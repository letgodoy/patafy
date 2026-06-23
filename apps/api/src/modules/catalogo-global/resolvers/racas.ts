import { GraphQLError } from 'graphql'
import { requireAuth, requireSystemAdmin } from '../../auth/rbac.js'
import { mapRaca } from '../mappers.js'
import type { GraphQLContext } from '../../../context.js'

export const racasResolvers = {
  Query: {
    racas: async (_: unknown, { tipoAnimalId, ativo }: { tipoAnimalId?: string; ativo?: boolean }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const where: Record<string, unknown> = {}
      if (tipoAnimalId !== undefined) where['tipo_animal_id'] = tipoAnimalId
      if (ativo !== undefined) where['ativo'] = ativo
      const items = await ctx.prisma.raca.findMany({ where, include: { tipo_animal: true }, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] })
      return items.map(mapRaca)
    },
  },

  Mutation: {
    createRaca: async (_: unknown, { input }: { input: { tipoAnimalId: string; nome: string; ordem?: number } }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      const tipo = await ctx.prisma.tipoAnimal.findUnique({ where: { id: input.tipoAnimalId } })
      if (!tipo) throw new GraphQLError('Tipo de animal não encontrado', { extensions: { code: 'NOT_FOUND' } })
      try {
        const item = await ctx.prisma.raca.create({
          data: { tipo_animal_id: input.tipoAnimalId, nome: input.nome.trim(), ordem: input.ordem },
          include: { tipo_animal: true },
        })
        return mapRaca(item)
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2002') throw new GraphQLError('Já existe uma raça com este nome para este tipo de animal', { extensions: { code: 'DUPLICATE' } })
        throw e
      }
    },

    updateRaca: async (_: unknown, { id, input }: { id: string; input: { nome?: string; ordem?: number } }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      try {
        const data: Record<string, unknown> = {}
        if (input.nome !== undefined) data['nome'] = input.nome.trim()
        if (input.ordem !== undefined) data['ordem'] = input.ordem
        const item = await ctx.prisma.raca.update({ where: { id }, data, include: { tipo_animal: true } })
        return mapRaca(item)
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2002') throw new GraphQLError('Já existe uma raça com este nome para este tipo de animal', { extensions: { code: 'DUPLICATE' } })
        throw e
      }
    },
  },
}
