import { btnSmall, colors } from '@patafy/ui'

type Agendamento = {
  id: string; dataHoraInicio: string; duracaoTotalMinutos: number
  status: string; pago: boolean; precisaTransporte: boolean
  pet: { nome: string; porte: string | null; raca: string | null } | null
  tutor: { nome: string; email: string; telefone: string | null } | null
  banhista: { nome: string } | null
}

type Actions = {
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  onIniciar: (id: string) => void
  onPronto: (id: string) => void
  onFinalizar: (id: string) => void
  onNaoCompareceu: (id: string) => void
  onTogglePago: (id: string) => void
  onAbrirAtendimento?: () => void
}

export const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  AguardandoConfirmacao: { label: 'Aguardando', bg: '#fef9c3', color: '#92400e' },
  Confirmado: { label: 'Confirmado', bg: '#d1fae5', color: '#065f46' },
  EmAndamento: { label: 'Em andamento', bg: '#dbeafe', color: '#1e40af' },
  Atrasado: { label: 'Atrasado', bg: '#fee2e2', color: '#991b1b' },
  Pronto: { label: 'Pronto', bg: '#ede9fe', color: '#4c1d95' },
  Finalizado: { label: 'Finalizado', bg: '#f3f4f6', color: '#374151' },
  Cancelado: { label: 'Cancelado', bg: '#f3f4f6', color: '#9ca3af' },
  NaoCompareceu: { label: 'Não compareceu', bg: '#f3f4f6', color: '#9ca3af' },
}

type Props = { ag: Agendamento; expanded: boolean; onToggle: () => void } & Actions

export function AgendamentoCard({ ag, expanded, onToggle, onConfirm, onCancel, onIniciar, onPronto, onFinalizar, onNaoCompareceu, onTogglePago, onAbrirAtendimento }: Props) {
  const st = STATUS_LABEL[ag.status] ?? { label: ag.status, bg: '#f3f4f6', color: '#555' }
  const dt = new Date(ag.dataHoraInicio)

  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <div>
          <span style={{ fontWeight: 600 }}>{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ marginLeft: 12, fontSize: 14 }}>{ag.pet?.nome ?? '—'}</span>
          {ag.tutor && <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>({ag.tutor.nome})</span>}
          {ag.banhista && <span style={{ marginLeft: 8, fontSize: 12, color: '#555' }}>· {ag.banhista.nome}</span>}
          {ag.pago && <span style={{ marginLeft: 8, fontSize: 11, background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: 10 }}>Pago</span>}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: '4px 10px', borderRadius: 20 }}>{st.label}</span>
      </div>

      {expanded && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}`, background: '#f9fafb' }}>
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            {ag.pet && <p style={{ margin: '0 0 4px' }}><strong>Pet:</strong> {ag.pet.nome}{ag.pet.porte ? ` — ${ag.pet.porte}` : ''}{ag.pet.raca ? ` (${ag.pet.raca})` : ''}</p>}
            {ag.tutor && <p style={{ margin: '0 0 4px' }}><strong>Tutor:</strong> {ag.tutor.nome} · {ag.tutor.email}{ag.tutor.telefone ? ` · ${ag.tutor.telefone}` : ''}</p>}
            <p style={{ margin: '0 0 4px' }}><strong>Duração:</strong> {ag.duracaoTotalMinutos} min</p>
            {ag.precisaTransporte && <p style={{ margin: '0 0 4px', color: colors.primary }}><strong>Solicita transporte</strong></p>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ag.status === 'AguardandoConfirmacao' && (
              <button onClick={() => onConfirm(ag.id)} style={{ ...btnSmall, background: '#d1fae5', color: '#065f46', borderColor: '#86efac' }}>Confirmar</button>
            )}
            {['AguardandoConfirmacao', 'Confirmado'].includes(ag.status) && (
              <button onClick={() => onCancel(ag.id)} style={{ ...btnSmall, color: '#dc2626', borderColor: '#fca5a5' }}>Cancelar</button>
            )}
            {ag.status === 'Confirmado' && (
              <button onClick={() => onIniciar(ag.id)} style={{ ...btnSmall, background: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' }}>Iniciar</button>
            )}
            {ag.status === 'EmAndamento' && (
              <button onClick={() => onPronto(ag.id)} style={{ ...btnSmall, background: '#ede9fe', color: '#4c1d95', borderColor: '#c4b5fd' }}>Pronto</button>
            )}
            {ag.status === 'Pronto' && (
              <button onClick={() => onFinalizar(ag.id)} style={btnSmall}>Finalizar</button>
            )}
            {['Confirmado', 'Atrasado'].includes(ag.status) && (
              <button onClick={() => onNaoCompareceu(ag.id)} style={{ ...btnSmall, color: '#6b7280' }}>Não compareceu</button>
            )}
            <button onClick={() => onTogglePago(ag.id)} style={{ ...btnSmall, color: ag.pago ? '#6b7280' : '#16a34a' }}>
              {ag.pago ? 'Desmarcar pago' : 'Marcar pago'}
            </button>
            {onAbrirAtendimento && (
              <button onClick={onAbrirAtendimento} style={{ ...btnSmall, background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac', marginLeft: 'auto' }}>
                Ver Atendimento
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
