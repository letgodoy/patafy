import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../context.js'
import type { AgendamentoStatus as PrismaAgendamentoStatus } from '@patafy/db'
import { getAvailableSlots, getAvailableBanhistas } from './availability.service.js'
import { requireAuth, requirePetshopRole } from '../auth/rbac.js'
import { loadPetshopConfig, loadBanhistas, loadAgendamentosParaSlot, loadBloqueios, calcularDuracao, findAgendamento, mapAgendamento, AGENDAMENTO_INCLUDE } from './agendamento.helpers.js'

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
    const isTutorDono = ctx.tutorProfile?.id === ag.tutor_profile_id
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    if (!isTutorDono && !isStaff) throw new GraphQLError('Sem permissão', { extensions: { code: 'FORBIDDEN' } })
    return mapAgendamento(ag)
  },
}
