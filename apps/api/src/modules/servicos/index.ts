import { servicosQueries, servicosMutations } from './resolvers.js'

export { servicosTypeDefs } from './typedefs.js'

export const servicosResolvers = {
  Query: { ...servicosQueries },
  Mutation: { ...servicosMutations },
}
