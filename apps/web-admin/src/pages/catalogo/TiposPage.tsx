import { useState } from 'react'
import { useQuery, useMutation } from 'urql'
import { Layout } from '../../components/Layout.js'
import { Provider } from 'urql'
import { graphqlClient } from '../../lib/graphql-client.js'

const TIPOS_QUERY = /* GraphQL */ `
  query TiposAnimal {
    tiposAnimal {
      id nome ativo ordem createdAt
    }
  }
`

const CREATE_TIPO = /* GraphQL */ `
  mutation CreateTipoAnimal($input: CreateTipoAnimalInput!) {
    createTipoAnimal(input: $input) { id nome ativo ordem }
  }
`

const UPDATE_TIPO = /* GraphQL */ `
  mutation UpdateTipoAnimal($id: ID!, $input: UpdateTipoAnimalInput!) {
    updateTipoAnimal(id: $id, input: $input) { id nome ativo ordem }
  }
`

const SET_ATIVO = /* GraphQL */ `
  mutation SetAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) {
    setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo)
  }
`

type TipoAnimal = { id: string; nome: string; ativo: boolean; ordem: number | null }

function TiposPageInner() {
  const [{ data, fetching, error }, reexecute] = useQuery({ query: TIPOS_QUERY })
  const [, createTipo] = useMutation(CREATE_TIPO)
  const [, updateTipo] = useMutation(UPDATE_TIPO)
  const [, setAtivo] = useMutation(SET_ATIVO)

  const [editando, setEditando] = useState<TipoAnimal | null>(null)
  const [nome, setNome] = useState('')
  const [ordem, setOrdem] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setOrdem(''); setErro(''); setEditando(null); setMostrarForm(false) }

  const abrirEdicao = (t: TipoAnimal) => {
    setEditando(t)
    setNome(t.nome)
    setOrdem(t.ordem != null ? String(t.ordem) : '')
    setMostrarForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    const input = { nome: nome.trim(), ...(ordem ? { ordem: parseInt(ordem) } : {}) }
    const result = editando
      ? await updateTipo({ id: editando.id, input })
      : await createTipo({ input })
    if (result.error) { setErro(result.error.graphQLErrors[0]?.message ?? 'Erro ao salvar'); return }
    reexecute({ requestPolicy: 'network-only' })
    resetForm()
  }

  const handleToggleAtivo = async (t: TipoAnimal) => {
    await setAtivo({ tipo: 'tipoAnimal', id: t.id, ativo: !t.ativo })
    reexecute({ requestPolicy: 'network-only' })
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Tipos de Animal</h1>
        <button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnStyle}>+ Novo Tipo</button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3 style={{ marginTop: 0 }}>{editando ? 'Editar Tipo' : 'Novo Tipo de Animal'}</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Ordem</label>
              <input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} style={{ ...inputStyle, width: 80 }} />
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
            {(data.tiposAnimal as TipoAnimal[]).map((t) => (
              <tr key={t.id} style={{ opacity: t.ativo ? 1 : 0.5 }}>
                <td style={tdStyle}>{t.nome}</td>
                <td style={tdStyle}>{t.ordem ?? '—'}</td>
                <td style={tdStyle}>
                  <span style={{ color: t.ativo ? 'green' : '#999' }}>{t.ativo ? 'Ativo' : 'Inativo'}</span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => abrirEdicao(t)} style={btnSmStyle}>Editar</button>
                  <button onClick={() => handleToggleAtivo(t)} style={{ ...btnSmStyle, marginLeft: 6, color: t.ativo ? '#c00' : 'green' }}>
                    {t.ativo ? 'Inativar' : 'Ativar'}
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

export function TiposPage() {
  return <Provider value={graphqlClient}><TiposPageInner /></Provider>
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
