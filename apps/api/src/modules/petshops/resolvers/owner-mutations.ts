import { GraphQLError } from 'graphql'
import { admin } from '../../../plugins/firebase-auth.js'
import { requireAuth, requirePetshopRole } from '../../auth/rbac.js'
import { mapPetShop, mapStaffMember, mapBloqueio } from '../mappers.js'
import type { GraphQLContext } from '../../../context.js'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SLUG_RESERVED = new Set(['admin', 'login', 'api', 'app', 'www', 'loja', 'patafy', 'sistema'])

type UpdatePetShopInput = {
  nomeExibicao?: string
  razaoSocial?: string
  cnpj?: string
  endereco?: string
  cidade?: string
  estado?: string
  telefone?: string
  email?: string
}

type UpdateConfigInput = {
  slug?: string
  nome?: string
  logo?: string
  corPrincipal?: string
  animaisAtendidos?: string[]
  tamanhosAceitos?: string[]
  aceitaPetsAgressivos?: boolean
  horarioFuncionamento?: string
  intervaloBanhoMinutos?: number
  prazoCancelamentoHoras?: number
  prazoRemarcacaoHoras?: number
  politicaCancelamento?: string
  toleranciaAtrasoMinutos?: number
  cancelamentoAutomaticoAposAtraso?: boolean
}

type CreateStaffInput = {
  petshopId: string
  nome: string
  cpf: string
  email: string
  telefone?: string
  roles: string[]
  senha: string
}

type CreateBloqueioInput = {
  petshopId: string
  banhistaId?: string
  dataInicio: string
  dataFim: string
  motivo?: string
}

export const ownerMutations = {
  updatePetShop: async (_: unknown, { id, input }: { id: string; input: UpdatePetShopInput }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const isAdmin = ctx.isSystemAdmin
    if (!isAdmin) requirePetshopRole(ctx, id, ['owner'])

    const data: Record<string, unknown> = {}
    if (input.nomeExibicao !== undefined) data['nome_exibicao'] = input.nomeExibicao
    if (input.razaoSocial !== undefined) data['razao_social'] = input.razaoSocial
    if (input.cnpj !== undefined) data['cnpj'] = input.cnpj.replace(/\D/g, '')
    if (input.endereco !== undefined) data['endereco'] = input.endereco
    if (input.cidade !== undefined) data['cidade'] = input.cidade
    if (input.estado !== undefined) data['estado'] = input.estado.toUpperCase()
    if (input.telefone !== undefined) data['telefone'] = input.telefone
    if (input.email !== undefined) data['email'] = input.email

    const ps = await ctx.prisma.petShop.update({ where: { id }, data })
    return mapPetShop(ps)
  },

  updatePetShopConfig: async (_: unknown, { id, config }: { id: string; config: UpdateConfigInput }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const isAdmin = ctx.isSystemAdmin
    if (!isAdmin) requirePetshopRole(ctx, id, ['owner'])

    if (config.slug !== undefined) {
      const slug = config.slug.toLowerCase()
      if (slug.length < 3 || slug.length > 64) {
        throw new GraphQLError('Slug deve ter entre 3 e 64 caracteres', { extensions: { code: 'BAD_REQUEST' } })
      }
      if (!SLUG_REGEX.test(slug)) {
        throw new GraphQLError('Slug inválido — use apenas letras minúsculas, números e hífens', { extensions: { code: 'BAD_REQUEST' } })
      }
      if (SLUG_RESERVED.has(slug)) {
        throw new GraphQLError(`Slug "${slug}" é reservado`, { extensions: { code: 'BAD_REQUEST' } })
      }
      const existing = await ctx.prisma.petShop.findMany({ where: { ativo: true } })
      const conflict = existing.find((ps) => {
        if (ps.id === id) return false
        const cfg = (ps.config_json ?? {}) as Record<string, unknown>
        return typeof cfg['slug'] === 'string' && cfg['slug'].toLowerCase() === slug
      })
      if (conflict) {
        throw new GraphQLError('Este slug já está em uso', { extensions: { code: 'DUPLICATE' } })
      }
      config.slug = slug
    }

    const current = await ctx.prisma.petShop.findUnique({ where: { id } })
    if (!current) throw new GraphQLError('Pet shop não encontrado', { extensions: { code: 'NOT_FOUND' } })

    const existingConfig = (current.config_json ?? {}) as Record<string, unknown>
    const updatedConfig: Record<string, unknown> = { ...existingConfig }

    if (config.slug !== undefined) updatedConfig['slug'] = config.slug
    if (config.nome !== undefined) updatedConfig['nome'] = config.nome
    if (config.logo !== undefined) updatedConfig['logo'] = config.logo
    if (config.corPrincipal !== undefined) updatedConfig['cor_principal'] = config.corPrincipal
    if (config.animaisAtendidos !== undefined) updatedConfig['animais_atendidos'] = config.animaisAtendidos
    if (config.tamanhosAceitos !== undefined) updatedConfig['tamanhos_aceitos'] = config.tamanhosAceitos
    if (config.aceitaPetsAgressivos !== undefined) updatedConfig['aceita_pets_agressivos'] = config.aceitaPetsAgressivos
    if (config.horarioFuncionamento !== undefined) {
      try { updatedConfig['horario_funcionamento'] = JSON.parse(config.horarioFuncionamento) }
      catch { updatedConfig['horario_funcionamento'] = config.horarioFuncionamento }
    }
    if (config.intervaloBanhoMinutos !== undefined) updatedConfig['intervalo_entre_banhos_minutos'] = config.intervaloBanhoMinutos
    if (config.prazoCancelamentoHoras !== undefined) updatedConfig['prazo_cancelamento_horas'] = config.prazoCancelamentoHoras
    if (config.prazoRemarcacaoHoras !== undefined) updatedConfig['prazo_remarcacao_horas'] = config.prazoRemarcacaoHoras
    if (config.politicaCancelamento !== undefined) updatedConfig['politica_cancelamento'] = config.politicaCancelamento
    if (config.toleranciaAtrasoMinutos !== undefined) updatedConfig['tolerancia_atraso_minutos'] = config.toleranciaAtrasoMinutos
    if (config.cancelamentoAutomaticoAposAtraso !== undefined) updatedConfig['cancelamento_automatico_apos_atraso'] = config.cancelamentoAutomaticoAposAtraso

    const ps = await ctx.prisma.petShop.update({ where: { id }, data: { config_json: updatedConfig as object } })
    return mapPetShop(ps)
  },

  createStaff: async (_: unknown, { input }: { input: CreateStaffInput }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const isAdmin = ctx.isSystemAdmin
    if (!isAdmin) requirePetshopRole(ctx, input.petshopId, ['owner'])

    const validRoles = ['owner', 'atendente', 'banhista']
    const invalidRoles = input.roles.filter((r) => !validRoles.includes(r))
    if (invalidRoles.length > 0) {
      throw new GraphQLError(`Roles inválidos: ${invalidRoles.join(', ')}`, { extensions: { code: 'BAD_REQUEST' } })
    }

    let fbUser: { uid: string }
    try {
      fbUser = await admin.auth().createUser({ email: input.email, password: input.senha, displayName: input.nome })
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
          roles: input.roles as ('owner' | 'atendente' | 'banhista')[],
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

  updateStaff: async (
    _: unknown,
    { id, input }: { id: string; input: { nome?: string; telefone?: string; roles?: string[] } },
    ctx: GraphQLContext,
  ) => {
    requireAuth(ctx)
    const profile = await ctx.prisma.petshopUserProfile.findUnique({ where: { id }, include: { user: true } })
    if (!profile) throw new GraphQLError('Membro de equipe não encontrado', { extensions: { code: 'NOT_FOUND' } })

    const isAdmin = ctx.isSystemAdmin
    if (!isAdmin) requirePetshopRole(ctx, profile.petshop_id, ['owner'])

    if (input.nome !== undefined || input.telefone !== undefined) {
      const userData: Record<string, unknown> = {}
      if (input.nome !== undefined) userData['nome'] = input.nome
      if (input.telefone !== undefined) userData['telefone'] = input.telefone
      await ctx.prisma.user.update({ where: { id: profile.user_id }, data: userData })
    }

    if (input.roles !== undefined) {
      const validRoles = ['owner', 'atendente', 'banhista']
      const invalid = input.roles.filter((r) => !validRoles.includes(r))
      if (invalid.length > 0) throw new GraphQLError(`Roles inválidos: ${invalid.join(', ')}`, { extensions: { code: 'BAD_REQUEST' } })
      await ctx.prisma.petshopUserProfile.update({
        where: { id },
        data: { roles: input.roles as ('owner' | 'atendente' | 'banhista')[] },
      })
    }

    const updated = await ctx.prisma.petshopUserProfile.findUnique({ where: { id }, include: { user: true } })
    return mapStaffMember(updated!)
  },

  deactivateStaff: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const profile = await ctx.prisma.petshopUserProfile.findUnique({ where: { id } })
    if (!profile) throw new GraphQLError('Membro de equipe não encontrado', { extensions: { code: 'NOT_FOUND' } })
    const isAdmin = ctx.isSystemAdmin
    if (!isAdmin) requirePetshopRole(ctx, profile.petshop_id, ['owner'])
    await ctx.prisma.petshopUserProfile.update({ where: { id }, data: { ativo: false } })
    return true
  },

  createBloqueio: async (_: unknown, { input }: { input: CreateBloqueioInput }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    requirePetshopRole(ctx, input.petshopId, ['owner', 'atendente'])
    const inicio = new Date(input.dataInicio)
    const fim = new Date(input.dataFim)
    if (fim <= inicio) throw new GraphQLError('Data fim deve ser posterior à data início', { extensions: { code: 'BAD_REQUEST' } })
    const bloqueio = await ctx.prisma.bloqueioAgenda.create({
      data: {
        petshop_id: input.petshopId,
        banhista_id: input.banhistaId ?? null,
        data_inicio: inicio,
        data_fim: fim,
        motivo: input.motivo ?? null,
      },
    })
    return mapBloqueio(bloqueio)
  },

  deleteBloqueio: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const bloqueio = await ctx.prisma.bloqueioAgenda.findUnique({ where: { id } })
    if (!bloqueio) throw new GraphQLError('Bloqueio não encontrado', { extensions: { code: 'NOT_FOUND' } })
    requirePetshopRole(ctx, bloqueio.petshop_id, ['owner', 'atendente'])
    await ctx.prisma.bloqueioAgenda.delete({ where: { id } })
    return true
  },
}
