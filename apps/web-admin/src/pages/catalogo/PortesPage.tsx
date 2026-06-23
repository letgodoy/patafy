import { useState } from 'react'
import { useQuery, useMutation, Provider } from 'urql'
import { graphqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

const PORTES_QUERY = /* GraphQL */ `
  query Portes { portes { id nome ativo ordem } }
`
const CREATE_PORTE = /* GraphQL */ `
  mutation CreatePorte($input: CreatePorteInput!) { createPorte(input: $input) { id nome ativo ordem } }
`
const UPDATE_PORTE = /* GraphQL */ `
  mutation UpdatePorte($id: ID!, $input: UpdatePorteInput!) { updatePorte(id: $id, input: $input) { id nome ativo ordem } }
`
const SET_ATIVO = /* GraphQL */ `
  mutation SetAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) { setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo) }
`

type Porte = { id: string; nome: string; ativo: boolean; ordem: number | null }

function PortesPageInner() {
  const [{ data, fetching, error }, reexecute] = useQuery({ query: PORTES_QUERY })
  const [, createPorte] = useMutation(CREATE_PORTE)
  const [, updatePorte] = useMutation(UPDATE_PORTE)
  const [, setAtivo] = useMutation(SET_ATIVO)

  const [editando, setEditando] = useState<Porte | null>(null)
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setErro(''); setEditando(null); setMostrarForm(false) }
  const abrirEdicao = (p: Porte) => { setEditando(p); setNome(p.nome); setMostrarForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    const result = editando
      ? await updatePorte({ id: editando.id, input: { nome: nome.trim() } })
      : await createPorte({ input: { nome: nome.trim() } })
    if (result.error) { setErro(result.error.graphQLErrors[0]?.message ?? 'Erro ao salvar'); return }
    reexecute({ requestPolicy: 'network-only' })
    resetForm()
  }

  const handleToggleAtivo = async (p: Porte) => {
    await setAtivo({ tipo: 'porte', id: p.id, ativo: !p.ativo })
    reexecute({ requestPolicy: 'network-only' })
  }

  const columns: Column<Porte>[] = [
    { key: 'nome', header: 'Nome', render: (p) => p.nome },
    { key: 'ordem', header: 'Ordem', width: 80, render: (p) => p.ordem ?? '—' },
    { key: 'status', header: 'Status', width: 90, render: (p) => <span style={{ color: p.ativo ? 'green' : '#999' }}>{p.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 160,
      render: (p) => (
        <>
          <button onClick={() => abrirEdicao(p)} style={btnSmall}>Editar</button>
          <button onClick={() => handleToggleAtivo(p)} style={{ ...btnSmall, marginLeft: 6, color: p.ativo ? '#c00' : 'green' }}>
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
        data={(data?.portes as Porte[] | undefined) ?? []}
        rowKey={(p) => p.id}
        loading={fetching}
        error={error?.message}
        rowStyle={(p) => ({ opacity: p.ativo ? 1 : 0.5 })}
      />
    </>
  )
}

export function PortesPage() {
  return <Provider value={graphqlClient}><PortesPageInner /></Provider>
}
