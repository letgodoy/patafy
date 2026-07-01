import { useState } from 'react'
import { useRegistrosOperacionaisQuery, useMyPetShopIdQuery } from '@patafy/graphql-client'
import { PageHeader, colors } from '@patafy/ui'
import { RegistroTimeline } from './RegistroTimeline.js'

const ACTION_OPTIONS = [
  'CREATED', 'STATUS_CHANGED', 'RESCHEDULED', 'BANHISTA_CHANGED',
  'PAGO_TOGGLED', 'PACOTE_DEBITADO', 'SERVICO_ADICIONAL',
  'CANCELLED', 'NAO_COMPARECEU', 'OBS_UPDATED',
]

export function AuditoriaPetshopPage() {
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const defaultTo = today.toISOString().slice(0, 10)

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [action, setAction] = useState('')

  const { data, isFetching } = useRegistrosOperacionaisQuery(
    {
      filter: {
        petshopId: petshopId || undefined,
        from: from ? `${from}T00:00:00.000Z` : undefined,
        to: to ? `${to}T23:59:59.999Z` : undefined,
        action: action || undefined,
        limit: 100,
      },
    },
    { enabled: !!petshopId },
  )

  const registros = data?.registrosOperacionais ?? []

  return (
    <div>
      <PageHeader title="Auditoria Operacional" />

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Período — início</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Período — fim</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Tipo de ação</label>
            <select value={action} onChange={(e) => setAction(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, minWidth: 180 }}>
              <option value="">Todos</option>
              {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isFetching && <p style={{ color: '#999', fontSize: 13 }}>Carregando...</p>}

      {!isFetching && (
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16 }}>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#666' }}>{registros.length} registro(s) encontrado(s)</p>
          <RegistroTimeline registros={registros} />
        </div>
      )}
    </div>
  )
}
