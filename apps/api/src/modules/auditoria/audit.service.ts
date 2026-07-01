import type { PrismaClient } from '@patafy/db'

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

type LogParams = {
  actorUserId: string | null
  petshopId: string | null
  agendamentoId?: string | null
  entityType: string
  entityId: string
  action: string
  metadata?: Record<string, unknown>
}

export async function auditLog(
  tx: TxClient,
  params: LogParams,
): Promise<void> {
  await tx.registroOperacional.create({
    data: {
      actor_user_id: params.actorUserId,
      petshop_id: params.petshopId,
      agendamento_id: params.agendamentoId ?? null,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: (params.metadata ?? {}) as any,
    },
  })
}
