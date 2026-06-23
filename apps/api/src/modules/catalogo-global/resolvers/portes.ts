import { GraphQLError } from 'graphql'
import { requireAuth, requireSystemAdmin } from '../../auth/rbac.js'
import { mapPorte } from '../mappers.js'
import type { GraphQLContext } from '../../../context.js'

export const portesResolvers = {
  Query: {
    portes: async (_: unknown, { ativo }: { ativo?: boolean }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const where = ativo !== undefined ? { ativo } : {}
      const items = await ctx.prisma.porte.findMany({ where, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] })
      return items.map(mapPorte)
    },
  },

  Mutation: {
    createPorte: async (_: unknown, { input }: { input: { nome: string; ordem?: number } }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      try {
        const item = await ctx.prisma.porte.create({ data: { nome: input.nome.trim(), ordem: input.ordem } })
        return mapPorte(item)
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2002') throw new GraphQLError('Já existe um porte com este nome', { extensions: { code: 'DUPLICATE' } })
        throw e
      }
    },

    updatePorte: async (_: unknown, { id, input }: { id: string; input: { nome?: string; ordem?: number } }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      try {
        const data: Record<string, unknown> = {}
        if (input.nome !== undefined) data['nome'] = input.nome.trim()
        if (input.ordem !== undefined) data['ordem'] = input.ordem
        const item = await ctx.prisma.porte.update({ where: { id }, data })
        return mapPorte(item)
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2002') throw new GraphQLError('Já existe um porte com este nome', { extensions: { code: 'DUPLICATE' } })
        throw e
      }
    },
  },
}
