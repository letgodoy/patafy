import { GraphQLError } from 'graphql'
import { requireAuth, requirePetshopRole } from '../auth/rbac.js'
import type { GraphQLContext } from '../../context.js'
import type { Pacote, PacoteItem, PacotePet, ServicoVariante, Servico, PacoteItemDebito } from '@patafy/db'

type PacoteWithItems = Pacote & { items: (PacoteItem & { servico_variante: ServicoVariante & { servico: Servico } })[] }

type PacotePetWithDebitos = PacotePet & {
  pacote: PacoteWithItems
  debitos: PacoteItemDebito[]
}

function mapPacote(p: Pacote & { items: PacoteItem[] }) {
  return {
    id: p.id,
    petshopId: p.petshop_id,
    nome: p.nome,
    descricao: p.descricao,
    travado: p.travado,
    descontoPercentual: p.desconto_percentual ? Number(p.desconto_percentual) : null,
    validade: p.validade?.toISOString().slice(0, 10) ?? null,
    ativo: p.ativo,
    items: p.items.map((i) => ({
      id: i.id,
      pacoteId: i.pacote_id,
      servicoVarianteId: i.servico_variante_id,
      quantidadeTotal: i.quantidade_total,
      quantidadeUsada: i.quantidade_usada,
      restante: i.quantidade_total - i.quantidade_usada,
    })),
  }
}

function mapSaldo(pp: PacotePetWithDebitos) {
  const now = new Date()
  const expirado = pp.data_expiracao ? pp.data_expiracao < now : false

  const items = pp.pacote.items.map((item) => {
    const usada = pp.debitos.filter((d) => d.pacote_item_id === item.id).reduce((acc, d) => acc + d.quantidade, 0)
    return {
      servicoVarianteId: item.servico_variante_id,
      servicoNome: item.servico_variante.servico.nome,
      quantidadeTotal: item.quantidade_total,
      quantidadeUsada: usada,
      restante: item.quantidade_total - usada,
    }
  })

  const esgotado = items.every((i) => i.restante <= 0)
  const status = expirado ? 'expirado' : esgotado ? 'esgotado' : 'ativo'

  return {
    id: pp.id,
    pacoteId: pp.pacote_id,
    pacoteNome: pp.pacote.nome,
    dataAtivacao: pp.data_ativacao.toISOString().slice(0, 10),
    dataExpiracao: pp.data_expiracao?.toISOString().slice(0, 10) ?? null,
    status,
    items,
  }
}

const PACOTE_INCLUDE = { items: true } as const

const SALDO_INCLUDE = {
  pacote: { include: { items: { include: { servico_variante: { include: { servico: true } } } } } },
  debitos: true,
} as const

export const pacotesQueries = {
  listPacotes: async (_: unknown, { petshopId }: { petshopId: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const pacotes = await ctx.prisma.pacote.findMany({
      where: { petshop_id: petshopId },
      include: PACOTE_INCLUDE,
      orderBy: { nome: 'asc' },
    })
    return pacotes.map(mapPacote)
  },

  listPacotesPorPet: async (_: unknown, { petId }: { petId: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const pps = await ctx.prisma.pacotePet.findMany({
      where: { pet_id: petId },
      include: SALDO_INCLUDE,
      orderBy: { data_ativacao: 'desc' },
    })
    return pps.map((pp) => mapSaldo(pp as PacotePetWithDebitos))
  },
}

export const pacotesMutations = {
  createPacote: async (_: unknown, { petshopId, input }: { petshopId: string; input: { nome: string; descricao?: string; travado: boolean; descontoPercentual?: number; validade?: string } }, ctx: GraphQLContext) => {
    requirePetshopRole(ctx, petshopId, ['owner'])
    const p = await ctx.prisma.pacote.create({
      data: {
        petshop_id: petshopId,
        nome: input.nome.trim(),
        descricao: input.descricao ?? null,
        travado: input.travado,
        desconto_percentual: input.descontoPercentual ?? null,
        validade: input.validade ? new Date(input.validade) : null,
      },
      include: PACOTE_INCLUDE,
    })
    return mapPacote(p)
  },

  updatePacote: async (_: unknown, { id, input }: { id: string; input: { nome?: string; descricao?: string; descontoPercentual?: number; validade?: string; ativo?: boolean } }, ctx: GraphQLContext) => {
    const existing = await ctx.prisma.pacote.findUnique({ where: { id } })
    if (!existing) throw new GraphQLError('Pacote não encontrado', { extensions: { code: 'NOT_FOUND' } })
    requirePetshopRole(ctx, existing.petshop_id, ['owner'])
    const p = await ctx.prisma.pacote.update({
      where: { id },
      data: {
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao ?? null } : {}),
        ...(input.descontoPercentual !== undefined ? { desconto_percentual: input.descontoPercentual ?? null } : {}),
        ...(input.validade !== undefined ? { validade: input.validade ? new Date(input.validade) : null } : {}),
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
      },
      include: PACOTE_INCLUDE,
    })
    return mapPacote(p)
  },

  addPacoteItem: async (_: unknown, { pacoteId, servicoVarianteId, quantidadeTotal }: { pacoteId: string; servicoVarianteId: string; quantidadeTotal: number }, ctx: GraphQLContext) => {
    const pacote = await ctx.prisma.pacote.findUnique({ where: { id: pacoteId } })
    if (!pacote) throw new GraphQLError('Pacote não encontrado', { extensions: { code: 'NOT_FOUND' } })
    requirePetshopRole(ctx, pacote.petshop_id, ['owner'])
    await ctx.prisma.pacoteItem.create({ data: { pacote_id: pacoteId, servico_variante_id: servicoVarianteId, quantidade_total: quantidadeTotal } })
    const updated = await ctx.prisma.pacote.findUnique({ where: { id: pacoteId }, include: PACOTE_INCLUDE })
    return mapPacote(updated!)
  },

  removePacoteItem: async (_: unknown, { pacoteItemId }: { pacoteItemId: string }, ctx: GraphQLContext) => {
    const item = await ctx.prisma.pacoteItem.findUnique({ where: { id: pacoteItemId }, include: { pacote: true } })
    if (!item) throw new GraphQLError('Item não encontrado', { extensions: { code: 'NOT_FOUND' } })
    requirePetshopRole(ctx, item.pacote.petshop_id, ['owner'])
    await ctx.prisma.pacoteItem.delete({ where: { id: pacoteItemId } })
    const updated = await ctx.prisma.pacote.findUnique({ where: { id: item.pacote_id }, include: PACOTE_INCLUDE })
    return mapPacote(updated!)
  },

  venderPacoteTravado: async (_: unknown, { pacoteId, petId, dataAtivacao }: { pacoteId: string; petId: string; dataAtivacao: string }, ctx: GraphQLContext) => {
    const pacote = await ctx.prisma.pacote.findUnique({ where: { id: pacoteId } })
    if (!pacote) throw new GraphQLError('Pacote não encontrado', { extensions: { code: 'NOT_FOUND' } })
    if (!pacote.travado) throw new GraphQLError('Use venderPacotePersonalizado para pacotes não travados', { extensions: { code: 'BAD_REQUEST' } })
    if (!pacote.ativo) throw new GraphQLError('Pacote inativo', { extensions: { code: 'BAD_REQUEST' } })
    requirePetshopRole(ctx, pacote.petshop_id, ['owner', 'atendente'])

    const pp = await ctx.prisma.pacotePet.create({
      data: {
        pacote_id: pacoteId,
        pet_id: petId,
        data_ativacao: new Date(dataAtivacao),
        data_expiracao: pacote.validade ?? null,
      },
      include: SALDO_INCLUDE,
    })
    return mapSaldo(pp as PacotePetWithDebitos)
  },

  venderPacotePersonalizado: async (
    _: unknown,
    { petshopId, petId, itens, descontoPercentual, dataAtivacao }: { petshopId: string; petId: string; itens: { servicoVarianteId: string; quantidade: number }[]; descontoPercentual?: number; dataAtivacao: string },
    ctx: GraphQLContext,
  ) => {
    requirePetshopRole(ctx, petshopId, ['owner', 'atendente'])
    if (itens.length === 0) throw new GraphQLError('Informe pelo menos um item', { extensions: { code: 'BAD_REQUEST' } })

    const variantes = await ctx.prisma.servicoVariante.findMany({
      where: { id: { in: itens.map((i) => i.servicoVarianteId) }, servico: { petshop_id: petshopId } },
    })
    if (variantes.length !== itens.length) throw new GraphQLError('Uma ou mais variantes inválidas para este pet shop', { extensions: { code: 'BAD_REQUEST' } })

    const pacote = await ctx.prisma.pacote.create({
      data: {
        petshop_id: petshopId,
        nome: `Pacote personalizado — ${new Date(dataAtivacao).toLocaleDateString('pt-BR')}`,
        travado: false,
        desconto_percentual: descontoPercentual ?? null,
        ativo: false,
        items: { create: itens.map((i) => ({ servico_variante_id: i.servicoVarianteId, quantidade_total: i.quantidade })) },
      },
    })

    const pp = await ctx.prisma.pacotePet.create({
      data: { pacote_id: pacote.id, pet_id: petId, data_ativacao: new Date(dataAtivacao) },
      include: SALDO_INCLUDE,
    })
    return mapSaldo(pp as PacotePetWithDebitos)
  },
}
