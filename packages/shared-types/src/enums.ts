export enum AgendamentoStatus {
  AguardandoConfirmacao = 'AguardandoConfirmacao',
  Confirmado = 'Confirmado',
  Cancelado = 'Cancelado',
  EmAndamento = 'EmAndamento',
  Atrasado = 'Atrasado',
  Pronto = 'Pronto',
  Finalizado = 'Finalizado',
  NaoCompareceu = 'NaoCompareceu',
}

export enum AgendamentoOrigem {
  Tutor = 'tutor',
  Atendente = 'atendente',
}

export enum PetTutorTipo {
  Responsavel = 'responsavel',
  Autorizado = 'autorizado',
}

export enum PetTutorConviteStatus {
  Pendente = 'pendente',
  Aceito = 'aceito',
  Expirado = 'expirado',
  Revogado = 'revogado',
}

export enum PetshopUserRole {
  Owner = 'owner',
  Atendente = 'atendente',
  Banhista = 'banhista',
}

export enum NotificacaoCanal {
  Email = 'email',
  Push = 'push',
}

export enum NotificacaoTipo {
  Agendado = 'agendado',
  Confirmado = 'confirmado',
  Cancelado = 'cancelado',
  Alterado = 'alterado',
}

export enum NotificacaoStatus {
  Pendente = 'pendente',
  Enviado = 'enviado',
  Falha = 'falha',
}

export enum AtendimentoServicoOrigem {
  Agendamento = 'agendamento',
  Balcao = 'balcao',
}

export enum GraphQLErrorCode {
  Unauthenticated = 'UNAUTHENTICATED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  BadInput = 'BAD_INPUT',
  Conflict = 'CONFLICT',
  InternalError = 'INTERNAL_ERROR',
}
