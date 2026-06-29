import type { GraphQLContext } from '../../context.js'
import type { PetshopUserProfile, User, Agendamento } from '@patafy/db'
import type { DiaFuncionamento } from './availability.service.js'

export function parseDateParts(date: string): { ano: number; mes: number; dia: number } {
  const p = date.split('-').map(Number)
  return { ano: p[0] ?? 2000, mes: (p[1] ?? 1) - 1, dia: p[2] ?? 1 }
}

export async function loadPetshopConfig(ctx: GraphQLContext, petShopId: string) {
  const shop = await ctx.prisma.petShop.findUniqueOrThrow({ where: { id: petShopId } })
  const cfg = shop.config_json as Record<string, unknown>
  return {
    horario: (cfg.horario_funcionamento ?? []) as DiaFuncionamento[],
    intervalo: typeof cfg.intervalo_entre_banhos_minutos === 'number' ? cfg.intervalo_entre_banhos_minutos : 0,
    prazoRemarcacaoHoras: typeof cfg.prazo_remarcacao_horas === 'number' ? cfg.prazo_remarcacao_horas : (typeof cfg.prazo_cancelamento_horas === 'number' ? cfg.prazo_cancelamento_horas : 0),
    prazoCancelamentoHoras: typeof cfg.prazo_cancelamento_horas === 'number' ? cfg.prazo_cancelamento_horas : 0,
  }
}

export async function loadBanhistas(ctx: GraphQLContext, petShopId: string) {
  const profiles = await ctx.prisma.petshopUserProfile.findMany({
    where: { petshop_id: petShopId, ativo: true, roles: { has: 'banhista' } },
    include: { user: true },
  })
  return profiles.map((p: PetshopUserProfile & { user: User }) => ({ id: p.id, nome: p.user.nome, ativo: p.ativo }))
}

export async function loadAgendamentosParaSlot(ctx: GraphQLContext, petShopId: string, date: string) {
  const { ano, mes, dia } = parseDateParts(date)
  const inicio = new Date(ano, mes, dia, 0, 0, 0)
  const fim = new Date(ano, mes, dia, 23, 59, 59)
  const rows = await ctx.prisma.agendamento.findMany({
    where: { petshop_id: petShopId, data_hora_inicio: { gte: inicio, lte: fim }, status: { notIn: ['Cancelado', 'Finalizado', 'NaoCompareceu'] } },
  })
  return rows.map((r: Agendamento) => ({ id: r.id, banhistaId: r.banhista_id, dataHoraInicio: r.data_hora_inicio, duracaoTotalMinutos: r.duracao_total_minutos, status: r.status as string }))
}

export async function loadBloqueios(ctx: GraphQLContext, petShopId: string, date: string) {
  const { ano, mes, dia } = parseDateParts(date)
  const diaInicio = new Date(ano, mes, dia, 0, 0, 0)
  const diaFim = new Date(ano, mes, dia, 23, 59, 59)
  const rows = await ctx.prisma.bloqueioAgenda.findMany({
    where: { petshop_id: petShopId, data_inicio: { lte: diaFim }, data_fim: { gte: diaInicio } },
  })
  return rows.map((r) => ({ id: r.id, banhistaId: r.banhista_id, dataInicio: r.data_inicio, dataFim: r.data_fim }))
}

export async function calcularDuracao(ctx: GraphQLContext, varianteIds: string[]): Promise<number> {
  const variantes = await ctx.prisma.servicoVariante.findMany({ where: { id: { in: varianteIds } } })
  return variantes.reduce((acc: number, v) => acc + v.duracao_minutos, 0)
}

export const AGENDAMENTO_INCLUDE = {
  servicos: true,
  pet: { include: { tipo_animal: true, raca: true, porte: true } },
  tutor_profile: { include: { user: true } },
  banhista: { include: { user: true } },
} as const

export type AgendamentoWithIncludes = Awaited<ReturnType<typeof findAgendamento>>

export function mapAgendamento(ag: AgendamentoWithIncludes) {
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

export async function findAgendamento(ctx: GraphQLContext, id: string) {
  return ctx.prisma.agendamento.findUniqueOrThrow({ where: { id }, include: AGENDAMENTO_INCLUDE })
}
