import { requireAuth, requirePetshopRole, requireSystemAdmin } from '../../auth/rbac.js'
import { mapPetShop, mapStaffMember, mapBloqueio } from '../mappers.js'
import type { GraphQLContext } from '../../../context.js'

export const petshopsQueries = {
  listPetShops: async (
    _: unknown,
    { filter }: { filter?: { cidade?: string; estado?: string; nome?: string; ativo?: boolean } },
    ctx: GraphQLContext,
  ) => {
    requireAuth(ctx)
    const where: Record<string, unknown> = {}
    if (filter?.cidade) where['cidade'] = { contains: filter.cidade, mode: 'insensitive' }
    if (filter?.estado) where['estado'] = filter.estado.toUpperCase()
    if (filter?.nome) where['nome_exibicao'] = { contains: filter.nome, mode: 'insensitive' }
    if (filter?.ativo !== undefined) where['ativo'] = filter.ativo
    const items = await ctx.prisma.petShop.findMany({ where, orderBy: { nome_exibicao: 'asc' } })
    return items.map(mapPetShop)
  },

  petShopById: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const ps = await ctx.prisma.petShop.findUnique({ where: { id } })
    return ps ? mapPetShop(ps) : null
  },

  petShopBySlug: async (_: unknown, { slug }: { slug: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const items = await ctx.prisma.petShop.findMany({
      where: { ativo: true },
    })
    const found = items.find((ps) => {
      const cfg = (ps.config_json ?? {}) as Record<string, unknown>
      return typeof cfg['slug'] === 'string' && cfg['slug'].toLowerCase() === slug.toLowerCase()
    })
    return found ? mapPetShop(found) : null
  },

  myPetShop: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const petshopId = ctx.activePetshopId ?? ctx.petshopProfiles[0]?.petshop_id
    if (!petshopId) return null
    const ps = await ctx.prisma.petShop.findUnique({ where: { id: petshopId } })
    return ps ? mapPetShop(ps) : null
  },

  listStaff: async (_: unknown, { petshopId }: { petshopId: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const isAdmin = ctx.isSystemAdmin
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === petshopId && p.ativo)
    if (!isAdmin && !isStaff) {
      requirePetshopRole(ctx, petshopId, ['owner', 'atendente'])
    }
    const profiles = await ctx.prisma.petshopUserProfile.findMany({
      where: { petshop_id: petshopId },
      include: { user: true },
      orderBy: { created_at: 'asc' },
    })
    return profiles.map(mapStaffMember)
  },

  listBloqueios: async (_: unknown, { petshopId }: { petshopId: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    requirePetshopRole(ctx, petshopId, ['owner', 'atendente', 'banhista'])
    const bloqueios = await ctx.prisma.bloqueioAgenda.findMany({
      where: { petshop_id: petshopId },
      orderBy: { data_inicio: 'asc' },
    })
    return bloqueios.map(mapBloqueio)
  },
}

export const petshopsAdminQueries = {
  listPetShopsAdmin: async (
    _: unknown,
    { filter }: { filter?: { cidade?: string; estado?: string; nome?: string; ativo?: boolean } },
    ctx: GraphQLContext,
  ) => {
    requireSystemAdmin(ctx)
    const where: Record<string, unknown> = {}
    if (filter?.cidade) where['cidade'] = { contains: filter.cidade, mode: 'insensitive' }
    if (filter?.estado) where['estado'] = filter.estado.toUpperCase()
    if (filter?.nome) where['nome_exibicao'] = { contains: filter.nome, mode: 'insensitive' }
    if (filter?.ativo !== undefined) where['ativo'] = filter.ativo
    const items = await ctx.prisma.petShop.findMany({ where, orderBy: { nome_exibicao: 'asc' } })
    return items.map(mapPetShop)
  },
}
