import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { usePetShopBySlugQuery, useMyPetsQuery, useListServicosQuery, useAvailableSlotsQuery, useAvailableBanhistasQuery, useCreateAgendamentoMutation, useMyAgendamentosQuery } from '@patafy/graphql-client'
import { PageHeader, btnPrimary, btnSecondary, colors } from '@patafy/ui'
import type { Slot } from '@patafy/ui'
import { useQueryClient } from '@tanstack/react-query'
import { StepServicos } from './steps/StepServicos.js'
import { StepPet } from './steps/StepPet.js'
import { StepData } from './steps/StepData.js'
import { StepSlot } from './steps/StepSlot.js'
import { StepBanhista } from './steps/StepBanhista.js'
import { StepResumo } from './steps/StepResumo.js'

type Pet = { id: string; nome: string; tipoAnimal: { nome: string } | null; porte: { id: string; nome: string } | null; raca: { nome: string } | null }
type ServicoVariante = { id: string; preco: number; duracaoMinutos: number }
type Servico = { id: string; nome: string; variantes: ServicoVariante[] }

type Step = 'servicos' | 'pet' | 'data' | 'slot' | 'banhista' | 'resumo'
const STEPS: Step[] = ['servicos', 'pet', 'data', 'slot', 'banhista', 'resumo']

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

  const toggleServico = (varianteId: string) =>
    setServicoVarianteIds((prev) => prev.includes(varianteId) ? prev.filter((id) => id !== varianteId) : [...prev, varianteId])

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

  const lojaNome = (loja.configJson as { nome?: string }).nome ?? loja.nomeExibicao

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

  const stepIdx = STEPS.indexOf(step)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <PageHeader title={`Agendar — ${lojaNome}`} />

      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i < stepIdx ? '#86efac' : i === stepIdx ? colors.primary : '#e5e7eb' }} />
        ))}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 24 }}>
        {step === 'servicos' && (
          <StepServicos servicos={servicos} servicoVarianteIds={servicoVarianteIds} duracaoTotal={duracaoTotal} onToggle={toggleServico} onNext={() => setStep('pet')} />
        )}
        {step === 'pet' && (
          <StepPet pets={pets} petId={petId} onSelect={setPetId} onBack={() => setStep('servicos')} onNext={() => setStep('data')} />
        )}
        {step === 'data' && (
          <StepData date={date} onChangeDate={(d) => { setDate(d); setSlot(null) }} onBack={() => setStep('pet')} onNext={() => setStep('slot')} />
        )}
        {step === 'slot' && (
          <StepSlot date={date} slots={slots} loading={loadingSlots} selectedSlot={slot} onSelect={setSlot} onBack={() => setStep('data')} onNext={() => setStep('banhista')} />
        )}
        {step === 'banhista' && (
          <StepBanhista banhistas={banhistas} banhistaOpcional={banhistaOpcional} precisaTransporte={precisaTransporte} onChangeBanhista={setBanhistaOpcional} onChangeTransporte={setPrecisaTransporte} onBack={() => setStep('slot')} onNext={() => setStep('resumo')} />
        )}
        {step === 'resumo' && slot && (
          <StepResumo lojaNome={lojaNome} pet={petSelecionado} slot={slot} banhistaOpcional={banhistaOpcional} banhistas={banhistas} duracaoTotal={duracaoTotal} servicoVarianteIds={servicoVarianteIds} precisaTransporte={precisaTransporte} erro={erro} isPending={createMutation.isPending} onBack={() => setStep('banhista')} onConfirmar={handleConfirmar} />
        )}
      </div>
    </div>
  )
}
