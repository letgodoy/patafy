export const relatoriosTypeDefs = /* GraphQL */ `
  type RelatorioAtendimentosResumo {
    totalFinalizados: Int!
    totalCancelados: Int!
    totalNaoCompareceu: Int!
    valorEstimado: Float!
    valorPago: Float!
    valorPendente: Float!
  }

  type RelatorioServicoItem {
    servicoVarianteId: ID!
    servicoNome: String!
    varianteNome: String!
    quantidade: Int!
    valorTotal: Float!
    valorMedio: Float!
  }

  type RelatorioPacotesResumo {
    pacotesVendidos: Int!
    valorTotalVendas: Float!
    creditosConsumidos: Int!
    creditosRestantes: Int!
  }

  extend type Query {
    relatorioAtendimentosResumo(petshopId: ID!, from: String!, to: String!): RelatorioAtendimentosResumo!
    relatorioServicosRealizados(petshopId: ID!, from: String!, to: String!): [RelatorioServicoItem!]!
    relatorioPacotes(petshopId: ID!, from: String!, to: String!): RelatorioPacotesResumo!
  }
`
