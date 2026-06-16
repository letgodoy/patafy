# E06 — Motor de Agenda e Disponibilidade

| Campo | Valor |
| --- | --- |
| **ID** | E06 |
| **Fase** | MVP |
| **Dependências** | E03, E05 |
| **Apps** | `api`, `packages/ui` (componente calendário compartilhado) |
| **Rastreabilidade** | RF07.1–4, RF08.3; CA AGD-01, AGD-02, ADM-05, ADM-06, ADM-07; Arquitetura §AvailabilityService |

## Objetivo

Implementar o serviço de domínio que calcula slots livres e garante integridade temporal da agenda (sem overbooking), base para agendamentos.

## Regras de negócio

### Capacidade

1. **1 banhista = 1 atendimento por intervalo** — sem sobreposição no mesmo `banhista_id`.
2. **N banhistas** com slot livre ⇒ até **N** atendimentos paralelos no mesmo instante.
3. Sem fila de espera; sem overbooking.

### Cálculo de slot

Entradas:
- `petshop_id`
- `data` (dia local da loja — timezone da aplicação/documentar)
- `duracao_total_minutos` (soma variantes)
- `banhista_id` opcional (se tutor escolheu banhista específico)

Algoritmo `AvailabilityService.getAvailableSlots`:

1. Carregar `horario_funcionamento` do `config_json` para o weekday.
2. Gerar faixas candidatas dentro de `abre`–`fecha` (múltiplas faixas por dia).
3. Excluir horários no passado (relativo a `now` no timezone da loja).
4. Para cada banhista elegível (todos com role banhista ativo, ou só o escolhido):
   - Listar agendamentos não cancelados/não finalizados que intersectam o dia
   - Aplicar `intervalo_entre_banhos_minutos` após cada agendamento existente
   - Subtrair `BloqueioAgenda` (por banhista ou loja inteira)
5. Slot disponível se existe banhista com janela contínua ≥ `duracao_total_minutos`.
6. Retornar slots com metadata: `banhistaId` sugerido (primeiro livre se não especificado), `inicio`, `fim`.

### Atribuição de banhista na criação

- Tutor não escolhe banhista → atribuir **primeiro banhista** com slot livre no horário escolhido.
- Tutor escolhe banhista → validar só aquele recurso.

### Anti double-booking (concorrência)

Mutations de criação/movimentação (implementadas no E07, **serviço aqui**):

```sql
-- Dentro de transação Prisma:
SELECT ... FROM agendamento
WHERE banhista_id = $1
  AND status NOT IN ('Cancelado', 'Finalizado', 'NaoCompareceu')
  AND tstzrange(data_hora_inicio, data_hora_inicio + duracao * interval '1 minute')
      && tstzrange($inicio, $fim)
FOR UPDATE;
-- Se conflito → erro SLOT_UNAVAILABLE
-- Senão → INSERT
```

Validação só em memória **não** é suficiente.

## API GraphQL (módulo `agendamentos` — queries apenas neste épico)

| Operação | Descrição |
| --- | --- |
| `availableSlots(input)` | Slots do dia |
| `availableBanhistas(input)` | Banhistas livres num slot + duração |

### Input exemplo

```graphql
input AvailableSlotsInput {
  petShopId: ID!
  date: Date!
  duracaoMinutos: Int!
  banhistaId: ID
  servicoVarianteIds: [ID!]  # opcional: recalcular duração server-side
}
```

## Implementação

### `AvailabilityService` (puro, testável)

- Sem dependência HTTP
- Injetar: config, agendamentos, bloqueios, staff
- Testes unitários extensivos:
  - Dia fechado → []
  - Duas faixas (manhã/tarde)
  - Buffer entre banhos
  - Bloqueio parcial
  - Dois banhistas → 2 slots no mesmo horário
  - Banhista único ocupado → slot indisponível

### Testes de integração

- Dois `createAgendamento` paralelos no mesmo slot → exatamente 1 sucesso

## Frontend (componente compartilhado `packages/ui`)

- `SlotPicker`: grade ou lista de horários clicáveis
- Props: slots[], loading, onSelect(slot)
- Estados: disponível, indisponível, selecionado
- Usado em `web-tutor` (E07) e `web-petshop` (E07)

## Fora do escopo

- Agendamento recorrente
- Otimização de rota / geolocalização

## Critérios de aceite

- [ ] CA AGD-01, AGD-02
- [ ] Horários fora do funcionamento não retornados
- [ ] Horários passados não retornados
- [ ] Bloqueios respeitados (ADM-05)
- [ ] Buffer `intervalo_entre_banhos_minutos` aplicado
- [ ] Paralelismo = número de banhistas livres (ADM-07)
- [ ] Testes unitários ≥ 15 cenários de borda
- [ ] Teste concorrência double-booking passa

## Histórias sugeridas

1. AvailabilityService core
2. Integração bloqueios + buffer
3. Queries GraphQL availableSlots
4. Lock transacional (helper para E07)
5. Componente SlotPicker
6. Testes unitários + integração concorrência

## Definição de pronto

API retorna slots corretos; serviço de lock pronto para E07; componente UI reutilizável.
