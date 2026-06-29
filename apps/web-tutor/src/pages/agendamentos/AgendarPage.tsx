import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { usePetShopBySlugQuery, useMyPetsQuery, useListServicosQuery, useAvailableSlotsQuery, useAvailableBanhistasQuery, useCreateAgendamentoMutation, useMyAgendamentosQuery } from '@patafy/graphql-client'
import { SlotPicker, PageHeader, btnPrimary, btnSecondary, inputStyle, labelStyle, colors } from '@patafy/ui'
import type { Slot } from '@patafy/ui'
import { useQueryClient } from '@tanstack/react-query'

type Pet = { id: string; nome: string; tipoAnimal: { nome: string } | null; porte: { id: string; nome: string } | null; raca: { nome: string } | null }
type ServicoVariante = { id: string; preco: number; duracaoMinutos: number }
type Servico = { id: string; nome: string; variantes: ServicoVariante[] }

type Step = 'servicos' | 'pet' | 'data' | 'slot' | 'banhista' | 'resumo'

export function AgendarPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: shopData } = usePetShopBySlugQuery({ slug: slug! }, { enabled: !!slug })
  const { data: petsData } = useMyPetsQuery()

  const [step, setStep] = useState<Step>('servicos')
  const [servicoVarianteIds, setServicoVarianteIds] = useState<string[]>([])
  const [petId, setPetId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [slot, setSlot] = useState<Slot | null>(null)
  const [banhistaOpcional, setBanhistaOpcional] = useState<string>('')
  const [precisaTransporte, setPrecisaTransporte] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const petshopId = shopData?.petShopBySlug?.id ?? ''
  const pets = (petsData?.myPets as Pet[] | undefined) ?? []
  const petSelecionado = pets.find((p) => p.id === petId)

  const { data: servicosData } = useListServicosQuery(
    { petshopId, petId: petId || undefined },
    { enabled: !!petshopId },
  )
  const servicos = (servicosData?.listServicos as Servico[] | undefined) ?? []

  const duracaoTotal = servicoVarianteIds.reduce((acc, id) => {
    const variante = servicos.flatMap((s) => s.variantes).find((v) => v.id === id)
    return acc + (variante?.duracaoMinutos ?? 0)
  }, 0)

  const { data: slotsData, isLoading: loadingSlots } = useAvailableSlotsQuery(
    { input: { petShopId: petshopId, date, duracaoMinutos: duracaoTotal, servicoVarianteIds } },
    { enabled: step === 'slot' && !!petshopId && duracaoTotal > 0 },
  )
  const slots = (slotsData?.availableSlots ?? []) as Slot[]

  const { data: banhistasData } = useAvailableBanhistasQuery(
    { input: { petShopId: petshopId, inicio: slot?.inicio ?? '', duracaoMinutos: duracaoTotal } },
    { enabled: step === 'banhista' && !!slot },
  )
  const banhistas = banhistasData?.availableBanhistas ?? []

  const createMutation = useCreateAgendamentoMutation({
    onSuccess: () => qc.invalidateQueries({ queryKey: useMyAgendamentosQuery.getKey({ upcoming: true }) }),
  })

  const toggleServico = (varianteId: string) => {
    setServicoVarianteIds((prev) =>
      prev.includes(varianteId) ? prev.filter((id) => id !== varianteId) : [...prev, varianteId],
    )
  }

  const handleConfirmar = async () => {
    setErro('')
    if (!slot || !petId || servicoVarianteIds.length === 0) return
    try {
      await createMutation.mutateAsync({
        input: {
          petshopId,
          petId,
          servicoVarianteIds,
          dataHoraInicio: slot.inicio,
          banhistaId: banhistaOpcional || slot.banhistaId,
          banhistaFixadoPeloTutor: !!banhistaOpcional,
          precisaTransporte,
        },
      })
      setSucesso(true)
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao agendar')
    }
  }

  const loja = shopData?.petShopBySlug
  if (!loja) return <p style={{ padding: 24, color: '#666' }}>Carregando...</p>

  if (sucesso) return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
      <h2>Agendamento enviado!</h2>
      <p style={{ color: '#666' }}>Aguarde a confirmação da loja.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <button onClick={() => navigate('/agendamentos')} style={btnPrimary}>Meus Agendamentos</button>
        <button onClick={() => navigate(`/loja/${slug}`)} style={btnSecondary}>Voltar à Loja</button>
      </div>
    </div>
  )

  const steps: Step[] = ['servicos', 'pet', 'data', 'slot', 'banhista', 'resumo']
  const stepIdx = steps.indexOf(step)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <PageHeader title={`Agendar — ${(loja.configJson as { nome?: string }).nome ?? loja.nomeExibicao}`} />

      {/* Barra de progresso */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i < stepIdx ? '#86efac' : i === stepIdx ? colors.primary : '#e5e7eb' }} />
        ))}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 24 }}>

        {/* Step 1: Serviços */}
        {step === 'servicos' && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>1. Escolha os serviços</h3>
            {servicos.filter((s) => s.variantes.length > 0).map((s) => (
              <div key={s.id} style={{ marginBottom: 12 }}>
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{s.nome}</p>
                {s.variantes.map((v) => {
                  const selected = servicoVarianteIds.includes(v.id)
                  return (
                    <div key={v.id} onClick={() => toggleServico(v.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginBottom: 4, border: `2px solid ${selected ? colors.primary : colors.border}`, borderRadius: 8, cursor: 'pointer', background: selected ? '#f0fdf4' : '#fff' }}>
                      <span style={{ fontSize: 14 }}>{v.duracaoMinutos} min</span>
                      <strong style={{ color: colors.primary }}>R$ {Number(v.preco).toFixed(2)}</strong>
                    </div>
                  )
                })}
              </div>
            ))}
            {servicos.length === 0 && <p style={{ color: '#666' }}>Nenhum serviço disponível.</p>}
            <button onClick={() => setStep('pet')} style={{ ...btnPrimary, marginTop: 16 }} disabled={servicoVarianteIds.length === 0}>
              Continuar ({duracaoTotal} min)
            </button>
          </>
        )}

        {/* Step 2: Pet */}
        {step === 'pet' && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>2. Qual pet?</h3>
            {pets.map((p) => (
              <div key={p.id} onClick={() => setPetId(p.id)} style={{ padding: 14, marginBottom: 8, border: `2px solid ${petId === p.id ? colors.primary : colors.border}`, borderRadius: 8, cursor: 'pointer', background: petId === p.id ? '#f0fdf4' : '#fff' }}>
                <strong>{p.nome}</strong>
                <span style={{ marginLeft: 8, fontSize: 13, color: '#666' }}>{[p.tipoAnimal?.nome, p.raca?.nome, p.porte?.nome].filter(Boolean).join(' · ')}</span>
              </div>
            ))}
            {pets.length === 0 && <p style={{ color: '#666' }}>Nenhum pet cadastrado. <a href="/pets/novo" style={{ color: colors.primary }}>Cadastrar pet</a></p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep('servicos')} style={btnSecondary}>Voltar</button>
              <button onClick={() => setStep('data')} style={btnPrimary} disabled={!petId}>Continuar</button>
            </div>
          </>
        )}

        {/* Step 3: Data */}
        {step === 'data' && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>3. Escolha a data</h3>
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setDate(e.target.value); setSlot(null) }} style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep('pet')} style={btnSecondary}>Voltar</button>
              <button onClick={() => setStep('slot')} style={btnPrimary} disabled={!date}>Ver horários</button>
            </div>
          </>
        )}

        {/* Step 4: Slot */}
        {step === 'slot' && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>4. Escolha o horário</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#666' }}>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
            <SlotPicker slots={slots} loading={loadingSlots} selectedInicio={slot?.inicio} onSelect={(s) => setSlot(s)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep('data')} style={btnSecondary}>Voltar</button>
              <button onClick={() => setStep('banhista')} style={btnPrimary} disabled={!slot}>Continuar</button>
            </div>
          </>
        )}

        {/* Step 5: Banhista (opcional) + transporte */}
        {step === 'banhista' && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>5. Preferências (opcional)</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Banhista preferido</label>
              <select value={banhistaOpcional} onChange={(e) => setBanhistaOpcional(e.target.value)} style={inputStyle}>
                <option value="">Sem preferência (primeiro livre)</option>
                {banhistas.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={precisaTransporte} onChange={(e) => setPrecisaTransporte(e.target.checked)} />
              Preciso de transporte
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep('slot')} style={btnSecondary}>Voltar</button>
              <button onClick={() => setStep('resumo')} style={btnPrimary}>Continuar</button>
            </div>
          </>
        )}

        {/* Step 6: Resumo + confirmar */}
        {step === 'resumo' && slot && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>6. Confirmar agendamento</h3>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px' }}><strong>Loja:</strong> {(loja.configJson as { nome?: string }).nome ?? loja.nomeExibicao}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Pet:</strong> {petSelecionado?.nome}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Data/Hora:</strong> {new Date(slot.inicio).toLocaleString('pt-BR')}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Banhista:</strong> {banhistaOpcional ? banhistas.find((b) => b.id === banhistaOpcional)?.nome : `${slot.banhistaNome} (sugerido)`}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Duração:</strong> {duracaoTotal} min</p>
              <p style={{ margin: 0 }}><strong>Serviços:</strong> {servicoVarianteIds.length} selecionado(s)</p>
              {precisaTransporte && <p style={{ margin: '8px 0 0', color: colors.primary }}>Solicita transporte</p>}
            </div>
            {erro && <p style={{ color: '#c00', marginBottom: 12 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep('banhista')} style={btnSecondary}>Voltar</button>
              <button onClick={handleConfirmar} style={btnPrimary} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Enviando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
