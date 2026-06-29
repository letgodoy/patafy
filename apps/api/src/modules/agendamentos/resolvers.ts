import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../context.js'
import type { PetshopUserProfile, User, Agendamento } from '@patafy/db'
import { requireAuth, requirePetshopRole } from '../auth/rbac.js'
import { getAvailableSlots, getAvailableBanhistas } from './availability.service.js'
import type { DiaFuncionamento } from './availability.service.js'
import { assertTransition } from './state-machine.js'
import type { AgendamentoStatus } from './state-machine.js'
import type { AgendamentoStatus as PrismaAgendamentoStatus } from '@patafy/db'

// ── helpers ────────────────────────────────────────────────────────────────

function parseDateParts(date: string): { ano: number; mes: number; dia: number } {
  const p = date.split('-').map(Number)
  return { ano: p[0] ?? 2000, mes: (p[1] ?? 1) - 1, dia: p[2] ?? 1 }
}

async function loadPetshopConfig(ctx: GraphQLContext, petShopId: string) {
  const shop = await ctx.prisma.petShop.findUniqueOrThrow({ where: { id: petShopId } })
  const cfg = shop.config_json as Record<string, unknown>
  return {
    horario: (cfg.horario_funcionamento ?? []) as DiaFuncionamento[],
    intervalo: typeof cfg.intervalo_entre_banhos_minutos === 'number' ? cfg.intervalo_entre_banhos_minutos : 0,
    prazoRemarcacaoHoras: typeof cfg.prazo_remarcacao_horas === 'number' ? cfg.prazo_remarcacao_horas : (typeof cfg.prazo_cancelamento_horas === 'number' ? cfg.prazo_cancelamento_horas : 0),
    prazoCancelamentoHoras: typeof cfg.prazo_cancelamento_horas === 'number' ? cfg.prazo_cancelamento_horas : 0,
  }
}

async function loadBanhistas(ctx: GraphQLContext, petShopId: string) {
  const profiles = await ctx.prisma.petshopUserProfile.findMany({
    where: { petshop_id: petShopId, ativo: true, roles: { has: 'banhista' } },
    include: { user: true },
  })
  return profiles.map((p: PetshopUserProfile & { user: User }) => ({ id: p.id, nome: p.user.nome, ativo: p.ativo }))
}

async function loadAgendamentosParaSlot(ctx: GraphQLContext, petShopId: string, date: string) {
  const { ano, mes, dia } = parseDateParts(date)
  const inicio = new Date(ano, mes, dia, 0, 0, 0)
  const fim = new Date(ano, mes, dia, 23, 59, 59)
  const rows = await ctx.prisma.agendamento.findMany({
    where: { petshop_id: petShopId, data_hora_inicio: { gte: inicio, lte: fim }, status: { notIn: ['Cancelado', 'Finalizado', 'NaoCompareceu'] } },
  })
  return rows.map((r: Agendamento) => ({ id: r.id, banhistaId: r.banhista_id, dataHoraInicio: r.data_hora_inicio, duracaoTotalMinutos: r.duracao_total_minutos, status: r.status as string }))
}

async function loadBloqueios(ctx: GraphQLContext, petShopId: string, date: string) {
  const { ano, mes, dia } = parseDateParts(date)
  const diaInicio = new Date(ano, mes, dia, 0, 0, 0)
  const diaFim = new Date(ano, mes, dia, 23, 59, 59)
  const rows = await ctx.prisma.bloqueioAgenda.findMany({
    where: { petshop_id: petShopId, data_inicio: { lte: diaFim }, data_fim: { gte: diaInicio } },
  })
  return rows.map((r) => ({ id: r.id, banhistaId: r.banhista_id, dataInicio: r.data_inicio, dataFim: r.data_fim }))
}

async function calcularDuracao(ctx: GraphQLContext, varianteIds: string[]): Promise<number> {
  const variantes = await ctx.prisma.servicoVariante.findMany({ where: { id: { in: varianteIds } } })
  return variantes.reduce((acc: number, v) => acc + v.duracao_minutos, 0)
}

const AGENDAMENTO_INCLUDE = {
  servicos: true,
  pet: { include: { tipo_animal: true, raca: true, porte: true } },
  tutor_profile: { include: { user: true } },
  banhista: { include: { user: true } },
} as const

function mapAgendamento(ag: Awaited<ReturnType<typeof findAgendamento>>) {
  if (!ag) return null
  return {
    id: ag.id,
    petshopId: ag.petshop_id,
    petId: ag.pet_id,
    tutorProfileId: ag.tutor_profile_id,
    dataHoraInicio: ag.data_hora_inicio.toISOString(),
    duracaoTotalMinutos: ag.duracao_total_minutos,
    banhistaId: ag.banhista_id,
    banhistaFixadoPeloTutor: ag.banhista_fixado_pelo_tutor,
    status: ag.status,
    origem: ag.origem,
    pago: ag.pago,
    precisaTransporte: ag.precisa_transporte,
    createdAt: ag.created_at.toISOString(),
    updatedAt: ag.updated_at.toISOString(),
    servicos: ag.servicos.map((s) => ({ id: s.id, servicoVarianteId: s.servico_variante_id, ordem: s.ordem })),
    pet: ag.pet ? {
      id: ag.pet.id,
      nome: ag.pet.nome,
      tipoAnimal: ag.pet.tipo_animal?.nome ?? null,
      raca: ag.pet.raca?.nome ?? null,
      porte: ag.pet.porte?.nome ?? null,
    } : null,
    tutor: ag.tutor_profile ? {
      id: ag.tutor_profile.id,
      nome: ag.tutor_profile.user.nome,
      email: ag.tutor_profile.user.email,
      telefone: ag.tutor_profile.user.telefone ?? null,
    } : null,
    banhista: ag.banhista ? {
      id: ag.banhista.id,
      nome: ag.banhista.user.nome,
    } : null,
  }
}

async function findAgendamento(ctx: GraphQLContext, id: string) {
  return ctx.prisma.agendamento.findUniqueOrThrow({ where: { id }, include: AGENDAMENTO_INCLUDE })
}

/** Verifica slot e cria o agendamento dentro de uma transação com SELECT FOR UPDATE. */
async function criarComLock(ctx: GraphQLContext, params: {
  petshopId: string
  petId: string
  tutorProfileId: string
  servicoVarianteIds: string[]
  dataHoraInicio: Date
  duracaoMin: number
  banhistaId: string
  banhistaFixadoPeloTutor: boolean
  precisaTransporte: boolean
  origem: 'tutor' | 'atendente'
}) {
  return ctx.prisma.$transaction(async (tx) => {
    // Lock: busca agendamentos conflitantes no mesmo banhista para detectar overbooking
    const fimInicio = new Date(params.dataHoraInicio.getTime() + params.duracaoMin * 60000)

    const conflito = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM agendamentos
      WHERE banhista_id = ${params.banhistaId}
        AND status NOT IN ('Cancelado', 'Finalizado', 'NaoCompareceu')
        AND data_hora_inicio < ${fimInicio}
        AND (data_hora_inicio + duracao_total_minutos * interval '1 minute') > ${params.dataHoraInicio}
      FOR UPDATE
    `

    if (conflito.length > 0) {
      throw new GraphQLError('Horário não disponível para este banhista', { extensions: { code: 'SLOT_UNAVAILABLE' } })
    }

    const status = params.origem === 'atendente' ? 'Confirmado' : 'AguardandoConfirmacao'

    const ag = await tx.agendamento.create({
      data: {
        petshop_id: params.petshopId,
        pet_id: params.petId,
        tutor_profile_id: params.tutorProfileId,
        data_hora_inicio: params.dataHoraInicio,
        duracao_total_minutos: params.duracaoMin,
        banhista_id: params.banhistaId,
        banhista_fixado_pelo_tutor: params.banhistaFixadoPeloTutor,
        status,
        origem: params.origem,
        precisa_transporte: params.precisaTransporte,
        servicos: {
          create: params.servicoVarianteIds.map((id, ordem) => ({ servico_variante_id: id, ordem })),
        },
      },
      include: AGENDAMENTO_INCLUDE,
    })

    // Atendimento 1:1
    await tx.atendimento.create({
      data: { agendamento_id: ag.id, banhista_id: params.banhistaId },
    })

    return ag
  })
}

// ── queries ────────────────────────────────────────────────────────────────

export const agendamentosQueries = {
  availableSlots: async (_: unknown, { input }: { input: { petShopId: string; date: string; duracaoMinutos: number; banhistaId?: string; servicoVarianteIds?: string[] } }, ctx: GraphQLContext) => {
    const { horario, intervalo } = await loadPetshopConfig(ctx, input.petShopId)
    const banhistas = await loadBanhistas(ctx, input.petShopId)
    const agendamentos = await loadAgendamentosParaSlot(ctx, input.petShopId, input.date)
    const bloqueios = await loadBloqueios(ctx, input.petShopId, input.date)
    const duracao = input.servicoVarianteIds?.length
      ? await calcularDuracao(ctx, input.servicoVarianteIds)
      : input.duracaoMinutos

    return getAvailableSlots({ horarioFuncionamento: horario, intervaloEntreMin: intervalo, agendamentos, bloqueios, banhistas, date: input.date, duracaoMin: duracao, banhistaId: input.banhistaId })
  },

  availableBanhistas: async (_: unknown, { input }: { input: { petShopId: string; inicio: string; duracaoMinutos: number; servicoVarianteIds?: string[] } }, ctx: GraphQLContext) => {
    const date = new Date(input.inicio).toISOString().slice(0, 10)
    const { horario, intervalo } = await loadPetshopConfig(ctx, input.petShopId)
    const banhistas = await loadBanhistas(ctx, input.petShopId)
    const agendamentos = await loadAgendamentosParaSlot(ctx, input.petShopId, date)
    const bloqueios = await loadBloqueios(ctx, input.petShopId, date)
    const duracao = input.servicoVarianteIds?.length
      ? await calcularDuracao(ctx, input.servicoVarianteIds)
      : input.duracaoMinutos

    return getAvailableBanhistas({ horarioFuncionamento: horario, intervaloEntreMin: intervalo, agendamentos, bloqueios, banhistas, inicio: input.inicio, duracaoMin: duracao })
  },

  myAgendamentos: async (_: unknown, { upcoming }: { upcoming?: boolean }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const tp = ctx.tutorProfile
    if (!tp) throw new GraphQLError('Perfil de tutor não encontrado', { extensions: { code: 'NOT_FOUND' } })

    const TERMINAL = ['Cancelado', 'Finalizado', 'NaoCompareceu'] as PrismaAgendamentoStatus[]
    const where = upcoming === false
      ? { tutor_profile_id: tp.id, data_hora_inicio: { lt: new Date() } }
      : upcoming === true
      ? { tutor_profile_id: tp.id, data_hora_inicio: { gte: new Date() }, status: { notIn: TERMINAL } }
      : { tutor_profile_id: tp.id }

    const rows = await ctx.prisma.agendamento.findMany({
      where,
      orderBy: { data_hora_inicio: upcoming === false ? 'desc' : 'asc' },
      include: AGENDAMENTO_INCLUDE,
    })
    return rows.map(mapAgendamento)
  },

  agendaPetShop: async (_: unknown, { petshopId, from, to, filters }: { petshopId: string; from: string; to: string; filters?: { status?: string[]; pago?: boolean; banhistaId?: string } }, ctx: GraphQLContext) => {
    requirePetshopRole(ctx, petshopId, ['owner', 'atendente', 'banhista'])
    const rows = await ctx.prisma.agendamento.findMany({
      where: {
        petshop_id: petshopId,
        data_hora_inicio: { gte: new Date(from), lte: new Date(to) },
        ...(filters?.status?.length ? { status: { in: filters.status as PrismaAgendamentoStatus[] } } : {}),
        ...(filters?.pago != null ? { pago: filters.pago } : {}),
        ...(filters?.banhistaId ? { banhista_id: filters.banhistaId } : {}),
      },
      orderBy: { data_hora_inicio: 'asc' },
      include: AGENDAMENTO_INCLUDE,
    })
    return rows.map(mapAgendamento)
  },

  agendamento: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const ag = await findAgendamento(ctx, id)
    // tutor dono ou staff da loja pode ver
    const isTutorDono = ctx.tutorProfile?.id === ag.tutor_profile_id
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    if (!isTutorDono && !isStaff) throw new GraphQLError('Sem permissão', { extensions: { code: 'FORBIDDEN' } })
    return mapAgendamento(ag)
  },
}

// ── mutations ──────────────────────────────────────────────────────────────

export const agendamentosMutations = {
  createAgendamento: async (_: unknown, { input }: { input: { petshopId: string; petId: string; servicoVarianteIds: string[]; dataHoraInicio: string; banhistaId?: string; banhistaFixadoPeloTutor?: boolean; precisaTransporte?: boolean } }, ctx: GraphQLContext) => {
    requireAuth(ctx)

    const dataHoraInicio = new Date(input.dataHoraInicio)
    const duracaoMin = await calcularDuracao(ctx, input.servicoVarianteIds)

    // Determinar banhista
    let banhistaId = input.banhistaId
    if (!banhistaId) {
      const date = dataHoraInicio.toISOString().slice(0, 10)
      const { horario, intervalo } = await loadPetshopConfig(ctx, input.petshopId)
      const banhistas = await loadBanhistas(ctx, input.petshopId)
      const agendamentos = await loadAgendamentosParaSlot(ctx, input.petshopId, date)
      const bloqueios = await loadBloqueios(ctx, input.petshopId, date)
      const slots = getAvailableSlots({ horarioFuncionamento: horario, intervaloEntreMin: intervalo, agendamentos, bloqueios, banhistas, date, duracaoMin })
      const slot = slots.find((s) => new Date(s.inicio).getTime() === dataHoraInicio.getTime())
      if (!slot) throw new GraphQLError('Horário não disponível', { extensions: { code: 'SLOT_UNAVAILABLE' } })
      banhistaId = slot.banhistaId
    }

    // origem: tutor se tem tutorProfile, atendente se tem petshopProfile
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === input.petshopId && p.ativo)
    const isTutor = !!ctx.tutorProfile
    if (!isTutor && !isStaff) throw new GraphQLError('Não autorizado', { extensions: { code: 'UNAUTHENTICATED' } })

    const tutorProfileId = isTutor
      ? ctx.tutorProfile!.id
      : await (async () => {
          // staff criando para pet: buscar tutor responsável
          const pt = await ctx.prisma.petTutor.findFirst({ where: { pet_id: input.petId, tipo: 'responsavel' } })
          if (!pt) throw new GraphQLError('Pet sem tutor responsável', { extensions: { code: 'NOT_FOUND' } })
          return pt.tutor_profile_id
        })()

    const ag = await criarComLock(ctx, {
      petshopId: input.petshopId,
      petId: input.petId,
      tutorProfileId,
      servicoVarianteIds: input.servicoVarianteIds,
      dataHoraInicio,
      duracaoMin,
      banhistaId,
      banhistaFixadoPeloTutor: input.banhistaFixadoPeloTutor ?? !!input.banhistaId,
      precisaTransporte: input.precisaTransporte ?? false,
      origem: isStaff ? 'atendente' : 'tutor',
    })

    return mapAgendamento(ag)
  },

  confirmAgendamento: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente'])
    assertTransition(ag.status as AgendamentoStatus, 'Confirmado')
    const updated = await ctx.prisma.agendamento.update({ where: { id }, data: { status: 'Confirmado' }, include: AGENDAMENTO_INCLUDE })
    return mapAgendamento(updated)
  },

  cancelAgendamento: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const ag = await findAgendamento(ctx, id)
    assertTransition(ag.status as AgendamentoStatus, 'Cancelado')

    const isTutorDono = ctx.tutorProfile?.id === ag.tutor_profile_id
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    if (!isTutorDono && !isStaff) throw new GraphQLError('Sem permissão', { extensions: { code: 'FORBIDDEN' } })

    if (isTutorDono && !isStaff) {
      const { prazoCancelamentoHoras } = await loadPetshopConfig(ctx, ag.petshop_id)
      if (prazoCancelamentoHoras > 0) {
        const limite = new Date(ag.data_hora_inicio.getTime() - prazoCancelamentoHoras * 3600000)
        if (new Date() > limite) throw new GraphQLError('Prazo de cancelamento expirado', { extensions: { code: 'DEADLINE_EXCEEDED' } })
      }
    }

    const updated = await ctx.prisma.agendamento.update({ where: { id }, data: { status: 'Cancelado' }, include: AGENDAMENTO_INCLUDE })
    return mapAgendamento(updated)
  },

  rescheduleAgendamento: async (_: unknown, { id, input }: { id: string; input: { dataHoraInicio: string; banhistaId?: string } }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const ag = await findAgendamento(ctx, id)

    const isTutorDono = ctx.tutorProfile?.id === ag.tutor_profile_id
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    if (!isTutorDono && !isStaff) throw new GraphQLError('Sem permissão', { extensions: { code: 'FORBIDDEN' } })

    if (isTutorDono && !isStaff) {
      const { prazoRemarcacaoHoras } = await loadPetshopConfig(ctx, ag.petshop_id)
      if (prazoRemarcacaoHoras > 0) {
        const limite = new Date(ag.data_hora_inicio.getTime() - prazoRemarcacaoHoras * 3600000)
        if (new Date() > limite) throw new GraphQLError('Prazo de remarcação expirado', { extensions: { code: 'DEADLINE_EXCEEDED' } })
      }
    }

    const novaData = new Date(input.dataHoraInicio)
    const date = novaData.toISOString().slice(0, 10)
    const { horario, intervalo } = await loadPetshopConfig(ctx, ag.petshop_id)
    const banhistas = await loadBanhistas(ctx, ag.petshop_id)
    const agendamentos = (await loadAgendamentosParaSlot(ctx, ag.petshop_id, date)).filter((a) => a.id !== id)
    const bloqueios = await loadBloqueios(ctx, ag.petshop_id, date)

    let novoBanhistaId = ag.banhista_fixado_pelo_tutor ? ag.banhista_id! : (input.banhistaId ?? ag.banhista_id!)
    const slots = getAvailableSlots({ horarioFuncionamento: horario, intervaloEntreMin: intervalo, agendamentos, bloqueios, banhistas, date, duracaoMin: ag.duracao_total_minutos, banhistaId: novoBanhistaId })
    const slotOk = slots.some((s) => new Date(s.inicio).getTime() === novaData.getTime())
    if (!slotOk) throw new GraphQLError('Horário não disponível', { extensions: { code: 'SLOT_UNAVAILABLE' } })

    const updated = await ctx.prisma.agendamento.update({
      where: { id },
      data: { data_hora_inicio: novaData, banhista_id: novoBanhistaId },
      include: AGENDAMENTO_INCLUDE,
    })
    return mapAgendamento(updated)
  },

  updateAgendamentoStatus: async (_: unknown, { id, status }: { id: string; status: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente', 'banhista'])
    assertTransition(ag.status as AgendamentoStatus, status as AgendamentoStatus)
    const updated = await ctx.prisma.agendamento.update({ where: { id }, data: { status: status as AgendamentoStatus }, include: AGENDAMENTO_INCLUDE })
    return mapAgendamento(updated)
  },

  markNaoCompareceu: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente'])
    assertTransition(ag.status as AgendamentoStatus, 'NaoCompareceu')
    const updated = await ctx.prisma.agendamento.update({ where: { id }, data: { status: 'NaoCompareceu' }, include: AGENDAMENTO_INCLUDE })
    return mapAgendamento(updated)
  },

  assignBanhista: async (_: unknown, { id, banhistaId }: { id: string; banhistaId: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente'])
    if (ag.banhista_fixado_pelo_tutor) throw new GraphQLError('Banhista foi escolhido pelo tutor e não pode ser alterado', { extensions: { code: 'FORBIDDEN' } })
    const updated = await ctx.prisma.agendamento.update({ where: { id }, data: { banhista_id: banhistaId }, include: AGENDAMENTO_INCLUDE })
    return mapAgendamento(updated)
  },

  togglePago: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente'])
    const updated = await ctx.prisma.agendamento.update({ where: { id }, data: { pago: !ag.pago }, include: AGENDAMENTO_INCLUDE })
    return mapAgendamento(updated)
  },
}
