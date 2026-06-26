import { GraphQLError } from 'graphql'
import { requireAuth, requirePetshopRole } from '../auth/rbac.js'
import type { GraphQLContext } from '../../context.js'
import type { Servico, ServicoVariante, Pet } from '@patafy/db'

const VARIANTE_INCLUDE = { variantes: { where: { ativo: true }, orderBy: { preco: 'asc' as const } } } as const

function mapVariante(v: ServicoVariante) {
  return { id: v.id, servicoId: v.servico_id, porteId: v.porte_id, racaId: v.raca_id, pelagemId: v.pelagem_id, duracaoMinutos: v.duracao_minutos, preco: Number(v.preco), ativo: v.ativo }
}

function mapServico(s: Servico & { variantes: ServicoVariante[] }) {
  return { id: s.id, petshopId: s.petshop_id, categoriaId: s.categoria_id, nome: s.nome, descricao: s.descricao, ativo: s.ativo, variantes: s.variantes.map(mapVariante) }
}

function varianteMatchesPet(v: ServicoVariante, pet: Pet) {
  if (v.porte_id && v.porte_id !== pet.porte_id) return false
  if (v.raca_id && v.raca_id !== pet.raca_id) return false
  if (v.pelagem_id && v.pelagem_id !== pet.pelagem_id) return false
  return true
}

export const servicosQueries = {
  listCategorias: async (_: unknown, { petshopId }: { petshopId: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const cats = await ctx.prisma.categoriaServico.findMany({
      where: { petshop_id: petshopId },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    })
    return cats.map((c) => ({ id: c.id, petshopId: c.petshop_id, nome: c.nome, ordem: c.ordem, ativo: c.ativo }))
  },

  listServicos: async (_: unknown, { petshopId, petId }: { petshopId: string; petId?: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const servicos = await ctx.prisma.servico.findMany({
      where: { petshop_id: petshopId, ativo: true },
      include: VARIANTE_INCLUDE,
      orderBy: { nome: 'asc' },
    })

    if (!petId) return servicos.map(mapServico)

    const pet = await ctx.prisma.pet.findUnique({ where: { id: petId } })
    if (!pet) throw new GraphQLError('Pet não encontrado', { extensions: { code: 'NOT_FOUND' } })

    return servicos
      .map((s) => ({ ...mapServico(s), variantes: s.variantes.filter((v) => varianteMatchesPet(v, pet)) }))
      .filter((s) => s.variantes.length > 0)
  },

  getServico: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const s = await ctx.prisma.servico.findUnique({ where: { id }, include: VARIANTE_INCLUDE })
    return s ? mapServico(s) : null
  },
}

export const servicosMutations = {
  createCategoria: async (_: unknown, { petshopId, input }: { petshopId: string; input: { nome: string; ordem?: number } }, ctx: GraphQLContext) => {
    requirePetshopRole(ctx, petshopId, ['owner'])
    const c = await ctx.prisma.categoriaServico.create({ data: { petshop_id: petshopId, nome: input.nome.trim(), ordem: input.ordem ?? null } })
    return { id: c.id, petshopId: c.petshop_id, nome: c.nome, ordem: c.ordem, ativo: c.ativo }
  },

  updateCategoria: async (_: unknown, { id, input }: { id: string; input: { nome?: string; ordem?: number; ativo?: boolean } }, ctx: GraphQLContext) => {
    const existing = await ctx.prisma.categoriaServico.findUnique({ where: { id } })
    if (!existing) throw new GraphQLError('Categoria não encontrada', { extensions: { code: 'NOT_FOUND' } })
    requirePetshopRole(ctx, existing.petshop_id, ['owner'])
    const c = await ctx.prisma.categoriaServico.update({
      where: { id },
      data: { ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}), ...(input.ordem !== undefined ? { ordem: input.ordem } : {}), ...(input.ativo !== undefined ? { ativo: input.ativo } : {}) },
    })
    return { id: c.id, petshopId: c.petshop_id, nome: c.nome, ordem: c.ordem, ativo: c.ativo }
  },

  createServico: async (_: unknown, { petshopId, input }: { petshopId: string; input: { nome: string; descricao?: string; categoriaId?: string } }, ctx: GraphQLContext) => {
    requirePetshopRole(ctx, petshopId, ['owner'])
    const s = await ctx.prisma.servico.create({
      data: { petshop_id: petshopId, nome: input.nome.trim(), descricao: input.descricao ?? null, categoria_id: input.categoriaId ?? null },
      include: VARIANTE_INCLUDE,
    })
    return mapServico(s)
  },

  updateServico: async (_: unknown, { id, input }: { id: string; input: { nome?: string; descricao?: string; categoriaId?: string; ativo?: boolean } }, ctx: GraphQLContext) => {
    const existing = await ctx.prisma.servico.findUnique({ where: { id } })
    if (!existing) throw new GraphQLError('Serviço não encontrado', { extensions: { code: 'NOT_FOUND' } })
    requirePetshopRole(ctx, existing.petshop_id, ['owner'])
    const s = await ctx.prisma.servico.update({
      where: { id },
      data: { ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}), ...(input.descricao !== undefined ? { descricao: input.descricao ?? null } : {}), ...(input.categoriaId !== undefined ? { categoria_id: input.categoriaId ?? null } : {}), ...(input.ativo !== undefined ? { ativo: input.ativo } : {}) },
      include: VARIANTE_INCLUDE,
    })
    return mapServico(s)
  },

  deactivateServico: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const existing = await ctx.prisma.servico.findUnique({ where: { id } })
    if (!existing) throw new GraphQLError('Serviço não encontrado', { extensions: { code: 'NOT_FOUND' } })
    requirePetshopRole(ctx, existing.petshop_id, ['owner'])
    await ctx.prisma.servico.update({ where: { id }, data: { ativo: false } })
    return true
  },

  createServicoVariante: async (_: unknown, { input }: { input: { servicoId: string; porteId?: string; racaId?: string; pelagemId?: string; duracaoMinutos: number; preco: number } }, ctx: GraphQLContext) => {
    const servico = await ctx.prisma.servico.findUnique({ where: { id: input.servicoId } })
    if (!servico) throw new GraphQLError('Serviço não encontrado', { extensions: { code: 'NOT_FOUND' } })
    requirePetshopRole(ctx, servico.petshop_id, ['owner'])
    const v = await ctx.prisma.servicoVariante.create({
      data: { servico_id: input.servicoId, porte_id: input.porteId ?? null, raca_id: input.racaId ?? null, pelagem_id: input.pelagemId ?? null, duracao_minutos: input.duracaoMinutos, preco: input.preco },
    })
    return mapVariante(v)
  },

  updateServicoVariante: async (_: unknown, { id, input }: { id: string; input: { porteId?: string; racaId?: string; pelagemId?: string; duracaoMinutos?: number; preco?: number; ativo?: boolean } }, ctx: GraphQLContext) => {
    const v = await ctx.prisma.servicoVariante.findUnique({ where: { id }, include: { servico: true } })
    if (!v) throw new GraphQLError('Variante não encontrada', { extensions: { code: 'NOT_FOUND' } })
    requirePetshopRole(ctx, v.servico.petshop_id, ['owner'])
    const updated = await ctx.prisma.servicoVariante.update({
      where: { id },
      data: { ...(input.porteId !== undefined ? { porte_id: input.porteId ?? null } : {}), ...(input.racaId !== undefined ? { raca_id: input.racaId ?? null } : {}), ...(input.pelagemId !== undefined ? { pelagem_id: input.pelagemId ?? null } : {}), ...(input.duracaoMinutos !== undefined ? { duracao_minutos: input.duracaoMinutos } : {}), ...(input.preco !== undefined ? { preco: input.preco } : {}), ...(input.ativo !== undefined ? { ativo: input.ativo } : {}) },
    })
    return mapVariante(updated)
  },
}
