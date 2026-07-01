export { notificacoesTypeDefs } from './typedefs.js'
import { notificacoesQueries, notificacoesMutations } from './resolvers.js'

export const notificacoesResolvers = {
  Query: notificacoesQueries,
  Mutation: notificacoesMutations,
}
