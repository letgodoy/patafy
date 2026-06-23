import { useState } from 'react'
import { useQuery, useMutation, Provider } from 'urql'
import { graphqlClient } from '../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

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

  const columns: Column<AdminUser>[] = [
    { key: 'nome', header: 'Nome', render: (a) => a.nome },
    { key: 'email', header: 'E-mail', render: (a) => a.email },
    { key: 'status', header: 'Status', width: 90, render: (a) => <span style={{ color: a.ativo ? 'green' : '#999' }}>{a.ativo ? 'Ativo' : 'Inativo'}</span> },
    { key: 'criado', header: 'Criado em', width: 130, render: (a) => new Date(a.createdAt).toLocaleDateString('pt-BR') },
  ]

  return (
    <>
      <PageHeader
        title="Administradores do Sistema"
        action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Admin</button>}
      />

      {sucesso && <p style={{ color: 'green', background: '#f0fff0', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}>{sucesso}</p>}

      {mostrarForm && (
        <FormCard title="Novo Administrador" onSubmit={handleSubmit}>
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
            <button type="submit" style={btnPrimary}>Criar Administrador</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}

      <DataTable
        columns={columns}
        data={(data?.listSystemAdmins as AdminUser[] | undefined) ?? []}
        rowKey={(a) => a.id}
        loading={fetching}
        error={error?.message}
        rowStyle={(a) => ({ opacity: a.ativo ? 1 : 0.5 })}
      />
    </>
  )
}

export function AdminsPage() {
  return <Provider value={graphqlClient}><AdminsPageInner /></Provider>
}
