import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useListSystemAdminsQuery, useCreateSystemAdminMutation } from '@patafy/graphql-client'
import type { SystemAdminUser } from '@patafy/graphql-client'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})
type FormData = z.infer<typeof schema>
type AdminRow = Pick<SystemAdminUser, 'id' | 'email' | 'nome' | 'ativo' | 'createdAt'>

export function AdminsPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useListSystemAdminsQuery()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [sucesso, setSucesso] = useState('')

  const createMutation = useCreateSystemAdminMutation({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: useListSystemAdminsQuery.getKey() })
      setSucesso('Administrador criado com sucesso.')
    },
  })

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { nome: '', email: '', senha: '' } })
  const resetForm = () => { form.reset(); setMostrarForm(false) }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync({ input: { nome: data.nome.trim(), email: data.email.trim(), senha: data.senha } })
      resetForm()
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao criar administrador' })
    }
  })

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
        <FormCard title="Novo Administrador" onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input {...form.register('nome')} style={inputStyle} />
              {form.formState.errors.nome && <p style={{ color: 'red', margin: '4px 0 0', fontSize: 13 }}>{form.formState.errors.nome.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>E-mail *</label>
              <input type="email" {...form.register('email')} style={inputStyle} />
              {form.formState.errors.email && <p style={{ color: 'red', margin: '4px 0 0', fontSize: 13 }}>{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Senha *</label>
              <input type="password" {...form.register('senha')} style={inputStyle} />
              {form.formState.errors.senha && <p style={{ color: 'red', margin: '4px 0 0', fontSize: 13 }}>{form.formState.errors.senha.message}</p>}
            </div>
          </div>
          {form.formState.errors.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{form.formState.errors.root.message}</p>}
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
