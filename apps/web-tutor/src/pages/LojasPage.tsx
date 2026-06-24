import { useState } from 'react'
import { Link } from 'react-router'
import { useListPetShopsQuery } from '@patafy/graphql-client'
import { PageHeader, inputStyle, labelStyle, colors } from '@patafy/ui'

export function LojasPage() {
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [nome, setNome] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState({ cidade: '', estado: '', nome: '' })

  const { data, isLoading, error } = useListPetShopsQuery(
    { filter: { ativo: true, cidade: filtroAtivo.cidade || undefined, estado: filtroAtivo.estado || undefined, nome: filtroAtivo.nome || undefined } },
  )

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault()
    setFiltroAtivo({ cidade: cidade.trim(), estado: estado.trim(), nome: nome.trim() })
  }

  const lojas = data?.listPetShops ?? []

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <PageHeader title="Encontre um Pet Shop" />
      <form onSubmit={handleFiltrar} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, background: '#fff', padding: 16, borderRadius: 8, border: `1px solid ${colors.border}` }}>
        <div><label style={labelStyle}>Nome</label><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Buscar por nome..." style={inputStyle} /></div>
        <div><label style={labelStyle}>Cidade</label><input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="ex: São Paulo" style={inputStyle} /></div>
        <div><label style={labelStyle}>Estado (UF)</label><input value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} placeholder="SP" style={{ ...inputStyle, width: 80 }} /></div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button type="submit" style={{ background: colors.primary, color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 4, cursor: 'pointer' }}>Buscar</button>
        </div>
      </form>

      {isLoading && <p>Buscando lojas...</p>}
      {!!error && <p style={{ color: 'red' }}>{String(error)}</p>}
      {!isLoading && !error && lojas.length === 0 && (
        <p style={{ color: '#666', textAlign: 'center', padding: 32 }}>Nenhuma loja encontrada com os filtros aplicados.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {lojas.map((loja) => (
          <div key={loja.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: loja.configJson?.corPrincipal ?? colors.primary, height: 8 }} />
            <div style={{ padding: 16 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{loja.configJson?.nome ?? loja.nomeExibicao}</h3>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#666' }}>{loja.cidade} — {loja.estado}</p>
              {loja.telefone && <p style={{ margin: '0 0 4px', fontSize: 13 }}>{loja.telefone}</p>}
              <p style={{ margin: '0 0 12px', fontSize: 13 }}>{loja.email}</p>
              {loja.configJson?.slug && (
                <Link to={`/loja/${loja.configJson.slug}`} style={{ color: colors.primary, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
                  Ver loja →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
