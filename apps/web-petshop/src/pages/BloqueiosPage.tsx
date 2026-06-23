import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

const MY_PETSHOP_ID = /* GraphQL */ `
  query MyPetShopId { myPetShop { id } }
`

const LIST_BLOQUEIOS = /* GraphQL */ `
  query ListBloqueios($petshopId: ID!) {
    listBloqueios(petshopId: $petshopId) { id petshopId banhistaId dataInicio dataFim motivo createdAt }
  }
`

const LIST_STAFF = /* GraphQL */ `
  query ListStaffBanhistas($petshopId: ID!) {
    listStaff(petshopId: $petshopId) { id nome roles ativo }
  }
`

const CREATE_BLOQUEIO = /* GraphQL */ `
  mutation CreateBloqueio($input: CreateBloqueioInput!) {
    createBloqueio(input: $input) { id petshopId banhistaId dataInicio dataFim motivo createdAt }
  }
`

const DELETE_BLOQUEIO = /* GraphQL */ `
  mutation DeleteBloqueio($id: ID!) { deleteBloqueio(id: $id) }
`

type Bloqueio = { id: string; banhistaId: string | null; dataInicio: string; dataFim: string; motivo: string | null; createdAt: string }
type StaffMember = { id: string; nome: string; roles: string[]; ativo: boolean }

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function BloqueiosPage() {
  const qc = useQueryClient()

  const { data: psData } = useQuery({
    queryKey: ['myPetshopId'],
    queryFn: () => gqlClient.request<{ myPetShop: { id: string } | null }>(MY_PETSHOP_ID),
  })
  const petshopId = psData?.myPetShop?.id ?? ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['bloqueios', petshopId],
    queryFn: () => gqlClient.request<{ listBloqueios: Bloqueio[] }>(LIST_BLOQUEIOS, { petshopId }),
    enabled: !!petshopId,
  })
  const { data: staffData } = useQuery({
    queryKey: ['staffBanhistas', petshopId],
    queryFn: () => gqlClient.request<{ listStaff: StaffMember[] }>(LIST_STAFF, { petshopId }),
    enabled: !!petshopId,
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['bloqueios', petshopId] })

  const createBloqueioMutation = useMutation({
    mutationFn: (vars: { input: Record<string, unknown> }) => gqlClient.request(CREATE_BLOQUEIO, vars),
    onSuccess: invalidate,
  })
  const deleteBloqueioMutation = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_BLOQUEIO, { id }),
    onSuccess: invalidate,
  })

  const [mostrarForm, setMostrarForm] = useState(false)
  const [banhistaId, setBanhistaId] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')

  const banhistas = (staffData?.listStaff ?? []).filter((m) => m.ativo && m.roles.includes('banhista'))

  const resetForm = () => { setMostrarForm(false); setBanhistaId(''); setDataInicio(''); setDataFim(''); setMotivo(''); setErro('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErro('')
    try {
      await createBloqueioMutation.mutateAsync({
        input: {
          petshopId,
          banhistaId: banhistaId || undefined,
          dataInicio: new Date(dataInicio).toISOString(),
          dataFim: new Date(dataFim).toISOString(),
          motivo: motivo.trim() || undefined,
        },
      })
      resetForm()
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao criar bloqueio')
    }
  }

  const handleDelete = async (b: Bloqueio) => {
    if (!confirm('Remover este bloqueio?')) return
    await deleteBloqueioMutation.mutateAsync(b.id)
  }

  const banhistaNome = (id: string | null) => {
    if (!id) return 'Loja inteira'
    return banhistas.find((b) => b.id === id)?.nome ?? id
  }

  const columns: Column<Bloqueio>[] = [
    { key: 'banhista', header: 'Banhista / Escopo', render: (b) => banhistaNome(b.banhistaId) },
    { key: 'inicio', header: 'Início', width: 150, render: (b) => fmt(b.dataInicio) },
    { key: 'fim', header: 'Fim', width: 150, render: (b) => fmt(b.dataFim) },
    { key: 'motivo', header: 'Motivo', render: (b) => b.motivo ?? '—' },
    {
      key: 'acoes', header: 'Ações', width: 100,
      render: (b) => <button onClick={() => handleDelete(b)} style={{ ...btnSmall, color: '#c00' }}>Remover</button>,
    },
  ]

  return (
    <>
      <PageHeader title="Bloqueios de Agenda" action={<button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Bloqueio</button>} />

      {mostrarForm && (
        <FormCard title="Novo Bloqueio" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Banhista (deixe em branco para bloquear a loja inteira)</label>
              <select value={banhistaId} onChange={(e) => setBanhistaId(e.target.value)} style={inputStyle}>
                <option value="">Loja inteira</option>
                {banhistas.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Data/hora início *</label><input type="datetime-local" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required style={inputStyle} /></div>
            <div><label style={labelStyle}>Data/hora fim *</label><input type="datetime-local" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required style={inputStyle} /></div>
            <div style={{ width: '100%' }}><label style={labelStyle}>Motivo</label><input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="ex: Feriado, Férias..." style={{ ...inputStyle, width: '100%' }} /></div>
          </div>
          {erro && <p style={{ color: 'red', margin: '8px 0 0' }}>{erro}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Criar Bloqueio</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}

      <DataTable
        columns={columns}
        data={data?.listBloqueios ?? []}
        rowKey={(b) => b.id}
        loading={isLoading || !petshopId}
        error={error ? String(error) : undefined}
        emptyText="Nenhum bloqueio de agenda cadastrado."
      />
    </>
  )
}
