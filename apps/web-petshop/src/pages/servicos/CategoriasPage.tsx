import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useMyPetShopIdQuery, useListCategoriasQuery, useCreateCategoriaMutation, useUpdateCategoriaMutation } from '@patafy/graphql-client'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'
import { useState } from 'react'

type CatRow = { id: string; nome: string; ordem: number | null; ativo: boolean }
const schema = z.object({ nome: z.string().min(1, 'Nome é obrigatório'), ordem: z.coerce.number().int().optional().or(z.literal('')) })
type FormData = z.infer<typeof schema>

export function CategoriasPage() {
  const qc = useQueryClient()
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''
  const { data, isLoading, error } = useListCategoriasQuery({ petshopId }, { enabled: !!petshopId })
  const invalidate = () => qc.invalidateQueries({ queryKey: useListCategoriasQuery.getKey({ petshopId }) })

  const createMutation = useCreateCategoriaMutation({ onSuccess: invalidate })
  const updateMutation = useUpdateCategoriaMutation({ onSuccess: invalidate })

  const [editando, setEditando] = useState<CatRow | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { nome: '', ordem: '' } })
  const resetForm = () => { form.reset(); setEditando(null); setMostrarForm(false) }
  const abrirEdicao = (c: CatRow) => { setEditando(c); form.reset({ nome: c.nome, ordem: c.ordem ?? '' }); setMostrarForm(true) }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (editando) {
        await updateMutation.mutateAsync({ id: editando.id, input: { nome: data.nome, ordem: data.ordem !== '' ? Number(data.ordem) : undefined } })
      } else {
        await createMutation.mutateAsync({ petshopId, input: { nome: data.nome, ordem: data.ordem !== '' ? Number(data.ordem) : undefined } })
      }
      resetForm()
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar' })
    }
  })

  const handleToggleAtivo = async (c: CatRow) => {
    await updateMutation.mutateAsync({ id: c.id, input: { ativo: !c.ativo } })
  }

  const e = form.formState.errors
  const cols: Column<CatRow>[] = [
    { key: 'nome', header: 'Nome', render: (c) => c.nome },
    { key: 'ordem', header: 'Ordem', width: 80, render: (c) => c.ordem ?? '—' },
    { key: 'status', header: 'Status', width: 90, render: (c) => <span style={{ color: c.ativo ? 'green' : '#999' }}>{c.ativo ? 'Ativa' : 'Inativa'}</span> },
    { key: 'acoes', header: 'Ações', width: 160, render: (c) => <><button onClick={() => abrirEdicao(c)} style={btnSmall}>Editar</button><button onClick={() => handleToggleAtivo(c)} style={{ ...btnSmall, marginLeft: 6, color: c.ativo ? '#c00' : 'green' }}>{c.ativo ? 'Desativar' : 'Ativar'}</button></> },
  ]

  return (
    <>
      <PageHeader title="Categorias de Serviço" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Nova Categoria</button>} />
      {mostrarForm && (
        <FormCard title={editando ? 'Editar Categoria' : 'Nova Categoria'} onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nome *</label>
              <input {...form.register('nome')} style={{ ...inputStyle, width: '100%' }} />
              {e.nome && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.nome.message}</p>}
            </div>
            <div style={{ width: 100 }}>
              <label style={labelStyle}>Ordem</label>
              <input type="number" min={0} {...form.register('ordem')} style={inputStyle} />
            </div>
          </div>
          {e.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{e.root.message}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Salvar</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}
      <DataTable columns={cols} data={(data?.listCategorias as CatRow[] | undefined) ?? []} rowKey={(c) => c.id} loading={isLoading || !petshopId} error={error ? String(error) : undefined} emptyText="Nenhuma categoria cadastrada." />
    </>
  )
}
