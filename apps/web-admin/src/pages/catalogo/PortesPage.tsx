import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'
import type {
  PortesQuery, PortesQueryVariables,
  CreatePorteMutation, CreatePorteMutationVariables,
  UpdatePorteMutation, UpdatePorteMutationVariables,
  SetCatalogItemAtivoMutationVariables,
  Porte,
} from '@patafy/graphql-client'

const PORTES_QUERY = /* GraphQL */ `query Portes { portes { id nome ativo ordem } }`
const CREATE_PORTE = /* GraphQL */ `mutation CreatePorte($input: CreatePorteInput!) { createPorte(input: $input) { id nome ativo ordem } }`
const UPDATE_PORTE = /* GraphQL */ `mutation UpdatePorte($id: ID!, $input: UpdatePorteInput!) { updatePorte(id: $id, input: $input) { id nome ativo ordem } }`
const SET_ATIVO = /* GraphQL */ `mutation SetCatalogItemAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) { setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo) }`

type PorteRow = Pick<Porte, 'id' | 'nome' | 'ativo' | 'ordem'>

export function PortesPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['portes'],
    queryFn: () => gqlClient.request<PortesQuery>(PORTES_QUERY),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['portes'] })
  const createMutation = useMutation({ mutationFn: (vars: CreatePorteMutationVariables) => gqlClient.request<CreatePorteMutation>(CREATE_PORTE, vars), onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: (vars: UpdatePorteMutationVariables) => gqlClient.request<UpdatePorteMutation>(UPDATE_PORTE, vars), onSuccess: invalidate })
  const setAtivoMutation = useMutation({ mutationFn: (vars: SetCatalogItemAtivoMutationVariables) => gqlClient.request(SET_ATIVO, vars), onSuccess: invalidate })

  const [editando, setEditando] = useState<PorteRow | null>(null)
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setErro(''); setEditando(null); setMostrarForm(false) }
  const abrirEdicao = (p: PorteRow) => { setEditando(p); setNome(p.nome); setMostrarForm(true) }

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

  const columns: Column<PorteRow>[] = [
    { key: 'nome', header: 'Nome', render: (p) => p.nome },
    { key: 'ordem', header: 'Ordem', width: 80, render: (p) => p.ordem ?? '—' },
    { key: 'status', header: 'Status', width: 90, render: (p) => <span style={{ color: p.ativo ? 'green' : '#999' }}>{p.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 160,
      render: (p) => (
        <>
          <button onClick={() => abrirEdicao(p)} style={btnSmall}>Editar</button>
          <button onClick={() => setAtivoMutation.mutate({ tipo: 'porte', id: p.id, ativo: !p.ativo })} style={{ ...btnSmall, marginLeft: 6, color: p.ativo ? '#c00' : 'green' }}>
            {p.ativo ? 'Inativar' : 'Ativar'}
          </button>
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Portes" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Porte</button>} />
      {mostrarForm && (
        <FormCard title={editando ? 'Editar Porte' : 'Novo Porte'} onSubmit={handleSubmit}>
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
      <DataTable columns={columns} data={(data?.portes as PorteRow[] | undefined) ?? []} rowKey={(p) => p.id} loading={isLoading} error={error ? String(error) : undefined} rowStyle={(p) => ({ opacity: p.ativo ? 1 : 0.5 })} />
    </>
  )
}
