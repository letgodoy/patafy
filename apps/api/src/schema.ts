import { createSchema } from 'graphql-yoga'
import type { GraphQLContext } from './context.js'
import { authTypeDefs, authResolvers } from './modules/auth/index.js'
import { catalogoGlobalTypeDefs, catalogoGlobalResolvers } from './modules/catalogo-global/index.js'
import { petshopsTypeDefs, petshopsResolvers } from './modules/petshops/index.js'
import { petsTypeDefs, petsResolvers } from './modules/pets/index.js'

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
  typeDefs: [baseTypeDefs, authTypeDefs, catalogoGlobalTypeDefs, petshopsTypeDefs, petsTypeDefs],
  resolvers: [baseResolvers, authResolvers, catalogoGlobalResolvers, petshopsResolvers, petsResolvers],
})
