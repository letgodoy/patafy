import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../context.js'
import { requireAuth, requirePetshopRole, requireSystemAdmin } from '../auth/rbac.js'

function mapRegistro(r: {
  id: string
  occurred_at: Date
  actor_user_id: string | null
  petshop_id: string | null
  agendamento_id: string | null
  entity_type: string
  entity_id: string
  action: string
  metadata: unknown
}) {
  return {
    id: r.id,
    occurredAt: r.occurred_at.toISOString(),
    actorUserId: r.actor_user_id,
    petshopId: r.petshop_id,
    agendamentoId: r.agendamento_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    action: r.action,
    metadata: JSON.stringify(r.metadata),
  }
}

type RegistroFilter = {
  petshopId?: string
  entityType?: string
  entityId?: string
  action?: string
  agendamentoId?: string
  from?: string
  to?: string
  limit?: number
  cursor?: string
}

export const auditoriaQueries = {
  registrosOperacionais: async (_: unknown, { filter }: { filter?: RegistroFilter }, ctx: GraphQLContext) => {
    requireAuth(ctx)

    const isAdmin = ctx.isSystemAdmin
    const petshopId = filter?.petshopId

    if (!isAdmin) {
      if (!petshopId) throw new GraphQLError('petshopId obrigatório', { extensions: { code: 'BAD_USER_INPUT' } })
      requirePetshopRole(ctx, petshopId, ['owner', 'atendente', 'banhista'])
    }

    const where: Record<string, unknown> = {}
    if (!isAdmin && petshopId) where['petshop_id'] = petshopId
    else if (petshopId) where['petshop_id'] = petshopId
    if (filter?.entityType) where['entity_type'] = filter.entityType
    if (filter?.entityId) where['entity_id'] = filter.entityId
    if (filter?.action) where['action'] = filter.action
    if (filter?.agendamentoId) where['agendamento_id'] = filter.agendamentoId
    if (filter?.from || filter?.to) {
      where['occurred_at'] = {
        ...(filter.from ? { gte: new Date(filter.from) } : {}),
        ...(filter.to ? { lte: new Date(filter.to) } : {}),
      }
    }
    if (filter?.cursor) where['id'] = { lt: filter.cursor }

    const rows = await ctx.prisma.registroOperacional.findMany({
      where,
      orderBy: { occurred_at: 'desc' },
      take: filter?.limit ?? 50,
    })

    return rows.map(mapRegistro)
  },

  registrosPorAgendamento: async (_: unknown, { agendamentoId }: { agendamentoId: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const ag = await ctx.prisma.agendamento.findUniqueOrThrow({ where: { id: agendamentoId } })

    const isTutorDono = ctx.tutorProfile?.id === ag.tutor_profile_id
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    if (!isTutorDono && !isStaff && !ctx.isSystemAdmin) {
      throw new GraphQLError('Sem permissão', { extensions: { code: 'FORBIDDEN' } })
    }

    const rows = await ctx.prisma.registroOperacional.findMany({
      where: { agendamento_id: agendamentoId },
      orderBy: { occurred_at: 'desc' },
    })

    // tutores não veem obs internas
    const visibles = isTutorDono && !isStaff
      ? rows.filter((r) => !(r.action === 'OBS_UPDATED' && (r.metadata as { tipo?: string })?.tipo === 'interna'))
      : rows

    return visibles.map(mapRegistro)
  },
}
