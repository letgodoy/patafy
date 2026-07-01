import { createSchema } from 'graphql-yoga'
import type { GraphQLContext } from './context.js'
import { authTypeDefs, authResolvers } from './modules/auth/index.js'
import { catalogoGlobalTypeDefs, catalogoGlobalResolvers } from './modules/catalogo-global/index.js'
import { petshopsTypeDefs, petshopsResolvers } from './modules/petshops/index.js'
import { petsTypeDefs, petsResolvers } from './modules/pets/index.js'
import { servicosTypeDefs, servicosResolvers } from './modules/servicos/index.js'
import { pacotesTypeDefs, pacotesResolvers } from './modules/pacotes/index.js'
import { agendamentosTypeDefs, agendamentosResolvers } from './modules/agendamentos/index.js'
import { atendimentosTypeDefs, atendimentosResolvers } from './modules/atendimentos/index.js'
import { notificacoesTypeDefs, notificacoesResolvers } from './modules/notificacoes/index.js'
import { auditoriaTypeDefs, auditoriaResolvers } from './modules/auditoria/index.js'

const baseTypeDefs = /* GraphQL */ `
  type Query {
    health: String!
  }

  type Mutation {
    _empty: String
  }
`

const baseResolvers = {
  Query: {
    health: () => 'ok',
  },
}

export const schema = createSchema<GraphQLContext>({
  typeDefs: [baseTypeDefs, authTypeDefs, catalogoGlobalTypeDefs, petshopsTypeDefs, petsTypeDefs, servicosTypeDefs, pacotesTypeDefs, agendamentosTypeDefs, atendimentosTypeDefs, notificacoesTypeDefs, auditoriaTypeDefs],
  resolvers: [baseResolvers, authResolvers, catalogoGlobalResolvers, petshopsResolvers, petsResolvers, servicosResolvers, pacotesResolvers, agendamentosResolvers, atendimentosResolvers, notificacoesResolvers, auditoriaResolvers],
})
