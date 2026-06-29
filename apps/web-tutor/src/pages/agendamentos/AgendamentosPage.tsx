import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMyAgendamentosQuery, useCancelAgendamentoMutation } from '@patafy/graphql-client'
import { PageHeader, colors } from '@patafy/ui'
import { useQueryClient } from '@tanstack/react-query'

type Agendamento = {
  id: string; petshopId: string; dataHoraInicio: string; duracaoTotalMinutos: number
  status: string; pago: boolean; precisaTransporte: boolean
  pet: { nome: string; tipoAnimal: string | null; porte: string | null } | null
  banhista: { nome: string } | null
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  AguardandoConfirmacao: { label: 'Aguardando', color: '#d97706' },
  Confirmado: { label: 'Confirmado', color: '#16a34a' },
  EmAndamento: { label: 'Em andamento', color: '#2563eb' },
  Atrasado: { label: 'Atrasado', color: '#dc2626' },
  Pronto: { label: 'Pronto', color: '#7c3aed' },
  Finalizado: { label: 'Finalizado', color: '#6b7280' },
  Cancelado: { label: 'Cancelado', color: '#9ca3af' },
  NaoCompareceu: { label: 'Não compareceu', color: '#9ca3af' },
}

const PRAZO_CANCELAMENTO_HORAS = 2

export function AgendamentosPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [aba, setAba] = useState<'upcoming' | 'historico'>('upcoming')
  const { data, isLoading } = useMyAgendamentosQuery({ upcoming: aba === 'upcoming' ? true : false })
  const cancelMutation = useCancelAgendamentoMutation({
    onSuccess: () => qc.invalidateQueries({ queryKey: useMyAgendamentosQuery.getKey({ upcoming: true }) }),
  })

  const agendamentos = (data?.myAgendamentos as Agendamento[] | undefined) ?? []

  const podeCancel = (ag: Agendamento) => {
    if (!['AguardandoConfirmacao', 'Confirmado'].includes(ag.status)) return false
    const limite = new Date(ag.dataHoraInicio).getTime() - PRAZO_CANCELAMENTO_HORAS * 3600000
    return Date.now() < limite
  }

  const podeRemarcar = (ag: Agendamento) => podeCancel(ag)

  const handleCancelar = async (id: string) => {
    if (!confirm('Cancelar este agendamento?')) return
    await cancelMutation.mutateAsync({ id })
  }

  const downloadIcs = (id: string) => {
    const token = localStorage.getItem('authToken') ?? ''
    window.open(`/calendar/agendamentos/${id}.ics?token=${token}`, '_blank')
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <PageHeader title="Meus Agendamentos" />

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
        {(['upcoming', 'historico'] as const).map((a) => (
          <button key={a} onClick={() => setAba(a)} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 0, background: aba === a ? colors.primary : '#fff', color: aba === a ? '#fff' : '#374151', cursor: 'pointer', fontWeight: aba === a ? 600 : 400 }}>
            {a === 'upcoming' ? 'Próximos' : 'Histórico'}
          </button>
        ))}
      </div>

      {isLoading && <p style={{ color: '#666' }}>Carregando...</p>}
      {!isLoading && agendamentos.length === 0 && (
        <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
          {aba === 'upcoming' ? 'Nenhum agendamento futuro.' : 'Nenhum histórico.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {agendamentos.map((ag) => {
          const st = STATUS_LABEL[ag.status] ?? { label: ag.status, color: '#555' }
          const dt = new Date(ag.dataHoraInicio)
          const fim = new Date(dt.getTime() + ag.duracaoTotalMinutos * 60000)
          return (
            <div key={ag.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600 }}>
                    {ag.pet?.nome ?? 'Pet'}{ag.pet?.tipoAnimal ? ` — ${ag.pet.tipoAnimal}` : ''}{ag.pet?.porte ? ` (${ag.pet.porte})` : ''}
                  </p>
                  <p style={{ margin: '0 0 2px', fontSize: 14 }}>
                    {dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} · {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – {fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {ag.banhista && <p style={{ margin: 0, fontSize: 13, color: '#666' }}>Banhista: {ag.banhista.nome}</p>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: `${st.color}18`, padding: '4px 10px', borderRadius: 20 }}>{st.label}</span>
              </div>
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {podeRemarcar(ag) && (
                  <button onClick={() => navigate(`/agendamentos/${ag.id}/remarcar`)} style={{ fontSize: 13, padding: '6px 12px', border: `1px solid ${colors.border}`, borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Remarcar</button>
                )}
                {podeCancel(ag) && (
                  <button onClick={() => handleCancelar(ag.id)} style={{ fontSize: 13, padding: '6px 12px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fff', color: '#dc2626', cursor: 'pointer' }}>Cancelar</button>
                )}
                <button onClick={() => downloadIcs(ag.id)} style={{ fontSize: 13, padding: '6px 12px', border: `1px solid ${colors.border}`, borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
                  📅 Adicionar ao calendário
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
