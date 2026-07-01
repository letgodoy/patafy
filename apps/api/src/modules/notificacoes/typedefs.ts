export const notificacoesTypeDefs = /* GraphQL */ `
  type NotificacaoOutbox {
    id: ID!
    userId: ID!
    agendamentoId: ID
    canal: String!
    tipo: String!
    status: String!
    tentativas: Int!
    dataEnvio: String
    erro: String
    createdAt: String!
  }

  extend type Query {
    notificacaoOutboxList(status: String, limit: Int): [NotificacaoOutbox!]!
  }

  extend type Mutation {
    retryNotificacao(id: ID!): NotificacaoOutbox!
  }
`
