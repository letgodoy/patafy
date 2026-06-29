import { GraphQLError } from 'graphql'

export type AgendamentoStatus =
  | 'AguardandoConfirmacao'
  | 'Confirmado'
  | 'Cancelado'
  | 'EmAndamento'
  | 'Atrasado'
  | 'Pronto'
  | 'Finalizado'
  | 'NaoCompareceu'

const TRANSITIONS: Record<AgendamentoStatus, AgendamentoStatus[]> = {
  AguardandoConfirmacao: ['Confirmado', 'Cancelado'],
  Confirmado:            ['EmAndamento', 'Atrasado', 'Cancelado', 'NaoCompareceu'],
  Atrasado:              ['EmAndamento', 'Cancelado', 'NaoCompareceu'],
  EmAndamento:           ['Pronto', 'Finalizado'],
  Pronto:                ['Finalizado'],
  Finalizado:            [],
  Cancelado:             [],
  NaoCompareceu:         [],
}

export function assertTransition(de: AgendamentoStatus, para: AgendamentoStatus): void {
  const allowed = TRANSITIONS[de] ?? []
  if (!allowed.includes(para)) {
    throw new GraphQLError(
      `Transição inválida: ${de} → ${para}`,
      { extensions: { code: 'INVALID_STATUS_TRANSITION' } },
    )
  }
}

export const TERMINAL_STATUSES: AgendamentoStatus[] = ['Finalizado', 'Cancelado', 'NaoCompareceu']
export const ACTIVE_STATUSES: AgendamentoStatus[] = ['AguardandoConfirmacao', 'Confirmado', 'Atrasado', 'EmAndamento', 'Pronto']
