import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'
import type {
  PelagensQuery, PelagensQueryVariables,
  CreatePelagemMutation, CreatePelagemMutationVariables,
  UpdatePelagemMutation, UpdatePelagemMutationVariables,
  SetCatalogItemAtivoMutationVariables,
  Pelagem,
} from '@patafy/graphql-client'

const PELAGENS_QUERY = /* GraphQL */ `query Pelagens { pelagens { id nome ativo ordem } }`
const CREATE_PELAGEM = /* GraphQL */ `mutation CreatePelagem($input: CreatePelagemInput!) { createPelagem(input: $input) { id nome ativo ordem } }`
const UPDATE_PELAGEM = /* GraphQL */ `mutation UpdatePelagem($id: ID!, $input: UpdatePelagemInput!) { updatePelagem(id: $id, input: $input) { id nome ativo ordem } }`
const SET_ATIVO = /* GraphQL */ `mutation SetCatalogItemAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) { setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo) }`

type PelagemRow = Pick<Pelagem, 'id' | 'nome' | 'ativo' | 'ordem'>

export function PelagensPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['pelagens'],
    queryFn: () => gqlClient.request<PelagensQuery>(PELAGENS_QUERY),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['pelagens'] })
  const createMutation = useMutation({ mutationFn: (vars: CreatePelagemMutationVariables) => gqlClient.request<CreatePelagemMutation>(CREATE_PELAGEM, vars), onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: (vars: UpdatePelagemMutationVariables) => gqlClient.request<UpdatePelagemMutation>(UPDATE_PELAGEM, vars), onSuccess: invalidate })
  const setAtivoMutation = useMutation({ mutationFn: (vars: SetCatalogItemAtivoMutationVariables) => gqlClient.request(SET_ATIVO, vars), onSuccess: invalidate })

  const [editando, setEditando] = useState<PelagemRow | null>(null)
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setErro(''); setEditando(null); setMostrarForm(false) }
  const abrirEdicao = (p: PelagemRow) => { setEditando(p); setNome(p.nome); setMostrarForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErro('')
    try {
      if (editando) await updateMutation.mutateAsync({ id: editando.id, input: { nome: nome.trim() } })
      else await createMutation.mutateAsync({ input: { nome: nome.trim() } })
      resetForm()
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar')
    }
  }

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
        <FormCard title={editando ? 'Editar Pelagem' : 'Nova Pelagem'} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div><label style={labelStyle}>Nome *</label><input value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} /></div>
          </div>
          {erro && <p style={{ color: 'red', margin: '8px 0 0' }}>{erro}</p>}
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
