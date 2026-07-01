import { useState } from 'react'
import {
  useRelatorioAtendimentosResumoQuery,
  useRelatorioServicosRealizadosQuery,
  useRelatorioPacotesQuery,
  useMyPetShopIdQuery,
} from '@patafy/graphql-client'
import { PageHeader, colors } from '@patafy/ui'

function CardMetric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 180 }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function downloadCsv(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.click()
}

export function RelatoriosPage() {
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const defaultTo = today.toISOString().slice(0, 10)

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)

  const fromIso = `${from}T00:00:00.000Z`
  const toIso = `${to}T23:59:59.999Z`
  const enabled = !!petshopId && !!from && !!to

  const { data: resumoData, isFetching: loadingResumo } = useRelatorioAtendimentosResumoQuery(
    { petshopId, from: fromIso, to: toIso },
    { enabled },
  )
  const { data: servicosData, isFetching: loadingServicos } = useRelatorioServicosRealizadosQuery(
    { petshopId, from: fromIso, to: toIso },
    { enabled },
  )
  const { data: pacotesData, isFetching: loadingPacotes } = useRelatorioPacotesQuery(
    { petshopId, from: fromIso, to: toIso },
    { enabled },
  )

  const resumo = resumoData?.relatorioAtendimentosResumo
  const servicos = servicosData?.relatorioServicosRealizados ?? []
  const pacotes = pacotesData?.relatorioPacotes

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

  function buildCsvUrl(tipo: string) {
    return `${apiBase}/reports/${tipo}.csv?petshopId=${petshopId}&from=${from}&to=${to}`
  }

  return (
    <div>
      <PageHeader title="Relatórios Financeiros" />

      {/* Filtro período */}
      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>De</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Até</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13 }} />
        </div>
      </div>

      {/* Cards resumo atendimentos */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Resumo de atendimentos</h3>
          <button onClick={() => downloadCsv(buildCsvUrl('atendimentos'))} style={{ fontSize: 13, padding: '6px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', color: '#166534' }}>
            Exportar CSV
          </button>
        </div>
        {loadingResumo && <p style={{ color: '#9ca3af', fontSize: 13 }}>Carregando...</p>}
        {resumo && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <CardMetric label="Finalizados" value={String(resumo.totalFinalizados)} />
            <CardMetric label="Cancelados" value={String(resumo.totalCancelados)} />
            <CardMetric label="Não compareceu" value={String(resumo.totalNaoCompareceu)} />
            <CardMetric label="Valor estimado" value={`R$ ${resumo.valorEstimado.toFixed(2)}`} />
            <CardMetric label="Valor pago" value={`R$ ${resumo.valorPago.toFixed(2)}`} sub="marcados como pago" />
            <CardMetric label="Valor pendente" value={`R$ ${resumo.valorPendente.toFixed(2)}`} />
          </div>
        )}
      </section>

      {/* Tabela serviços realizados */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Serviços realizados</h3>
          <button onClick={() => downloadCsv(buildCsvUrl('servicos'))} style={{ fontSize: 13, padding: '6px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', color: '#166534' }}>
            Exportar CSV
          </button>
        </div>
        {loadingServicos && <p style={{ color: '#9ca3af', fontSize: 13 }}>Carregando...</p>}
        {!loadingServicos && (
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Serviço', 'Qtd', 'Total (R$)', 'Médio (R$)'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}`, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {servicos.map((s) => (
                  <tr key={s.servicoVarianteId} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '8px 12px' }}>{s.servicoNome}</td>
                    <td style={{ padding: '8px 12px' }}>{s.quantidade}</td>
                    <td style={{ padding: '8px 12px' }}>{s.valorTotal.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px' }}>{s.valorMedio.toFixed(2)}</td>
                  </tr>
                ))}
                {servicos.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Nenhum serviço no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Cards pacotes */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Pacotes</h3>
          <button onClick={() => downloadCsv(buildCsvUrl('pacotes'))} style={{ fontSize: 13, padding: '6px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', color: '#166534' }}>
            Exportar CSV
          </button>
        </div>
        {loadingPacotes && <p style={{ color: '#9ca3af', fontSize: 13 }}>Carregando...</p>}
        {pacotes && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <CardMetric label="Pacotes vendidos no período" value={String(pacotes.pacotesVendidos)} />
            <CardMetric label="Valor total vendas" value={`R$ ${pacotes.valorTotalVendas.toFixed(2)}`} />
            <CardMetric label="Créditos consumidos no período" value={String(pacotes.creditosConsumidos)} />
            <CardMetric label="Créditos restantes (snapshot)" value={String(pacotes.creditosRestantes)} />
          </div>
        )}
      </section>
    </div>
  )
}
