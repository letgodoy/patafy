import type { GraphQLContext } from '../../context.js'
import type { PetshopUserProfile, User } from '@patafy/db'
import { getAvailableSlots, getAvailableBanhistas } from './availability.service.js'
import type { DiaFuncionamento } from './availability.service.js'

interface AvailableSlotsInput {
  petShopId: string
  date: string
  duracaoMinutos: number
  banhistaId?: string
  servicoVarianteIds?: string[]
}

interface AvailableBanhistasInput {
  petShopId: string
  inicio: string
  duracaoMinutos: number
  servicoVarianteIds?: string[]
}

async function loadPetshopConfig(ctx: GraphQLContext, petShopId: string) {
  const shop = await ctx.prisma.petShop.findUniqueOrThrow({ where: { id: petShopId } })
  const cfg = shop.config_json as Record<string, unknown>
  const horario = (cfg.horario_funcionamento ?? []) as DiaFuncionamento[]
  const intervalo = typeof cfg.intervalo_entre_banhos_minutos === 'number'
    ? cfg.intervalo_entre_banhos_minutos
    : 0
  return { horario, intervalo }
}

async function loadBanhistas(ctx: GraphQLContext, petShopId: string) {
  const profiles = await ctx.prisma.petshopUserProfile.findMany({
    where: { petshop_id: petShopId, ativo: true, roles: { has: 'banhista' } },
    include: { user: true },
  })
  return profiles.map((p: PetshopUserProfile & { user: User }) => ({
    id: p.id,
    nome: p.user.nome,
    ativo: p.ativo,
  }))
}

function parseDateParts(date: string): { ano: number; mes: number; dia: number } {
  const parts = date.split('-').map(Number)
  return { ano: parts[0] ?? 2000, mes: (parts[1] ?? 1) - 1, dia: parts[2] ?? 1 }
}

async function loadAgendamentos(ctx: GraphQLContext, petShopId: string, date: string) {
  const { ano, mes, dia } = parseDateParts(date)
  const inicio = new Date(ano, mes, dia, 0, 0, 0)
  const fim = new Date(ano, mes, dia, 23, 59, 59)

  const rows = await ctx.prisma.agendamento.findMany({
    where: {
      petshop_id: petShopId,
      data_hora_inicio: { gte: inicio, lte: fim },
      status: { notIn: ['Cancelado', 'Finalizado', 'NaoCompareceu'] },
    },
  })

  return rows.map((r) => ({
    id: r.id,
    banhistaId: r.banhista_id,
    dataHoraInicio: r.data_hora_inicio,
    duracaoTotalMinutos: r.duracao_total_minutos,
    status: r.status as string,
  }))
}

async function loadBloqueios(ctx: GraphQLContext, petShopId: string, date: string) {
  const { ano, mes, dia } = parseDateParts(date)
  const diaInicio = new Date(ano, mes, dia, 0, 0, 0)
  const diaFim = new Date(ano, mes, dia, 23, 59, 59)

  const rows = await ctx.prisma.bloqueioAgenda.findMany({
    where: {
      petshop_id: petShopId,
      data_inicio: { lte: diaFim },
      data_fim: { gte: diaInicio },
    },
  })

  return rows.map((r) => ({
    id: r.id,
    banhistaId: r.banhista_id,
    dataInicio: r.data_inicio,
    dataFim: r.data_fim,
  }))
}

async function resolverDuracao(
  ctx: GraphQLContext,
  duracaoMinutos: number,
  servicoVarianteIds?: string[],
): Promise<number> {
  if (!servicoVarianteIds?.length) return duracaoMinutos
  const variantes = await ctx.prisma.servicoVariante.findMany({
    where: { id: { in: servicoVarianteIds } },
  })
  return variantes.reduce((acc: number, v) => acc + v.duracao_minutos, 0)
}

export const agendamentosQueries = {
  availableSlots: async (_: unknown, { input }: { input: AvailableSlotsInput }, ctx: GraphQLContext) => {
    const { horario, intervalo } = await loadPetshopConfig(ctx, input.petShopId)
    const banhistas = await loadBanhistas(ctx, input.petShopId)
    const agendamentos = await loadAgendamentos(ctx, input.petShopId, input.date)
    const bloqueios = await loadBloqueios(ctx, input.petShopId, input.date)
    const duracao = await resolverDuracao(ctx, input.duracaoMinutos, input.servicoVarianteIds)

    return getAvailableSlots({
      horarioFuncionamento: horario,
      intervaloEntreMin: intervalo,
      agendamentos,
      bloqueios,
      banhistas,
      date: input.date,
      duracaoMin: duracao,
      banhistaId: input.banhistaId,
    })
  },

  availableBanhistas: async (_: unknown, { input }: { input: AvailableBanhistasInput }, ctx: GraphQLContext) => {
    const inicioDate = new Date(input.inicio)
    const date = inicioDate.toISOString().slice(0, 10)

    const { horario, intervalo } = await loadPetshopConfig(ctx, input.petShopId)
    const banhistas = await loadBanhistas(ctx, input.petShopId)
    const agendamentos = await loadAgendamentos(ctx, input.petShopId, date)
    const bloqueios = await loadBloqueios(ctx, input.petShopId, date)
    const duracao = await resolverDuracao(ctx, input.duracaoMinutos, input.servicoVarianteIds)

    return getAvailableBanhistas({
      horarioFuncionamento: horario,
      intervaloEntreMin: intervalo,
      agendamentos,
      bloqueios,
      banhistas,
      inicio: input.inicio,
      duracaoMin: duracao,
    })
  },
}
