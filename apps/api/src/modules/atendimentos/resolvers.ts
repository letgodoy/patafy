import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../context.js'
import { requireAuth, requirePetshopRole } from '../auth/rbac.js'
import { assertTransition } from '../agendamentos/state-machine.js'
import type { AgendamentoStatus } from '../agendamentos/state-machine.js'

const ATENDIMENTO_INCLUDE = {
  adicionais: true,
} as const

function mapAtendimento(at: {
  id: string
  agendamento_id: string
  banhista_id: string
  observacoes_gerais: string | null
  observacoes_internas: string | null
  created_at: Date
  updated_at: Date
  adicionais: { id: string; servico_variante_id: string; preco_cobrado: { toNumber: () => number } | number; created_at: Date }[]
}) {
  return {
    id: at.id,
    agendamentoId: at.agendamento_id,
    banhistaId: at.banhista_id,
    observacoesGerais: at.observacoes_gerais,
    observacoesInternas: at.observacoes_internas,
    createdAt: at.created_at.toISOString(),
    updatedAt: at.updated_at.toISOString(),
    adicionais: at.adicionais.map((a) => ({
      id: a.id,
      servicoVarianteId: a.servico_variante_id,
      precoCobrado: typeof a.preco_cobrado === 'number' ? a.preco_cobrado : (a.preco_cobrado as { toNumber: () => number }).toNumber(),
      createdAt: a.created_at.toISOString(),
    })),
  }
}

async function findAtendimento(ctx: GraphQLContext, agendamentoId: string) {
  return ctx.prisma.atendimento.findUniqueOrThrow({ where: { agendamento_id: agendamentoId }, include: ATENDIMENTO_INCLUDE })
}

async function requireBanhistaOrStaff(ctx: GraphQLContext, petshopId: string) {
  requirePetshopRole(ctx, petshopId, ['owner', 'atendente', 'banhista'])
}

async function debitarPacote(ctx: GraphQLContext, agendamentoId: string, petId: string, petshopId: string, servicoVarianteIds: string[]) {
  for (const varianteId of servicoVarianteIds) {
    const pacotePet = await ctx.prisma.pacotePet.findFirst({
      where: {
        pet_id: petId,
        pacote: { petshop_id: petshopId, items: { some: { servico_variante_id: varianteId } } },
        data_expiracao: { gte: new Date() },
      },
      include: { pacote: { include: { items: true } } },
    })

    if (!pacotePet) continue

    const item = pacotePet.pacote.items.find((i) => i.servico_variante_id === varianteId)
    if (!item) continue

    try {
      await ctx.prisma.pacoteItemDebito.create({
        data: {
          agendamento_id: agendamentoId,
          pacote_pet_id: pacotePet.id,
          pacote_item_id: item.id,
          quantidade: 1,
        },
      })
      await ctx.prisma.pacoteItem.update({
        where: { id: item.id },
        data: { quantidade_usada: { increment: 1 } },
      })
    } catch {
      // @@unique([agendamento_id, pacote_item_id]) — débito já registrado, idempotente
    }
  }
}

export const atendimentosQueries = {
  atendimentoByAgendamento: async (_: unknown, { agendamentoId }: { agendamentoId: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const ag = await ctx.prisma.agendamento.findUniqueOrThrow({ where: { id: agendamentoId } })
    const isTutorDono = ctx.tutorProfile?.id === ag.tutor_profile_id
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    if (!isTutorDono && !isStaff) throw new GraphQLError('Sem permissão', { extensions: { code: 'FORBIDDEN' } })
    const at = await ctx.prisma.atendimento.findUnique({ where: { agendamento_id: agendamentoId }, include: ATENDIMENTO_INCLUDE })
    return at ? mapAtendimento(at) : null
  },
}

export const atendimentosMutations = {
  startAtendimento: async (_: unknown, { agendamentoId }: { agendamentoId: string }, ctx: GraphQLContext) => {
    const ag = await ctx.prisma.agendamento.findUniqueOrThrow({ where: { id: agendamentoId } })
    await requireBanhistaOrStaff(ctx, ag.petshop_id)
    assertTransition(ag.status as AgendamentoStatus, 'EmAndamento')
    await ctx.prisma.agendamento.update({ where: { id: agendamentoId }, data: { status: 'EmAndamento' } })
    return mapAtendimento(await findAtendimento(ctx, agendamentoId))
  },

  markPronto: async (_: unknown, { agendamentoId }: { agendamentoId: string }, ctx: GraphQLContext) => {
    const ag = await ctx.prisma.agendamento.findUniqueOrThrow({ where: { id: agendamentoId } })
    await requireBanhistaOrStaff(ctx, ag.petshop_id)
    assertTransition(ag.status as AgendamentoStatus, 'Pronto')
    await ctx.prisma.agendamento.update({ where: { id: agendamentoId }, data: { status: 'Pronto' } })
    return mapAtendimento(await findAtendimento(ctx, agendamentoId))
  },

  finalizarAtendimento: async (_: unknown, { agendamentoId }: { agendamentoId: string }, ctx: GraphQLContext) => {
    const ag = await ctx.prisma.agendamento.findUniqueOrThrow({
      where: { id: agendamentoId },
      include: { servicos: true },
    })
    await requireBanhistaOrStaff(ctx, ag.petshop_id)
    assertTransition(ag.status as AgendamentoStatus, 'Finalizado')

    await ctx.prisma.agendamento.update({ where: { id: agendamentoId }, data: { status: 'Finalizado' } })

    const varianteIds = ag.servicos.map((s) => s.servico_variante_id)
    await debitarPacote(ctx, agendamentoId, ag.pet_id, ag.petshop_id, varianteIds)

    return mapAtendimento(await findAtendimento(ctx, agendamentoId))
  },

  addServicoAdicional: async (_: unknown, { input }: { input: { atendimentoId: string; servicoVarianteId: string; precoCobrado: number } }, ctx: GraphQLContext) => {
    const at = await ctx.prisma.atendimento.findUniqueOrThrow({ where: { id: input.atendimentoId }, include: ATENDIMENTO_INCLUDE })
    const ag = await ctx.prisma.agendamento.findUniqueOrThrow({ where: { id: at.agendamento_id } })
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente', 'banhista'])

    await ctx.prisma.atendimentoServicoAdicional.create({
      data: {
        atendimento_id: input.atendimentoId,
        servico_variante_id: input.servicoVarianteId,
        preco_cobrado: input.precoCobrado,
      },
    })

    return mapAtendimento(await ctx.prisma.atendimento.findUniqueOrThrow({ where: { id: input.atendimentoId }, include: ATENDIMENTO_INCLUDE }))
  },

  updateObservacoesGerais: async (_: unknown, { atendimentoId, texto }: { atendimentoId: string; texto: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const at = await ctx.prisma.atendimento.findUniqueOrThrow({ where: { id: atendimentoId }, include: ATENDIMENTO_INCLUDE })
    const ag = await ctx.prisma.agendamento.findUniqueOrThrow({ where: { id: at.agendamento_id } })
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    const isTutorDono = ctx.tutorProfile?.id === ag.tutor_profile_id
    if (!isStaff && !isTutorDono) throw new GraphQLError('Sem permissão', { extensions: { code: 'FORBIDDEN' } })
    const updated = await ctx.prisma.atendimento.update({ where: { id: atendimentoId }, data: { observacoes_gerais: texto }, include: ATENDIMENTO_INCLUDE })
    return mapAtendimento(updated)
  },

  updateObservacoesInternas: async (_: unknown, { atendimentoId, texto }: { atendimentoId: string; texto: string }, ctx: GraphQLContext) => {
    const at = await ctx.prisma.atendimento.findUniqueOrThrow({ where: { id: atendimentoId }, include: ATENDIMENTO_INCLUDE })
    const ag = await ctx.prisma.agendamento.findUniqueOrThrow({ where: { id: at.agendamento_id } })
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente'])
    const updated = await ctx.prisma.atendimento.update({ where: { id: atendimentoId }, data: { observacoes_internas: texto }, include: ATENDIMENTO_INCLUDE })
    return mapAtendimento(updated)
  },
}
