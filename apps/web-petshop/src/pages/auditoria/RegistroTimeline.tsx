import { colors } from '@patafy/ui'

type Registro = {
  id: string
  occurredAt: string
  actorUserId: string | null
  action: string
  entityType: string
  metadata: string
}

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  CREATED:          { label: 'Criado',              color: '#16a34a' },
  STATUS_CHANGED:   { label: 'Status alterado',     color: '#2563eb' },
  RESCHEDULED:      { label: 'Remarcado',           color: '#d97706' },
  BANHISTA_CHANGED: { label: 'Banhista alterado',   color: '#7c3aed' },
  PAGO_TOGGLED:     { label: 'Pagamento',           color: '#0891b2' },
  PACOTE_DEBITADO:  { label: 'Pacote debitado',     color: '#059669' },
  SERVICO_ADICIONAL:{ label: 'Serviço adicional',   color: '#9333ea' },
  CANCELLED:        { label: 'Cancelado',           color: '#dc2626' },
  NAO_COMPARECEU:   { label: 'Não compareceu',      color: '#6b7280' },
  OBS_UPDATED:      { label: 'Observação',          color: '#64748b' },
}

function metadataResume(action: string, raw: string): string {
  try {
    const m = JSON.parse(raw) as Record<string, unknown>
    if (action === 'STATUS_CHANGED') return `${m['from']} → ${m['to']}`
    if (action === 'RESCHEDULED') return `Nova data: ${new Date(m['new_inicio'] as string).toLocaleString('pt-BR')}`
    if (action === 'BANHISTA_CHANGED') return `Silencioso: ${m['silencioso'] ? 'sim' : 'não'}`
    if (action === 'PAGO_TOGGLED') return `${m['old'] ? 'pago' : 'pendente'} → ${m['new'] ? 'pago' : 'pendente'}`
    if (action === 'SERVICO_ADICIONAL') return `R$ ${Number(m['preco']).toFixed(2)}`
    if (action === 'OBS_UPDATED') return `tipo: ${m['tipo']}`
    if (action === 'CANCELLED') return `por: ${m['motivo']}`
    return ''
  } catch {
    return ''
  }
}

type Props = { registros: Registro[] }

export function RegistroTimeline({ registros }: Props) {
  if (registros.length === 0) {
    return <p style={{ color: '#999', fontSize: 13 }}>Nenhum registro ainda.</p>
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 20 }}>
      <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: colors.border }} />
      {registros.map((r) => {
        const info = ACTION_LABEL[r.action] ?? { label: r.action, color: '#6b7280' }
        const resume = metadataResume(r.action, r.metadata)
        return (
          <div key={r.id} style={{ marginBottom: 16, position: 'relative' }}>
            <div style={{ position: 'absolute', left: -16, top: 4, width: 10, height: 10, borderRadius: '50%', background: info.color, border: '2px solid #fff' }} />
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>
              {new Date(r.occurredAt).toLocaleString('pt-BR')}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: info.color }}>{info.label}</span>
              {resume && <span style={{ fontSize: 12, color: '#6b7280' }}>{resume}</span>}
              {!r.actorUserId && <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', padding: '1px 6px', borderRadius: 8 }}>automático</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
