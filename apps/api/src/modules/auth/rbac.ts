import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../context.js'

export function requireAuth(ctx: GraphQLContext): asserts ctx is GraphQLContext & { user: NonNullable<GraphQLContext['user']> } {
  if (!ctx.user) {
    throw new GraphQLError('Não autenticado', { extensions: { code: 'UNAUTHENTICATED' } })
  }
}

export function requireSystemAdmin(ctx: GraphQLContext) {
  if (!ctx.firebaseUser) {
    throw new GraphQLError('Não autenticado', { extensions: { code: 'UNAUTHENTICATED' } })
  }
  if (!ctx.isSystemAdmin) {
    throw new GraphQLError('Acesso restrito a administradores do sistema', { extensions: { code: 'FORBIDDEN' } })
  }
}

export function requirePetshopRole(ctx: GraphQLContext, petshopId: string, roles: string[]) {
  requireAuth(ctx)
  const profile = ctx.petshopProfiles.find((p) => p.petshop_id === petshopId && p.ativo)
  if (!profile || !profile.roles.some((r) => roles.includes(r))) {
    throw new GraphQLError('Sem permissão neste pet shop', { extensions: { code: 'FORBIDDEN' } })
  }
}
