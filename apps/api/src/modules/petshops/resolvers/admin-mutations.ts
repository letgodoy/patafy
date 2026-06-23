import { GraphQLError } from 'graphql'
import { admin } from '../../../plugins/firebase-auth.js'
import { requireSystemAdmin } from '../../auth/rbac.js'
import { mapPetShop, mapStaffMember } from '../mappers.js'
import type { GraphQLContext } from '../../../context.js'

type CreatePetShopInput = {
  nomeExibicao: string
  razaoSocial: string
  cnpj: string
  endereco: string
  cidade: string
  estado: string
  telefone?: string
  email: string
}

type CreateOwnerInput = {
  petshopId: string
  nome: string
  cpf: string
  email: string
  telefone?: string
  senha: string
}

export const adminMutations = {
  createPetShop: async (_: unknown, { input }: { input: CreatePetShopInput }, ctx: GraphQLContext) => {
    requireSystemAdmin(ctx)
    if (input.cnpj.replace(/\D/g, '').length !== 14) {
      throw new GraphQLError('CNPJ inválido', { extensions: { code: 'BAD_REQUEST' } })
    }
    if (!/^[A-Z]{2}$/.test(input.estado.toUpperCase())) {
      throw new GraphQLError('Estado inválido — use a sigla com 2 letras (ex: SP)', { extensions: { code: 'BAD_REQUEST' } })
    }
    try {
      const ps = await ctx.prisma.petShop.create({
        data: {
          nome_exibicao: input.nomeExibicao,
          razao_social: input.razaoSocial,
          cnpj: input.cnpj.replace(/\D/g, ''),
          endereco: input.endereco,
          cidade: input.cidade,
          estado: input.estado.toUpperCase(),
          telefone: input.telefone ?? null,
          email: input.email,
        },
      })
      return mapPetShop(ps)
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new GraphQLError('CNPJ já cadastrado', { extensions: { code: 'DUPLICATE' } })
      }
      throw e
    }
  },

  createPetShopOwner: async (_: unknown, { input }: { input: CreateOwnerInput }, ctx: GraphQLContext) => {
    requireSystemAdmin(ctx)
    const petshop = await ctx.prisma.petShop.findUnique({ where: { id: input.petshopId } })
    if (!petshop) throw new GraphQLError('Pet shop não encontrado', { extensions: { code: 'NOT_FOUND' } })

    let fbUser: { uid: string }
    try {
      fbUser = await admin.auth().createUser({
        email: input.email,
        password: input.senha,
        displayName: input.nome,
      })
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code === 'auth/email-already-exists') {
        throw new GraphQLError('E-mail já cadastrado no Firebase', { extensions: { code: 'DUPLICATE' } })
      }
      throw e
    }

    try {
      const user = await ctx.prisma.user.upsert({
        where: { firebase_uid: fbUser.uid },
        update: {},
        create: {
          firebase_uid: fbUser.uid,
          email: input.email,
          nome: input.nome,
          cpf: input.cpf.replace(/\D/g, ''),
          telefone: input.telefone ?? null,
          ativo: true,
        },
      })

      const profile = await ctx.prisma.petshopUserProfile.create({
        data: {
          user_id: user.id,
          petshop_id: input.petshopId,
          roles: ['owner'],
          ativo: true,
        },
        include: { user: true },
      })

      return mapStaffMember(profile)
    } catch (e) {
      await admin.auth().deleteUser(fbUser.uid)
      throw e
    }
  },

  deactivatePetShop: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireSystemAdmin(ctx)
    const ps = await ctx.prisma.petShop.findUnique({ where: { id } })
    if (!ps) throw new GraphQLError('Pet shop não encontrado', { extensions: { code: 'NOT_FOUND' } })
    await ctx.prisma.petShop.update({ where: { id }, data: { ativo: false } })
    return true
  },
}
