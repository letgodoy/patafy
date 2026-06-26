import { petsQueries, petsMutations } from './resolvers.js'

export { petsTypeDefs } from './typedefs.js'

export const petsResolvers = {
  Query: { ...petsQueries },
  Mutation: { ...petsMutations },
}
