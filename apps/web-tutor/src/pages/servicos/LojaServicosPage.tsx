import { useState } from 'react'
import { useParams } from 'react-router'
import { usePetShopBySlugQuery, useMyPetsQuery, useListServicosQuery } from '@patafy/graphql-client'
import { PageHeader, inputStyle, labelStyle, colors } from '@patafy/ui'

type Pet = { id: string; nome: string; tipoAnimal: { id: string; nome: string } | null; raca: { id: string; nome: string } | null; porte: { id: string; nome: string } | null }
type Variante = { id: string; duracaoMinutos: number; preco: number }
type Servico = { id: string; nome: string; descricao: string | null; categoriaId: string | null; ativo: boolean; variantes: Variante[] }

export function LojaServicosPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: shopData } = usePetShopBySlugQuery({ slug: slug! }, { enabled: !!slug })
  const { data: petsData } = useMyPetsQuery()
  const [petSelecionado, setPetSelecionado] = useState('')

  const petshopId = shopData?.petShopBySlug?.id ?? ''
  const { data: servicosData, isLoading } = useListServicosQuery(
    { petshopId, petId: petSelecionado || undefined },
    { enabled: !!petshopId },
  )

  const loja = shopData?.petShopBySlug
  const pets = (petsData?.myPets as Pet[] | undefined) ?? []
  const servicos = (servicosData?.listServicos as Servico[] | undefined) ?? []

  if (!loja) return <p style={{ padding: 24, color: '#666' }}>Carregando...</p>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <PageHeader title={`Serviços — ${loja.configJson.nome ?? loja.nomeExibicao}`} />

      <div style={{ marginBottom: 20, padding: 16, background: '#f0fdf4', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label style={{ ...labelStyle, margin: 0, whiteSpace: 'nowrap' }}>Filtrar por pet</label>
        <select value={petSelecionado} onChange={(e) => setPetSelecionado(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
          <option value="">Todos os serviços</option>
          {pets.map((p) => <option key={p.id} value={p.id}>{p.nome}{p.raca ? ` — ${p.raca.nome}` : ''}{p.porte ? ` (${p.porte.nome})` : ''}</option>)}
        </select>
      </div>

      {isLoading && <p style={{ color: '#666' }}>Carregando serviços...</p>}

      {!isLoading && servicos.length === 0 && (
        <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
          {petSelecionado ? 'Nenhum serviço disponível para este pet.' : 'Esta petshop ainda não cadastrou serviços.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {servicos.filter((s) => s.ativo).map((servico) => (
          <div key={servico.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: servico.variantes.length > 0 ? `1px solid ${colors.border}` : undefined }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{servico.nome}</h3>
              {servico.descricao && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>{servico.descricao}</p>}
            </div>
            {servico.variantes.length > 0 && (
              <div>
                {servico.variantes.map((v, idx) => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: idx % 2 === 0 ? '#fafafa' : '#fff', borderTop: idx > 0 ? `1px solid ${colors.border}` : undefined }}>
                    <span style={{ fontSize: 13, color: '#555' }}>{v.duracaoMinutos} min</span>
                    <strong style={{ fontSize: 15, color: colors.primary }}>R$ {Number(v.preco).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
