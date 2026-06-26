import { useParams, Link } from 'react-router'
import { useListPacotesPorPetQuery, usePetQuery } from '@patafy/graphql-client'
import { PageHeader, colors } from '@patafy/ui'

type SaldoItem = { servicoVarianteId: string; servicoNome: string; quantidadeTotal: number; quantidadeUsada: number; restante: number }
type SaldoPacote = { id: string; pacoteId: string; pacoteNome: string; dataAtivacao: string; dataExpiracao: string | null; status: string; items: SaldoItem[] }
type Pet = { id: string; nome: string }

const statusLabel: Record<string, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: '#16a34a' },
  expirado: { label: 'Expirado', color: '#999' },
  esgotado: { label: 'Esgotado', color: '#c00' },
}

export function PetPacotesPage() {
  const { id } = useParams<{ id: string }>()
  const { data: petData } = usePetQuery({ id: id! }, { enabled: !!id })
  const { data, isLoading, error } = useListPacotesPorPetQuery({ petId: id! }, { enabled: !!id })

  const pet = petData?.pet as Pet | null | undefined
  const pacotes = (data?.listPacotesPorPet as SaldoPacote[] | undefined) ?? []

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 8 }}>
        <Link to={`/pets/${id}`} style={{ fontSize: 13, color: colors.primary }}>← Voltar para {pet?.nome ?? 'pet'}</Link>
      </div>
      <PageHeader title={`Pacotes${pet ? ` — ${pet.nome}` : ''}`} />

      {isLoading && <p style={{ color: '#666' }}>Carregando...</p>}
      {!!error && <p style={{ color: '#c00' }}>Erro ao carregar pacotes.</p>}

      {!isLoading && pacotes.length === 0 && (
        <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>Nenhum pacote vinculado a este pet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {pacotes.map((p) => {
          const st = statusLabel[p.status] ?? { label: p.status, color: '#555' }
          const totalItens = p.items.reduce((acc, i) => acc + i.quantidadeTotal, 0)
          const totalUsados = p.items.reduce((acc, i) => acc + i.quantidadeUsada, 0)
          const pct = totalItens > 0 ? Math.round((totalUsados / totalItens) * 100) : 0

          return (
            <div key={p.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{p.pacoteNome}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
                    Ativado em {new Date(p.dataAtivacao).toLocaleDateString('pt-BR')}
                    {p.dataExpiracao && ` · Expira em ${new Date(p.dataExpiracao).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: `${st.color}15`, padding: '4px 10px', borderRadius: 20 }}>{st.label}</span>
              </div>

              {/* Barra de progresso */}
              <div style={{ padding: '0 16px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
                  <span>{totalUsados} usados de {totalItens} sessões</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: p.status === 'ativo' ? colors.primary : '#999', width: `${pct}%`, transition: 'width 0.3s' }} />
                </div>
              </div>

              {/* Itens detalhados */}
              {p.items.length > 0 && (
                <div style={{ borderTop: `1px solid ${colors.border}` }}>
                  {p.items.map((item, idx) => {
                    const itemPct = item.quantidadeTotal > 0 ? Math.round((item.quantidadeUsada / item.quantidadeTotal) * 100) : 0
                    return (
                      <div key={item.servicoVarianteId} style={{ padding: '10px 16px', background: idx % 2 === 0 ? '#fafafa' : '#fff', borderTop: idx > 0 ? `1px solid ${colors.border}` : undefined, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ flex: 1, fontSize: 13 }}>{item.servicoNome}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: item.restante > 0 ? colors.primary : '#999', width: `${itemPct}%` }} />
                          </div>
                          <span style={{ fontSize: 12, color: item.restante > 0 ? '#16a34a' : '#999', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {item.restante} restante{item.restante !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
