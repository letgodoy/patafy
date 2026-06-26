export const petsTypeDefs = /* GraphQL */ `
  type Pet {
    id: ID!
    nome: String!
    tipoAnimalId: String!
    tipoAnimal: TipoAnimalRef
    racaId: String
    porteId: String
    pelagemId: String
    idade: Int
    peso: Float
    agressivo: Boolean!
    cuidadosEspeciais: String
    obsCompartilhadas: JSON
    tutores: [PetTutorInfo!]!
    deletedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type PetForShop {
    id: ID!
    nome: String!
    tipoAnimalId: String!
    tipoAnimal: TipoAnimalRef
    racaId: String
    porteId: String
    pelagemId: String
    idade: Int
    peso: Float
    agressivo: Boolean!
    cuidadosEspeciais: String
    obsCompartilhadas: JSON
    obsInternas: String
    tutores: [PetTutorInfo!]!
    createdAt: String!
  }

  type TipoAnimalRef {
    id: ID!
    nome: String!
  }

  type PetTutorInfo {
    tutorProfileId: String!
    nome: String!
    email: String!
    tipo: String!
  }

  type PetTutorConvite {
    id: ID!
    petId: String!
    pet: Pet
    convidadoEmail: String!
    status: String!
    expiresAt: String!
    createdAt: String!
    acceptedAt: String
  }

  type TutorSearchResult {
    id: ID!
    userId: String!
    nome: String!
    email: String!
    cpf: String!
    telefone: String
    endereco: String
    ativo: Boolean!
  }

  scalar JSON

  input CreatePetInput {
    nome: String!
    tipoAnimalId: String!
    racaId: String
    porteId: String
    pelagemId: String
    idade: Int
    peso: Float
    agressivo: Boolean
    cuidadosEspeciais: String
  }

  input UpdatePetInput {
    nome: String
    racaId: String
    porteId: String
    pelagemId: String
    idade: Int
    peso: Float
    agressivo: Boolean
    cuidadosEspeciais: String
  }

  input UpdatePetObsCompartilhadasInput {
    petId: ID!
    texto: String!
  }

  input UpdatePetObsInternasInput {
    petId: ID!
    texto: String!
  }

  input CreateTutorAssistedInput {
    nome: String!
    email: String!
    cpf: String!
    telefone: String
    endereco: String
  }

  extend type Query {
    myPets: [Pet!]!
    pet(id: ID!): Pet
    myPetTutorConvites: [PetTutorConvite!]!
    searchTutor(cpf: String, email: String): TutorSearchResult
    petForShop(id: ID!): PetForShop
  }

  extend type Mutation {
    createPet(input: CreatePetInput!): Pet!
    updatePet(id: ID!, input: UpdatePetInput!): Pet!
    deletePet(id: ID!): Boolean!
    createPetTutorConvite(petId: ID!, convidadoEmail: String!): PetTutorConvite!
    acceptPetTutorConvite(token: String!): Boolean!
    revokePetTutorConvite(id: ID!): Boolean!
    createTutorAssisted(input: CreateTutorAssistedInput!): TutorSearchResult!
    createPetForTutor(tutorProfileId: ID!, input: CreatePetInput!): Pet!
    updatePetObsInternas(input: UpdatePetObsInternasInput!): Boolean!
    updatePetObsCompartilhadas(input: UpdatePetObsCompartilhadasInput!): Boolean!
  }
`
