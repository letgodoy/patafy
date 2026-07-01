import { useState } from 'react'
import { useRegistrosOperacionaisQuery } from '@patafy/graphql-client'
import { PageHeader, colors } from '@patafy/ui'

type Registro = {
  id: string
  occurredAt: string
  actorUserId: string | null
  petshopId: string | null
  agendamentoId: string | null
  entityType: string
  entityId: string
  action: string
  metadata: string
}

const ACTION_OPTIONS = [
  'CREATED', 'STATUS_CHANGED', 'RESCHEDULED', 'BANHISTA_CHANGED',
  'PAGO_TOGGLED', 'PACOTE_DEBITADO', 'SERVICO_ADICIONAL',
  'CANCELLED', 'NAO_COMPARECEU', 'OBS_UPDATED',
]

export function AuditoriaPage() {
  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const defaultTo = today.toISOString().slice(0, 10)

  const [petshopId, setPetshopId] = useState('')
  const [entityId, setEntityId] = useState('')
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [action, setAction] = useState('')

  const { data, isFetching } = useRegistrosOperacionaisQuery({
    filter: {
      petshopId: petshopId || undefined,
      entityId: entityId || undefined,
      from: from ? `${from}T00:00:00.000Z` : undefined,
      to: to ? `${to}T23:59:59.999Z` : undefined,
      action: action || undefined,
      limit: 200,
    },
  })

  const registros: Registro[] = data?.registrosOperacionais ?? []

  return (
    <div>
      <PageHeader title="Auditoria Global" />

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Petshop ID</label>
            <input value={petshopId} onChange={(e) => setPetshopId(e.target.value)} placeholder="(todos)" style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, width: 240 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Entity ID</label>
            <input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="(qualquer)" style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, width: 240 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>De</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Até</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Ação</label>
            <select value={action} onChange={(e) => setAction(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, minWidth: 180 }}>
              <option value="">Todas</option>
              {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isFetching && <p style={{ color: '#999', fontSize: 13 }}>Carregando...</p>}

      {!isFetching && (
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, fontSize: 13, color: '#666' }}>
            {registros.length} registro(s)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Data/hora', 'Petshop', 'Ação', 'Entidade', 'Entity ID', 'Actor'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}`, fontWeight: 600, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{new Date(r.occurredAt).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>{r.petshopId?.slice(0, 8) ?? '—'}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.action}</td>
                  <td style={{ padding: '8px 12px' }}>{r.entityType}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>{r.entityId.slice(0, 8)}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>{r.actorUserId?.slice(0, 8) ?? <span style={{ color: '#9ca3af' }}>auto</span>}</td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
