import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../context.js'
import { AGENDAMENTO_INCLUDE } from './agendamento.helpers.js'

export async function criarComLock(ctx: GraphQLContext, params: {
  petshopId: string
  petId: string
  tutorProfileId: string
  servicoVarianteIds: string[]
  dataHoraInicio: Date
  duracaoMin: number
  banhistaId: string
  banhistaFixadoPeloTutor: boolean
  precisaTransporte: boolean
  origem: 'tutor' | 'atendente'
}) {
  return ctx.prisma.$transaction(async (tx) => {
    const fimInicio = new Date(params.dataHoraInicio.getTime() + params.duracaoMin * 60000)

    const conflito = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM agendamentos
      WHERE banhista_id = ${params.banhistaId}
        AND status NOT IN ('Cancelado', 'Finalizado', 'NaoCompareceu')
        AND data_hora_inicio < ${fimInicio}
        AND (data_hora_inicio + duracao_total_minutos * interval '1 minute') > ${params.dataHoraInicio}
      FOR UPDATE
    `

    if (conflito.length > 0) {
      throw new GraphQLError('Horário não disponível para este banhista', { extensions: { code: 'SLOT_UNAVAILABLE' } })
    }

    const status = params.origem === 'atendente' ? 'Confirmado' : 'AguardandoConfirmacao'

    const ag = await tx.agendamento.create({
      data: {
        petshop_id: params.petshopId,
        pet_id: params.petId,
        tutor_profile_id: params.tutorProfileId,
        data_hora_inicio: params.dataHoraInicio,
        duracao_total_minutos: params.duracaoMin,
        banhista_id: params.banhistaId,
        banhista_fixado_pelo_tutor: params.banhistaFixadoPeloTutor,
        status,
        origem: params.origem,
        precisa_transporte: params.precisaTransporte,
        servicos: {
          create: params.servicoVarianteIds.map((id, ordem) => ({ servico_variante_id: id, ordem })),
        },
      },
      include: AGENDAMENTO_INCLUDE,
    })

    await tx.atendimento.create({
      data: { agendamento_id: ag.id, banhista_id: params.banhistaId },
    })

    return ag
  })
}
