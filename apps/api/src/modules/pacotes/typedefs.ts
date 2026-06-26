export const pacotesTypeDefs = /* GraphQL */ `
  type PacoteItemDef {
    id: ID!
    pacoteId: String!
    servicoVarianteId: String!
    quantidadeTotal: Int!
    quantidadeUsada: Int!
    restante: Int!
  }

  type Pacote {
    id: ID!
    petshopId: String!
    nome: String!
    descricao: String
    travado: Boolean!
    descontoPercentual: Float
    validade: String
    ativo: Boolean!
    items: [PacoteItemDef!]!
  }

  type SaldoItem {
    servicoVarianteId: String!
    servicoNome: String!
    quantidadeTotal: Int!
    quantidadeUsada: Int!
    restante: Int!
  }

  type SaldoPacotePet {
    id: ID!
    pacoteId: String!
    pacoteNome: String!
    dataAtivacao: String!
    dataExpiracao: String
    status: String!
    items: [SaldoItem!]!
  }

  input CreatePacoteInput {
    nome: String!
    descricao: String
    travado: Boolean!
    descontoPercentual: Float
    validade: String
  }

  input UpdatePacoteInput {
    nome: String
    descricao: String
    descontoPercentual: Float
    validade: String
    ativo: Boolean
  }

  input ItemVendaInput {
    servicoVarianteId: ID!
    quantidade: Int!
  }

  extend type Query {
    listPacotes(petshopId: ID!): [Pacote!]!
    listPacotesPorPet(petId: ID!): [SaldoPacotePet!]!
  }

  extend type Mutation {
    createPacote(petshopId: ID!, input: CreatePacoteInput!): Pacote!
    updatePacote(id: ID!, input: UpdatePacoteInput!): Pacote!
    addPacoteItem(pacoteId: ID!, servicoVarianteId: ID!, quantidadeTotal: Int!): Pacote!
    removePacoteItem(pacoteItemId: ID!): Pacote!
    venderPacoteTravado(pacoteId: ID!, petId: ID!, dataAtivacao: String!): SaldoPacotePet!
    venderPacotePersonalizado(petshopId: ID!, petId: ID!, itens: [ItemVendaInput!]!, descontoPercentual: Float, dataAtivacao: String!): SaldoPacotePet!
  }
`
