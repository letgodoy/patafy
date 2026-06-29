import { useState } from 'react'
import { useAgendaPetShopQuery, useMyPetShopIdQuery } from '@patafy/graphql-client'
import { PageHeader, colors } from '@patafy/ui'
import { AtendimentoDetalhe } from './AtendimentoDetalhe.js'
import { STATUS_LABEL } from './AgendamentoCard.js'

type Agendamento = {
  id: string; dataHoraInicio: string; duracaoTotalMinutos: number; status: string; pago: boolean
  pet: { nome: string } | null
  tutor: { nome: string } | null
  banhista: { id: string; nome: string } | null
}

export function MinhaAgendaPage() {
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''

  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

  const { data, isLoading } = useAgendaPetShopQuery(
    { petshopId, from: from.toISOString(), to: to.toISOString(), filters: { status: ['Confirmado', 'EmAndamento', 'Atrasado', 'Pronto'] } },
    { enabled: !!petshopId },
  )

  const [selected, setSelected] = useState<{ id: string; petNome: string; tutorNome: string } | null>(null)

  const agendamentos = (data?.agendaPetShop as Agendamento[] | undefined) ?? []

  if (selected) {
    return (
      <AtendimentoDetalhe
        agendamentoId={selected.id}
        petNome={selected.petNome}
        tutorNome={selected.tutorNome}
        onClose={() => setSelected(null)}
      />
    )
  }

  return (
    <div>
      <PageHeader title="Minha Agenda Hoje" />

      {isLoading && <p style={{ color: '#666' }}>Carregando...</p>}
      {!isLoading && agendamentos.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Nenhum atendimento para hoje.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agendamentos.map((ag) => {
          const st = STATUS_LABEL[ag.status] ?? { label: ag.status, bg: '#f3f4f6', color: '#555' }
          const dt = new Date(ag.dataHoraInicio)
          return (
            <div
              key={ag.id}
              onClick={() => setSelected({ id: ag.id, petNome: ag.pet?.nome ?? '—', tutorNome: ag.tutor?.nome ?? '—' })}
              style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ marginLeft: 12, fontSize: 15 }}>{ag.pet?.nome ?? '—'}</span>
                {ag.tutor && <span style={{ marginLeft: 8, fontSize: 13, color: '#666' }}>({ag.tutor.nome})</span>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: '4px 10px', borderRadius: 20 }}>{st.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
