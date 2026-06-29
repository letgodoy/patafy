import { btnPrimary, btnSecondary, colors } from '@patafy/ui'

type Pet = { id: string; nome: string; tipoAnimal: { nome: string } | null; porte: { id: string; nome: string } | null; raca: { nome: string } | null }

type Props = {
  pets: Pet[]
  petId: string
  onSelect: (id: string) => void
  onBack: () => void
  onNext: () => void
}

export function StepPet({ pets, petId, onSelect, onBack, onNext }: Props) {
  return (
    <>
      <h3 style={{ margin: '0 0 16px' }}>2. Qual pet?</h3>
      {pets.map((p) => (
        <div key={p.id} onClick={() => onSelect(p.id)} style={{ padding: 14, marginBottom: 8, border: `2px solid ${petId === p.id ? colors.primary : colors.border}`, borderRadius: 8, cursor: 'pointer', background: petId === p.id ? '#f0fdf4' : '#fff' }}>
          <strong>{p.nome}</strong>
          <span style={{ marginLeft: 8, fontSize: 13, color: '#666' }}>{[p.tipoAnimal?.nome, p.raca?.nome, p.porte?.nome].filter(Boolean).join(' · ')}</span>
        </div>
      ))}
      {pets.length === 0 && <p style={{ color: '#666' }}>Nenhum pet cadastrado. <a href="/pets/novo" style={{ color: colors.primary }}>Cadastrar pet</a></p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onBack} style={btnSecondary}>Voltar</button>
        <button onClick={onNext} style={btnPrimary} disabled={!petId}>Continuar</button>
      </div>
    </>
  )
}
