export const auditoriaTypeDefs = /* GraphQL */ `
  type RegistroOperacional {
    id: ID!
    occurredAt: String!
    actorUserId: ID
    petshopId: ID
    agendamentoId: ID
    entityType: String!
    entityId: String!
    action: String!
    metadata: String!
  }

  input RegistroOperacionalFilter {
    petshopId: ID
    entityType: String
    entityId: ID
    action: String
    agendamentoId: ID
    from: String
    to: String
    limit: Int
    cursor: String
  }

  extend type Query {
    registrosOperacionais(filter: RegistroOperacionalFilter): [RegistroOperacional!]!
    registrosPorAgendamento(agendamentoId: ID!): [RegistroOperacional!]!
  }
`
