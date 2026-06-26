import { GraphQLError } from 'graphql'
import crypto from 'node:crypto'
import { admin } from '../../plugins/firebase-auth.js'
import { requireAuth, requirePetshopRole } from '../auth/rbac.js'
import { validarCPF, normalizarCPF } from '../../lib/cpf.js'
import { mapPet, mapTutorSearch } from './mappers.js'
import type { GraphQLContext } from '../../context.js'

const PET_INCLUDE = {
  tipo_animal: true,
  pet_tutores: { where: { tutor_profile: { ativo: true } }, include: { tutor_profile: { include: { user: true } } } },
} as const

const CONVITE_EXPIRY_DAYS = 7

// ─── helpers ───────────────────────────────────────────────────────────────

function requireTutor(ctx: GraphQLContext) {
  requireAuth(ctx)
  if (!ctx.tutorProfile) throw new GraphQLError('Perfil de tutor não encontrado', { extensions: { code: 'FORBIDDEN' } })
  return ctx.tutorProfile
}

function requireStaff(ctx: GraphQLContext) {
  requireAuth(ctx)
  if (!ctx.activePetshopId) throw new GraphQLError('Pet shop não selecionado', { extensions: { code: 'FORBIDDEN' } })
  requirePetshopRole(ctx, ctx.activePetshopId, ['owner', 'atendente'])
  return ctx.activePetshopId
}

async function assertPetOwner(ctx: GraphQLContext, petId: string, tutorProfileId: string) {
  const link = await ctx.prisma.petTutor.findUnique({ where: { pet_id_tutor_profile_id: { pet_id: petId, tutor_profile_id: tutorProfileId } } })
  if (!link || link.tipo !== 'responsavel') throw new GraphQLError('Sem permissão neste pet', { extensions: { code: 'FORBIDDEN' } })
}

// ─── queries ────────────────────────────────────────────────────────────────

export const petsQueries = {
  myPets: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const tutor = requireTutor(ctx)
    const pets = await ctx.prisma.pet.findMany({
      where: {
        deleted_at: null,
        pet_tutores: { some: { tutor_profile_id: tutor.id } },
      },
      include: PET_INCLUDE,
      orderBy: { created_at: 'asc' },
    })
    return pets.map((p) => mapPet(p))
  },

  pet: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const tutor = requireTutor(ctx)
    const pet = await ctx.prisma.pet.findFirst({
      where: { id, deleted_at: null, pet_tutores: { some: { tutor_profile_id: tutor.id } } },
      include: PET_INCLUDE,
    })
    if (!pet) throw new GraphQLError('Pet não encontrado', { extensions: { code: 'NOT_FOUND' } })
    return mapPet(pet)
  },

  myPetTutorConvites: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const tutor = requireTutor(ctx)
    const convites = await ctx.prisma.petTutorConvite.findMany({
      where: { convitador_tutor_profile_id: tutor.id },
      include: { pet: { include: PET_INCLUDE } },
      orderBy: { created_at: 'desc' },
    })
    return convites.map((c) => ({
      id: c.id,
      petId: c.pet_id,
      pet: mapPet(c.pet),
      convidadoEmail: c.convidado_email,
      status: c.status,
      expiresAt: c.expires_at.toISOString(),
      createdAt: c.created_at.toISOString(),
      acceptedAt: c.accepted_at?.toISOString() ?? null,
    }))
  },

  searchTutor: async (_: unknown, { cpf, email }: { cpf?: string; email?: string }, ctx: GraphQLContext) => {
    requireStaff(ctx)
    if (!cpf && !email) throw new GraphQLError('Informe CPF ou e-mail', { extensions: { code: 'BAD_REQUEST' } })

    const where: Record<string, unknown> = {}
    if (cpf) where['cpf'] = normalizarCPF(cpf)
    if (email) where['email'] = email.toLowerCase().trim()

    const user = await ctx.prisma.user.findFirst({
      where,
      include: { tutor_profile: true },
    })
    if (!user?.tutor_profile) return null
    return mapTutorSearch({ ...user.tutor_profile, user })
  },

  petForShop: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const petshopId = requireStaff(ctx)
    const pet = await ctx.prisma.pet.findFirst({
      where: { id, deleted_at: null },
      include: PET_INCLUDE,
    })
    if (!pet) throw new GraphQLError('Pet não encontrado', { extensions: { code: 'NOT_FOUND' } })
    return { ...mapPet(pet, petshopId), obsInternas: ((pet.obs_internas ?? {}) as Record<string, string>)[petshopId] ?? null }
  },
}

// ─── mutations ──────────────────────────────────────────────────────────────

export const petsMutations = {
  createPet: async (_: unknown, { input }: { input: { nome: string; tipoAnimalId: string; racaId?: string; porteId?: string; pelagemId?: string; idade?: number; peso?: number; agressivo?: boolean; cuidadosEspeciais?: string } }, ctx: GraphQLContext) => {
    const tutor = requireTutor(ctx)

    const count = await ctx.prisma.petTutor.count({
      where: { tutor_profile_id: tutor.id, tipo: 'responsavel', pet: { deleted_at: null } },
    })
    if (count >= 30) throw new GraphQLError('Limite de 30 pets atingido', { extensions: { code: 'PET_LIMIT_EXCEEDED' } })

    const pet = await ctx.prisma.pet.create({
      data: {
        nome: input.nome.trim(),
        tipo_animal_id: input.tipoAnimalId,
        raca_id: input.racaId ?? null,
        porte_id: input.porteId ?? null,
        pelagem_id: input.pelagemId ?? null,
        idade: input.idade ?? null,
        peso: input.peso ?? null,
        agressivo: input.agressivo ?? false,
        cuidados_especiais: input.cuidadosEspeciais ?? null,
        pet_tutores: { create: { tutor_profile_id: tutor.id, tipo: 'responsavel' } },
      },
      include: PET_INCLUDE,
    })
    return mapPet(pet)
  },

  updatePet: async (_: unknown, { id, input }: { id: string; input: { nome?: string; racaId?: string; porteId?: string; pelagemId?: string; idade?: number; peso?: number; agressivo?: boolean; cuidadosEspeciais?: string } }, ctx: GraphQLContext) => {
    const tutor = requireTutor(ctx)
    await assertPetOwner(ctx, id, tutor.id)

    const pet = await ctx.prisma.pet.update({
      where: { id },
      data: {
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.racaId !== undefined ? { raca_id: input.racaId ?? null } : {}),
        ...(input.porteId !== undefined ? { porte_id: input.porteId ?? null } : {}),
        ...(input.pelagemId !== undefined ? { pelagem_id: input.pelagemId ?? null } : {}),
        ...(input.idade !== undefined ? { idade: input.idade ?? null } : {}),
        ...(input.peso !== undefined ? { peso: input.peso ?? null } : {}),
        ...(input.agressivo !== undefined ? { agressivo: input.agressivo } : {}),
        ...(input.cuidadosEspeciais !== undefined ? { cuidados_especiais: input.cuidadosEspeciais ?? null } : {}),
      },
      include: PET_INCLUDE,
    })
    return mapPet(pet)
  },

  deletePet: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const tutor = requireTutor(ctx)
    await assertPetOwner(ctx, id, tutor.id)
    await ctx.prisma.pet.update({ where: { id }, data: { deleted_at: new Date() } })
    return true
  },

  createPetTutorConvite: async (_: unknown, { petId, convidadoEmail }: { petId: string; convidadoEmail: string }, ctx: GraphQLContext) => {
    const tutor = requireTutor(ctx)
    await assertPetOwner(ctx, petId, tutor.id)

    const email = convidadoEmail.toLowerCase().trim()

    const jaAutorizado = await ctx.prisma.petTutor.findFirst({
      where: { pet_id: petId, tutor_profile: { user: { email } } },
    })
    if (jaAutorizado) throw new GraphQLError('Este tutor já tem acesso ao pet', { extensions: { code: 'ALREADY_AUTHORIZED' } })

    const pendente = await ctx.prisma.petTutorConvite.findFirst({
      where: { pet_id: petId, convidado_email: email, status: 'pendente' },
    })
    if (pendente) throw new GraphQLError('Já existe um convite pendente para este e-mail', { extensions: { code: 'CONVITE_PENDING' } })

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + CONVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    const convite = await ctx.prisma.petTutorConvite.create({
      data: {
        pet_id: petId,
        convitador_tutor_profile_id: tutor.id,
        convidado_email: email,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
      include: { pet: { include: PET_INCLUDE } },
    })

    return {
      id: convite.id,
      petId: convite.pet_id,
      pet: mapPet(convite.pet),
      convidadoEmail: convite.convidado_email,
      status: convite.status,
      expiresAt: convite.expires_at.toISOString(),
      createdAt: convite.created_at.toISOString(),
      acceptedAt: null,
      token,
    }
  },

  acceptPetTutorConvite: async (_: unknown, { token }: { token: string }, ctx: GraphQLContext) => {
    const tutor = requireTutor(ctx)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const convite = await ctx.prisma.petTutorConvite.findUnique({ where: { token_hash: tokenHash } })
    if (!convite) throw new GraphQLError('Convite inválido', { extensions: { code: 'NOT_FOUND' } })
    if (convite.status !== 'pendente') throw new GraphQLError('Convite não está pendente', { extensions: { code: 'CONVITE_INVALID' } })
    if (convite.expires_at < new Date()) {
      await ctx.prisma.petTutorConvite.update({ where: { id: convite.id }, data: { status: 'expirado' } })
      throw new GraphQLError('Convite expirado', { extensions: { code: 'CONVITE_EXPIRED' } })
    }

    const meuEmail = ctx.user!.email.toLowerCase()
    if (convite.convidado_email !== meuEmail) throw new GraphQLError('Este convite não é para você', { extensions: { code: 'FORBIDDEN' } })

    await ctx.prisma.$transaction([
      ctx.prisma.petTutor.upsert({
        where: { pet_id_tutor_profile_id: { pet_id: convite.pet_id, tutor_profile_id: tutor.id } },
        create: { pet_id: convite.pet_id, tutor_profile_id: tutor.id, tipo: 'autorizado' },
        update: {},
      }),
      ctx.prisma.petTutorConvite.update({
        where: { id: convite.id },
        data: { status: 'aceito', accepted_at: new Date(), convidado_tutor_profile_id: tutor.id },
      }),
    ])
    return true
  },

  revokePetTutorConvite: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const tutor = requireTutor(ctx)
    const convite = await ctx.prisma.petTutorConvite.findUnique({ where: { id } })
    if (!convite || convite.convitador_tutor_profile_id !== tutor.id) throw new GraphQLError('Convite não encontrado', { extensions: { code: 'NOT_FOUND' } })
    if (convite.status !== 'pendente') throw new GraphQLError('Só é possível revogar convites pendentes', { extensions: { code: 'CONVITE_INVALID' } })
    await ctx.prisma.petTutorConvite.update({ where: { id }, data: { status: 'revogado' } })
    return true
  },

  createTutorAssisted: async (_: unknown, { input }: { input: { nome: string; email: string; cpf: string; telefone?: string; endereco?: string } }, ctx: GraphQLContext) => {
    requireStaff(ctx)

    const cpf = normalizarCPF(input.cpf)
    if (!validarCPF(cpf)) throw new GraphQLError('CPF inválido', { extensions: { code: 'CPF_INVALID' } })

    const email = input.email.toLowerCase().trim()

    const existing = await ctx.prisma.user.findFirst({
      where: { OR: [{ cpf }, { email }] },
      include: { tutor_profile: true },
    })
    if (existing) {
      if (!existing.tutor_profile) throw new GraphQLError('Usuário existe mas não é tutor', { extensions: { code: 'USER_NOT_TUTOR' } })
      return mapTutorSearch({ ...existing.tutor_profile, user: existing })
    }

    let firebaseUid: string
    try {
      const fbUser = await admin.auth().createUser({ email, displayName: input.nome })
      firebaseUid = fbUser.uid
      await admin.auth().generatePasswordResetLink(email)
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'auth/email-already-exists') {
        throw new GraphQLError('E-mail já existe no Firebase', { extensions: { code: 'EMAIL_DUPLICATE' } })
      }
      throw e
    }

    try {
      const user = await ctx.prisma.user.create({
        data: {
          firebase_uid: firebaseUid,
          nome: input.nome.trim(),
          email,
          cpf,
          telefone: input.telefone?.trim() ?? null,
          tutor_profile: { create: { endereco: input.endereco?.trim() ?? null } },
        },
        include: { tutor_profile: true },
      })
      return mapTutorSearch({ ...user.tutor_profile!, user })
    } catch (e: unknown) {
      await admin.auth().deleteUser(firebaseUid).catch(() => undefined)
      throw e
    }
  },

  createPetForTutor: async (_: unknown, { tutorProfileId, input }: { tutorProfileId: string; input: { nome: string; tipoAnimalId: string; racaId?: string; porteId?: string; pelagemId?: string; idade?: number; peso?: number; agressivo?: boolean; cuidadosEspeciais?: string } }, ctx: GraphQLContext) => {
    requireStaff(ctx)

    const count = await ctx.prisma.petTutor.count({
      where: { tutor_profile_id: tutorProfileId, tipo: 'responsavel', pet: { deleted_at: null } },
    })
    if (count >= 30) throw new GraphQLError('Limite de 30 pets atingido', { extensions: { code: 'PET_LIMIT_EXCEEDED' } })

    const pet = await ctx.prisma.pet.create({
      data: {
        nome: input.nome.trim(),
        tipo_animal_id: input.tipoAnimalId,
        raca_id: input.racaId ?? null,
        porte_id: input.porteId ?? null,
        pelagem_id: input.pelagemId ?? null,
        idade: input.idade ?? null,
        peso: input.peso ?? null,
        agressivo: input.agressivo ?? false,
        cuidados_especiais: input.cuidadosEspeciais ?? null,
        pet_tutores: { create: { tutor_profile_id: tutorProfileId, tipo: 'responsavel' } },
      },
      include: PET_INCLUDE,
    })
    return mapPet(pet)
  },

  updatePetObsInternas: async (_: unknown, { input }: { input: { petId: string; texto: string } }, ctx: GraphQLContext) => {
    const petshopId = requireStaff(ctx)
    const pet = await ctx.prisma.pet.findFirst({ where: { id: input.petId, deleted_at: null } })
    if (!pet) throw new GraphQLError('Pet não encontrado', { extensions: { code: 'NOT_FOUND' } })

    const obs = (pet.obs_internas ?? {}) as Record<string, string>
    obs[petshopId] = input.texto
    await ctx.prisma.pet.update({ where: { id: input.petId }, data: { obs_internas: obs } })
    return true
  },

  updatePetObsCompartilhadas: async (_: unknown, { input }: { input: { petId: string; texto: string } }, ctx: GraphQLContext) => {
    const petshopId = requireStaff(ctx)
    const pet = await ctx.prisma.pet.findFirst({ where: { id: input.petId, deleted_at: null } })
    if (!pet) throw new GraphQLError('Pet não encontrado', { extensions: { code: 'NOT_FOUND' } })

    const obs = (pet.obs_compartilhadas ?? {}) as Record<string, string>
    obs[petshopId] = input.texto
    await ctx.prisma.pet.update({ where: { id: input.petId }, data: { obs_compartilhadas: obs } })
    return true
  },
}
