import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../context.js'
import { requireAuth, requirePetshopRole } from '../auth/rbac.js'
import { getAvailableSlots } from './availability.service.js'
import type { AgendamentoStatus } from './state-machine.js'
import { assertTransition } from './state-machine.js'
import { loadPetshopConfig, loadBanhistas, loadAgendamentosParaSlot, loadBloqueios, calcularDuracao, findAgendamento, mapAgendamento, AGENDAMENTO_INCLUDE } from './agendamento.helpers.js'
import { criarComLock } from './agendamento.service.js'
import { buildAgendamentoPayload, enqueueOutbox } from '../notificacoes/enqueue.js'
import { auditLog } from '../auditoria/audit.service.js'

export const agendamentosMutations = {
  createAgendamento: async (_: unknown, { input }: { input: { petshopId: string; petId: string; servicoVarianteIds: string[]; dataHoraInicio: string; banhistaId?: string; banhistaFixadoPeloTutor?: boolean; precisaTransporte?: boolean } }, ctx: GraphQLContext) => {
    requireAuth(ctx)

    const dataHoraInicio = new Date(input.dataHoraInicio)
    const duracaoMin = await calcularDuracao(ctx, input.servicoVarianteIds)

    let banhistaId = input.banhistaId
    if (!banhistaId) {
      const date = dataHoraInicio.toISOString().slice(0, 10)
      const { horario, intervalo } = await loadPetshopConfig(ctx, input.petshopId)
      const banhistas = await loadBanhistas(ctx, input.petshopId)
      const agendamentos = await loadAgendamentosParaSlot(ctx, input.petshopId, date)
      const bloqueios = await loadBloqueios(ctx, input.petshopId, date)
      const slots = getAvailableSlots({ horarioFuncionamento: horario, intervaloEntreMin: intervalo, agendamentos, bloqueios, banhistas, date, duracaoMin })
      const slot = slots.find((s) => new Date(s.inicio).getTime() === dataHoraInicio.getTime())
      if (!slot) throw new GraphQLError('Horário não disponível', { extensions: { code: 'SLOT_UNAVAILABLE' } })
      banhistaId = slot.banhistaId
    }

    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === input.petshopId && p.ativo)
    const isTutor = !!ctx.tutorProfile
    if (!isTutor && !isStaff) throw new GraphQLError('Não autorizado', { extensions: { code: 'UNAUTHENTICATED' } })

    const tutorProfileId = isTutor
      ? ctx.tutorProfile!.id
      : await (async () => {
          const pt = await ctx.prisma.petTutor.findFirst({ where: { pet_id: input.petId, tipo: 'responsavel' } })
          if (!pt) throw new GraphQLError('Pet sem tutor responsável', { extensions: { code: 'NOT_FOUND' } })
          return pt.tutor_profile_id
        })()

    const ag = await criarComLock(ctx, {
      petshopId: input.petshopId,
      petId: input.petId,
      tutorProfileId,
      servicoVarianteIds: input.servicoVarianteIds,
      dataHoraInicio,
      duracaoMin,
      banhistaId,
      banhistaFixadoPeloTutor: input.banhistaFixadoPeloTutor ?? !!input.banhistaId,
      precisaTransporte: input.precisaTransporte ?? false,
      origem: isStaff ? 'atendente' : 'tutor',
    })

    const payload = await buildAgendamentoPayload(ctx.prisma, ag.id)
    await ctx.prisma.$transaction(async (tx) => {
      await enqueueOutbox(tx, 'agendado', payload)
      if (isStaff) await enqueueOutbox(tx, 'confirmado', payload)
      await auditLog(tx, {
        actorUserId: ctx.user?.id ?? null,
        petshopId: input.petshopId,
        agendamentoId: ag.id,
        entityType: 'Agendamento',
        entityId: ag.id,
        action: 'CREATED',
        metadata: { origem: isStaff ? 'atendente' : 'tutor', servicoVarianteIds: input.servicoVarianteIds },
      })
    })

    return mapAgendamento(ag)
  },

  confirmAgendamento: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente'])
    assertTransition(ag.status as AgendamentoStatus, 'Confirmado')
    const payload = await buildAgendamentoPayload(ctx.prisma, id)
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const result = await tx.agendamento.update({ where: { id }, data: { status: 'Confirmado' }, include: AGENDAMENTO_INCLUDE })
      await enqueueOutbox(tx, 'confirmado', payload)
      await auditLog(tx, { actorUserId: ctx.user?.id ?? null, petshopId: ag.petshop_id, agendamentoId: id, entityType: 'Agendamento', entityId: id, action: 'STATUS_CHANGED', metadata: { from: ag.status, to: 'Confirmado' } })
      return result
    })
    return mapAgendamento(updated)
  },

  cancelAgendamento: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const ag = await findAgendamento(ctx, id)
    assertTransition(ag.status as AgendamentoStatus, 'Cancelado')

    const isTutorDono = ctx.tutorProfile?.id === ag.tutor_profile_id
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    if (!isTutorDono && !isStaff) throw new GraphQLError('Sem permissão', { extensions: { code: 'FORBIDDEN' } })

    if (isTutorDono && !isStaff) {
      const { prazoCancelamentoHoras } = await loadPetshopConfig(ctx, ag.petshop_id)
      if (prazoCancelamentoHoras > 0) {
        const limite = new Date(ag.data_hora_inicio.getTime() - prazoCancelamentoHoras * 3600000)
        if (new Date() > limite) throw new GraphQLError('Prazo de cancelamento expirado', { extensions: { code: 'DEADLINE_EXCEEDED' } })
      }
    }

    const payload = await buildAgendamentoPayload(ctx.prisma, id)
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const result = await tx.agendamento.update({ where: { id }, data: { status: 'Cancelado' }, include: AGENDAMENTO_INCLUDE })
      await enqueueOutbox(tx, 'cancelado', payload)
      await auditLog(tx, { actorUserId: ctx.user?.id ?? null, petshopId: ag.petshop_id, agendamentoId: id, entityType: 'Agendamento', entityId: id, action: 'CANCELLED', metadata: { from: ag.status, motivo: isTutorDono && !isStaff ? 'tutor' : 'staff' } })
      return result
    })
    return mapAgendamento(updated)
  },

  rescheduleAgendamento: async (_: unknown, { id, input }: { id: string; input: { dataHoraInicio: string; banhistaId?: string } }, ctx: GraphQLContext) => {
    requireAuth(ctx)
    const ag = await findAgendamento(ctx, id)

    const isTutorDono = ctx.tutorProfile?.id === ag.tutor_profile_id
    const isStaff = ctx.petshopProfiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    if (!isTutorDono && !isStaff) throw new GraphQLError('Sem permissão', { extensions: { code: 'FORBIDDEN' } })

    if (isTutorDono && !isStaff) {
      const { prazoRemarcacaoHoras } = await loadPetshopConfig(ctx, ag.petshop_id)
      if (prazoRemarcacaoHoras > 0) {
        const limite = new Date(ag.data_hora_inicio.getTime() - prazoRemarcacaoHoras * 3600000)
        if (new Date() > limite) throw new GraphQLError('Prazo de remarcação expirado', { extensions: { code: 'DEADLINE_EXCEEDED' } })
      }
    }

    const novaData = new Date(input.dataHoraInicio)
    const date = novaData.toISOString().slice(0, 10)
    const { horario, intervalo } = await loadPetshopConfig(ctx, ag.petshop_id)
    const banhistas = await loadBanhistas(ctx, ag.petshop_id)
    const agendamentos = (await loadAgendamentosParaSlot(ctx, ag.petshop_id, date)).filter((a) => a.id !== id)
    const bloqueios = await loadBloqueios(ctx, ag.petshop_id, date)

    const novoBanhistaId = ag.banhista_fixado_pelo_tutor ? ag.banhista_id! : (input.banhistaId ?? ag.banhista_id!)
    const slots = getAvailableSlots({ horarioFuncionamento: horario, intervaloEntreMin: intervalo, agendamentos, bloqueios, banhistas, date, duracaoMin: ag.duracao_total_minutos, banhistaId: novoBanhistaId })
    const slotOk = slots.some((s) => new Date(s.inicio).getTime() === novaData.getTime())
    if (!slotOk) throw new GraphQLError('Horário não disponível', { extensions: { code: 'SLOT_UNAVAILABLE' } })

    const payload = await buildAgendamentoPayload(ctx.prisma, id)
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const result = await tx.agendamento.update({
        where: { id },
        data: { data_hora_inicio: novaData, banhista_id: novoBanhistaId },
        include: AGENDAMENTO_INCLUDE,
      })
      await enqueueOutbox(tx, 'alterado', { ...payload, dataHoraInicio: novaData })
      await auditLog(tx, { actorUserId: ctx.user?.id ?? null, petshopId: ag.petshop_id, agendamentoId: id, entityType: 'Agendamento', entityId: id, action: 'RESCHEDULED', metadata: { old_inicio: ag.data_hora_inicio.toISOString(), new_inicio: novaData.toISOString() } })
      return result
    })
    return mapAgendamento(updated)
  },

  updateAgendamentoStatus: async (_: unknown, { id, status }: { id: string; status: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente', 'banhista'])
    assertTransition(ag.status as AgendamentoStatus, status as AgendamentoStatus)
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const result = await tx.agendamento.update({ where: { id }, data: { status: status as AgendamentoStatus }, include: AGENDAMENTO_INCLUDE })
      await auditLog(tx, { actorUserId: ctx.user?.id ?? null, petshopId: ag.petshop_id, agendamentoId: id, entityType: 'Agendamento', entityId: id, action: 'STATUS_CHANGED', metadata: { from: ag.status, to: status } })
      return result
    })
    return mapAgendamento(updated)
  },

  markNaoCompareceu: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente'])
    assertTransition(ag.status as AgendamentoStatus, 'NaoCompareceu')
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const result = await tx.agendamento.update({ where: { id }, data: { status: 'NaoCompareceu' }, include: AGENDAMENTO_INCLUDE })
      await auditLog(tx, { actorUserId: ctx.user?.id ?? null, petshopId: ag.petshop_id, agendamentoId: id, entityType: 'Agendamento', entityId: id, action: 'NAO_COMPARECEU', metadata: { motivo: 'manual' } })
      return result
    })
    return mapAgendamento(updated)
  },

  assignBanhista: async (_: unknown, { id, banhistaId }: { id: string; banhistaId: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente'])
    if (ag.banhista_fixado_pelo_tutor) throw new GraphQLError('Banhista foi escolhido pelo tutor e não pode ser alterado', { extensions: { code: 'FORBIDDEN' } })
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const result = await tx.agendamento.update({ where: { id }, data: { banhista_id: banhistaId }, include: AGENDAMENTO_INCLUDE })
      await auditLog(tx, { actorUserId: ctx.user?.id ?? null, petshopId: ag.petshop_id, agendamentoId: id, entityType: 'Agendamento', entityId: id, action: 'BANHISTA_CHANGED', metadata: { old_id: ag.banhista_id, new_id: banhistaId, silencioso: !ag.banhista_fixado_pelo_tutor } })
      return result
    })
    return mapAgendamento(updated)
  },

  togglePago: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const ag = await findAgendamento(ctx, id)
    requirePetshopRole(ctx, ag.petshop_id, ['owner', 'atendente'])
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const result = await tx.agendamento.update({ where: { id }, data: { pago: !ag.pago }, include: AGENDAMENTO_INCLUDE })
      await auditLog(tx, { actorUserId: ctx.user?.id ?? null, petshopId: ag.petshop_id, agendamentoId: id, entityType: 'Agendamento', entityId: id, action: 'PAGO_TOGGLED', metadata: { old: ag.pago, new: !ag.pago } })
      return result
    })
    return mapAgendamento(updated)
  },
}
