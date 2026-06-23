import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'
import type {
  ListSystemAdminsQuery,
  CreateSystemAdminMutation, CreateSystemAdminMutationVariables,
  SystemAdminUser,
} from '@patafy/graphql-client'

const ADMINS_QUERY = /* GraphQL */ `query ListSystemAdmins { listSystemAdmins { id email nome ativo createdAt } }`
const CREATE_ADMIN = /* GraphQL */ `mutation CreateSystemAdmin($input: CreateSystemAdminInput!) { createSystemAdmin(input: $input) { id email nome ativo createdAt } }`

type AdminRow = Pick<SystemAdminUser, 'id' | 'email' | 'nome' | 'ativo' | 'createdAt'>

export function AdminsPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['systemAdmins'],
    queryFn: () => gqlClient.request<ListSystemAdminsQuery>(ADMINS_QUERY),
  })
  const createMutation = useMutation({
    mutationFn: (vars: CreateSystemAdminMutationVariables) => gqlClient.request<CreateSystemAdminMutation>(CREATE_ADMIN, vars),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['systemAdmins'] }); setSucesso(`Administrador criado com sucesso.`) },
  })

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setEmail(''); setSenha(''); setErro(''); setMostrarForm(false) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErro(''); setSucesso('')
    if (senha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return }
    try {
      await createMutation.mutateAsync({ input: { nome: nome.trim(), email: email.trim(), senha } })
      resetForm()
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao criar administrador')
    }
  }

  const columns: Column<AdminRow>[] = [
    { key: 'nome', header: 'Nome', render: (a) => a.nome },
    { key: 'email', header: 'E-mail', render: (a) => a.email },
    { key: 'status', header: 'Status', width: 90, render: (a) => <span style={{ color: a.ativo ? 'green' : '#999' }}>{a.ativo ? 'Ativo' : 'Inativo'}</span> },
    { key: 'criado', header: 'Criado em', width: 130, render: (a) => new Date(a.createdAt).toLocaleDateString('pt-BR') },
  ]

  return (
    <>
      <PageHeader title="Administradores do Sistema" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Admin</button>} />
      {sucesso && <p style={{ color: 'green', background: '#f0fff0', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}>{sucesso}</p>}
      {mostrarForm && (
        <FormCard title="Novo Administrador" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Nome *</label><input value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} /></div>
            <div><label style={labelStyle}>E-mail *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} /></div>
            <div><label style={labelStyle}>Senha *</label><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} style={inputStyle} /></div>
          </div>
          {erro && <p style={{ color: 'red', margin: '8px 0 0' }}>{erro}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Criar Administrador</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}
      <DataTable columns={columns} data={(data?.listSystemAdmins as AdminRow[] | undefined) ?? []} rowKey={(a) => a.id} loading={isLoading} error={error ? String(error) : undefined} rowStyle={(a) => ({ opacity: a.ativo ? 1 : 0.5 })} />
    </>
  )
}
