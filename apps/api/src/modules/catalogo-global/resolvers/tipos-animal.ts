import { GraphQLError } from 'graphql'
import { requireAuth, requireSystemAdmin } from '../../auth/rbac.js'
import { mapTipoAnimal } from '../mappers.js'
import type { GraphQLContext } from '../../../context.js'

export const tiposAnimalResolvers = {
  Query: {
    tiposAnimal: async (_: unknown, { ativo }: { ativo?: boolean }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const where = ativo !== undefined ? { ativo } : {}
      const items = await ctx.prisma.tipoAnimal.findMany({ where, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] })
      return items.map(mapTipoAnimal)
    },
  },

  Mutation: {
    createTipoAnimal: async (_: unknown, { input }: { input: { nome: string; ordem?: number } }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      try {
        const item = await ctx.prisma.tipoAnimal.create({ data: { nome: input.nome.trim(), ordem: input.ordem } })
        return mapTipoAnimal(item)
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2002') throw new GraphQLError('Já existe um tipo de animal com este nome', { extensions: { code: 'DUPLICATE' } })
        throw e
      }
    },

    updateTipoAnimal: async (_: unknown, { id, input }: { id: string; input: { nome?: string; ordem?: number } }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      try {
        const data: Record<string, unknown> = {}
        if (input.nome !== undefined) data['nome'] = input.nome.trim()
        if (input.ordem !== undefined) data['ordem'] = input.ordem
        const item = await ctx.prisma.tipoAnimal.update({ where: { id }, data })
        return mapTipoAnimal(item)
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2002') throw new GraphQLError('Já existe um tipo de animal com este nome', { extensions: { code: 'DUPLICATE' } })
        throw e
      }
    },
  },
}
