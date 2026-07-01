import { useState } from 'react'
import { useAtendimentoByAgendamentoQuery, useStartAtendimentoMutation, useMarkProntoMutation, useFinalizarAtendimentoMutation, useAddServicoAdicionalMutation, useUpdateObservacoesGeraisMutation, useUpdateObservacoesInternasMutation, useListServicosQuery, useMyPetShopIdQuery } from '@patafy/graphql-client'
import { PageHeader, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle, colors } from '@patafy/ui'
import { useQueryClient } from '@tanstack/react-query'

type Props = { agendamentoId: string; petNome: string; tutorNome: string; onClose: () => void }

type ServicoVariante = { id: string; preco: number; duracaoMinutos: number }
type Servico = { id: string; nome: string; variantes: ServicoVariante[] }

export function AtendimentoDetalhe({ agendamentoId, petNome, tutorNome, onClose }: Props) {
  const qc = useQueryClient()
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''

  const { data, refetch } = useAtendimentoByAgendamentoQuery({ agendamentoId })
  const at = data?.atendimentoByAgendamento

  const { data: servicosData } = useListServicosQuery({ petshopId }, { enabled: !!petshopId })
  const servicos = (servicosData?.listServicos as Servico[] | undefined) ?? []

  const [addVarianteId, setAddVarianteId] = useState('')
  const [addPreco, setAddPreco] = useState('')
  const [obsGeral, setObsGeral] = useState('')
  const [obsInterna, setObsInterna] = useState('')
  const [obsGeralMode, setObsGeralMode] = useState(false)
  const [obsInternaMode, setObsInternaMode] = useState(false)

  const invalidate = () => refetch()

  const startMutation = useStartAtendimentoMutation({ onSuccess: invalidate })
  const prontoMutation = useMarkProntoMutation({ onSuccess: invalidate })
  const finalizarMutation = useFinalizarAtendimentoMutation({ onSuccess: () => { invalidate(); qc.invalidateQueries() } })
  const addAdicionalMutation = useAddServicoAdicionalMutation({ onSuccess: invalidate })
  const updateGeralMutation = useUpdateObservacoesGeraisMutation({ onSuccess: () => { invalidate(); setObsGeralMode(false) } })
  const updateInternaMutation = useUpdateObservacoesInternasMutation({ onSuccess: () => { invalidate(); setObsInternaMode(false) } })

  if (!at) return (
    <div>
      <PageHeader title={`Atendimento — ${petNome}`} />
      <p style={{ color: '#666' }}>Carregando...</p>
    </div>
  )

  const todasVariantes = servicos.flatMap((s) => s.variantes.map((v) => ({ ...v, servicoNome: s.nome })))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onClose} style={btnSecondary}>← Voltar</button>
        <PageHeader title={`Atendimento — ${petNome}`} />
      </div>

      <p style={{ margin: '0 0 16px', color: '#666', fontSize: 14 }}>Tutor: {tutorNome}</p>

      {/* Ações de status */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => startMutation.mutateAsync({ agendamentoId })} style={{ ...btnSmall, background: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' }} disabled={startMutation.isPending}>
          Iniciar
        </button>
        <button onClick={() => prontoMutation.mutateAsync({ agendamentoId })} style={{ ...btnSmall, background: '#ede9fe', color: '#4c1d95', borderColor: '#c4b5fd' }} disabled={prontoMutation.isPending}>
          Pronto
        </button>
        <button onClick={() => finalizarMutation.mutateAsync({ agendamentoId })} style={btnPrimary} disabled={finalizarMutation.isPending}>
          {finalizarMutation.isPending ? 'Finalizando...' : 'Finalizar'}
        </button>
      </div>

      {/* Serviços adicionais */}
      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px' }}>Serviços adicionais</h4>
        {at.adicionais.length === 0 && <p style={{ color: '#999', fontSize: 13, margin: '0 0 12px' }}>Nenhum adicional.</p>}
        {at.adicionais.map((a) => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: `1px solid ${colors.border}` }}>
            <span>{todasVariantes.find((v) => v.id === a.servicoVarianteId)?.servicoNome ?? a.servicoVarianteId}</span>
            <strong>R$ {a.precoCobrado.toFixed(2)}</strong>
          </div>
        ))}

        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Serviço</label>
            <select value={addVarianteId} onChange={(e) => setAddVarianteId(e.target.value)} style={{ ...inputStyle, minWidth: 200 }}>
              <option value="">Selecionar...</option>
              {todasVariantes.map((v) => <option key={v.id} value={v.id}>{v.servicoNome} — R$ {Number(v.preco).toFixed(2)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Preço (R$)</label>
            <input type="number" step="0.01" value={addPreco} onChange={(e) => setAddPreco(e.target.value)} style={{ ...inputStyle, width: 100 }} placeholder="0.00" />
          </div>
          <button
            onClick={async () => {
              if (!addVarianteId || !addPreco) return
              await addAdicionalMutation.mutateAsync({ input: { atendimentoId: at.id, servicoVarianteId: addVarianteId, precoCobrado: parseFloat(addPreco) } })
              setAddVarianteId(''); setAddPreco('')
            }}
            style={btnSmall}
            disabled={!addVarianteId || !addPreco || addAdicionalMutation.isPending}
          >
            + Adicionar
          </button>
        </div>
      </div>

      {/* Observações gerais */}
      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ margin: 0 }}>Observações (visível ao tutor)</h4>
          <button onClick={() => { setObsGeral(at.observacoesGerais ?? ''); setObsGeralMode(true) }} style={btnSmall}>Editar</button>
        </div>
        {obsGeralMode ? (
          <>
            <textarea value={obsGeral} onChange={(e) => setObsGeral(e.target.value)} rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => updateGeralMutation.mutateAsync({ atendimentoId: at.id, texto: obsGeral })} style={btnPrimary} disabled={updateGeralMutation.isPending}>Salvar</button>
              <button onClick={() => setObsGeralMode(false)} style={btnSecondary}>Cancelar</button>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: at.observacoesGerais ? '#333' : '#999' }}>{at.observacoesGerais ?? 'Sem observações.'}</p>
        )}
      </div>

      {/* Observações internas */}
      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ margin: 0 }}>Notas internas (apenas staff)</h4>
          <button onClick={() => { setObsInterna(at.observacoesInternas ?? ''); setObsInternaMode(true) }} style={btnSmall}>Editar</button>
        </div>
        {obsInternaMode ? (
          <>
            <textarea value={obsInterna} onChange={(e) => setObsInterna(e.target.value)} rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => updateInternaMutation.mutateAsync({ atendimentoId: at.id, texto: obsInterna })} style={btnPrimary} disabled={updateInternaMutation.isPending}>Salvar</button>
              <button onClick={() => setObsInternaMode(false)} style={btnSecondary}>Cancelar</button>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: at.observacoesInternas ? '#333' : '#999' }}>{at.observacoesInternas ?? 'Sem notas internas.'}</p>
        )}
      </div>
    </div>
  )
}
