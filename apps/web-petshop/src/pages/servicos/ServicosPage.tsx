import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  useMyPetShopIdQuery, useListCategoriasQuery, useListServicosQuery,
  useCreateServicoMutation, useUpdateServicoMutation, useDeactivateServicoMutation,
  useCreateServicoVarianteMutation, useUpdateServicoVarianteMutation,
  usePortesQuery, useRacasQuery, useTiposAnimalQuery,
} from '@patafy/graphql-client'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle, colors } from '@patafy/ui'
import type { Column } from '@patafy/ui'

type Variante = { id: string; servicoId: string; porteId: string | null; racaId: string | null; pelagemId: string | null; duracaoMinutos: number; preco: number; ativo: boolean }
type Servico = { id: string; petshopId: string; categoriaId: string | null; nome: string; descricao: string | null; ativo: boolean; variantes: Variante[] }

const servicoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  categoriaId: z.string().optional(),
})
const varianteSchema = z.object({
  porteId: z.string().optional(),
  racaId: z.string().optional(),
  pelagemId: z.string().optional(),
  duracaoMinutos: z.coerce.number().int().min(1, 'Duração obrigatória'),
  preco: z.coerce.number().min(0, 'Preço obrigatório'),
})
type ServicoForm = z.infer<typeof servicoSchema>
type VarianteForm = z.infer<typeof varianteSchema>

export function ServicosPage() {
  const qc = useQueryClient()
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''
  const { data: catData } = useListCategoriasQuery({ petshopId }, { enabled: !!petshopId })
  const { data, isLoading, error } = useListServicosQuery({ petshopId }, { enabled: !!petshopId })
  const { data: portesData } = usePortesQuery({ ativo: true })
  const { data: tiposData } = useTiposAnimalQuery({ ativo: true })

  const [tipoSelecionado, setTipoSelecionado] = useState('')
  const { data: racasData } = useRacasQuery({ tipoAnimalId: tipoSelecionado, ativo: true }, { enabled: !!tipoSelecionado })

  const invalidate = () => qc.invalidateQueries({ queryKey: useListServicosQuery.getKey({ petshopId }) })

  const createMutation = useCreateServicoMutation({ onSuccess: invalidate })
  const updateMutation = useUpdateServicoMutation({ onSuccess: invalidate })
  const deactivateMutation = useDeactivateServicoMutation({ onSuccess: invalidate })
  const createVarianteMutation = useCreateServicoVarianteMutation({ onSuccess: invalidate })
  const updateVarianteMutation = useUpdateServicoVarianteMutation({ onSuccess: invalidate })

  const [editando, setEditando] = useState<Servico | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [mostrarVarianteForm, setMostrarVarianteForm] = useState<string | null>(null)

  const servicoForm = useForm<ServicoForm>({ resolver: zodResolver(servicoSchema), defaultValues: { nome: '', descricao: '', categoriaId: '' } })
  const varianteForm = useForm<VarianteForm>({ resolver: zodResolver(varianteSchema), defaultValues: { porteId: '', racaId: '', pelagemId: '', duracaoMinutos: 30, preco: 0 } })

  const resetServico = () => { servicoForm.reset(); setEditando(null); setMostrarForm(false) }
  const abrirEdicao = (s: Servico) => { setEditando(s); servicoForm.reset({ nome: s.nome, descricao: s.descricao ?? '', categoriaId: s.categoriaId ?? '' }); setMostrarForm(true) }

  const onSubmitServico = servicoForm.handleSubmit(async (data) => {
    try {
      if (editando) {
        await updateMutation.mutateAsync({ id: editando.id, input: { nome: data.nome, descricao: data.descricao || undefined, categoriaId: data.categoriaId || undefined } })
      } else {
        await createMutation.mutateAsync({ petshopId, input: { nome: data.nome, descricao: data.descricao || undefined, categoriaId: data.categoriaId || undefined } })
      }
      resetServico()
    } catch (err: unknown) {
      servicoForm.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar' })
    }
  })

  const onSubmitVariante = varianteForm.handleSubmit(async (data) => {
    if (!mostrarVarianteForm) return
    try {
      await createVarianteMutation.mutateAsync({
        input: { servicoId: mostrarVarianteForm, porteId: data.porteId || undefined, racaId: data.racaId || undefined, pelagemId: data.pelagemId || undefined, duracaoMinutos: Number(data.duracaoMinutos), preco: Number(data.preco) },
      })
      varianteForm.reset()
      setMostrarVarianteForm(null)
    } catch (err: unknown) {
      varianteForm.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar variante' })
    }
  })

  const categorias = catData?.listCategorias ?? []
  const servicos = (data?.listServicos as Servico[] | undefined) ?? []
  const portes = portesData?.portes ?? []
  const racas = racasData?.racas ?? []
  const tipos = tiposData?.tiposAnimal ?? []

  const es = servicoForm.formState.errors
  const ev = varianteForm.formState.errors

  const cols: Column<Servico>[] = [
    { key: 'nome', header: 'Nome', render: (s) => <>{s.nome}{s.categoriaId && <span style={{ marginLeft: 8, fontSize: 11, color: '#666', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{categorias.find((c) => c.id === s.categoriaId)?.nome}</span>}</> },
    { key: 'variantes', header: 'Variantes', width: 90, render: (s) => <span style={{ color: colors.primary }}>{s.variantes.length}</span> },
    { key: 'status', header: 'Status', width: 90, render: (s) => <span style={{ color: s.ativo ? 'green' : '#999' }}>{s.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 200,
      render: (s) => (
        <>
          <button onClick={() => setExpandido(expandido === s.id ? null : s.id)} style={btnSmall}>Variantes</button>
          <button onClick={() => abrirEdicao(s)} style={{ ...btnSmall, marginLeft: 6 }}>Editar</button>
          {s.ativo && <button onClick={() => deactivateMutation.mutateAsync({ id: s.id })} style={{ ...btnSmall, marginLeft: 6, color: '#c00' }}>Desativar</button>}
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Serviços" action={<button onClick={() => { resetServico(); setMostrarForm(true) }} style={btnPrimary}>+ Novo Serviço</button>} />
      {mostrarForm && (
        <FormCard title={editando ? 'Editar Serviço' : 'Novo Serviço'} onSubmit={onSubmitServico}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Nome *</label>
              <input {...servicoForm.register('nome')} style={{ ...inputStyle, width: '100%' }} />
              {es.nome && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{es.nome.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select {...servicoForm.register('categoriaId')} style={inputStyle}>
                <option value="">Sem categoria</option>
                {categorias.filter((c) => c.ativo).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Descrição</label>
              <input {...servicoForm.register('descricao')} style={{ ...inputStyle, width: '100%' }} />
            </div>
          </div>
          {es.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{es.root.message}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Salvar</button>
            <button type="button" onClick={resetServico} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}
      <DataTable
        columns={cols}
        data={servicos}
        rowKey={(s) => s.id}
        loading={isLoading || !petshopId}
        error={error ? String(error) : undefined}
        emptyText="Nenhum serviço cadastrado."
        expandedRow={(s) => expandido === s.id ? (
          <div style={{ padding: '12px 16px', background: '#f9fafb', borderTop: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>Variantes de {s.nome}</strong>
              <button onClick={() => { varianteForm.reset(); setMostrarVarianteForm(s.id) }} style={{ ...btnSmall, fontSize: 12 }}>+ Variante</button>
            </div>
            {s.variantes.length === 0 && <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Nenhuma variante. Adicione pelo menos uma para que o serviço apareça nos agendamentos.</p>}
            {s.variantes.map((v) => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: `1px solid ${colors.border}`, fontSize: 13 }}>
                <span>{[portes.find((p) => p.id === v.porteId)?.nome, racas.find((r) => r.id === v.racaId)?.nome].filter(Boolean).join(' · ') || 'Qualquer porte/raça'}</span>
                <span style={{ color: '#555' }}>{v.duracaoMinutos} min · R$ {Number(v.preco).toFixed(2)}</span>
                <button onClick={() => updateVarianteMutation.mutateAsync({ id: v.id, input: { ativo: !v.ativo } })} style={{ ...btnSmall, fontSize: 11, color: v.ativo ? '#c00' : 'green' }}>{v.ativo ? 'Desativar' : 'Ativar'}</button>
              </div>
            ))}
            {mostrarVarianteForm === s.id && (
              <form onSubmit={onSubmitVariante} style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 6, border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto auto', gap: 8, alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Porte</label>
                    <select {...varianteForm.register('porteId')} style={{ ...inputStyle, fontSize: 13 }}>
                      <option value="">Qualquer</option>
                      {portes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Tipo/Raça</label>
                    <select value={tipoSelecionado} onChange={(e) => setTipoSelecionado(e.target.value)} style={{ ...inputStyle, fontSize: 13, marginBottom: 4 }}>
                      <option value="">Tipo...</option>
                      {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                    <select {...varianteForm.register('racaId')} style={{ ...inputStyle, fontSize: 13 }} disabled={!tipoSelecionado}>
                      <option value="">Qualquer</option>
                      {racas.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Duração (min) *</label>
                    <input type="number" min={1} {...varianteForm.register('duracaoMinutos')} style={{ ...inputStyle, fontSize: 13 }} />
                    {ev.duracaoMinutos && <p style={{ color: 'red', fontSize: 11 }}>{ev.duracaoMinutos.message}</p>}
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Preço *</label>
                    <input type="number" min={0} step="0.01" {...varianteForm.register('preco')} style={{ ...inputStyle, fontSize: 13 }} />
                    {ev.preco && <p style={{ color: 'red', fontSize: 11 }}>{ev.preco.message}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="submit" style={{ ...btnSmall, fontSize: 12 }}>Salvar</button>
                    <button type="button" onClick={() => setMostrarVarianteForm(null)} style={{ ...btnSmall, fontSize: 12 }}>✕</button>
                  </div>
                </div>
                {ev.root && <p style={{ color: 'red', fontSize: 12, margin: '4px 0 0' }}>{ev.root.message}</p>}
              </form>
            )}
          </div>
        ) : null}
      />
    </>
  )
}
