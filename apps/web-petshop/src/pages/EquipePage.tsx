import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

const MY_PETSHOP_ID = /* GraphQL */ `
  query MyPetShopId { myPetShop { id } }
`

const LIST_STAFF = /* GraphQL */ `
  query ListStaff($petshopId: ID!) {
    listStaff(petshopId: $petshopId) { id nome email roles ativo createdAt }
  }
`

const CREATE_STAFF = /* GraphQL */ `
  mutation CreateStaff($input: CreateStaffInput!) {
    createStaff(input: $input) { id nome email roles ativo createdAt }
  }
`

const UPDATE_STAFF = /* GraphQL */ `
  mutation UpdateStaff($id: ID!, $input: UpdateStaffInput!) {
    updateStaff(id: $id, input: $input) { id nome email roles ativo }
  }
`

const DEACTIVATE_STAFF = /* GraphQL */ `
  mutation DeactivateStaff($id: ID!) { deactivateStaff(id: $id) }
`

type StaffMember = { id: string; nome: string; email: string; roles: string[]; ativo: boolean; createdAt: string }

const ROLE_LABELS: Record<string, string> = { owner: 'Owner', atendente: 'Atendente', banhista: 'Banhista' }

export function EquipePage() {
  const qc = useQueryClient()

  const { data: psData } = useQuery({
    queryKey: ['myPetshopId'],
    queryFn: () => gqlClient.request<{ myPetShop: { id: string } | null }>(MY_PETSHOP_ID),
  })
  const petshopId = psData?.myPetShop?.id ?? ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['staff', petshopId],
    queryFn: () => gqlClient.request<{ listStaff: StaffMember[] }>(LIST_STAFF, { petshopId }),
    enabled: !!petshopId,
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['staff', petshopId] })

  const createStaffMutation = useMutation({
    mutationFn: (vars: { input: Record<string, unknown> }) => gqlClient.request(CREATE_STAFF, vars),
    onSuccess: invalidate,
  })
  const updateStaffMutation = useMutation({
    mutationFn: (vars: { id: string; input: Record<string, unknown> }) => gqlClient.request(UPDATE_STAFF, vars),
    onSuccess: invalidate,
  })
  const deactivateStaffMutation = useMutation({
    mutationFn: (id: string) => gqlClient.request(DEACTIVATE_STAFF, { id }),
    onSuccess: invalidate,
  })

  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<StaffMember | null>(null)
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [rolesAtendente, setRolesAtendente] = useState(false)
  const [rolesBanhista, setRolesBanhista] = useState(false)
  const [erro, setErro] = useState('')

  const resetForm = () => {
    setMostrarForm(false); setEditando(null)
    setNome(''); setCpf(''); setEmail(''); setTelefone(''); setSenha('')
    setRolesAtendente(false); setRolesBanhista(false); setErro('')
  }

  const abrirEdicao = (m: StaffMember) => {
    setEditando(m); setNome(m.nome)
    setRolesAtendente(m.roles.includes('atendente')); setRolesBanhista(m.roles.includes('banhista'))
    setMostrarForm(true)
  }

  const buildRoles = () => {
    const roles: string[] = []
    if (rolesAtendente) roles.push('atendente')
    if (rolesBanhista) roles.push('banhista')
    return roles
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErro('')
    if (!editando && buildRoles().length === 0) { setErro('Selecione pelo menos um papel'); return }
    try {
      if (editando) {
        await updateStaffMutation.mutateAsync({ id: editando.id, input: { nome: nome.trim(), roles: buildRoles() } })
      } else {
        await createStaffMutation.mutateAsync({
          input: { petshopId, nome: nome.trim(), cpf: cpf.trim(), email: email.trim(), telefone: telefone.trim() || undefined, senha, roles: buildRoles() },
        })
      }
      resetForm()
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar')
    }
  }

  const handleDeactivate = async (m: StaffMember) => {
    if (!confirm(`Desativar "${m.nome}"?`)) return
    await deactivateStaffMutation.mutateAsync(m.id)
  }

  const columns: Column<StaffMember>[] = [
    { key: 'nome', header: 'Nome', render: (m) => m.nome },
    { key: 'email', header: 'E-mail', render: (m) => m.email },
    { key: 'roles', header: 'Papéis', render: (m) => m.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ') },
    { key: 'status', header: 'Status', width: 90, render: (m) => <span style={{ color: m.ativo ? 'green' : '#999' }}>{m.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 160,
      render: (m) => (
        <>
          {m.ativo && <button onClick={() => abrirEdicao(m)} style={btnSmall}>Editar</button>}
          {m.ativo && !m.roles.includes('owner') && (
            <button onClick={() => handleDeactivate(m)} style={{ ...btnSmall, marginLeft: 6, color: '#c00' }}>Desativar</button>
          )}
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Equipe" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Membro</button>} />

      {mostrarForm && (
        <FormCard title={editando ? 'Editar Membro' : 'Novo Membro da Equipe'} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Nome *</label><input value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} /></div>
            {!editando && (
              <>
                <div><label style={labelStyle}>CPF *</label><input value={cpf} onChange={(e) => setCpf(e.target.value)} required placeholder="000.000.000-00" style={inputStyle} /></div>
                <div><label style={labelStyle}>E-mail *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} /></div>
                <div><label style={labelStyle}>Telefone</label><input value={telefone} onChange={(e) => setTelefone(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Senha *</label><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} style={inputStyle} /></div>
              </>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Papéis *</label>
            <label style={{ marginRight: 16, fontSize: 14 }}>
              <input type="checkbox" checked={rolesAtendente} onChange={(e) => setRolesAtendente(e.target.checked)} /> Atendente
            </label>
            <label style={{ fontSize: 14 }}>
              <input type="checkbox" checked={rolesBanhista} onChange={(e) => setRolesBanhista(e.target.checked)} /> Banhista
            </label>
          </div>
          {erro && <p style={{ color: 'red', margin: '8px 0 0' }}>{erro}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Salvar</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}

      <DataTable
        columns={columns}
        data={data?.listStaff ?? []}
        rowKey={(m) => m.id}
        loading={isLoading || !petshopId}
        error={error ? String(error) : undefined}
        rowStyle={(m) => ({ opacity: m.ativo ? 1 : 0.5 })}
        emptyText="Nenhum membro de equipe cadastrado."
      />
    </>
  )
}
