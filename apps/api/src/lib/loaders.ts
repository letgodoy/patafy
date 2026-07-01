import DataLoader from 'dataloader'
import type { PrismaClient } from '@patafy/db'

export function createLoaders(prisma: PrismaClient) {
  const petLoader = new DataLoader(async (ids: readonly string[]) => {
    const pets = await prisma.pet.findMany({ where: { id: { in: [...ids] } } })
    const map = new Map(pets.map((p) => [p.id, p]))
    return ids.map((id) => map.get(id) ?? new Error(`Pet ${id} não encontrado`))
  })

  const servicoVarianteLoader = new DataLoader(async (ids: readonly string[]) => {
    const variantes = await prisma.servicoVariante.findMany({
      where: { id: { in: [...ids] } },
      include: { servico: true },
    })
    const map = new Map(variantes.map((v) => [v.id, v]))
    return ids.map((id) => map.get(id) ?? new Error(`ServicoVariante ${id} não encontrado`))
  })

  const petshopUserLoader = new DataLoader(async (ids: readonly string[]) => {
    const profiles = await prisma.petshopUserProfile.findMany({
      where: { id: { in: [...ids] } },
      include: { user: true },
    })
    const map = new Map(profiles.map((p) => [p.id, p]))
    return ids.map((id) => map.get(id) ?? new Error(`PetshopUserProfile ${id} não encontrado`))
  })

  return { petLoader, servicoVarianteLoader, petshopUserLoader }
}

export type Loaders = ReturnType<typeof createLoaders>
