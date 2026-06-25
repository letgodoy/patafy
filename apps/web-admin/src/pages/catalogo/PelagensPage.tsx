import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { usePelagensQuery, useCreatePelagemMutation, useUpdatePelagemMutation, useSetCatalogItemAtivoMutation } from '@patafy/graphql-client'
import type { Pelagem } from '@patafy/graphql-client'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

const schema = z.object({ nome: z.string().min(1, 'Nome é obrigatório') })
type FormData = z.infer<typeof schema>
type PelagemRow = Pick<Pelagem, 'id' | 'nome' | 'ativo' | 'ordem'>

export function PelagensPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = usePelagensQuery()
  const invalidate = () => qc.invalidateQueries({ queryKey: usePelagensQuery.getKey() })
  const createMutation = useCreatePelagemMutation({ onSuccess: invalidate })
  const updateMutation = useUpdatePelagemMutation({ onSuccess: invalidate })
  const setAtivoMutation = useSetCatalogItemAtivoMutation({ onSuccess: invalidate })

  const [editando, setEditando] = useState<PelagemRow | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { nome: '' } })

  const resetForm = () => { setEditando(null); form.reset(); setMostrarForm(false) }
  const abrirEdicao = (p: PelagemRow) => { setEditando(p); form.reset({ nome: p.nome }); setMostrarForm(true) }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (editando) await updateMutation.mutateAsync({ id: editando.id, input: { nome: data.nome.trim() } })
      else await createMutation.mutateAsync({ input: { nome: data.nome.trim() } })
      resetForm()
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar' })
    }
  })

  const columns: Column<PelagemRow>[] = [
    { key: 'nome', header: 'Nome', render: (p) => p.nome },
    { key: 'ordem', header: 'Ordem', width: 80, render: (p) => p.ordem ?? '—' },
    { key: 'status', header: 'Status', width: 90, render: (p) => <span style={{ color: p.ativo ? 'green' : '#999' }}>{p.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 160,
      render: (p) => (
        <>
          <button onClick={() => abrirEdicao(p)} style={btnSmall}>Editar</button>
          <button onClick={() => setAtivoMutation.mutate({ tipo: 'pelagem', id: p.id, ativo: !p.ativo })} style={{ ...btnSmall, marginLeft: 6, color: p.ativo ? '#c00' : 'green' }}>
            {p.ativo ? 'Inativar' : 'Ativar'}
          </button>
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Pelagens" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Nova Pelagem</button>} />
      {mostrarForm && (
        <FormCard title={editando ? 'Editar Pelagem' : 'Nova Pelagem'} onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input {...form.register('nome')} style={inputStyle} />
              {form.formState.errors.nome && <p style={{ color: 'red', margin: '4px 0 0', fontSize: 13 }}>{form.formState.errors.nome.message}</p>}
            </div>
          </div>
          {form.formState.errors.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{form.formState.errors.root.message}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Salvar</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}
      <DataTable columns={columns} data={(data?.pelagens as PelagemRow[] | undefined) ?? []} rowKey={(p) => p.id} loading={isLoading} error={error ? String(error) : undefined} rowStyle={(p) => ({ opacity: p.ativo ? 1 : 0.5 })} />
    </>
  )
}
