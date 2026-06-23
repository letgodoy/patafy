import { GraphQLError } from 'graphql'
import { requireAuth, requireSystemAdmin } from '../../auth/rbac.js'
import { mapPelagem } from '../mappers.js'
import type { GraphQLContext } from '../../../context.js'

export const pelagensResolvers = {
  Query: {
    pelagens: async (_: unknown, { ativo }: { ativo?: boolean }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const where = ativo !== undefined ? { ativo } : {}
      const items = await ctx.prisma.pelagem.findMany({ where, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] })
      return items.map(mapPelagem)
    },
  },

  Mutation: {
    createPelagem: async (_: unknown, { input }: { input: { nome: string; ordem?: number } }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      try {
        const item = await ctx.prisma.pelagem.create({ data: { nome: input.nome.trim(), ordem: input.ordem } })
        return mapPelagem(item)
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2002') throw new GraphQLError('Já existe uma pelagem com este nome', { extensions: { code: 'DUPLICATE' } })
        throw e
      }
    },

    updatePelagem: async (_: unknown, { id, input }: { id: string; input: { nome?: string; ordem?: number } }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      try {
        const data: Record<string, unknown> = {}
        if (input.nome !== undefined) data['nome'] = input.nome.trim()
        if (input.ordem !== undefined) data['ordem'] = input.ordem
        const item = await ctx.prisma.pelagem.update({ where: { id }, data })
        return mapPelagem(item)
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2002') throw new GraphQLError('Já existe uma pelagem com este nome', { extensions: { code: 'DUPLICATE' } })
        throw e
      }
    },
  },
}
