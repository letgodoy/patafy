import type { GraphQLContext } from '../../context.js'
import { requireSystemAdmin } from '../auth/rbac.js'

function mapOutbox(n: { id: string; user_id: string; agendamento_id: string | null; canal: string; tipo: string; status: string; tentativas: number; data_envio: Date | null; erro: string | null; created_at: Date }) {
  return {
    id: n.id,
    userId: n.user_id,
    agendamentoId: n.agendamento_id,
    canal: n.canal,
    tipo: n.tipo,
    status: n.status,
    tentativas: n.tentativas,
    dataEnvio: n.data_envio?.toISOString() ?? null,
    erro: n.erro,
    createdAt: n.created_at.toISOString(),
  }
}

export const notificacoesQueries = {
  notificacaoOutboxList: async (_: unknown, { status, limit }: { status?: string; limit?: number }, ctx: GraphQLContext) => {
    requireSystemAdmin(ctx)
    const rows = await ctx.prisma.notificacaoOutbox.findMany({
      where: status ? { status: status as 'pendente' | 'enviado' | 'falha' } : undefined,
      orderBy: { created_at: 'desc' },
      take: limit ?? 50,
    })
    return rows.map(mapOutbox)
  },
}

export const notificacoesMutations = {
  retryNotificacao: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireSystemAdmin(ctx)
    const updated = await ctx.prisma.notificacaoOutbox.update({
      where: { id },
      data: { status: 'pendente', tentativas: 0, erro: null },
    })
    return mapOutbox(updated)
  },
}
