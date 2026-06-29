import { btnPrimary, btnSecondary, inputStyle, labelStyle } from '@patafy/ui'

type Props = {
  date: string
  onChangeDate: (date: string) => void
  onBack: () => void
  onNext: () => void
}

export function StepData({ date, onChangeDate, onBack, onNext }: Props) {
  return (
    <>
      <h3 style={{ margin: '0 0 16px' }}>3. Escolha a data</h3>
      <div>
        <label style={labelStyle}>Data</label>
        <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => onChangeDate(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onBack} style={btnSecondary}>Voltar</button>
        <button onClick={onNext} style={btnPrimary} disabled={!date}>Ver horários</button>
      </div>
    </>
  )
}
