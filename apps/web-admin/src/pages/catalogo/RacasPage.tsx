import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'
import type {
  RacasQuery,
  CreateRacaMutation, CreateRacaMutationVariables,
  UpdateRacaMutation, UpdateRacaMutationVariables,
  SetCatalogItemAtivoMutationVariables,
  Raca,
} from '@patafy/graphql-client'

const RACAS_QUERY = /* GraphQL */ `
  query Racas {
    racas { id nome ativo ordem tipoAnimalId tipoAnimal { id nome } }
    tiposAnimal(ativo: true) { id nome ativo ordem createdAt }
  }
`
const CREATE_RACA = /* GraphQL */ `mutation CreateRaca($input: CreateRacaInput!) { createRaca(input: $input) { id nome ativo ordem tipoAnimalId tipoAnimal { id nome } } }`
const UPDATE_RACA = /* GraphQL */ `mutation UpdateRaca($id: ID!, $input: UpdateRacaInput!) { updateRaca(id: $id, input: $input) { id nome ativo ordem tipoAnimalId tipoAnimal { id nome } } }`
const SET_ATIVO = /* GraphQL */ `mutation SetCatalogItemAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) { setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo) }`

const schema = z.object({
  tipoAnimalId: z.string(),
  nome: z.string().min(1, 'Nome é obrigatório'),
})
type FormData = z.infer<typeof schema>

type RacaRow = Pick<Raca, 'id' | 'nome' | 'ativo' | 'ordem' | 'tipoAnimalId'> & { tipoAnimal: { id: string; nome: string } }

export function RacasPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['racas'],
    queryFn: () => gqlClient.request<RacasQuery & { tiposAnimal: { id: string; nome: string }[] }>(RACAS_QUERY),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['racas'] })
  const createMutation = useMutation({ mutationFn: (vars: CreateRacaMutationVariables) => gqlClient.request<CreateRacaMutation>(CREATE_RACA, vars), onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: (vars: UpdateRacaMutationVariables) => gqlClient.request<UpdateRacaMutation>(UPDATE_RACA, vars), onSuccess: invalidate })
  const setAtivoMutation = useMutation({ mutationFn: (vars: SetCatalogItemAtivoMutationVariables) => gqlClient.request(SET_ATIVO, vars), onSuccess: invalidate })

  const [editando, setEditando] = useState<RacaRow | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { tipoAnimalId: '', nome: '' } })

  const resetForm = () => { setEditando(null); form.reset(); setMostrarForm(false) }
  const abrirEdicao = (r: RacaRow) => { setEditando(r); form.reset({ tipoAnimalId: r.tipoAnimalId, nome: r.nome }); setMostrarForm(true) }

  const onSubmit = form.handleSubmit(async (data) => {
    if (!editando && !data.tipoAnimalId) {
      form.setError('tipoAnimalId', { message: 'Selecione um tipo de animal' })
      return
    }
    try {
      if (editando) await updateMutation.mutateAsync({ id: editando.id, input: { nome: data.nome.trim() } })
      else await createMutation.mutateAsync({ input: { tipoAnimalId: data.tipoAnimalId, nome: data.nome.trim() } })
      resetForm()
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar' })
    }
  })

  const tipos = (data as { tiposAnimal?: { id: string; nome: string }[] } | undefined)?.tiposAnimal ?? []
  const racasFiltradas = ((data as { racas?: RacaRow[] } | undefined)?.racas ?? []).filter((r) => !filtroTipo || r.tipoAnimalId === filtroTipo)

  const columns: Column<RacaRow>[] = [
    { key: 'nome', header: 'Nome', render: (r) => r.nome },
    { key: 'tipo', header: 'Tipo de Animal', render: (r) => r.tipoAnimal.nome },
    { key: 'ordem', header: 'Ordem', width: 80, render: (r) => r.ordem ?? '—' },
    { key: 'status', header: 'Status', width: 90, render: (r) => <span style={{ color: r.ativo ? 'green' : '#999' }}>{r.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 160,
      render: (r) => (
        <>
          <button onClick={() => abrirEdicao(r)} style={btnSmall}>Editar</button>
          <button onClick={() => setAtivoMutation.mutate({ tipo: 'raca', id: r.id, ativo: !r.ativo })} style={{ ...btnSmall, marginLeft: 6, color: r.ativo ? '#c00' : 'green' }}>
            {r.ativo ? 'Inativar' : 'Ativar'}
          </button>
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Raças" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Nova Raça</button>} />

      {mostrarForm && (
        <FormCard title={editando ? 'Editar Raça' : 'Nova Raça'} onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!editando && (
              <div>
                <label style={labelStyle}>Tipo de Animal *</label>
                <select {...form.register('tipoAnimalId')} style={inputStyle}>
                  <option value="">Selecione...</option>
                  {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
                {form.formState.errors.tipoAnimalId && <p style={{ color: 'red', margin: '4px 0 0', fontSize: 13 }}>{form.formState.errors.tipoAnimalId.message}</p>}
              </div>
            )}
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

      <div style={{ marginBottom: 16 }}>
        <label style={{ ...labelStyle, display: 'inline' }}>Filtrar por tipo: </label>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ ...inputStyle, width: 200, display: 'inline-block', marginLeft: 8 }}>
          <option value="">Todos</option>
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={racasFiltradas} rowKey={(r) => r.id} loading={isLoading} error={error ? String(error) : undefined} rowStyle={(r) => ({ opacity: r.ativo ? 1 : 0.5 })} />
    </>
  )
}
