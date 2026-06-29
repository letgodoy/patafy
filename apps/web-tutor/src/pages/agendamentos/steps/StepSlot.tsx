import { SlotPicker, btnPrimary, btnSecondary } from '@patafy/ui'
import type { Slot } from '@patafy/ui'

type Props = {
  date: string
  slots: Slot[]
  loading: boolean
  selectedSlot: Slot | null
  onSelect: (slot: Slot) => void
  onBack: () => void
  onNext: () => void
}

export function StepSlot({ date, slots, loading, selectedSlot, onSelect, onBack, onNext }: Props) {
  return (
    <>
      <h3 style={{ margin: '0 0 16px' }}>4. Escolha o horário</h3>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#666' }}>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
      <SlotPicker slots={slots} loading={loading} selectedInicio={selectedSlot?.inicio} onSelect={onSelect} />
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onBack} style={btnSecondary}>Voltar</button>
        <button onClick={onNext} style={btnPrimary} disabled={!selectedSlot}>Continuar</button>
      </div>
    </>
  )
}
