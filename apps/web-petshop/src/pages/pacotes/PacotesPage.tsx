import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useMyPetShopIdQuery, useListPacotesQuery, useCreatePacoteMutation, useUpdatePacoteMutation, useAddPacoteItemMutation, useRemovePacoteItemMutation, useListServicosQuery } from '@patafy/graphql-client'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle, colors } from '@patafy/ui'
import type { Column } from '@patafy/ui'

type PacoteItem = { id: string; servicoVarianteId: string; quantidadeTotal: number; quantidadeUsada: number; restante: number }
type Pacote = { id: string; nome: string; descricao: string | null; travado: boolean; descontoPercentual: number | null; validade: string | null; ativo: boolean; items: PacoteItem[] }
type Variante = { id: string; porteId: string | null; duracaoMinutos: number; preco: number }
type Servico = { id: string; nome: string; variantes: Variante[] }

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  travado: z.boolean(),
  descontoPercentual: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  validade: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function PacotesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''
  const { data, isLoading, error } = useListPacotesQuery({ petshopId }, { enabled: !!petshopId })
  const { data: servicosData } = useListServicosQuery({ petshopId }, { enabled: !!petshopId })
  const invalidate = () => qc.invalidateQueries({ queryKey: useListPacotesQuery.getKey({ petshopId }) })

  const createMutation = useCreatePacoteMutation({ onSuccess: invalidate })
  const updateMutation = useUpdatePacoteMutation({ onSuccess: invalidate })
  const addItemMutation = useAddPacoteItemMutation({ onSuccess: invalidate })
  const removeItemMutation = useRemovePacoteItemMutation({ onSuccess: invalidate })

  const [editando, setEditando] = useState<Pacote | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [novoItem, setNovoItem] = useState<{ servicoVarianteId: string; quantidade: number }>({ servicoVarianteId: '', quantidade: 1 })
  const [expandindoItem, setExpandindoItem] = useState<string | null>(null)

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { nome: '', descricao: '', travado: true, descontoPercentual: '', validade: '' } })
  const resetForm = () => { form.reset(); setEditando(null); setMostrarForm(false) }
  const abrirEdicao = (p: Pacote) => {
    setEditando(p)
    form.reset({ nome: p.nome, descricao: p.descricao ?? '', travado: p.travado, descontoPercentual: p.descontoPercentual ?? '', validade: p.validade ?? '' })
    setMostrarForm(true)
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (editando) {
        await updateMutation.mutateAsync({ id: editando.id, input: { nome: data.nome, descricao: data.descricao || undefined, descontoPercentual: data.descontoPercentual !== '' ? Number(data.descontoPercentual) : undefined, validade: data.validade || undefined } })
      } else {
        await createMutation.mutateAsync({ petshopId, input: { nome: data.nome, descricao: data.descricao || undefined, travado: data.travado, descontoPercentual: data.descontoPercentual !== '' ? Number(data.descontoPercentual) : undefined, validade: data.validade || undefined } })
      }
      resetForm()
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar' })
    }
  })

  const handleAddItem = async (pacoteId: string) => {
    if (!novoItem.servicoVarianteId) return
    await addItemMutation.mutateAsync({ pacoteId, servicoVarianteId: novoItem.servicoVarianteId, quantidadeTotal: novoItem.quantidade })
    setNovoItem({ servicoVarianteId: '', quantidade: 1 })
    setExpandindoItem(null)
  }

  const servicos = (servicosData?.listServicos as Servico[] | undefined) ?? []
  const allVariantes = servicos.flatMap((s) => s.variantes.map((v) => ({ ...v, servicoNome: s.nome })))
  const e = form.formState.errors

  const cols: Column<Pacote>[] = [
    { key: 'nome', header: 'Nome', render: (p) => <>{p.nome}<span style={{ marginLeft: 8, fontSize: 11, color: '#666', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{p.travado ? 'Travado' : 'Personalizável'}</span></> },
    { key: 'itens', header: 'Itens', width: 80, render: (p) => p.items.length },
    { key: 'desconto', header: 'Desconto', width: 100, render: (p) => p.descontoPercentual ? `${p.descontoPercentual}%` : '—' },
    { key: 'validade', header: 'Validade', width: 110, render: (p) => p.validade ?? '—' },
    { key: 'status', header: 'Status', width: 80, render: (p) => <span style={{ color: p.ativo ? 'green' : '#999' }}>{p.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 200,
      render: (p) => (
        <>
          <button onClick={() => setExpandido(expandido === p.id ? null : p.id)} style={btnSmall}>Itens</button>
          <button onClick={() => abrirEdicao(p)} style={{ ...btnSmall, marginLeft: 6 }}>Editar</button>
          {p.ativo && <button onClick={() => navigate('/pacotes/vender')} style={{ ...btnSmall, marginLeft: 6, color: colors.primary }}>Vender</button>}
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Pacotes" action={
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/pacotes/vender')} style={btnSecondary}>Vender Pacote</button>
          <button onClick={() => { resetForm(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Pacote</button>
        </div>
      } />
      {mostrarForm && (
        <FormCard title={editando ? 'Editar Pacote' : 'Novo Pacote'} onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Nome *</label>
              <input {...form.register('nome')} style={{ ...inputStyle, width: '100%' }} />
              {e.nome && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.nome.message}</p>}
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Descrição</label>
              <input {...form.register('descricao')} style={{ ...inputStyle, width: '100%' }} />
            </div>
            {!editando && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" {...form.register('travado')} />
                  Pacote travado (composição fixa)
                </label>
              </div>
            )}
            <div>
              <label style={labelStyle}>Desconto (%)</label>
              <input type="number" min={0} max={100} step="0.1" {...form.register('descontoPercentual')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Validade</label>
              <input type="date" {...form.register('validade')} style={inputStyle} />
            </div>
          </div>
          {e.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{e.root.message}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Salvar</button>
            <button type="button" onClick={resetForm} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}
      <DataTable
        columns={cols}
        data={(data?.listPacotes as Pacote[] | undefined) ?? []}
        rowKey={(p) => p.id}
        loading={isLoading || !petshopId}
        error={error ? String(error) : undefined}
        emptyText="Nenhum pacote cadastrado."
        expandedRow={(p) => expandido === p.id ? (
          <div style={{ padding: '12px 16px', background: '#f9fafb', borderTop: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>Itens do pacote</strong>
              {p.travado && <button onClick={() => setExpandindoItem(expandindoItem === p.id ? null : p.id)} style={{ ...btnSmall, fontSize: 12 }}>+ Item</button>}
            </div>
            {p.items.length === 0 && <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Nenhum item. Adicione serviços a este pacote.</p>}
            {p.items.map((item) => {
              const v = allVariantes.find((v) => v.id === item.servicoVarianteId)
              return (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: `1px solid ${colors.border}`, fontSize: 13 }}>
                  <span>{v?.servicoNome ?? item.servicoVarianteId}</span>
                  <span style={{ color: '#555' }}>× {item.quantidadeTotal}</span>
                  <button onClick={() => removeItemMutation.mutateAsync({ pacoteItemId: item.id })} style={{ ...btnSmall, fontSize: 11, color: '#c00' }}>Remover</button>
                </div>
              )
            })}
            {expandindoItem === p.id && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: 12 }}>Variante de serviço</label>
                  <select value={novoItem.servicoVarianteId} onChange={(e) => setNovoItem((n) => ({ ...n, servicoVarianteId: e.target.value }))} style={{ ...inputStyle, fontSize: 13 }}>
                    <option value="">Selecione...</option>
                    {allVariantes.map((v) => <option key={v.id} value={v.id}>{v.servicoNome} — R$ {Number(v.preco).toFixed(2)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 12 }}>Qtd</label>
                  <input type="number" min={1} value={novoItem.quantidade} onChange={(e) => setNovoItem((n) => ({ ...n, quantidade: Number(e.target.value) }))} style={{ ...inputStyle, width: 70, fontSize: 13 }} />
                </div>
                <button onClick={() => handleAddItem(p.id)} style={{ ...btnSmall, fontSize: 12 }}>Adicionar</button>
                <button onClick={() => setExpandindoItem(null)} style={{ ...btnSmall, fontSize: 12 }}>Cancelar</button>
              </div>
            )}
          </div>
        ) : null}
      />
    </>
  )
}
