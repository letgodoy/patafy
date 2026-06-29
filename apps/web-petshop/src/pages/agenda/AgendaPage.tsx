import { useState } from 'react'
import { useMyPetShopIdQuery, useAgendaPetShopQuery, useConfirmAgendamentoMutation, useCancelAgendamentoMutation, useMarkNaoCompareceuMutation, useTogglePagoMutation, useUpdateAgendamentoStatusMutation } from '@patafy/graphql-client'
import { PageHeader, btnSmall, colors } from '@patafy/ui'
import { useQueryClient } from '@tanstack/react-query'

type Agendamento = {
  id: string; petshopId: string; dataHoraInicio: string; duracaoTotalMinutos: number
  status: string; pago: boolean; precisaTransporte: boolean; banhistaId: string | null
  pet: { nome: string; tipoAnimal: string | null; porte: string | null; raca: string | null } | null
  tutor: { nome: string; email: string; telefone: string | null } | null
  banhista: { nome: string } | null
}

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  AguardandoConfirmacao: { label: 'Aguardando', bg: '#fef9c3', color: '#92400e' },
  Confirmado: { label: 'Confirmado', bg: '#d1fae5', color: '#065f46' },
  EmAndamento: { label: 'Em andamento', bg: '#dbeafe', color: '#1e40af' },
  Atrasado: { label: 'Atrasado', bg: '#fee2e2', color: '#991b1b' },
  Pronto: { label: 'Pronto', bg: '#ede9fe', color: '#4c1d95' },
  Finalizado: { label: 'Finalizado', bg: '#f3f4f6', color: '#374151' },
  Cancelado: { label: 'Cancelado', bg: '#f3f4f6', color: '#9ca3af' },
  NaoCompareceu: { label: 'Não compareceu', bg: '#f3f4f6', color: '#9ca3af' },
}

const ALL_STATUS = Object.keys(STATUS_LABEL)

function dateRange(mode: 'dia' | 'semana' | 'mes', ref: Date): { from: Date; to: Date } {
  const d = new Date(ref)
  if (mode === 'dia') {
    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
    const to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
    return { from, to }
  }
  if (mode === 'semana') {
    const dow = d.getDay()
    const from = new Date(d); from.setDate(d.getDate() - dow); from.setHours(0, 0, 0, 0)
    const to = new Date(from); to.setDate(from.getDate() + 6); to.setHours(23, 59, 59, 999)
    return { from, to }
  }
  // mes
  const from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0)
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
  return { from, to }
}

export function AgendaPage() {
  const qc = useQueryClient()
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''

  const [mode, setMode] = useState<'dia' | 'semana' | 'mes'>('dia')
  const [ref, setRef] = useState(new Date())
  const [filtroStatus, setFiltroStatus] = useState<string[]>([])
  const [filtroPago, setFiltroPago] = useState<boolean | undefined>(undefined)
  const [expandido, setExpandido] = useState<string | null>(null)

  const { from, to } = dateRange(mode, ref)

  const { data, isLoading, refetch } = useAgendaPetShopQuery(
    {
      petshopId,
      from: from.toISOString(),
      to: to.toISOString(),
      filters: {
        status: filtroStatus.length > 0 ? filtroStatus : undefined,
        pago: filtroPago,
      },
    },
    { enabled: !!petshopId },
  )

  const invalidate = () => refetch()

  const confirmMutation = useConfirmAgendamentoMutation({ onSuccess: invalidate })
  const cancelMutation = useCancelAgendamentoMutation({ onSuccess: invalidate })
  const naoCompareceuMutation = useMarkNaoCompareceuMutation({ onSuccess: invalidate })
  const togglePagoMutation = useTogglePagoMutation({ onSuccess: invalidate })
  const updateStatusMutation = useUpdateAgendamentoStatusMutation({ onSuccess: invalidate })

  const agendamentos = (data?.agendaPetShop as Agendamento[] | undefined) ?? []

  const navAnterior = () => {
    const d = new Date(ref)
    if (mode === 'dia') d.setDate(d.getDate() - 1)
    else if (mode === 'semana') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setRef(d)
  }
  const navProximo = () => {
    const d = new Date(ref)
    if (mode === 'dia') d.setDate(d.getDate() + 1)
    else if (mode === 'semana') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setRef(d)
  }

  const titleRef = mode === 'dia'
    ? ref.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    : mode === 'semana'
    ? `Semana de ${from.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${to.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
    : ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <PageHeader title="Agenda" />

      {/* Controles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['dia', 'semana', 'mes'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${colors.border}`, background: mode === m ? colors.primary : '#fff', color: mode === m ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 8 }}>
          <button onClick={navAnterior} style={{ ...btnSmall, padding: '6px 10px' }}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 500, minWidth: 220, textAlign: 'center' }}>{titleRef}</span>
          <button onClick={navProximo} style={{ ...btnSmall, padding: '6px 10px' }}>›</button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#555' }}>Status:</span>
        {ALL_STATUS.map((s) => {
          const ativo = filtroStatus.includes(s)
          const st = STATUS_LABEL[s]!
          return (
            <button key={s} onClick={() => setFiltroStatus((prev) => ativo ? prev.filter((x) => x !== s) : [...prev, s])} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, border: `1px solid ${ativo ? st.color : '#e5e7eb'}`, background: ativo ? st.bg : '#fff', color: ativo ? st.color : '#555', cursor: 'pointer' }}>
              {st.label}
            </button>
          )
        })}
        <span style={{ fontSize: 13, color: '#555', marginLeft: 8 }}>Pago:</span>
        {[undefined, true, false].map((v, i) => (
          <button key={i} onClick={() => setFiltroPago(v)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, border: `1px solid ${filtroPago === v ? colors.primary : '#e5e7eb'}`, background: filtroPago === v ? '#f0fdf4' : '#fff', color: filtroPago === v ? colors.primary : '#555', cursor: 'pointer' }}>
            {v === undefined ? 'Todos' : v ? 'Pago' : 'Pendente'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading && <p style={{ color: '#666' }}>Carregando...</p>}
      {!isLoading && agendamentos.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Nenhum agendamento neste período.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agendamentos.map((ag) => {
          const st = STATUS_LABEL[ag.status] ?? { label: ag.status, bg: '#f3f4f6', color: '#555' }
          const dt = new Date(ag.dataHoraInicio)
          const aberto = expandido === ag.id
          return (
            <div key={ag.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div onClick={() => setExpandido(aberto ? null : ag.id)} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ marginLeft: 12, fontSize: 14 }}>{ag.pet?.nome ?? '—'}</span>
                  {ag.tutor && <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>({ag.tutor.nome})</span>}
                  {ag.banhista && <span style={{ marginLeft: 8, fontSize: 12, color: '#555' }}>· {ag.banhista.nome}</span>}
                  {ag.pago && <span style={{ marginLeft: 8, fontSize: 11, background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: 10 }}>Pago</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: '4px 10px', borderRadius: 20 }}>{st.label}</span>
              </div>

              {aberto && (
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}`, background: '#f9fafb' }}>
                  <div style={{ fontSize: 13, marginBottom: 12 }}>
                    {ag.pet && <p style={{ margin: '0 0 4px' }}><strong>Pet:</strong> {ag.pet.nome}{ag.pet.porte ? ` — ${ag.pet.porte}` : ''}{ag.pet.raca ? ` (${ag.pet.raca})` : ''}</p>}
                    {ag.tutor && <p style={{ margin: '0 0 4px' }}><strong>Tutor:</strong> {ag.tutor.nome} · {ag.tutor.email}{ag.tutor.telefone ? ` · ${ag.tutor.telefone}` : ''}</p>}
                    <p style={{ margin: '0 0 4px' }}><strong>Duração:</strong> {ag.duracaoTotalMinutos} min</p>
                    {ag.precisaTransporte && <p style={{ margin: '0 0 4px', color: colors.primary }}><strong>Solicita transporte</strong></p>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ag.status === 'AguardandoConfirmacao' && (
                      <button onClick={() => confirmMutation.mutateAsync({ id: ag.id })} style={{ ...btnSmall, background: '#d1fae5', color: '#065f46', borderColor: '#86efac' }}>Confirmar</button>
                    )}
                    {['AguardandoConfirmacao', 'Confirmado'].includes(ag.status) && (
                      <button onClick={() => cancelMutation.mutateAsync({ id: ag.id })} style={{ ...btnSmall, color: '#dc2626', borderColor: '#fca5a5' }}>Cancelar</button>
                    )}
                    {ag.status === 'Confirmado' && (
                      <button onClick={() => updateStatusMutation.mutateAsync({ id: ag.id, status: 'EmAndamento' })} style={{ ...btnSmall, background: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' }}>Iniciar</button>
                    )}
                    {ag.status === 'EmAndamento' && (
                      <button onClick={() => updateStatusMutation.mutateAsync({ id: ag.id, status: 'Pronto' })} style={{ ...btnSmall, background: '#ede9fe', color: '#4c1d95', borderColor: '#c4b5fd' }}>Pronto</button>
                    )}
                    {ag.status === 'Pronto' && (
                      <button onClick={() => updateStatusMutation.mutateAsync({ id: ag.id, status: 'Finalizado' })} style={btnSmall}>Finalizar</button>
                    )}
                    {['Confirmado', 'Atrasado'].includes(ag.status) && (
                      <button onClick={() => naoCompareceuMutation.mutateAsync({ id: ag.id })} style={{ ...btnSmall, color: '#6b7280' }}>Não compareceu</button>
                    )}
                    <button onClick={() => togglePagoMutation.mutateAsync({ id: ag.id })} style={{ ...btnSmall, color: ag.pago ? '#6b7280' : '#16a34a' }}>
                      {ag.pago ? 'Desmarcar pago' : 'Marcar pago'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
