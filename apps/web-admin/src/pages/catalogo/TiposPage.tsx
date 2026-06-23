import { useState } from 'react'
import { useQuery, useMutation } from 'urql'
import { Provider } from 'urql'
import { graphqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

const TIPOS_QUERY = /* GraphQL */ `
  query TiposAnimal {
    tiposAnimal { id nome ativo ordem createdAt }
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
  mutation SetAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) {
    setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo)
  }
`

type TipoAnimal = { id: string; nome: string; ativo: boolean; ordem: number | null }

function TiposPageInner() {
  const [{ data, fetching, error }, reexecute] = useQuery({ query: TIPOS_QUERY })
  const [, createTipo] = useMutation(CREATE_TIPO)
  const [, updateTipo] = useMutation(UPDATE_TIPO)
  const [, setAtivo] = useMutation(SET_ATIVO)

  const [editando, setEditando] = useState<TipoAnimal | null>(null)
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setErro(''); setEditando(null); setMostrarForm(false) }

  const abrirEdicao = (t: TipoAnimal) => { setEditando(t); setNome(t.nome); setMostrarForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    const input = { nome: nome.trim() }
    const result = editando
      ? await updateTipo({ id: editando.id, input })
      : await createTipo({ input })
    if (result.error) { setErro(result.error.graphQLErrors[0]?.message ?? 'Erro ao salvar'); return }
    reexecute({ requestPolicy: 'network-only' })
    resetForm()
  }

  const handleToggleAtivo = async (t: TipoAnimal) => {
    await setAtivo({ tipo: 'tipoAnimal', id: t.id, ativo: !t.ativo })
    reexecute({ requestPolicy: 'network-only' })
  }

  const columns: Column<TipoAnimal>[] = [
    { key: 'nome', header: 'Nome', render: (t) => t.nome },
    { key: 'ordem', header: 'Ordem', width: 80, render: (t) => t.ordem ?? '—' },
    {
      key: 'status', header: 'Status', width: 90,
      render: (t) => <span style={{ color: t.ativo ? 'green' : '#999' }}>{t.ativo ? 'Ativo' : 'Inativo'}</span>,
    },
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
      <PageHeader
        title="Tipos de Animal"
        action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Tipo</button>}
      />

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
        data={(data?.tiposAnimal as TipoAnimal[] | undefined) ?? []}
        rowKey={(t) => t.id}
        loading={fetching}
        error={error?.message}
        rowStyle={(t) => ({ opacity: t.ativo ? 1 : 0.5 })}
      />
    </>
  )
}

export function TiposPage() {
  return <Provider value={graphqlClient}><TiposPageInner /></Provider>
}
