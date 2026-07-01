import { useState } from 'react'
import { useMyPetShopIdQuery, useAgendaPetShopQuery, useConfirmAgendamentoMutation, useCancelAgendamentoMutation, useMarkNaoCompareceuMutation, useTogglePagoMutation, useUpdateAgendamentoStatusMutation } from '@patafy/graphql-client'
import { PageHeader, btnSmall, colors } from '@patafy/ui'
import { AgendamentoCard, STATUS_LABEL } from './AgendamentoCard.js'
import { AtendimentoDetalhe } from './AtendimentoDetalhe.js'

type Agendamento = {
  id: string; petshopId: string; dataHoraInicio: string; duracaoTotalMinutos: number
  status: string; pago: boolean; precisaTransporte: boolean; banhistaId: string | null
  pet: { nome: string; tipoAnimal: string | null; porte: string | null; raca: string | null } | null
  tutor: { nome: string; email: string; telefone: string | null } | null
  banhista: { nome: string } | null
}

const ALL_STATUS = Object.keys(STATUS_LABEL)
const ATENDIMENTO_STATUSES = ['EmAndamento', 'Confirmado', 'Atrasado', 'Pronto']

function dateRange(mode: 'dia' | 'semana' | 'mes', ref: Date): { from: Date; to: Date } {
  const d = new Date(ref)
  if (mode === 'dia') {
    return {
      from: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
      to: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
    }
  }
  if (mode === 'semana') {
    const from = new Date(d); from.setDate(d.getDate() - d.getDay()); from.setHours(0, 0, 0, 0)
    const to = new Date(from); to.setDate(from.getDate() + 6); to.setHours(23, 59, 59, 999)
    return { from, to }
  }
  return {
    from: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0),
    to: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
  }
}

export function AgendaPage() {
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''

  const [mode, setMode] = useState<'dia' | 'semana' | 'mes'>('dia')
  const [ref, setRef] = useState(new Date())
  const [filtroStatus, setFiltroStatus] = useState<string[]>([])
  const [filtroPago, setFiltroPago] = useState<boolean | undefined>(undefined)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [atendimentoAberto, setAtendimentoAberto] = useState<{ id: string; petNome: string; tutorNome: string } | null>(null)

  const { from, to } = dateRange(mode, ref)

  const { data, isLoading, refetch } = useAgendaPetShopQuery(
    { petshopId, from: from.toISOString(), to: to.toISOString(), filters: { status: filtroStatus.length > 0 ? filtroStatus : undefined, pago: filtroPago } },
    { enabled: !!petshopId },
  )

  const invalidate = () => refetch()
  const confirmMutation = useConfirmAgendamentoMutation({ onSuccess: invalidate })
  const cancelMutation = useCancelAgendamentoMutation({ onSuccess: invalidate })
  const naoCompareceuMutation = useMarkNaoCompareceuMutation({ onSuccess: invalidate })
  const togglePagoMutation = useTogglePagoMutation({ onSuccess: invalidate })
  const updateStatusMutation = useUpdateAgendamentoStatusMutation({ onSuccess: invalidate })

  const agendamentos = (data?.agendaPetShop as Agendamento[] | undefined) ?? []

  const navigate = (delta: number) => {
    const d = new Date(ref)
    if (mode === 'dia') d.setDate(d.getDate() + delta)
    else if (mode === 'semana') d.setDate(d.getDate() + delta * 7)
    else d.setMonth(d.getMonth() + delta)
    setRef(d)
  }

  const titleRef = mode === 'dia'
    ? ref.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    : mode === 'semana'
    ? `Semana de ${from.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${to.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
    : ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (atendimentoAberto) {
    return (
      <AtendimentoDetalhe
        agendamentoId={atendimentoAberto.id}
        petNome={atendimentoAberto.petNome}
        tutorNome={atendimentoAberto.tutorNome}
        onClose={() => setAtendimentoAberto(null)}
      />
    )
  }

  return (
    <div>
      <PageHeader title="Agenda" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['dia', 'semana', 'mes'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${colors.border}`, background: mode === m ? colors.primary : '#fff', color: mode === m ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 8 }}>
          <button onClick={() => navigate(-1)} style={{ ...btnSmall, padding: '6px 10px' }}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 500, minWidth: 220, textAlign: 'center' }}>{titleRef}</span>
          <button onClick={() => navigate(1)} style={{ ...btnSmall, padding: '6px 10px' }}>›</button>
        </div>
      </div>

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

      {isLoading && <p style={{ color: '#666' }}>Carregando...</p>}
      {!isLoading && agendamentos.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Nenhum agendamento neste período.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agendamentos.map((ag) => (
          <AgendamentoCard
            key={ag.id}
            ag={ag}
            expanded={expandido === ag.id}
            onToggle={() => setExpandido(expandido === ag.id ? null : ag.id)}
            onConfirm={(id) => confirmMutation.mutateAsync({ id })}
            onCancel={(id) => cancelMutation.mutateAsync({ id })}
            onIniciar={(id) => updateStatusMutation.mutateAsync({ id, status: 'EmAndamento' })}
            onPronto={(id) => updateStatusMutation.mutateAsync({ id, status: 'Pronto' })}
            onFinalizar={(id) => updateStatusMutation.mutateAsync({ id, status: 'Finalizado' })}
            onNaoCompareceu={(id) => naoCompareceuMutation.mutateAsync({ id })}
            onTogglePago={(id) => togglePagoMutation.mutateAsync({ id })}
            onAbrirAtendimento={ATENDIMENTO_STATUSES.includes(ag.status) ? () => setAtendimentoAberto({ id: ag.id, petNome: ag.pet?.nome ?? '—', tutorNome: ag.tutor?.nome ?? '—' }) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
