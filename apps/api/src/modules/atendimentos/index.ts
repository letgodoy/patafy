import { atendimentosTypeDefs } from './typedefs.js'
import { atendimentosQueries, atendimentosMutations } from './resolvers.js'

export { atendimentosTypeDefs }

export const atendimentosResolvers = {
  Query: atendimentosQueries,
  Mutation: atendimentosMutations,
}
