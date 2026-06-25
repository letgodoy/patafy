import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useMyPetShopIdQuery, useListStaffQuery, useCreateStaffMutation, useUpdateStaffMutation, useDeactivateStaffMutation } from '@patafy/graphql-client'
import type { StaffMember } from '@patafy/graphql-client'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

type StaffRow = Pick<StaffMember, 'id' | 'nome' | 'email' | 'roles' | 'ativo' | 'createdAt'>
const ROLE_LABELS: Record<string, string> = { owner: 'Owner', atendente: 'Atendente', banhista: 'Banhista' }

const staffSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().optional(),
  email: z.string().optional(),
  telefone: z.string().optional(),
  senha: z.string().optional(),
  rolesAtendente: z.boolean(),
  rolesBanhista: z.boolean(),
})
type FormData = z.infer<typeof staffSchema>

export function EquipePage() {
  const qc = useQueryClient()
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''

  const { data, isLoading, error } = useListStaffQuery({ petshopId }, { enabled: !!petshopId })
  const invalidate = () => qc.invalidateQueries({ queryKey: useListStaffQuery.getKey({ petshopId }) })

  const createStaffMutation = useCreateStaffMutation({ onSuccess: invalidate })
  const updateStaffMutation = useUpdateStaffMutation({ onSuccess: invalidate })
  const deactivateStaffMutation = useDeactivateStaffMutation({ onSuccess: invalidate })

  const [editando, setEditando] = useState<StaffRow | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: { nome: '', cpf: '', email: '', telefone: '', senha: '', rolesAtendente: false, rolesBanhista: false },
  })

  const resetForm = () => { setEditando(null); form.reset(); setMostrarForm(false) }
  const abrirEdicao = (m: StaffRow) => {
    setEditando(m)
    form.reset({ nome: m.nome, rolesAtendente: m.roles.includes('atendente'), rolesBanhista: m.roles.includes('banhista') })
    setMostrarForm(true)
  }

  const onSubmit = form.handleSubmit(async (data) => {
    const roles: string[] = []
    if (data.rolesAtendente) roles.push('atendente')
    if (data.rolesBanhista) roles.push('banhista')

    if (!editando) {
      if (!data.cpf) { form.setError('cpf', { message: 'CPF é obrigatório' }); return }
      if (!data.email) { form.setError('email', { message: 'E-mail é obrigatório' }); return }
      if (!data.senha || data.senha.length < 6) { form.setError('senha', { message: 'Senha deve ter pelo menos 6 caracteres' }); return }
      if (roles.length === 0) { form.setError('root', { message: 'Selecione pelo menos um papel' }); return }
    }

    try {
      if (editando) {
        await updateStaffMutation.mutateAsync({ id: editando.id, input: { nome: data.nome.trim(), roles } })
      } else {
        await createStaffMutation.mutateAsync({
          input: { petshopId, nome: data.nome.trim(), cpf: data.cpf!.trim(), email: data.email!.trim(), telefone: data.telefone?.trim() || undefined, senha: data.senha!, roles },
        })
      }
      resetForm()
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar' })
    }
  })

  const handleDeactivate = async (m: StaffRow) => {
    if (!confirm(`Desativar "${m.nome}"?`)) return
    await deactivateStaffMutation.mutateAsync({ id: m.id })
  }

  const columns: Column<StaffRow>[] = [
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

  const e = form.formState.errors

  return (
    <>
      <PageHeader title="Equipe" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Membro</button>} />
      {mostrarForm && (
        <FormCard title={editando ? 'Editar Membro' : 'Novo Membro da Equipe'} onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input {...form.register('nome')} style={inputStyle} />
              {e.nome && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.nome.message}</p>}
            </div>
            {!editando && (
              <>
                <div><label style={labelStyle}>CPF *</label><input {...form.register('cpf')} placeholder="000.000.000-00" style={inputStyle} />{e.cpf && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.cpf.message}</p>}</div>
                <div><label style={labelStyle}>E-mail *</label><input type="email" {...form.register('email')} style={inputStyle} />{e.email && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.email.message}</p>}</div>
                <div><label style={labelStyle}>Telefone</label><input {...form.register('telefone')} style={inputStyle} /></div>
                <div><label style={labelStyle}>Senha *</label><input type="password" {...form.register('senha')} style={inputStyle} />{e.senha && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.senha.message}</p>}</div>
              </>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Papéis *</label>
            <label style={{ marginRight: 16, fontSize: 14 }}><input type="checkbox" {...form.register('rolesAtendente')} /> Atendente</label>
            <label style={{ fontSize: 14 }}><input type="checkbox" {...form.register('rolesBanhista')} /> Banhista</label>
          </div>
          {e.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{e.root.message}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Salvar</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}
      <DataTable columns={columns} data={(data?.listStaff as StaffRow[] | undefined) ?? []} rowKey={(m) => m.id} loading={isLoading || !petshopId} error={error ? String(error) : undefined} rowStyle={(m) => ({ opacity: m.ativo ? 1 : 0.5 })} emptyText="Nenhum membro de equipe cadastrado." />
    </>
  )
}
