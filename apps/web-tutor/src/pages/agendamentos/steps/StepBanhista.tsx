import { btnPrimary, btnSecondary, inputStyle, labelStyle } from '@patafy/ui'

type Banhista = { id: string; nome: string }

type Props = {
  banhistas: Banhista[]
  banhistaOpcional: string
  precisaTransporte: boolean
  onChangeBanhista: (id: string) => void
  onChangeTransporte: (v: boolean) => void
  onBack: () => void
  onNext: () => void
}

export function StepBanhista({ banhistas, banhistaOpcional, precisaTransporte, onChangeBanhista, onChangeTransporte, onBack, onNext }: Props) {
  return (
    <>
      <h3 style={{ margin: '0 0 16px' }}>5. Preferências (opcional)</h3>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Banhista preferido</label>
        <select value={banhistaOpcional} onChange={(e) => onChangeBanhista(e.target.value)} style={inputStyle}>
          <option value="">Sem preferência (primeiro livre)</option>
          {banhistas.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
        </select>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
        <input type="checkbox" checked={precisaTransporte} onChange={(e) => onChangeTransporte(e.target.checked)} />
        Preciso de transporte
      </label>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onBack} style={btnSecondary}>Voltar</button>
        <button onClick={onNext} style={btnPrimary}>Continuar</button>
      </div>
    </>
  )
}
