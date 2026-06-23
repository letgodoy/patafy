import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'
import type {
  TiposAnimalQuery,
  CreateTipoAnimalMutation, CreateTipoAnimalMutationVariables,
  UpdateTipoAnimalMutation, UpdateTipoAnimalMutationVariables,
  SetCatalogItemAtivoMutation, SetCatalogItemAtivoMutationVariables,
  TipoAnimal,
} from '@patafy/graphql-client'

const TIPOS_QUERY = /* GraphQL */ `query TiposAnimal($ativo: Boolean) { tiposAnimal(ativo: $ativo) { id nome ativo ordem createdAt } }`
const CREATE_TIPO = /* GraphQL */ `mutation CreateTipoAnimal($input: CreateTipoAnimalInput!) { createTipoAnimal(input: $input) { id nome ativo ordem } }`
const UPDATE_TIPO = /* GraphQL */ `mutation UpdateTipoAnimal($id: ID!, $input: UpdateTipoAnimalInput!) { updateTipoAnimal(id: $id, input: $input) { id nome ativo ordem } }`
const SET_ATIVO = /* GraphQL */ `mutation SetCatalogItemAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) { setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo) }`

const schema = z.object({ nome: z.string().min(1, 'Nome é obrigatório') })
type FormData = z.infer<typeof schema>

type TipoRow = Pick<TipoAnimal, 'id' | 'nome' | 'ativo' | 'ordem'>

export function TiposPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['tiposAnimal'],
    queryFn: () => gqlClient.request<TiposAnimalQuery>(TIPOS_QUERY),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tiposAnimal'] })
  const createMutation = useMutation({ mutationFn: (vars: CreateTipoAnimalMutationVariables) => gqlClient.request<CreateTipoAnimalMutation>(CREATE_TIPO, vars), onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: (vars: UpdateTipoAnimalMutationVariables) => gqlClient.request<UpdateTipoAnimalMutation>(UPDATE_TIPO, vars), onSuccess: invalidate })
  const setAtivoMutation = useMutation({ mutationFn: (vars: SetCatalogItemAtivoMutationVariables) => gqlClient.request<SetCatalogItemAtivoMutation>(SET_ATIVO, vars), onSuccess: invalidate })

  const [editando, setEditando] = useState<TipoRow | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { nome: '' } })

  const resetForm = () => { setEditando(null); form.reset(); setMostrarForm(false) }
  const abrirEdicao = (t: TipoRow) => { setEditando(t); form.reset({ nome: t.nome }); setMostrarForm(true) }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (editando) await updateMutation.mutateAsync({ id: editando.id, input: { nome: data.nome.trim() } })
      else await createMutation.mutateAsync({ input: { nome: data.nome.trim() } })
      resetForm()
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar' })
    }
  })

  const columns: Column<TipoRow>[] = [
    { key: 'nome', header: 'Nome', render: (t) => t.nome },
    { key: 'ordem', header: 'Ordem', width: 80, render: (t) => t.ordem ?? '—' },
    { key: 'status', header: 'Status', width: 90, render: (t) => <span style={{ color: t.ativo ? 'green' : '#999' }}>{t.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 160,
      render: (t) => (
        <>
          <button onClick={() => abrirEdicao(t)} style={btnSmall}>Editar</button>
          <button onClick={() => setAtivoMutation.mutate({ tipo: 'tipoAnimal', id: t.id, ativo: !t.ativo })} style={{ ...btnSmall, marginLeft: 6, color: t.ativo ? '#c00' : 'green' }}>
            {t.ativo ? 'Inativar' : 'Ativar'}
          </button>
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Tipos de Animal" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Tipo</button>} />
      {mostrarForm && (
        <FormCard title={editando ? 'Editar Tipo' : 'Novo Tipo de Animal'} onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
      <DataTable columns={columns} data={(data?.tiposAnimal as TipoRow[] | undefined) ?? []} rowKey={(t) => t.id} loading={isLoading} error={error ? String(error) : undefined} rowStyle={(t) => ({ opacity: t.ativo ? 1 : 0.5 })} />
    </>
  )
}
