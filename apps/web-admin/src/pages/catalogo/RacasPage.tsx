import { useState } from 'react'
import { useQuery, useMutation, Provider } from 'urql'
import { graphqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

const RACAS_QUERY = /* GraphQL */ `
  query Racas {
    racas { id nome ativo ordem tipoAnimalId tipoAnimal { id nome } }
    tiposAnimal(ativo: true) { id nome }
  }
`
const CREATE_RACA = /* GraphQL */ `
  mutation CreateRaca($input: CreateRacaInput!) {
    createRaca(input: $input) { id nome ativo ordem tipoAnimalId tipoAnimal { id nome } }
  }
`
const UPDATE_RACA = /* GraphQL */ `
  mutation UpdateRaca($id: ID!, $input: UpdateRacaInput!) {
    updateRaca(id: $id, input: $input) { id nome ativo ordem tipoAnimalId tipoAnimal { id nome } }
  }
`
const SET_ATIVO = /* GraphQL */ `
  mutation SetAtivo($tipo: String!, $id: ID!, $ativo: Boolean!) { setCatalogItemAtivo(tipo: $tipo, id: $id, ativo: $ativo) }
`

type Raca = { id: string; nome: string; ativo: boolean; ordem: number | null; tipoAnimalId: string; tipoAnimal: { id: string; nome: string } }
type TipoAnimal = { id: string; nome: string }

function RacasPageInner() {
  const [{ data, fetching, error }, reexecute] = useQuery({ query: RACAS_QUERY })
  const [, createRaca] = useMutation(CREATE_RACA)
  const [, updateRaca] = useMutation(UPDATE_RACA)
  const [, setAtivo] = useMutation(SET_ATIVO)

  const [editando, setEditando] = useState<Raca | null>(null)
  const [nome, setNome] = useState('')
  const [tipoAnimalId, setTipoAnimalId] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setTipoAnimalId(''); setErro(''); setEditando(null); setMostrarForm(false) }
  const abrirEdicao = (r: Raca) => { setEditando(r); setNome(r.nome); setTipoAnimalId(r.tipoAnimalId); setMostrarForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!tipoAnimalId && !editando) { setErro('Selecione um tipo de animal'); return }
    const input = editando ? { nome: nome.trim() } : { tipoAnimalId, nome: nome.trim() }
    const result = editando
      ? await updateRaca({ id: editando.id, input })
      : await createRaca({ input })
    if (result.error) { setErro(result.error.graphQLErrors[0]?.message ?? 'Erro ao salvar'); return }
    reexecute({ requestPolicy: 'network-only' })
    resetForm()
  }

  const handleToggleAtivo = async (r: Raca) => {
    await setAtivo({ tipo: 'raca', id: r.id, ativo: !r.ativo })
    reexecute({ requestPolicy: 'network-only' })
  }

  const racasFiltradas = (data?.racas as Raca[] | undefined)?.filter((r) => !filtroTipo || r.tipoAnimalId === filtroTipo) ?? []

  const columns: Column<Raca>[] = [
    { key: 'nome', header: 'Nome', render: (r) => r.nome },
    { key: 'tipo', header: 'Tipo de Animal', render: (r) => r.tipoAnimal.nome },
    { key: 'ordem', header: 'Ordem', width: 80, render: (r) => r.ordem ?? '—' },
    { key: 'status', header: 'Status', width: 90, render: (r) => <span style={{ color: r.ativo ? 'green' : '#999' }}>{r.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 160,
      render: (r) => (
        <>
          <button onClick={() => abrirEdicao(r)} style={btnSmall}>Editar</button>
          <button onClick={() => handleToggleAtivo(r)} style={{ ...btnSmall, marginLeft: 6, color: r.ativo ? '#c00' : 'green' }}>
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
        <FormCard title={editando ? 'Editar Raça' : 'Nova Raça'} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!editando && (
              <div>
                <label style={labelStyle}>Tipo de Animal *</label>
                <select value={tipoAnimalId} onChange={(e) => setTipoAnimalId(e.target.value)} required style={inputStyle}>
                  <option value="">Selecione...</option>
                  {(data?.tiposAnimal as TipoAnimal[] | undefined)?.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            )}
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

      <div style={{ marginBottom: 16 }}>
        <label style={{ ...labelStyle, display: 'inline' }}>Filtrar por tipo: </label>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ ...inputStyle, width: 200, display: 'inline-block', marginLeft: 8 }}>
          <option value="">Todos</option>
          {(data?.tiposAnimal as TipoAnimal[] | undefined)?.map((t) => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={racasFiltradas}
        rowKey={(r) => r.id}
        loading={fetching}
        error={error?.message}
        rowStyle={(r) => ({ opacity: r.ativo ? 1 : 0.5 })}
      />
    </>
  )
}

export function RacasPage() {
  return <Provider value={graphqlClient}><RacasPageInner /></Provider>
}
