# E08 — Atendimento Operacional e Débito de Pacotes

| Campo | Valor |
| --- | --- |
| **ID** | E08 |
| **Fase** | MVP |
| **Dependências** | E05, E07 |
| **Apps** | `api`, `web-petshop` |
| **Rastreabilidade** | RF06.6, RF08.4, RF09; Modelo §3.15, PacoteItemDebito |

## Objetivo

Execução do banho no balcão: transições operacionais, observações, serviços adicionais durante o atendimento e débito idempotente de créditos de pacote ao entrar em **Em andamento**.

## Entidades

`Atendimento`, `PacoteItemDebito`, `AgendamentoServico` (adicionais)

## Regras de negócio

### Atendimento vs Agendamento

- `Atendimento` 1:1 com `Agendamento`
- **Status único** em `Agendamento.status` — UI pode dizer "status do atendimento" como alias
- `Atendimento.banhista_id` = quem **executou**; pode diferir de `Agendamento.banhista_id` após realocação silenciosa

### Transições operacionais (staff / banhista)

| Ação | Novo status |
| --- | --- |
| Iniciar banho | `EmAndamento` |
| Marcar pronto | `Pronto` |
| Finalizar | `Finalizado` |
| Check-in após atraso | `EmAndamento` (de `Atrasado`) |

### Débito de pacote (RF06.6)

**Gatilho:** transição para `EmAndamento` (primeira vez por agendamento).

Na **mesma transação** Prisma:

1. Identificar `PacotePet` / itens aplicáveis ao agendamento (serviços do snapshot vinculados a pacote).
2. Para cada `PacoteItem` aplicável:
   ```sql
   INSERT INTO pacote_item_debito (agendamento_id, pacote_item_id, pacote_pet_id, quantidade)
   VALUES (...)
   ON CONFLICT (agendamento_id, pacote_item_id) DO NOTHING
   RETURNING id;
   ```
3. **Só se insert ocorreu** → `UPDATE pacote_item SET quantidade_usada = quantidade_usada + quantidade`
4. Validar: pacote não expirado; saldo suficiente — senão erro `PACOTE_SALDO_INSUFICIENTE` **antes** da transição (ou não aplicar pacote)

**Idempotência:** retry da mutation não duplica débito.

### Serviços adicionais (RF08.4)

- Atendente adiciona serviços **durante** `EmAndamento` (até `Finalizado` / `Pronto` — definir: permitir até `Pronto`)
- Criar linhas em tabela `AtendimentoServicoAdicional` (nova) ou `AgendamentoServico` com flag `adicionado_em_atendimento: true`
- Recalcular preço informativo (relatórios E11); **não** estender slot automaticamente no MVP (registar em auditoria; extensão de agenda = decisão futura)

### Observações

- `observacoes_internas`: só pet shop
- `observacoes_gerais`: tutor + pet shop (tutor lê em detalhe do agendamento)

### Indicador pago

- `Agendamento.pago` toggle por staff
- Default false em cancelamento / não compareceu

## Nova entidade (migração)

```prisma
model AtendimentoServicoAdicional {
  id                  String @id @default(uuid())
  atendimento_id      String
  servico_variante_id String
  preco_cobrado       Decimal @db.Decimal(12, 2)
  created_at          DateTime @default(now())
}
```

## API GraphQL (módulo `atendimentos`)

| Operação | Quem | Descrição |
| --- | --- | --- |
| `startAtendimento` | staff, banhista | → EmAndamento + débito |
| `markPronto` | staff, banhista | → Pronto |
| `finalizarAtendimento` | staff | → Finalizado |
| `addServicoAdicional` | staff | Durante execução |
| `updateAtendimentoObservacoes` | staff, banhista | Obs internas/gerais |
| `atendimentoByAgendamento` | staff, tutor (só gerais) | Detalhe |

## Frontend web-petshop

### Vista atendente

- Painel detalhe do agendamento: timeline de status, botões de ação
- Formulário observações
- Lista serviços snapshot + adicionar serviço (modal select serviço/variante)
- Toggle pago

### Vista banhista

- `/minha-agenda` — agenda do dia simplificada (só seus atendimentos)
- Ações: iniciar, pronto, observações

## Fora do escopo

- Estender duração do slot ao adicionar serviço
- Pagamento na plataforma

## Critérios de aceite

- [ ] Débito só em primeira transição para EmAndamento
- [ ] UNIQUE (agendamento_id, pacote_item_id) respeitado
- [ ] Pacote expirado bloqueia débito
- [ ] Tutor vê saldo atualizado após débito
- [ ] Serviços adicionais registrados e visíveis no detalhe
- [ ] Realocação silenciosa de banhista reflete em Atendimento.banhista_id

## Histórias sugeridas

1. Serviço débito pacote idempotente + testes
2. startAtendimento / markPronto / finalizar
3. addServicoAdicional + migração
4. Observações e permissões
5. UI detalhe atendimento
6. UI vista banhista
7. Testes integração: double débito falha

## Definição de pronto

Operação de balcão completa; créditos debitados corretamente; banhista e atendente atualizam fluxo na UI.
