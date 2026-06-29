import { btnPrimary, colors } from '@patafy/ui'

type ServicoVariante = { id: string; preco: number; duracaoMinutos: number }
type Servico = { id: string; nome: string; variantes: ServicoVariante[] }

type Props = {
  servicos: Servico[]
  servicoVarianteIds: string[]
  duracaoTotal: number
  onToggle: (varianteId: string) => void
  onNext: () => void
}

export function StepServicos({ servicos, servicoVarianteIds, duracaoTotal, onToggle, onNext }: Props) {
  return (
    <>
      <h3 style={{ margin: '0 0 16px' }}>1. Escolha os serviços</h3>
      {servicos.filter((s) => s.variantes.length > 0).map((s) => (
        <div key={s.id} style={{ marginBottom: 12 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{s.nome}</p>
          {s.variantes.map((v) => {
            const selected = servicoVarianteIds.includes(v.id)
            return (
              <div key={v.id} onClick={() => onToggle(v.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginBottom: 4, border: `2px solid ${selected ? colors.primary : colors.border}`, borderRadius: 8, cursor: 'pointer', background: selected ? '#f0fdf4' : '#fff' }}>
                <span style={{ fontSize: 14 }}>{v.duracaoMinutos} min</span>
                <strong style={{ color: colors.primary }}>R$ {Number(v.preco).toFixed(2)}</strong>
              </div>
            )
          })}
        </div>
      ))}
      {servicos.length === 0 && <p style={{ color: '#666' }}>Nenhum serviço disponível.</p>}
      <button onClick={onNext} style={{ ...btnPrimary, marginTop: 16 }} disabled={servicoVarianteIds.length === 0}>
        Continuar ({duracaoTotal} min)
      </button>
    </>
  )
}
