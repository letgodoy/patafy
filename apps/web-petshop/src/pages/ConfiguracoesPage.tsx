import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../lib/graphql-client.js'
import { PageHeader, FormCard, btnPrimary, inputStyle, labelStyle } from '@patafy/ui'
import { useState } from 'react'

const MY_PETSHOP = /* GraphQL */ `
  query MyPetShop {
    myPetShop {
      id nomeExibicao razaoSocial cnpj endereco cidade estado telefone email
      configJson {
        slug nome logo corPrincipal aceitaPetsAgressivos
        intervaloBanhoMinutos prazoCancelamentoHoras prazoRemarcacaoHoras
        politicaCancelamento toleranciaAtrasoMinutos cancelamentoAutomaticoAposAtraso
      }
    }
  }
`
const UPDATE_CONFIG = /* GraphQL */ `
  mutation UpdatePetShopConfig($id: ID!, $config: UpdatePetShopConfigInput!) {
    updatePetShopConfig(id: $id, config: $config) { id configJson { slug nome logo corPrincipal } }
  }
`
const UPDATE_PETSHOP = /* GraphQL */ `
  mutation UpdatePetShop($id: ID!, $input: UpdatePetShopInput!) {
    updatePetShop(id: $id, input: $input) { id nomeExibicao razaoSocial endereco cidade estado telefone email }
  }
`

type PetShopConfig = {
  slug?: string | null; nome?: string | null; logo?: string | null; corPrincipal?: string | null
  aceitaPetsAgressivos?: boolean | null; intervaloBanhoMinutos?: number | null
  prazoCancelamentoHoras?: number | null; prazoRemarcacaoHoras?: number | null
  politicaCancelamento?: string | null; toleranciaAtrasoMinutos?: number | null
  cancelamentoAutomaticoAposAtraso?: boolean | null
}
type PetShop = {
  id: string; nomeExibicao: string; razaoSocial: string; cnpj: string
  endereco: string; cidade: string; estado: string; telefone: string | null
  email: string; configJson: PetShopConfig
}

const schema = z.object({
  nomeExibicao: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  prazoCancelamento: z.string().optional(),
  prazoRemarcacao: z.string().optional(),
  toleranciaAtraso: z.string().optional(),
  intervaloBanho: z.string().optional(),
  politica: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function ConfiguracoesPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['myPetshop'],
    queryFn: () => gqlClient.request<{ myPetShop: PetShop | null }>(MY_PETSHOP),
  })
  const updateConfigMutation = useMutation({
    mutationFn: (vars: { id: string; config: Record<string, unknown> }) => gqlClient.request(UPDATE_CONFIG, vars),
  })
  const updatePetShopMutation = useMutation({
    mutationFn: (vars: { id: string; input: Record<string, unknown> }) => gqlClient.request(UPDATE_PETSHOP, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myPetshop'] }),
  })

  const [sucesso, setSucesso] = useState('')
  const ps = data?.myPetShop

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nomeExibicao: '', slug: '', telefone: '', email: '', prazoCancelamento: '', prazoRemarcacao: '', toleranciaAtraso: '', intervaloBanho: '', politica: '' },
  })

  useEffect(() => {
    if (ps) {
      form.reset({
        nomeExibicao: ps.nomeExibicao,
        slug: ps.configJson?.slug ?? '',
        telefone: ps.telefone ?? '',
        email: ps.email,
        prazoCancelamento: ps.configJson?.prazoCancelamentoHoras?.toString() ?? '',
        prazoRemarcacao: ps.configJson?.prazoRemarcacaoHoras?.toString() ?? '',
        toleranciaAtraso: ps.configJson?.toleranciaAtrasoMinutos?.toString() ?? '',
        intervaloBanho: ps.configJson?.intervaloBanhoMinutos?.toString() ?? '',
        politica: ps.configJson?.politicaCancelamento ?? '',
      })
    }
  }, [ps?.id])

  const onSubmit = form.handleSubmit(async (data) => {
    if (!ps) return
    setSucesso('')
    try {
      await updateConfigMutation.mutateAsync({
        id: ps.id,
        config: {
          slug: data.slug?.trim() || undefined,
          politicaCancelamento: data.politica?.trim() || undefined,
          prazoCancelamentoHoras: data.prazoCancelamento ? Number(data.prazoCancelamento) : undefined,
          prazoRemarcacaoHoras: data.prazoRemarcacao ? Number(data.prazoRemarcacao) : undefined,
          toleranciaAtrasoMinutos: data.toleranciaAtraso ? Number(data.toleranciaAtraso) : undefined,
          intervaloBanhoMinutos: data.intervaloBanho ? Number(data.intervaloBanho) : undefined,
        },
      })
      await updatePetShopMutation.mutateAsync({
        id: ps.id,
        input: { nomeExibicao: data.nomeExibicao.trim(), telefone: data.telefone?.trim() || undefined, email: data.email.trim() },
      })
      setSucesso('Configurações salvas com sucesso!')
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar' })
    }
  })

  if (isLoading) return <p>Carregando...</p>
  if (error) return <p style={{ color: 'red' }}>{String(error)}</p>
  if (!ps) return <p style={{ color: '#999' }}>Nenhum pet shop associado a esta conta.</p>

  const e = form.formState.errors
  const slug = form.watch('slug') || 'meu-pet-shop'

  return (
    <>
      <PageHeader title="Configurações" />
      {sucesso && <p style={{ color: 'green', background: '#f0fff0', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}>{sucesso}</p>}

      <form onSubmit={onSubmit}>
        <FormCard title="Dados da Loja">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Nome de exibição *</label>
              <input {...form.register('nomeExibicao')} style={inputStyle} />
              {e.nomeExibicao && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.nomeExibicao.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Slug da URL pública</label>
              <input {...form.register('slug')} placeholder="meu-pet-shop" style={inputStyle} />
              <small style={{ color: '#999', fontSize: 12 }}>ex: patafy.com/loja/{slug}</small>
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input {...form.register('telefone')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>E-mail *</label>
              <input type="email" {...form.register('email')} style={inputStyle} />
              {e.email && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.email.message}</p>}
            </div>
          </div>
        </FormCard>

        <FormCard title="Políticas e Prazos">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Prazo cancelamento (horas)</label><input type="number" {...form.register('prazoCancelamento')} min="0" style={{ ...inputStyle, width: 120 }} /></div>
            <div><label style={labelStyle}>Prazo remarcação (horas)</label><input type="number" {...form.register('prazoRemarcacao')} min="0" style={{ ...inputStyle, width: 120 }} /></div>
            <div><label style={labelStyle}>Tolerância atraso (min)</label><input type="number" {...form.register('toleranciaAtraso')} min="0" style={{ ...inputStyle, width: 120 }} /></div>
            <div><label style={labelStyle}>Intervalo entre banhos (min)</label><input type="number" {...form.register('intervaloBanho')} min="0" style={{ ...inputStyle, width: 120 }} /></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Política de cancelamento (texto para tutores)</label>
            <textarea {...form.register('politica')} rows={4} style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </FormCard>

        {e.root && <p style={{ color: 'red', marginBottom: 12 }}>{e.root.message}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={btnPrimary}>Salvar Configurações</button>
        </div>
      </form>
    </>
  )
}
