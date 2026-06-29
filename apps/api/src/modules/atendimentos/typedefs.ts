export const atendimentosTypeDefs = /* GraphQL */ `
  type AtendimentoServicoAdicional {
    id: ID!
    servicoVarianteId: ID!
    precoCobrado: Float!
    createdAt: String!
  }

  type Atendimento {
    id: ID!
    agendamentoId: ID!
    banhistaId: ID!
    observacoesGerais: String
    observacoesInternas: String
    createdAt: String!
    updatedAt: String!
    adicionais: [AtendimentoServicoAdicional!]!
  }

  input AddServicoAdicionalInput {
    atendimentoId: ID!
    servicoVarianteId: ID!
    precoCobrado: Float!
  }

  extend type Query {
    atendimentoByAgendamento(agendamentoId: ID!): Atendimento
  }

  extend type Mutation {
    startAtendimento(agendamentoId: ID!): Atendimento!
    markPronto(agendamentoId: ID!): Atendimento!
    finalizarAtendimento(agendamentoId: ID!): Atendimento!
    addServicoAdicional(input: AddServicoAdicionalInput!): Atendimento!
    updateObservacoesGerais(atendimentoId: ID!, texto: String!): Atendimento!
    updateObservacoesInternas(atendimentoId: ID!, texto: String!): Atendimento!
  }
`
