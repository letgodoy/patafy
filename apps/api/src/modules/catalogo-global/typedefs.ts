export const catalogoGlobalTypeDefs = /* GraphQL */ `
  type TipoAnimal {
    id: ID!
    nome: String!
    ativo: Boolean!
    ordem: Int
    createdAt: String!
  }

  type Raca {
    id: ID!
    tipoAnimalId: String!
    tipoAnimal: TipoAnimal!
    nome: String!
    ativo: Boolean!
    ordem: Int
    createdAt: String!
  }

  type Porte {
    id: ID!
    nome: String!
    ativo: Boolean!
    ordem: Int
    createdAt: String!
  }

  type Pelagem {
    id: ID!
    nome: String!
    ativo: Boolean!
    ordem: Int
    createdAt: String!
  }

  type SystemAdminUser {
    id: ID!
    email: String!
    nome: String!
    ativo: Boolean!
    createdAt: String!
  }

  input CreateTipoAnimalInput { nome: String!, ordem: Int }
  input UpdateTipoAnimalInput { nome: String, ordem: Int }

  input CreateRacaInput { tipoAnimalId: String!, nome: String!, ordem: Int }
  input UpdateRacaInput { nome: String, ordem: Int }

  input CreatePorteInput { nome: String!, ordem: Int }
  input UpdatePorteInput { nome: String, ordem: Int }

  input CreatePelagemInput { nome: String!, ordem: Int }
  input UpdatePelagemInput { nome: String, ordem: Int }

  input CreateSystemAdminInput { nome: String!, email: String!, senha: String! }

  extend type Query {
    tiposAnimal(ativo: Boolean): [TipoAnimal!]!
    racas(tipoAnimalId: String, ativo: Boolean): [Raca!]!
    portes(ativo: Boolean): [Porte!]!
    pelagens(ativo: Boolean): [Pelagem!]!
    listSystemAdmins: [SystemAdminUser!]!
  }

  extend type Mutation {
    createTipoAnimal(input: CreateTipoAnimalInput!): TipoAnimal!
    updateTipoAnimal(id: ID!, input: UpdateTipoAnimalInput!): TipoAnimal!
    createRaca(input: CreateRacaInput!): Raca!
    updateRaca(id: ID!, input: UpdateRacaInput!): Raca!
    createPorte(input: CreatePorteInput!): Porte!
    updatePorte(id: ID!, input: UpdatePorteInput!): Porte!
    createPelagem(input: CreatePelagemInput!): Pelagem!
    updatePelagem(id: ID!, input: UpdatePelagemInput!): Pelagem!
    setCatalogItemAtivo(tipo: String!, id: ID!, ativo: Boolean!): Boolean!
    createSystemAdmin(input: CreateSystemAdminInput!): SystemAdminUser!
  }
`
