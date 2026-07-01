import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../context.js'
import { requireAuth, requirePetshopRole } from '../auth/rbac.js'

const MAX_DAYS_MS = 366 * 24 * 60 * 60 * 1000

function parseRange(from: string, to: string) {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (toDate.getTime() - fromDate.getTime() > MAX_DAYS_MS) {
    throw new GraphQLError('Intervalo máximo: 366 dias', { extensions: { code: 'BAD_USER_INPUT' } })
  }
  return { fromDate, toDate }
}

export const relatoriosQueries = {
  relatorioAtendimentosResumo: async (
    _: unknown,
    { petshopId, from, to }: { petshopId: string; from: string; to: string },
    ctx: GraphQLContext,
  ) => {
    requireAuth(ctx)
    requirePetshopRole(ctx, petshopId, ['owner'])
    const { fromDate, toDate } = parseRange(from, to)

    const [finalizados, totalCancelados, totalNaoCompareceu] = await Promise.all([
      ctx.prisma.agendamento.findMany({
        where: { petshop_id: petshopId, status: 'Finalizado', data_hora_inicio: { gte: fromDate, lte: toDate } },
        select: {
          pago: true,
          servicos: { select: { preco_snapshot: true } },
          atendimento: { select: { adicionais: { select: { preco_cobrado: true } } } },
        },
      }),
      ctx.prisma.agendamento.count({ where: { petshop_id: petshopId, status: 'Cancelado', data_hora_inicio: { gte: fromDate, lte: toDate } } }),
      ctx.prisma.agendamento.count({ where: { petshop_id: petshopId, status: 'NaoCompareceu', data_hora_inicio: { gte: fromDate, lte: toDate } } }),
    ])

    let valorEstimado = 0
    let valorPago = 0

    for (const ag of finalizados) {
      const valorServicos = ag.servicos.reduce((sum, s) => sum + Number(s.preco_snapshot ?? 0), 0)
      const valorAdicionais = ag.atendimento?.adicionais.reduce((sum, a) => sum + Number(a.preco_cobrado), 0) ?? 0
      const total = valorServicos + valorAdicionais
      valorEstimado += total
      if (ag.pago) valorPago += total
    }

    return {
      totalFinalizados: finalizados.length,
      totalCancelados,
      totalNaoCompareceu,
      valorEstimado,
      valorPago,
      valorPendente: valorEstimado - valorPago,
    }
  },

  relatorioServicosRealizados: async (
    _: unknown,
    { petshopId, from, to }: { petshopId: string; from: string; to: string },
    ctx: GraphQLContext,
  ) => {
    requireAuth(ctx)
    requirePetshopRole(ctx, petshopId, ['owner'])
    const { fromDate, toDate } = parseRange(from, to)

    const servicos = await ctx.prisma.agendamentoServico.findMany({
      where: {
        agendamento: {
          petshop_id: petshopId,
          status: 'Finalizado',
          data_hora_inicio: { gte: fromDate, lte: toDate },
        },
      },
      select: {
        servico_variante_id: true,
        preco_snapshot: true,
        servico_variante: {
          select: {
            preco: true,
            servico: { select: { nome: true } },
          },
        },
      },
    })

    const map = new Map<string, { servicoNome: string; quantidade: number; valorTotal: number }>()

    for (const s of servicos) {
      const varId = s.servico_variante_id
      const preco = Number(s.preco_snapshot ?? s.servico_variante.preco)
      const nome = s.servico_variante.servico.nome
      const existing = map.get(varId)
      if (existing) {
        existing.quantidade++
        existing.valorTotal += preco
      } else {
        map.set(varId, { servicoNome: nome, quantidade: 1, valorTotal: preco })
      }
    }

    return Array.from(map.entries()).map(([servicoVarianteId, v]) => ({
      servicoVarianteId,
      servicoNome: v.servicoNome,
      varianteNome: v.servicoNome,
      quantidade: v.quantidade,
      valorTotal: v.valorTotal,
      valorMedio: v.quantidade > 0 ? v.valorTotal / v.quantidade : 0,
    }))
  },

  relatorioPacotes: async (
    _: unknown,
    { petshopId, from, to }: { petshopId: string; from: string; to: string },
    ctx: GraphQLContext,
  ) => {
    requireAuth(ctx)
    requirePetshopRole(ctx, petshopId, ['owner'])
    const { fromDate, toDate } = parseRange(from, to)

    const [vendidos, creditosConsumidos, creditosItems] = await Promise.all([
      ctx.prisma.pacotePet.findMany({
        where: { pacote: { petshop_id: petshopId }, data_ativacao: { gte: fromDate, lte: toDate } },
        select: { valor_total_snapshot: true },
      }),
      ctx.prisma.pacoteItemDebito.count({
        where: { agendamento: { petshop_id: petshopId, data_hora_inicio: { gte: fromDate, lte: toDate } } },
      }),
      ctx.prisma.pacoteItem.findMany({
        where: { pacote: { petshop_id: petshopId, ativo: true } },
        select: { quantidade_total: true, quantidade_usada: true },
      }),
    ])

    return {
      pacotesVendidos: vendidos.length,
      valorTotalVendas: vendidos.reduce((sum, p) => sum + Number(p.valor_total_snapshot ?? 0), 0),
      creditosConsumidos,
      creditosRestantes: creditosItems.reduce((sum, i) => sum + Math.max(0, i.quantidade_total - i.quantidade_usada), 0),
    }
  },
}
