export const petshopsTypeDefs = /* GraphQL */ `
  type PetShop {
    id: ID!
    nomeExibicao: String!
    razaoSocial: String!
    cnpj: String!
    endereco: String!
    cidade: String!
    estado: String!
    telefone: String
    email: String!
    ativo: Boolean!
    configJson: PetShopConfig!
    createdAt: String!
    updatedAt: String!
  }

  type PetShopConfig {
    slug: String
    nome: String
    logo: String
    corPrincipal: String
    animaisAtendidos: [String!]
    tamanhosAceitos: [String!]
    aceitaPetsAgressivos: Boolean
    horarioFuncionamento: String
    intervaloBanhoMinutos: Int
    prazoCancelamentoHoras: Int
    prazoRemarcacaoHoras: Int
    politicaCancelamento: String
    toleranciaAtrasoMinutos: Int
    cancelamentoAutomaticoAposAtraso: Boolean
  }

  type StaffMember {
    id: ID!
    userId: String!
    petshopId: String!
    nome: String!
    email: String!
    roles: [String!]!
    ativo: Boolean!
    createdAt: String!
  }

  type BloqueioAgenda {
    id: ID!
    petshopId: String!
    banhistaId: String
    dataInicio: String!
    dataFim: String!
    motivo: String
    createdAt: String!
  }

  input CreatePetShopInput {
    nomeExibicao: String!
    razaoSocial: String!
    cnpj: String!
    endereco: String!
    cidade: String!
    estado: String!
    telefone: String
    email: String!
  }

  input UpdatePetShopInput {
    nomeExibicao: String
    razaoSocial: String
    cnpj: String
    endereco: String
    cidade: String
    estado: String
    telefone: String
    email: String
  }

  input UpdatePetShopConfigInput {
    slug: String
    nome: String
    logo: String
    corPrincipal: String
    animaisAtendidos: [String!]
    tamanhosAceitos: [String!]
    aceitaPetsAgressivos: Boolean
    horarioFuncionamento: String
    intervaloBanhoMinutos: Int
    prazoCancelamentoHoras: Int
    prazoRemarcacaoHoras: Int
    politicaCancelamento: String
    toleranciaAtrasoMinutos: Int
    cancelamentoAutomaticoAposAtraso: Boolean
  }

  input CreatePetShopOwnerInput {
    petshopId: String!
    nome: String!
    cpf: String!
    email: String!
    telefone: String
    senha: String!
  }

  input CreateStaffInput {
    petshopId: String!
    nome: String!
    cpf: String!
    email: String!
    telefone: String
    roles: [String!]!
    senha: String!
  }

  input UpdateStaffInput {
    nome: String
    telefone: String
    roles: [String!]
  }

  input CreateBloqueioInput {
    petshopId: String!
    banhistaId: String
    dataInicio: String!
    dataFim: String!
    motivo: String
  }

  input ListPetShopsFilter {
    cidade: String
    estado: String
    nome: String
    ativo: Boolean
  }

  extend type Query {
    listPetShops(filter: ListPetShopsFilter): [PetShop!]!
    petShopById(id: ID!): PetShop
    petShopBySlug(slug: String!): PetShop
    myPetShop: PetShop
    listStaff(petshopId: ID!): [StaffMember!]!
    listBloqueios(petshopId: ID!): [BloqueioAgenda!]!
  }

  extend type Mutation {
    createPetShop(input: CreatePetShopInput!): PetShop!
    updatePetShop(id: ID!, input: UpdatePetShopInput!): PetShop!
    updatePetShopConfig(id: ID!, config: UpdatePetShopConfigInput!): PetShop!
    deactivatePetShop(id: ID!): Boolean!
    createPetShopOwner(input: CreatePetShopOwnerInput!): StaffMember!
    createStaff(input: CreateStaffInput!): StaffMember!
    updateStaff(id: ID!, input: UpdateStaffInput!): StaffMember!
    deactivateStaff(id: ID!): Boolean!
    createBloqueio(input: CreateBloqueioInput!): BloqueioAgenda!
    deleteBloqueio(id: ID!): Boolean!
  }
`
