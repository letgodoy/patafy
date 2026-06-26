import { pacotesQueries, pacotesMutations } from './resolvers.js'

export { pacotesTypeDefs } from './typedefs.js'

export const pacotesResolvers = {
  Query: { ...pacotesQueries },
  Mutation: { ...pacotesMutations },
}
