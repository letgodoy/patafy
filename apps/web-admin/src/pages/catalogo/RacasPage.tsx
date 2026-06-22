import { useState } from 'react'
import { useQuery, useMutation, Provider } from 'urql'
import { Layout } from '../../components/Layout.js'
import { graphqlClient } from '../../lib/graphql-client.js'

const RACAS_QUERY = /* GraphQL */ `
  query Racas {
    racas {
      id nome ativo ordem tipoAnimalId
      tipoAnimal { id nome }
    }
    tiposAnimal(ativo: true) { id nome }
  }
`

const CREATE_RACA = /* GraphQL */ `
  mutation CreateRaca($input: CreateRacaInput!) {
    createRaca(input: $input) { id nome ativo ordem tipoAnimalId tipoAnimal { id nome } }
  }
`

const UPDATE_RACA = /* GraphQL */ `
  mutation UpdateRaca($id: ID!, $input: UpdateRacaInput!) {
    updateRaca(id: $id, input: $input) { id nome ativo ordem tipoAnimalId tipoAnimal { id nome } }
  }
`

const SET_ATIVO = /* GraphQL */ `
  mutation SetAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) {
    setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo)
  }
`

type Raca = { id: string; nome: string; ativo: boolean; ordem: number | null; tipoAnimalId: string; tipoAnimal: { id: string; nome: string } }
type TipoAnimal = { id: string; nome: string }

function RacasPageInner() {
  const [{ data, fetching, error }, reexecute] = useQuery({ query: RACAS_QUERY })
  const [, createRaca] = useMutation(CREATE_RACA)
  const [, updateRaca] = useMutation(UPDATE_RACA)
  const [, setAtivo] = useMutation(SET_ATIVO)

  const [editando, setEditando] = useState<Raca | null>(null)
  const [nome, setNome] = useState('')
  const [ordem, setOrdem] = useState('')
  const [tipoAnimalId, setTipoAnimalId] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setOrdem(''); setTipoAnimalId(''); setErro(''); setEditando(null); setMostrarForm(false) }

  const abrirEdicao = (r: Raca) => {
    setEditando(r)
    setNome(r.nome)
    setTipoAnimalId(r.tipoAnimalId)
    setMostrarForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!tipoAnimalId && !editando) { setErro('Selecione um tipo de animal'); return }
    const input = editando
      ? { nome: nome.trim() }
      : { tipoAnimalId, nome: nome.trim() }
    const result = editando
      ? await updateRaca({ id: editando.id, input })
      : await createRaca({ input })
    if (result.error) { setErro(result.error.graphQLErrors[0]?.message ?? 'Erro ao salvar'); return }
    reexecute({ requestPolicy: 'network-only' })
    resetForm()
  }

  const handleToggleAtivo = async (r: Raca) => {
    await setAtivo({ tipo: 'raca', id: r.id, ativo: !r.ativo })
    reexecute({ requestPolicy: 'network-only' })
  }

  const racasFiltradas = data
    ? (data.racas as Raca[]).filter((r) => !filtroTipo || r.tipoAnimalId === filtroTipo)
    : []

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Raças</h1>
        <button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnStyle}>+ Nova Raça</button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3 style={{ marginTop: 0 }}>{editando ? 'Editar Raça' : 'Nova Raça'}</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!editando && (
              <div>
                <label style={labelStyle}>Tipo de Animal *</label>
                <select value={tipoAnimalId} onChange={(e) => setTipoAnimalId(e.target.value)} required style={inputStyle}>
                  <option value="">Selecione...</option>
                  {data && (data.tiposAnimal as TipoAnimal[]).map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            )}
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

      <div style={{ marginBottom: 16 }}>
        <label style={{ ...labelStyle, display: 'inline' }}>Filtrar por tipo: </label>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ ...inputStyle, width: 200, display: 'inline-block', marginLeft: 8 }}>
          <option value="">Todos</option>
          {data && (data.tiposAnimal as TipoAnimal[]).map((t) => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
      </div>

      {fetching && <p>Carregando...</p>}
      {error && <p style={{ color: 'red' }}>{error.message}</p>}

      {data && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nome</th>
              <th style={thStyle}>Tipo de Animal</th>
              <th style={thStyle}>Ordem</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {racasFiltradas.map((r) => (
              <tr key={r.id} style={{ opacity: r.ativo ? 1 : 0.5 }}>
                <td style={tdStyle}>{r.nome}</td>
                <td style={tdStyle}>{r.tipoAnimal.nome}</td>
                <td style={tdStyle}>{r.ordem ?? '—'}</td>
                <td style={tdStyle}>
                  <span style={{ color: r.ativo ? 'green' : '#999' }}>{r.ativo ? 'Ativo' : 'Inativo'}</span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => abrirEdicao(r)} style={btnSmStyle}>Editar</button>
                  <button onClick={() => handleToggleAtivo(r)} style={{ ...btnSmStyle, marginLeft: 6, color: r.ativo ? '#c00' : 'green' }}>
                    {r.ativo ? 'Inativar' : 'Ativar'}
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

export function RacasPage() {
  return <Provider value={graphqlClient}><RacasPageInner /></Provider>
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
