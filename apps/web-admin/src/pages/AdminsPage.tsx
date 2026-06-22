import { useState } from 'react'
import { useQuery, useMutation, Provider } from 'urql'
import { Layout } from '../components/Layout.js'
import { graphqlClient } from '../lib/graphql-client.js'

const ADMINS_QUERY = /* GraphQL */ `
  query ListSystemAdmins {
    listSystemAdmins { id email nome ativo createdAt }
  }
`

const CREATE_ADMIN = /* GraphQL */ `
  mutation CreateSystemAdmin($input: CreateSystemAdminInput!) {
    createSystemAdmin(input: $input) { id email nome ativo createdAt }
  }
`

type AdminUser = { id: string; email: string; nome: string; ativo: boolean; createdAt: string }

function AdminsPageInner() {
  const [{ data, fetching, error }, reexecute] = useQuery({ query: ADMINS_QUERY })
  const [, createAdmin] = useMutation(CREATE_ADMIN)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setEmail(''); setSenha(''); setErro(''); setMostrarForm(false) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setSucesso('')
    if (senha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return }
    const result = await createAdmin({ input: { nome: nome.trim(), email: email.trim(), senha } })
    if (result.error) { setErro(result.error.graphQLErrors[0]?.message ?? 'Erro ao criar administrador'); return }
    setSucesso(`Administrador ${nome} criado com sucesso.`)
    reexecute({ requestPolicy: 'network-only' })
    resetForm()
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Administradores do Sistema</h1>
        <button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnStyle}>+ Novo Admin</button>
      </div>

      {sucesso && <p style={{ color: 'green', background: '#f0fff0', padding: '8px 12px', borderRadius: 4 }}>{sucesso}</p>}

      {mostrarForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3 style={{ marginTop: 0 }}>Novo Administrador</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>E-mail *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Senha *</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} style={inputStyle} />
            </div>
          </div>
          {erro && <p style={{ color: 'red', margin: '8px 0 0' }}>{erro}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnStyle}>Criar Administrador</button>
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
              <th style={thStyle}>E-mail</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Criado em</th>
            </tr>
          </thead>
          <tbody>
            {(data.listSystemAdmins as AdminUser[]).map((a) => (
              <tr key={a.id} style={{ opacity: a.ativo ? 1 : 0.5 }}>
                <td style={tdStyle}>{a.nome}</td>
                <td style={tdStyle}>{a.email}</td>
                <td style={tdStyle}><span style={{ color: a.ativo ? 'green' : '#999' }}>{a.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td style={tdStyle}>{new Date(a.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  )
}

export function AdminsPage() {
  return <Provider value={graphqlClient}><AdminsPageInner /></Provider>
}

const btnStyle: React.CSSProperties = { background: '#1a1a2e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }
const btnSecStyle: React.CSSProperties = { background: '#fff', color: '#333', border: '1px solid #ccc', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }
const inputStyle: React.CSSProperties = { display: 'block', padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, width: 220 }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, marginBottom: 4, color: '#555' }
const formStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 24 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 16px', background: '#f0f0f0', fontSize: 13, fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '10px 16px', borderTop: '1px solid #eee', fontSize: 14 }
