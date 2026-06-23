type RawTipoAnimal = { id: string; nome: string; ativo: boolean; ordem: number | null; created_at: Date }
type RawRaca = RawTipoAnimal & { tipo_animal_id: string; tipo_animal?: RawTipoAnimal }
type RawPorte = RawTipoAnimal
type RawPelagem = RawTipoAnimal

export function mapTipoAnimal(t: RawTipoAnimal) {
  return { id: t.id, nome: t.nome, ativo: t.ativo, ordem: t.ordem, createdAt: t.created_at.toISOString() }
}

export function mapRaca(r: RawRaca) {
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

export function mapPorte(p: RawPorte) {
  return { id: p.id, nome: p.nome, ativo: p.ativo, ordem: p.ordem, createdAt: p.created_at.toISOString() }
}

export function mapPelagem(p: RawPelagem) {
  return { id: p.id, nome: p.nome, ativo: p.ativo, ordem: p.ordem, createdAt: p.created_at.toISOString() }
}
