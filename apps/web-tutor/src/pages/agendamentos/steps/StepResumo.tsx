import { btnPrimary, btnSecondary, colors } from '@patafy/ui'
import type { Slot } from '@patafy/ui'

type Banhista = { id: string; nome: string }
type Pet = { id: string; nome: string }

type Props = {
  lojaNome: string
  pet: Pet | undefined
  slot: Slot
  banhistaOpcional: string
  banhistas: Banhista[]
  duracaoTotal: number
  servicoVarianteIds: string[]
  precisaTransporte: boolean
  erro: string
  isPending: boolean
  onBack: () => void
  onConfirmar: () => void
}

export function StepResumo({ lojaNome, pet, slot, banhistaOpcional, banhistas, duracaoTotal, servicoVarianteIds, precisaTransporte, erro, isPending, onBack, onConfirmar }: Props) {
  return (
    <>
      <h3 style={{ margin: '0 0 16px' }}>6. Confirmar agendamento</h3>
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <p style={{ margin: '0 0 8px' }}><strong>Loja:</strong> {lojaNome}</p>
        <p style={{ margin: '0 0 8px' }}><strong>Pet:</strong> {pet?.nome}</p>
        <p style={{ margin: '0 0 8px' }}><strong>Data/Hora:</strong> {new Date(slot.inicio).toLocaleString('pt-BR')}</p>
        <p style={{ margin: '0 0 8px' }}><strong>Banhista:</strong> {banhistaOpcional ? banhistas.find((b) => b.id === banhistaOpcional)?.nome : `${slot.banhistaNome} (sugerido)`}</p>
        <p style={{ margin: '0 0 8px' }}><strong>Duração:</strong> {duracaoTotal} min</p>
        <p style={{ margin: 0 }}><strong>Serviços:</strong> {servicoVarianteIds.length} selecionado(s)</p>
        {precisaTransporte && <p style={{ margin: '8px 0 0', color: colors.primary }}>Solicita transporte</p>}
      </div>
      {erro && <p style={{ color: '#c00', marginBottom: 12 }}>{erro}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={btnSecondary}>Voltar</button>
        <button onClick={onConfirmar} style={btnPrimary} disabled={isPending}>
          {isPending ? 'Enviando...' : 'Confirmar Agendamento'}
        </button>
      </div>
    </>
  )
}
