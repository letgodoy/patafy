# E10 — Auditoria Operacional

| Campo | Valor |
| --- | --- |
| **ID** | E10 |
| **Fase** | MVP |
| **Dependências** | E07, E08 |
| **Apps** | `api`, `web-petshop`, `web-admin` (leitura global) |
| **Rastreabilidade** | RNF03; CA ADM-AUD-01; ADR-005 |

## Objetivo

Trilha **append-only** de ações relevantes (`RegistroOperacional`) com consulta filtrada por pet shop e por agendamento.

## Entidade

`RegistroOperacional`

```
id, occurred_at, actor_user_id, petshop_id, entity_type, entity_id, action, metadata (jsonb)
```

## Eventos a registrar

| action | Quando | metadata exemplo |
| --- | --- | --- |
| `CREATED` | Agendamento criado | origem, servicos |
| `STATUS_CHANGED` | Qualquer transição | from, to |
| `RESCHEDULED` | Data/hora alterada | old_inicio, new_inicio |
| `BANHISTA_CHANGED` | Troca banhista | old_id, new_id, silencioso: bool |
| `PAGO_TOGGLED` | pago alterado | old, new |
| `PACOTE_DEBITADO` | Débito em EmAndamento | pacote_item_ids |
| `SERVICO_ADICIONAL` | Serviço extra no atendimento | variante_id, preco |
| `CANCELLED` | Cancelado | motivo |
| `NAO_COMPARECEU` | NaoCompareceu | manual \| auto |
| `OBS_UPDATED` | Observações | tipo: interna \| geral |

### Regras

1. **Append-only** — sem UPDATE/DELETE na tabela (enforçar na aplicação; opcional trigger BD).
2. `actor_user_id` null quando ação do **worker** (job automático).
3. Escrita na **mesma transação** do comando de domínio quando possível.
4. Pet shop vê apenas `petshop_id` próprio.
5. `system_admin` vê todos (filtro opcional).

## API GraphQL (módulo `auditoria`)

| Operação | Quem | Descrição |
| --- | --- | --- |
| `registrosOperacionais(filter)` | staff, admin | Lista paginada DESC por occurred_at |
| `registrosPorAgendamento(agendamentoId)` | staff, tutor (limitado) | Timeline do agendamento |

### Filter

```graphql
input RegistroOperacionalFilter {
  petshopId: ID
  entityType: String
  entityId: ID
  action: String
  from: DateTime
  to: DateTime
  limit: Int
  cursor: String
}
```

## Frontend

### web-petshop

- Timeline no detalhe do agendamento (`/agenda/:id`)
- `/auditoria` — listagem com filtros período e tipo de ação (owner)

### web-admin

- `/auditoria` — visão global com filtro petshop

### web-tutor

- Histórico limitado no detalhe do agendamento (sem obs internas nem ações de staff sensíveis)

## Integração

- `AgendamentoStateMachine` (E07) chama `AuditService.log(...)` em cada transição
- E08: débito e serviços adicionais
- E09: opcional correlacionar `metadata.email_outbox_id`

## Fora do escopo

- Export CSV auditoria
- Retenção/arquivo automático

## Critérios de aceite

- [ ] CA ADM-AUD-01
- [ ] Ordenação mais recente primeiro
- [ ] Filtro por petshop_id isola tenant
- [ ] Filtro por agendamento funciona
- [ ] Exibe data, ação, autor, resumo metadata
- [ ] Registros imutáveis (teste: tentativa delete falha)

## Histórias sugeridas

1. AuditService + integração state machine
2. Query registrosOperacionais com paginação
3. UI timeline detalhe agendamento
4. UI listagem auditoria petshop
5. Testes isolamento tenant

## Definição de pronto

Toda ação crítica de agenda/atendimento gera registro consultável pelo pet shop.
