import { GraphQLError } from 'graphql'
import { admin } from '../../plugins/firebase-auth.js'
import { requireAuth, requirePetshopRole } from './rbac.js'
import { validarCPF, normalizarCPF, mascararCPF } from '../../lib/cpf.js'
import type { GraphQLContext } from '../../context.js'
import type { PetshopUserRole } from '@patafy/db'

export const authTypeDefs = /* GraphQL */ `
  type User {
    id: ID!
    email: String!
    nome: String!
    cpf: String!
    telefone: String
    ativo: Boolean!
    tutorProfile: TutorProfile
    petshopProfiles: [PetshopUserProfile!]!
    createdAt: String!
  }

  type TutorProfile {
    id: ID!
    userId: String!
    endereco: String
    ativo: Boolean!
  }

  type PetshopUserProfile {
    id: ID!
    userId: String!
    petshopId: String!
    roles: [String!]!
    ativo: Boolean!
  }

  input RegisterTutorInput {
    nome: String!
    email: String!
    cpf: String!
    telefone: String
    endereco: String
  }

  input CreatePetshopStaffInput {
    nome: String!
    email: String!
    cpf: String!
    telefone: String
    petshopId: String!
    roles: [String!]!
  }

  input UpdateMyProfileInput {
    nome: String
    telefone: String
    endereco: String
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    syncUser: User
    registerTutor(input: RegisterTutorInput!): User!
    createPetshopStaff(input: CreatePetshopStaffInput!): User!
    updateMyProfile(input: UpdateMyProfileInput!): User!
  }
`

type UserWithRelations = Awaited<ReturnType<GraphQLContext['prisma']['user']['findUnique']>> & {
  tutor_profile: { id: string; user_id: string; endereco: string | null; ativo: boolean } | null
  petshop_profiles: { id: string; user_id: string; petshop_id: string; roles: PetshopUserRole[]; ativo: boolean }[]
}

function mapUser(user: NonNullable<UserWithRelations>) {
  return {
    id: user.id,
    email: user.email,
    nome: user.nome,
    cpf: mascararCPF(user.cpf),
    telefone: user.telefone,
    ativo: user.ativo,
    createdAt: user.created_at.toISOString(),
    tutorProfile: user.tutor_profile
      ? { id: user.tutor_profile.id, userId: user.tutor_profile.user_id, endereco: user.tutor_profile.endereco, ativo: user.tutor_profile.ativo }
      : null,
    petshopProfiles: user.petshop_profiles.map((p) => ({
      id: p.id,
      userId: p.user_id,
      petshopId: p.petshop_id,
      roles: p.roles,
      ativo: p.ativo,
    })),
  }
}

const include = { tutor_profile: true, petshop_profiles: true } as const

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.firebaseUser) return null
      const user = await ctx.prisma.user.findUnique({ where: { firebase_uid: ctx.firebaseUser.uid }, include })
      return user ? mapUser(user) : null
    },
  },

  Mutation: {
    syncUser: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.firebaseUser) throw new GraphQLError('Não autenticado', { extensions: { code: 'UNAUTHENTICATED' } })

      const user = await ctx.prisma.user.findUnique({ where: { firebase_uid: ctx.firebaseUser.uid }, include })
      if (!user) return null // não cadastrado — frontend redireciona para /cadastro

      const updated = await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          nome: ctx.firebaseUser.name ?? user.nome,
          email: ctx.firebaseUser.email ?? user.email,
        },
        include,
      })
      return mapUser(updated)
    },

    registerTutor: async (_: unknown, { input }: { input: { nome: string; email: string; cpf: string; telefone?: string; endereco?: string } }, ctx: GraphQLContext) => {
      if (!ctx.firebaseUser) throw new GraphQLError('Não autenticado', { extensions: { code: 'UNAUTHENTICATED' } })

      const cpf = normalizarCPF(input.cpf)
      if (!validarCPF(cpf)) throw new GraphQLError('CPF inválido', { extensions: { code: 'CPF_INVALID' } })

      try {
        const user = await ctx.prisma.user.create({
          data: {
            firebase_uid: ctx.firebaseUser.uid,
            nome: input.nome,
            email: input.email,
            cpf,
            telefone: input.telefone,
            tutor_profile: { create: { endereco: input.endereco } },
          },
          include,
        })
        return mapUser(user)
      } catch (e: unknown) {
        const target = (e as { meta?: { target?: string[] } }).meta?.target ?? []
        if ((e as { code?: string }).code === 'P2002') {
          if (target.includes('cpf')) throw new GraphQLError('CPF já cadastrado', { extensions: { code: 'CPF_DUPLICATE' } })
          if (target.includes('email')) throw new GraphQLError('E-mail já cadastrado', { extensions: { code: 'EMAIL_DUPLICATE' } })
        }
        throw e
      }
    },

    createPetshopStaff: async (_: unknown, { input }: { input: { nome: string; email: string; cpf: string; telefone?: string; petshopId: string; roles: string[] } }, ctx: GraphQLContext) => {
      requirePetshopRole(ctx, input.petshopId, ['owner'])

      const cpf = normalizarCPF(input.cpf)
      if (!validarCPF(cpf)) throw new GraphQLError('CPF inválido', { extensions: { code: 'CPF_INVALID' } })

      let firebaseUid: string
      try {
        const fbUser = await admin.auth().createUser({ email: input.email, displayName: input.nome })
        firebaseUid = fbUser.uid
        // Link de redefinição de senha gerado — envio via Resend no E09
        await admin.auth().generatePasswordResetLink(input.email)
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'auth/email-already-exists') {
          throw new GraphQLError('E-mail já existe no sistema de autenticação', { extensions: { code: 'EMAIL_DUPLICATE' } })
        }
        throw e
      }

      try {
        const user = await ctx.prisma.user.create({
          data: {
            firebase_uid: firebaseUid,
            nome: input.nome,
            email: input.email,
            cpf,
            telefone: input.telefone,
            petshop_profiles: {
              create: { petshop_id: input.petshopId, roles: input.roles as PetshopUserRole[] },
            },
          },
          include,
        })
        return mapUser(user)
      } catch (e: unknown) {
        await admin.auth().deleteUser(firebaseUid).catch(() => undefined)
        const target = (e as { meta?: { target?: string[] } }).meta?.target ?? []
        if ((e as { code?: string }).code === 'P2002' && target.includes('cpf')) {
          throw new GraphQLError('CPF já cadastrado', { extensions: { code: 'CPF_DUPLICATE' } })
        }
        throw e
      }
    },

    updateMyProfile: async (_: unknown, { input }: { input: { nome?: string; telefone?: string; endereco?: string } }, ctx: GraphQLContext) => {
      requireAuth(ctx)

      const user = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          ...(input.nome ? { nome: input.nome } : {}),
          ...(input.telefone !== undefined ? { telefone: input.telefone } : {}),
          ...(input.endereco !== undefined && ctx.tutorProfile
            ? { tutor_profile: { update: { endereco: input.endereco } } }
            : {}),
        },
        include,
      })
      return mapUser(user)
    },
  },
}
