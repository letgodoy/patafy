import type { Pet, PetTutor, TutorProfile, User, TipoAnimal } from '@patafy/db'

type PetWithRelations = Pet & {
  tipo_animal?: TipoAnimal | null
  pet_tutores?: (PetTutor & {
    tutor_profile: TutorProfile & { user: User }
  })[]
}

export function mapPet(pet: PetWithRelations, petshopId?: string | null) {
  const obsCompartilhadas = (pet.obs_compartilhadas ?? {}) as Record<string, string>
  const obsInternas = (pet.obs_internas ?? {}) as Record<string, string>

  return {
    id: pet.id,
    nome: pet.nome,
    tipoAnimalId: pet.tipo_animal_id,
    tipoAnimal: pet.tipo_animal ? { id: pet.tipo_animal.id, nome: pet.tipo_animal.nome } : null,
    racaId: pet.raca_id,
    porteId: pet.porte_id,
    pelagemId: pet.pelagem_id,
    idade: pet.idade,
    peso: pet.peso ? Number(pet.peso) : null,
    agressivo: pet.agressivo,
    cuidadosEspeciais: pet.cuidados_especiais,
    obsCompartilhadas,
    obsInternas: petshopId ? (obsInternas[petshopId] ?? null) : undefined,
    tutores: (pet.pet_tutores ?? []).map((pt) => ({
      tutorProfileId: pt.tutor_profile_id,
      nome: pt.tutor_profile.user.nome,
      email: pt.tutor_profile.user.email,
      tipo: pt.tipo,
    })),
    deletedAt: pet.deleted_at?.toISOString() ?? null,
    createdAt: pet.created_at.toISOString(),
    updatedAt: pet.updated_at.toISOString(),
  }
}

export function mapTutorSearch(profile: TutorProfile & { user: User }) {
  return {
    id: profile.id,
    userId: profile.user_id,
    nome: profile.user.nome,
    email: profile.user.email,
    cpf: profile.user.cpf,
    telefone: profile.user.telefone,
    endereco: profile.endereco,
    ativo: profile.ativo,
  }
}
