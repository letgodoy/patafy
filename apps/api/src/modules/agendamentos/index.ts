import { agendamentosQueries, agendamentosMutations } from './resolvers.js'
export { agendamentosTypeDefs } from './typedefs.js'
export const agendamentosResolvers = {
  Query: { ...agendamentosQueries },
  Mutation: { ...agendamentosMutations },
}
