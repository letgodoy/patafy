# E11 — Relatórios Financeiros Operacionais

| Campo | Valor |
| --- | --- |
| **ID** | E11 |
| **Fase** | MVP |
| **Dependências** | E05, E07, E08 |
| **Apps** | `api`, `web-petshop` |
| **Rastreabilidade** | PRD §2.1 (relatórios financeiros owner), §4.6 (contabilização por intervalo) |

## Objetivo

Permitir ao **owner** contabilizar serviços realizados, atendimentos e pacotes vendidos/utilizados em um intervalo de tempo — sem processamento de pagamento na plataforma (valores informativos para acerto manual).

## Decisão aplicável

- **Entra no MVP** (decisão produto #6)
- Baseado em snapshots de preço no agendamento e vendas de pacote; indicador `pago` para filtro operacional

## Escopo dos relatórios

### 1. Resumo de atendimentos por período

| Métrica | Fonte |
| --- | --- |
| Total atendimentos | `Agendamento` com status `Finalizado` (incluir `Pronto`→`Finalizado`?) — **usar `Finalizado`** |
| Atendimentos cancelados / não compareceu | Contagem por status |
| Valor estimado total | Soma preços `AgendamentoServico` + `AtendimentoServicoAdicional` |
| Valor marcado como pago | Filtro `pago = true` |
| Valor pendente | `pago = false` |

### 2. Serviços realizados (detalhe)

Por `servico_id` / variante no intervalo:

- Quantidade realizada
- Valor unitário médio / total
- Agrupamento opcional por `CategoriaServico`

### 3. Pacotes

| Métrica | Fonte |
| --- | --- |
| Pacotes vendidos no período | `PacotePet.data_ativacao` |
| Valor total vendas | `valor_total` no momento da venda |
| Créditos consumidos | `PacoteItemDebito` no período |
| Créditos restantes (snapshot) | Soma `quantidade_total - quantidade_usada` ativos |

### 4. Export

- **CSV** download para cada relatório (MVP)
- PDF = pós-MVP

## Regras

1. Intervalo obrigatório: `from`, `to` (timestamptz); máximo 366 dias por query.
2. Timezone: do pet shop (configurar em `config_json` ou usar timezone fixo America/Sao_Paulo no MVP — documentar).
3. Preços de serviços adicionais: `AtendimentoServicoAdicional.preco_cobrado` (snapshot).
4. Preços do agendamento: resolver de `ServicoVariante.preco` **no momento do relatório** ou persistir `preco_snapshot` em `AgendamentoServico` — **decisão MVP:** adicionar coluna `preco_snapshot` em `AgendamentoServico` na migração deste épico para imutabilidade histórica.

### Migração sugerida

```prisma
model AgendamentoServico {
  // campos existentes +
  preco_snapshot Decimal @db.Decimal(12, 2)
  duracao_snapshot_minutos Int
}
```

Preencher no `createAgendamento` a partir da variante.

## API GraphQL (módulo `relatorios`)

| Operação | Quem | Descrição |
| --- | --- | --- |
| `relatorioAtendimentosResumo` | owner | Totais período |
| `relatorioServicosRealizados` | owner | Detalhe por serviço |
| `relatorioPacotes` | owner | Vendas + consumo |
| `exportRelatorioCsv` | owner | URL assinada ou string base64 (preferir rota HTTP `GET /reports/:tipo.csv`) |

### Rota HTTP CSV (recomendado)

- `GET /reports/atendimentos.csv?from=&to=&petshopId=` — auth staff owner
- Mesmo padrão do `.ics` (E07)

## Frontend web-petshop

### `/relatorios`

1. Seletor período (date range picker)
2. Cards resumo: total atendimentos, valor estimado, pago vs pendente
3. Tabela serviços realizados (ordenável)
4. Secção pacotes vendidos / créditos usados
5. Botões "Exportar CSV" por secção

### Permissões

- **Owner** apenas (atendente pode ter read-only — opcional; default owner only)

## Fora do escopo

- Integração contábil / NF
- Gateway de pagamento
- Dashboard gráficos avançados (pós-MVP)

## Critérios de aceite

- [ ] Owner filtra por intervalo e vê totais coerentes
- [ ] Serviços agrupados com quantidade e valor
- [ ] Pacotes vendidos listados por data de ativação
- [ ] Débitos de pacote contabilizados no período
- [ ] CSV exportável e abre no Excel
- [ ] `preco_snapshot` persistido no agendamento
- [ ] Apenas dados do `petshop_id` do utilizador

## Histórias sugeridas

1. Migração preco_snapshot + backfill null para dados futuros
2. Serviços de agregação SQL/Prisma
3. Queries GraphQL relatórios
4. Rotas CSV
5. UI /relatorios com cards e tabelas
6. Testes: totais com agendamento finalizado + adicionais + pacote

## Definição de pronto

Owner exporta visão financeira operacional do período sem sair da plataforma.
