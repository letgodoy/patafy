import { useState } from 'react'
import { useQuery, useMutation, Provider } from 'urql'
import { Layout } from '../../components/Layout.js'
import { graphqlClient } from '../../lib/graphql-client.js'

const PORTES_QUERY = /* GraphQL */ `
  query Portes { portes { id nome ativo ordem } }
`
const CREATE_PORTE = /* GraphQL */ `
  mutation CreatePorte($input: CreatePorteInput!) { createPorte(input: $input) { id nome ativo ordem } }
`
const UPDATE_PORTE = /* GraphQL */ `
  mutation UpdatePorte($id: ID!, $input: UpdatePorteInput!) { updatePorte(id: $id, input: $input) { id nome ativo ordem } }
`
const SET_ATIVO = /* GraphQL */ `
  mutation SetAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) { setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo) }
`

type Porte = { id: string; nome: string; ativo: boolean; ordem: number | null }

function PortesPageInner() {
  const [{ data, fetching, error }, reexecute] = useQuery({ query: PORTES_QUERY })
  const [, createPorte] = useMutation(CREATE_PORTE)
  const [, updatePorte] = useMutation(UPDATE_PORTE)
  const [, setAtivo] = useMutation(SET_ATIVO)

  const [editando, setEditando] = useState<Porte | null>(null)
  const [nome, setNome] = useState('')
  const [ordem, setOrdem] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setOrdem(''); setErro(''); setEditando(null); setMostrarForm(false) }

  const abrirEdicao = (p: Porte) => {
    setEditando(p); setNome(p.nome); setMostrarForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    const input = { nome: nome.trim() }
    const result = editando ? await updatePorte({ id: editando.id, input }) : await createPorte({ input })
    if (result.error) { setErro(result.error.graphQLErrors[0]?.message ?? 'Erro ao salvar'); return }
    reexecute({ requestPolicy: 'network-only' })
    resetForm()
  }

  const handleToggleAtivo = async (p: Porte) => {
    await setAtivo({ tipo: 'porte', id: p.id, ativo: !p.ativo })
    reexecute({ requestPolicy: 'network-only' })
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Portes</h1>
        <button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnStyle}>+ Novo Porte</button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3 style={{ marginTop: 0 }}>{editando ? 'Editar Porte' : 'Novo Porte'}</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} />
            </div>
          </div>
          {erro && <p style={{ color: 'red', margin: '8px 0 0' }}>{erro}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnStyle}>Salvar</button>
            <button type="button" onClick={resetForm} style={btnSecStyle}>Cancelar</button>
          </div>
        </form>
      )}

      {fetching && <p>Carregando...</p>}
      {error && <p style={{ color: 'red' }}>{error.message}</p>}

      {data && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nome</th>
              <th style={thStyle}>Ordem</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(data.portes as Porte[]).map((p) => (
              <tr key={p.id} style={{ opacity: p.ativo ? 1 : 0.5 }}>
                <td style={tdStyle}>{p.nome}</td>
                <td style={tdStyle}>{p.ordem ?? '—'}</td>
                <td style={tdStyle}><span style={{ color: p.ativo ? 'green' : '#999' }}>{p.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td style={tdStyle}>
                  <button onClick={() => abrirEdicao(p)} style={btnSmStyle}>Editar</button>
                  <button onClick={() => handleToggleAtivo(p)} style={{ ...btnSmStyle, marginLeft: 6, color: p.ativo ? '#c00' : 'green' }}>
                    {p.ativo ? 'Inativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  )
}

export function PortesPage() {
  return <Provider value={graphqlClient}><PortesPageInner /></Provider>
}

const btnStyle: React.CSSProperties = { background: '#1a1a2e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }
const btnSecStyle: React.CSSProperties = { background: '#fff', color: '#333', border: '1px solid #ccc', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }
const btnSmStyle: React.CSSProperties = { background: 'none', border: '1px solid #ccc', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }
const inputStyle: React.CSSProperties = { display: 'block', padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, width: 220 }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, marginBottom: 4, color: '#555' }
const formStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 24 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 16px', background: '#f0f0f0', fontSize: 13, fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '10px 16px', borderTop: '1px solid #eee', fontSize: 14 }
