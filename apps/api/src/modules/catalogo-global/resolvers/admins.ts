import { GraphQLError } from 'graphql'
import { admin } from '../../../plugins/firebase-auth.js'
import { requireSystemAdmin } from '../../auth/rbac.js'
import type { GraphQLContext } from '../../../context.js'

export const adminsResolvers = {
  Query: {
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
        } catch (err) {
          console.warn(`Usuário ${u.firebase_uid} não encontrado no Firebase`, err)
        }
      }
      return adminList
    },
  },

  Mutation: {
    setCatalogItemAtivo: async (_: unknown, { tipo, id, ativo }: { tipo: string; id: string; ativo: boolean }, ctx: GraphQLContext) => {
      requireSystemAdmin(ctx)
      const modelos: Record<string, 'tipoAnimal' | 'raca' | 'porte' | 'pelagem'> = {
        tipoAnimal: 'tipoAnimal', raca: 'raca', porte: 'porte', pelagem: 'pelagem',
      }
      const model = modelos[tipo]
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
