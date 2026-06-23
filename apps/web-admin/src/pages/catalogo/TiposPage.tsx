import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'
import type {
  TiposAnimalQuery, TiposAnimalQueryVariables,
  CreateTipoAnimalMutation, CreateTipoAnimalMutationVariables,
  UpdateTipoAnimalMutation, UpdateTipoAnimalMutationVariables,
  SetCatalogItemAtivoMutation, SetCatalogItemAtivoMutationVariables,
  TipoAnimal,
} from '@patafy/graphql-client'

const TIPOS_QUERY = /* GraphQL */ `
  query TiposAnimal($ativo: Boolean) {
    tiposAnimal(ativo: $ativo) { id nome ativo ordem createdAt }
  }
`
const CREATE_TIPO = /* GraphQL */ `
  mutation CreateTipoAnimal($input: CreateTipoAnimalInput!) {
    createTipoAnimal(input: $input) { id nome ativo ordem }
  }
`
const UPDATE_TIPO = /* GraphQL */ `
  mutation UpdateTipoAnimal($id: ID!, $input: UpdateTipoAnimalInput!) {
    updateTipoAnimal(id: $id, input: $input) { id nome ativo ordem }
  }
`
const SET_ATIVO = /* GraphQL */ `
  mutation SetCatalogItemAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) {
    setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo)
  }
`

type TipoRow = Pick<TipoAnimal, 'id' | 'nome' | 'ativo' | 'ordem'>

export function TiposPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['tiposAnimal'],
    queryFn: () => gqlClient.request<TiposAnimalQuery>(TIPOS_QUERY),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tiposAnimal'] })

  const createMutation = useMutation({
    mutationFn: (vars: CreateTipoAnimalMutationVariables) =>
      gqlClient.request<CreateTipoAnimalMutation>(CREATE_TIPO, vars),
    onSuccess: invalidate,
  })
  const updateMutation = useMutation({
    mutationFn: (vars: UpdateTipoAnimalMutationVariables) =>
      gqlClient.request<UpdateTipoAnimalMutation>(UPDATE_TIPO, vars),
    onSuccess: invalidate,
  })
  const setAtivoMutation = useMutation({
    mutationFn: (vars: SetCatalogItemAtivoMutationVariables) =>
      gqlClient.request<SetCatalogItemAtivoMutation>(SET_ATIVO, vars),
    onSuccess: invalidate,
  })

  const [editando, setEditando] = useState<TipoRow | null>(null)
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setErro(''); setEditando(null); setMostrarForm(false) }
  const abrirEdicao = (t: TipoRow) => { setEditando(t); setNome(t.nome); setMostrarForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErro('')
    try {
      if (editando) await updateMutation.mutateAsync({ id: editando.id, input: { nome: nome.trim() } })
      else await createMutation.mutateAsync({ input: { nome: nome.trim() } })
      resetForm()
    } catch (err: unknown) {
      const msg = (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message
      setErro(msg ?? 'Erro ao salvar')
    }
  }

  const handleToggleAtivo = (t: TipoRow) => setAtivoMutation.mutate({ tipo: 'tipoAnimal', id: t.id, ativo: !t.ativo })

  const columns: Column<TipoRow>[] = [
    { key: 'nome', header: 'Nome', render: (t) => t.nome },
    { key: 'ordem', header: 'Ordem', width: 80, render: (t) => t.ordem ?? '—' },
    { key: 'status', header: 'Status', width: 90, render: (t) => <span style={{ color: t.ativo ? 'green' : '#999' }}>{t.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 160,
      render: (t) => (
        <>
          <button onClick={() => abrirEdicao(t)} style={btnSmall}>Editar</button>
          <button onClick={() => handleToggleAtivo(t)} style={{ ...btnSmall, marginLeft: 6, color: t.ativo ? '#c00' : 'green' }}>
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
        <FormCard title={editando ? 'Editar Tipo' : 'Novo Tipo de Animal'} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} />
            </div>
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
        data={(data?.tiposAnimal as TipoRow[] | undefined) ?? []}
        rowKey={(t) => t.id}
        loading={isLoading}
        error={error ? String(error) : undefined}
        rowStyle={(t) => ({ opacity: t.ativo ? 1 : 0.5 })}
      />
    </>
  )
}
