import type { PrismaClient } from '@patafy/db'

type OutboxTipo = 'agendado' | 'confirmado' | 'cancelado' | 'alterado'

type AgendamentoPayloadInput = {
  agendamentoId: string
  tutorUserId: string
  petNome: string
  petshopNome: string
  dataHoraInicio: Date
  servicosResumo: string[]
  enderecoLoja?: string | null
  linkAgendamento: string
}

export async function enqueueOutbox(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  tipo: OutboxTipo,
  params: AgendamentoPayloadInput,
) {
  await tx.notificacaoOutbox.create({
    data: {
      user_id: params.tutorUserId,
      agendamento_id: params.agendamentoId,
      canal: 'email',
      tipo,
      payload: {
        agendamento_id: params.agendamentoId,
        pet_nome: params.petNome,
        petshop_nome: params.petshopNome,
        data_hora_inicio: params.dataHoraInicio.toISOString(),
        servicos_resumo: params.servicosResumo,
        endereco_loja: params.enderecoLoja ?? null,
        link_agendamento: params.linkAgendamento,
      },
    },
  })
}

export async function buildAgendamentoPayload(
  prisma: PrismaClient,
  agendamentoId: string,
): Promise<AgendamentoPayloadInput> {
  const ag = await prisma.agendamento.findUniqueOrThrow({
    where: { id: agendamentoId },
    include: {
      pet: true,
      tutor_profile: { include: { user: true } },
      servicos: { include: { servico_variante: { include: { servico: true } } } },
      petshop: true,
    },
  })

  const cfg = (ag.petshop.config_json ?? {}) as Record<string, unknown>
  const petshopNome = (typeof cfg.nome === 'string' ? cfg.nome : null) ?? ag.petshop.nome_exibicao
  const endereco = typeof cfg.endereco === 'string' ? cfg.endereco : null
  const baseUrl = process.env['WEB_TUTOR_URL'] ?? 'https://tutor.patafy.care'

  return {
    agendamentoId: ag.id,
    tutorUserId: ag.tutor_profile.user_id,
    petNome: ag.pet.nome,
    petshopNome,
    dataHoraInicio: ag.data_hora_inicio,
    servicosResumo: ag.servicos.map((s) => s.servico_variante.servico.nome),
    enderecoLoja: endereco,
    linkAgendamento: `${baseUrl}/agendamentos`,
  }
}
