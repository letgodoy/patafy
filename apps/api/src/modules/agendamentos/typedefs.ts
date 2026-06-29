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

  type AgendamentoServico {
    id: ID!
    servicoVarianteId: ID!
    ordem: Int!
  }

  type Agendamento {
    id: ID!
    petshopId: ID!
    petId: ID!
    tutorProfileId: ID!
    dataHoraInicio: String!
    duracaoTotalMinutos: Int!
    banhistaId: ID
    banhistaFixadoPeloTutor: Boolean!
    status: String!
    origem: String!
    pago: Boolean!
    precisaTransporte: Boolean!
    createdAt: String!
    updatedAt: String!
    servicos: [AgendamentoServico!]!
    pet: AgendamentoPet
    tutor: AgendamentoTutor
    banhista: AgendamentoBanhista
  }

  type AgendamentoPet {
    id: ID!
    nome: String!
    tipoAnimal: String
    raca: String
    porte: String
  }

  type AgendamentoTutor {
    id: ID!
    nome: String!
    email: String!
    telefone: String
  }

  type AgendamentoBanhista {
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

  input CreateAgendamentoInput {
    petshopId: ID!
    petId: ID!
    servicoVarianteIds: [ID!]!
    dataHoraInicio: String!
    banhistaId: ID
    banhistaFixadoPeloTutor: Boolean
    precisaTransporte: Boolean
  }

  input RescheduleAgendamentoInput {
    dataHoraInicio: String!
    banhistaId: ID
  }

  input AgendaPetShopFilters {
    status: [String!]
    pago: Boolean
    banhistaId: ID
  }

  extend type Query {
    availableSlots(input: AvailableSlotsInput!): [SlotDisponivel!]!
    availableBanhistas(input: AvailableBanhistasInput!): [BanhistaLivre!]!
    myAgendamentos(upcoming: Boolean): [Agendamento!]!
    agendaPetShop(petshopId: ID!, from: String!, to: String!, filters: AgendaPetShopFilters): [Agendamento!]!
    agendamento(id: ID!): Agendamento
  }

  extend type Mutation {
    createAgendamento(input: CreateAgendamentoInput!): Agendamento!
    confirmAgendamento(id: ID!): Agendamento!
    cancelAgendamento(id: ID!): Agendamento!
    rescheduleAgendamento(id: ID!, input: RescheduleAgendamentoInput!): Agendamento!
    updateAgendamentoStatus(id: ID!, status: String!): Agendamento!
    markNaoCompareceu(id: ID!): Agendamento!
    assignBanhista(id: ID!, banhistaId: ID!): Agendamento!
    togglePago(id: ID!): Agendamento!
  }
`
