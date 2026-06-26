import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useMyPetsQuery, useDeletePetMutation } from '@patafy/graphql-client'
import { PageHeader, colors } from '@patafy/ui'

export function PetsPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useMyPetsQuery()
  const deleteMutation = useDeletePetMutation({
    onSuccess: () => qc.invalidateQueries({ queryKey: useMyPetsQuery.getKey() }),
  })

  const pets = data?.myPets ?? []

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Remover "${nome}" permanentemente?`)) return
    await deleteMutation.mutateAsync({ id })
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <PageHeader
        title="Meus Pets"
        action={<Link to="/pets/novo" style={{ background: colors.primary, color: '#fff', padding: '8px 16px', borderRadius: 4, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>+ Novo Pet</Link>}
      />
      {isLoading && <p>Carregando...</p>}
      {!!error && <p style={{ color: 'red' }}>{String(error)}</p>}
      {!isLoading && pets.length === 0 && <p style={{ color: '#666', textAlign: 'center', padding: 32 }}>Você ainda não tem pets cadastrados.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pets.map((pet) => (
          <div key={pet.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>{pet.nome}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#666' }}>
                {pet.tipoAnimal?.nome}
                {pet.agressivo && <span style={{ marginLeft: 8, color: '#c00', fontSize: 12 }}>⚠ Agressivo</span>}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>
                {pet.tutores.length > 1 ? `${pet.tutores.length} tutores` : 'Só você'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/pets/${pet.id}`} style={{ padding: '6px 12px', border: `1px solid ${colors.border}`, borderRadius: 4, textDecoration: 'none', fontSize: 13, color: colors.primary }}>Ver</Link>
              <Link to={`/pets/${pet.id}/editar`} style={{ padding: '6px 12px', border: `1px solid ${colors.border}`, borderRadius: 4, textDecoration: 'none', fontSize: 13 }}>Editar</Link>
              <button onClick={() => handleDelete(pet.id, pet.nome)} style={{ padding: '6px 12px', border: '1px solid #fca5a5', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#c00' }}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
