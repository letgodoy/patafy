import { petshopsQueries } from './resolvers/queries.js'
import { adminMutations } from './resolvers/admin-mutations.js'
import { ownerMutations } from './resolvers/owner-mutations.js'

export { petshopsTypeDefs } from './typedefs.js'

export const petshopsResolvers = {
  Query: { ...petshopsQueries },
  Mutation: { ...adminMutations, ...ownerMutations },
}
