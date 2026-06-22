import { GraphQLError } from 'graphql'
import { admin } from '../../plugins/firebase-auth.js'
import { requireAuth, requireSystemAdmin } from '../auth/rbac.js'
import type { GraphQLContext } from '../../context.js'

export const catalogoGlobalTypeDefs = /* GraphQL */ `
  type TipoAnimal {
    id: ID!
    nome: String!
    ativo: Boolean!
    ordem: Int
    createdAt: String!
  }

  type Raca {
    id: ID!
    tipoAnimalId: String!
    tipoAnimal: TipoAnimal!
    nome: String!
    ativo: Boolean!
    ordem: Int
    createdAt: String!
  }

  type Porte {
    id: ID!
    nome: String!
    ativo: Boolean!
    ordem: Int
    createdAt: String!
  }

  type Pelagem {
    id: ID!
    nome: String!
    ativo: Boolean!
    ordem: Int
    createdAt: String!
  }

  type SystemAdminUser {
    id: ID!
    email: String!
    nome: String!
    ativo: Boolean!
    createdAt: String!
  }

  input CreateTipoAnimalInput {
    nome: String!
    ordem: Int
  }

  input UpdateTipoAnimalInput {
    nome: String
    ordem: Int
  }

  input CreateRacaInput {
    tipoAnimalId: String!
    nome: String!
    ordem: Int
  }

  input UpdateRacaInput {
    nome: String
    ordem: Int
  }

  input CreatePorteInput {
    nome: String!
    ordem: Int
  }

  input UpdatePorteInput {
    nome: String
    ordem: Int
  }

  input CreatePelagemInput {
    nome: String!
    ordem: Int
  }

  input UpdatePelagemInput {
    nome: String
    ordem: Int
  }

  input CreateSystemAdminInput {
    nome: String!
    email: String!
    senha: String!
  }

  extend type Query {
    tiposAnimal(ativo: Boolean): [TipoAnimal!]!
    racas(tipoAnimalId: String, ativo: Boolean): [Raca!]!
    portes(ativo: Boolean): [Porte!]!
    pelagens(ativo: Boolean): [Pelagem!]!
    listSystemAdmins: [SystemAdminUser!]!
  }

  extend type Mutation {
    createTipoAnimal(input: CreateTipoAnimalInput!): TipoAnimal!
    updateTipoAnimal(id: ID!, input: UpdateTipoAnimalInput!): TipoAnimal!
    createRaca(input: CreateRacaInput!): Raca!
    updateRaca(id: ID!, input: UpdateRacaInput!): Raca!
    createPorte(input: CreatePorteInput!): Porte!
    updatePorte(id: ID!, input: UpdatePorteInput!): Porte!
    createPelagem(input: CreatePelagemInput!): Pelagem!
    updatePelagem(id: ID!, input: UpdatePelagemInput!): Pelagem!
    setCatalogItemAtivo(tipo: String!, id: ID!, ativo: Boolean!): Boolean!
    createSystemAdmin(input: CreateSystemAdminInput!): SystemAdminUser!
  }
`

type CatalogTipo = 'tipoAnimal' | 'raca' | 'porte' | 'pelagem'
const CATALOG_TIPOS: Record<string, CatalogTipo> = {
  tipoAnimal: 'tipoAnimal',
  raca: 'raca',
  porte: 'porte',
  pelagem: 'pelagem',
}

function mapTipoAnimal(t: { id: string; nome: string; ativo: boolean; ordem: number | null; created_at: Date }) {
  return { id: t.id, nome: t.nome, ativo: t.ativo, ordem: t.ordem, createdAt: t.created_at.toISOString() }
}

function mapRaca(r: {
  id: string
  tipo_animal_id: string
  nome: string
  ativo: boolean
  ordem: number | null
  created_at: Date
  tipo_animal?: { id: string; nome: string; ativo: boolean; ordem: number | null; created_at: Date }
}) {
  return {
    id: r.id,
    tipoAnimalId: r.tipo_animal_id,
    nome: r.nome,
    ativo: r.ativo,
    ordem: r.ordem,
    createdAt: r.created_at.toISOString(),
    tipoAnimal: r.tipo_animal ? mapTipoAnimal(r.tipo_animal) : null,
  }
}

function mapPorte(p: { id: string; nome: string; ativo: boolean; ordem: number | null; created_at: Date }) {
  return { id: p.id, nome: p.nome, ativo: p.ativo, ordem: p.ordem, createdAt: p.created_at.toISOString() }
}

function mapPelagem(p: { id: string; nome: string; ativo: boolean; ordem: number | null; created_at: Date }) {
  return { id: p.id, nome: p.nome, ativo: p.ativo, ordem: p.ordem, createdAt: p.created_at.toISOString() }
}

export const catalogoGlobalResolvers = {
  Query: {
    tiposAnimal: async (_: unknown, { ativo }: { ativo?: boolean }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const where = ativo !== undefined ? { ativo } : {}
      const items = await ctx.prisma.tipoAnimal.findMany({ where, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] })
      return items.map(mapTipoAnimal)
    },

    racas: async (_: unknown, { tipoAnimalId, ativo }: { tipoAnimalId?: string; ativo?: boolean }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const where: Record<string, unknown> = {}
      if (tipoAnimalId !== undefined) where['tipo_animal_id'] = tipoAnimalId
      if (ativo !== undefined) where['ativo'] = ativo
      const items = await ctx.prisma.raca.findMany({ where, include: { tipo_animal: true }, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] })
      return items.map(mapRaca)
    },

    portes: async (_: unknown, { ativo }: { ativo?: boolean }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const where = ativo !== undefined ? { ativo } : {}
      const items = await ctx.prisma.porte.findMany({ where, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] })
      return items.map(mapPorte)
    },

    pelagens: async (_: unknown, { ativo }: { ativo?: boolean }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const where = ativo !== undefined ? { ativo } : {}
      const items = await ctx.prisma.pelagem.findMany({ where, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] })
      return items.map(mapPelagem)
    },

    listSystemAdmins: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      const users = await ctx.prisma.user.findMany({ orderBy: { created_at: 'asc' } })
      const adminList = []
      for (const u of users) {
        try {
          const fbUser = await admin.auth().getUser(u.firebase_uid)
          const claims = fbUser.customClaims ?? {}
          if (claims['system_admin'] === true) {
            adminList.push({ id: u.id, email: u.email, nome: u.nome, ativo: u.ativo, createdAt: u.created_at.toISOString() })
          }
        } catch {
          // usuário removido do Firebase
        }
      }
      return adminList
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

    setCatalogItemAtivo: async (_: unknown, { tipo, id, ativo }: { tipo: string; id: string; ativo: boolean }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      const model = CATALOG_TIPOS[tipo]
      if (!model) throw new GraphQLError(`Tipo de catálogo inválido: ${tipo}`, { extensions: { code: 'BAD_REQUEST' } })
      await (ctx.prisma[model] as { update: (args: unknown) => Promise<unknown> }).update({ where: { id }, data: { ativo } })
      return true
    },

    createSystemAdmin: async (_: unknown, { input }: { input: { nome: string; email: string; senha: string } }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      let fbUser: { uid: string }
      try {
        fbUser = await admin.auth().createUser({ email: input.email, password: input.senha, displayName: input.nome })
      } catch (e: unknown) {
        const err = e as { code?: string }
        if (err.code === 'auth/email-already-exists') throw new GraphQLError('E-mail já cadastrado no Firebase', { extensions: { code: 'DUPLICATE' } })
        throw e
      }
      await admin.auth().setCustomUserClaims(fbUser.uid, { system_admin: true })
      try {
        const user = await ctx.prisma.user.create({
          data: { firebase_uid: fbUser.uid, email: input.email, nome: input.nome, cpf: `admin-${fbUser.uid.slice(0, 8)}`, ativo: true },
        })
        return { id: user.id, email: user.email, nome: user.nome, ativo: user.ativo, createdAt: user.created_at.toISOString() }
      } catch (e) {
        await admin.auth().deleteUser(fbUser.uid)
        throw e
      }
    },
  },
}
