export const agendamentosTypeDefs = /* GraphQL */ `
  type SlotDisponivel {
    inicio: String!
    fim: String!
    banhistaId: ID!
    banhistaNome: String!
  }

  type BanhistaLivre {
    id: ID!
    nome: String!
  }

  input AvailableSlotsInput {
    petShopId: ID!
    date: String!
    duracaoMinutos: Int!
    banhistaId: ID
    servicoVarianteIds: [ID!]
  }

  input AvailableBanhistasInput {
    petShopId: ID!
    inicio: String!
    duracaoMinutos: Int!
    servicoVarianteIds: [ID!]
  }

  extend type Query {
    availableSlots(input: AvailableSlotsInput!): [SlotDisponivel!]!
    availableBanhistas(input: AvailableBanhistasInput!): [BanhistaLivre!]!
  }
`
