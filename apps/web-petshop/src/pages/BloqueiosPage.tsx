import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useMyPetShopIdQuery, useListBloqueiosQuery, useListStaffQuery, useCreateBloqueioMutation, useDeleteBloqueioMutation } from '@patafy/graphql-client'
import type { BloqueioAgenda, StaffMember } from '@patafy/graphql-client'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

type BloqueioRow = Pick<BloqueioAgenda, 'id' | 'banhistaId' | 'dataInicio' | 'dataFim' | 'motivo' | 'createdAt'>
type StaffRow = Pick<StaffMember, 'id' | 'nome' | 'roles' | 'ativo'>

const schema = z.object({
  banhistaId: z.string().optional(),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  motivo: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function BloqueiosPage() {
  const qc = useQueryClient()
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''

  const { data, isLoading, error } = useListBloqueiosQuery({ petshopId }, { enabled: !!petshopId })
  const { data: staffData } = useListStaffQuery({ petshopId }, { enabled: !!petshopId })
  const invalidate = () => qc.invalidateQueries({ queryKey: useListBloqueiosQuery.getKey({ petshopId }) })

  const createBloqueioMutation = useCreateBloqueioMutation({ onSuccess: invalidate })
  const deleteBloqueioMutation = useDeleteBloqueioMutation({ onSuccess: invalidate })

  const [mostrarForm, setMostrarForm] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { banhistaId: '', dataInicio: '', dataFim: '', motivo: '' },
  })

  const banhistas = ((staffData?.listStaff ?? []) as StaffRow[]).filter((m) => m.ativo && m.roles.includes('banhista'))
  const resetForm = () => { form.reset(); setMostrarForm(false) }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createBloqueioMutation.mutateAsync({
        input: {
          petshopId,
          banhistaId: data.banhistaId || undefined,
          dataInicio: new Date(data.dataInicio).toISOString(),
          dataFim: new Date(data.dataFim).toISOString(),
          motivo: data.motivo?.trim() || undefined,
        },
      })
      resetForm()
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao criar bloqueio' })
    }
  })

  const handleDelete = async (b: BloqueioRow) => {
    if (!confirm('Remover este bloqueio?')) return
    await deleteBloqueioMutation.mutateAsync({ id: b.id })
  }

  const banhistaNome = (id: string | null) => {
    if (!id) return 'Loja inteira'
    return banhistas.find((b) => b.id === id)?.nome ?? id
  }

  const columns: Column<BloqueioRow>[] = [
    { key: 'banhista', header: 'Banhista / Escopo', render: (b) => banhistaNome(b.banhistaId ?? null) },
    { key: 'inicio', header: 'Início', width: 150, render: (b) => fmt(b.dataInicio) },
    { key: 'fim', header: 'Fim', width: 150, render: (b) => fmt(b.dataFim) },
    { key: 'motivo', header: 'Motivo', render: (b) => b.motivo ?? '—' },
    {
      key: 'acoes', header: 'Ações', width: 100,
      render: (b) => <button onClick={() => handleDelete(b)} style={{ ...btnSmall, color: '#c00' }}>Remover</button>,
    },
  ]

  const e = form.formState.errors

  return (
    <>
      <PageHeader title="Bloqueios de Agenda" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Bloqueio</button>} />
      {mostrarForm && (
        <FormCard title="Novo Bloqueio" onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Banhista (deixe em branco para bloquear a loja inteira)</label>
              <select {...form.register('banhistaId')} style={inputStyle}>
                <option value="">Loja inteira</option>
                {banhistas.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Data/hora início *</label>
              <input type="datetime-local" {...form.register('dataInicio')} style={inputStyle} />
              {e.dataInicio && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.dataInicio.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Data/hora fim *</label>
              <input type="datetime-local" {...form.register('dataFim')} style={inputStyle} />
              {e.dataFim && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.dataFim.message}</p>}
            </div>
            <div style={{ width: '100%' }}>
              <label style={labelStyle}>Motivo</label>
              <input {...form.register('motivo')} placeholder="ex: Feriado, Férias..." style={{ ...inputStyle, width: '100%' }} />
            </div>
          </div>
          {e.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{e.root.message}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Criar Bloqueio</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}
      <DataTable columns={columns} data={(data?.listBloqueios as BloqueioRow[] | undefined) ?? []} rowKey={(b) => b.id} loading={isLoading || !petshopId} error={error ? String(error) : undefined} emptyText="Nenhum bloqueio de agenda cadastrado." />
    </>
  )
}
