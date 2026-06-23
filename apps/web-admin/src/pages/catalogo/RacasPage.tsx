import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'
import type {
  RacasQuery, RacasQueryVariables,
  TiposAnimalQuery,
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

type RacaRow = Pick<Raca, 'id' | 'nome' | 'ativo' | 'ordem' | 'tipoAnimalId'> & { tipoAnimal: { id: string; nome: string } }

export function RacasPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['racas'],
    queryFn: () => gqlClient.request<RacasQuery & TiposAnimalQuery>(RACAS_QUERY),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['racas'] })
  const createMutation = useMutation({ mutationFn: (vars: CreateRacaMutationVariables) => gqlClient.request<CreateRacaMutation>(CREATE_RACA, vars), onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: (vars: UpdateRacaMutationVariables) => gqlClient.request<UpdateRacaMutation>(UPDATE_RACA, vars), onSuccess: invalidate })
  const setAtivoMutation = useMutation({ mutationFn: (vars: SetCatalogItemAtivoMutationVariables) => gqlClient.request(SET_ATIVO, vars), onSuccess: invalidate })

  const [editando, setEditando] = useState<RacaRow | null>(null)
  const [nome, setNome] = useState('')
  const [tipoAnimalId, setTipoAnimalId] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const resetForm = () => { setNome(''); setTipoAnimalId(''); setErro(''); setEditando(null); setMostrarForm(false) }
  const abrirEdicao = (r: RacaRow) => { setEditando(r); setNome(r.nome); setTipoAnimalId(r.tipoAnimalId); setMostrarForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErro('')
    if (!tipoAnimalId && !editando) { setErro('Selecione um tipo de animal'); return }
    try {
      if (editando) await updateMutation.mutateAsync({ id: editando.id, input: { nome: nome.trim() } })
      else await createMutation.mutateAsync({ input: { tipoAnimalId, nome: nome.trim() } })
      resetForm()
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar')
    }
  }

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
        <FormCard title={editando ? 'Editar Raça' : 'Nova Raça'} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!editando && (
              <div>
                <label style={labelStyle}>Tipo de Animal *</label>
                <select value={tipoAnimalId} onChange={(e) => setTipoAnimalId(e.target.value)} required style={inputStyle}>
                  <option value="">Selecione...</option>
                  {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
            )}
            <div><label style={labelStyle}>Nome *</label><input value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} /></div>
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
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={racasFiltradas} rowKey={(r) => r.id} loading={isLoading} error={error ? String(error) : undefined} rowStyle={(r) => ({ opacity: r.ativo ? 1 : 0.5 })} />
    </>
  )
}
