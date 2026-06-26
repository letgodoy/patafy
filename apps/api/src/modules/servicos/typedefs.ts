export const servicosTypeDefs = /* GraphQL */ `
  type CategoriaServico {
    id: ID!
    petshopId: String!
    nome: String!
    ordem: Int
    ativo: Boolean!
  }

  type ServicoVariante {
    id: ID!
    servicoId: String!
    porteId: String
    racaId: String
    pelagemId: String
    duracaoMinutos: Int!
    preco: Float!
    ativo: Boolean!
  }

  type Servico {
    id: ID!
    petshopId: String!
    categoriaId: String
    nome: String!
    descricao: String
    ativo: Boolean!
    variantes: [ServicoVariante!]!
  }

  input CreateCategoriaInput {
    nome: String!
    ordem: Int
  }

  input UpdateCategoriaInput {
    nome: String
    ordem: Int
    ativo: Boolean
  }

  input CreateServicoInput {
    nome: String!
    descricao: String
    categoriaId: String
  }

  input UpdateServicoInput {
    nome: String
    descricao: String
    categoriaId: String
    ativo: Boolean
  }

  input CreateServicoVarianteInput {
    servicoId: ID!
    porteId: String
    racaId: String
    pelagemId: String
    duracaoMinutos: Int!
    preco: Float!
  }

  input UpdateServicoVarianteInput {
    porteId: String
    racaId: String
    pelagemId: String
    duracaoMinutos: Int
    preco: Float
    ativo: Boolean
  }

  extend type Query {
    listCategorias(petshopId: ID!): [CategoriaServico!]!
    listServicos(petshopId: ID!, petId: ID): [Servico!]!
    getServico(id: ID!): Servico
  }

  extend type Mutation {
    createCategoria(petshopId: ID!, input: CreateCategoriaInput!): CategoriaServico!
    updateCategoria(id: ID!, input: UpdateCategoriaInput!): CategoriaServico!
    createServico(petshopId: ID!, input: CreateServicoInput!): Servico!
    updateServico(id: ID!, input: UpdateServicoInput!): Servico!
    deactivateServico(id: ID!): Boolean!
    createServicoVariante(input: CreateServicoVarianteInput!): ServicoVariante!
    updateServicoVariante(id: ID!, input: UpdateServicoVarianteInput!): ServicoVariante!
  }
`
