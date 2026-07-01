# Melhorias Pós-MVP — Patafy Care

> Documento gerado após audit técnico do projeto ao término do E12 (MVP completo).  
> Organizado por área e prioridade para guiar a evolução da plataforma.

---

## Índice

1. [Segurança](#1-segurança)
2. [Confiabilidade do Worker](#2-confiabilidade-do-worker)
3. [Performance e Banco de Dados](#3-performance-e-banco-de-dados)
4. [Qualidade de Código e Testes](#4-qualidade-de-código-e-testes)
5. [Experiência do Desenvolvedor](#5-experiência-do-desenvolvedor)
6. [Frontend — UX e Polish](#6-frontend--ux-e-polish)
7. [Roadmap Pós-MVP — Funcionalidades](#7-roadmap-pós-mvp--funcionalidades)

---

## 1. Segurança

### 1.1 Validação de inputs na API

**Problema**: A API não usa validação runtime em nenhum lugar. Toda a segurança de tipos é estrutural (TypeScript em compile time). Inputs como `dataHoraInicio`, `from`/`to` de queries e configs JSON são convertidos com `new Date(string)` e `JSON.parse()` sem verificação prévia.

Casos concretos:
- `createAgendamento` — `new Date(input.dataHoraInicio)` com string inválida gera `Invalid Date` sem mensagem amigável
- `agendaPetShop` — `from` e `to` sem validação de formato ISO
- `updatePetShopConfig.horarioFuncionamento` — JSON raw sem validação de schema; qualquer JSON válido é aceito, quebrando silenciosamente a lógica de disponibilidade
- `createPetShopOwner` / `createStaff` — CPF salvo sem validação matemática (a função `validarCPF` existe em `lib/cpf.ts` mas não é chamada aqui)

**Solução**: Criar `packages/api-schemas` (ou `apps/api/src/lib/schemas.ts`) com schemas Zod por operação. Chamar `schema.safeParse(input)` no início de cada resolver e lançar `GraphQLError` com `code: 'BAD_USER_INPUT'` em caso de falha.

```ts
// exemplo
const AgendamentoInput = z.object({
  dataHoraInicio: z.string().datetime(),
  servicoVarianteIds: z.array(z.string().uuid()).min(1),
  petshopId: z.string().uuid(),
  petId: z.string().uuid(),
})
```

---

### 1.2 Rate limiting por operação

**Problema**: Rate limit global de 100 req/min por IP para todos os endpoints. Não protege contra:
- Uso excessivo de operações caras (`listPetShops`, `agendaPetShop`)
- Batch de operações GraphQL (Yoga aceita arrays de operations por padrão)
- Spike de operações de escrita (`createAgendamento`, `createPetTutorConvite`)

**Solução**:
- Rate limits diferenciados por rota: mutations críticas com janela mais restrita
- Desabilitar batch de operações GraphQL no Yoga (`batchedRequestsBodyParser: false`)
- Rate limit baseado em `userId` quando autenticado (não apenas IP)

---

### 1.3 Campos sensíveis expostos no GraphQL

**Problema**:
- `listPetShops` retorna `cnpj`, `razaoSocial`, `email` de todos os petshops para qualquer usuário autenticado
- `availableSlots` e `availableBanhistas` não chamam `requireAuth` — qualquer cliente sem token pode consultar disponibilidade e banhistas de qualquer petshop

**Solução**:
- Adicionar `requireAuth` em `availableSlots` e `availableBanhistas`, ou documentar explicitamente a decisão de deixar público (para landing page/preview)
- Criar um tipo `PetShopPublico` sem `cnpj`/`razaoSocial` para listagem geral; manter tipo completo apenas para staff/owner

---

### 1.4 Validação de datas nos endpoints CSV

**Problema**: `apps/api/src/plugins/reports.ts` recebe `from` e `to` como query strings. Se o valor for inválido (ex: `"abc"`), `new Date("abc")` cria `Invalid Date`, `validateRange` passa (NaN comparisons), e o Prisma lança erro interno não tratado.

**Solução**: Adicionar parsing com Zod (`.datetime()` ou `z.string().refine(v => !isNaN(Date.parse(v)))`) no início dos handlers de CSV.

---

## 2. Confiabilidade do Worker

### 2.1 Graceful shutdown ausente

**Problema**: `apps/worker/src/main.ts` não registra handlers para `SIGTERM`/`SIGINT`. Em ambientes containerizados (Docker/Kubernetes), o processo recebe SIGTERM e tem ~30s antes de SIGKILL. Se cair no meio de um batch, os itens ficam como `pendente` e são reprocessados (possível duplicação de e-mail).

**Solução**:
```ts
let running = true

process.on('SIGTERM', () => { running = false })
process.on('SIGINT',  () => { running = false })

while (running) {
  await processOutbox()
  if (!running) break
  await setTimeout(POLL_INTERVAL_MS)
}

await prisma.$disconnect()
process.exit(0)
```

---

### 2.2 Backoff exponencial apenas cosmético

**Problema**: O worker calcula `retryDelay(tentativas)` e loga o valor, mas o item volta ao status `pendente` imediatamente. Na próxima rodada do polling (5 segundos depois) o item já é tentado novamente — o backoff não funciona de verdade.

**Solução**: Adicionar `next_retry_at DateTime?` no schema `NotificacaoOutbox` e filtrar `{ next_retry_at: { lte: new Date() } }` no batch. Ao registrar falha, calcular e persistir `next_retry_at`:

```ts
next_retry_at: new Date(Date.now() + retryDelay(item.tentativas + 1))
```

---

### 2.3 Race condition em escala horizontal

**Problema**: O `processOutbox` faz `findMany` sem lock. Se duas instâncias do worker rodarem em paralelo (ex: rolling deploy), o mesmo item pode ser processado por ambas → e-mail duplicado.

**Solução**: Atualizar atomicamente o status para `processando` antes de enviar:

```ts
// claim atômico
const claimed = await prisma.$queryRaw`
  UPDATE notificacoes_outbox
  SET status = 'processando', updated_at = now()
  WHERE id IN (
    SELECT id FROM notificacoes_outbox
    WHERE status = 'pendente' AND canal = 'email'
      AND (next_retry_at IS NULL OR next_retry_at <= now())
    LIMIT 20
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *
`
```

`SKIP LOCKED` garante que cada instância processe itens distintos.

---

### 2.4 Janela de duplicação por crash pós-envio

**Problema**: Se o processo cair após `resend.emails.send()` e antes de `prisma.notificacaoOutbox.update({ status: 'enviado' })`, o e-mail foi enviado mas o status permanece `pendente`. Próxima execução reenvía.

**Solução**: Usar `idempotency_key` da API do Resend:
```ts
await resend.emails.send({
  ...content,
  headers: { 'X-Idempotency-Key': item.id },
})
```

---

### 2.5 Ausência de testes no worker

O worker não tem nenhum arquivo de teste. As funções críticas `buildEmailContent`, `buildAgendamentoPayload` e o loop de retry são completamente não testadas.

**Solução**: Adicionar vitest ao worker e testar pelo menos:
- `buildEmailContent` para cada `OutboxTipo` (assertions no subject/html)
- Lógica de retry: tentativas → status `falha` após MAX_TENTATIVAS
- `buildAgendamentoPayload` com mock do Prisma

---

## 3. Performance e Banco de Dados

### 3.1 Queries sem paginação

As queries abaixo fazem `findMany()` sem `take`/`cursor` e podem explodir com volume:

| Query | Arquivo | Risco |
|---|---|---|
| `listPetShops` | `petshops/queries.ts` | 1.000+ petshops = resposta enorme |
| `myAgendamentos` | `agendamentos/queries.ts` | Tutor com 2 anos de histórico |
| `agendaPetShop` | `agendamentos/queries.ts` | Visão mensal de petshop grande |
| `listSystemAdmins` | `catalogo-global/resolvers/admins.ts` | Carrega TODOS os usuários |
| `registrosPorAgendamento` | `auditoria/resolvers.ts` | Agendamento com histórico longo |
| `registrosOperacionais` | `auditoria/resolvers.ts` | Já tem `take: limit ?? 50` ✓ |

**Solução**: Implementar paginação cursor-based nas queries críticas:
```graphql
type PetShopPage {
  items: [PetShop!]!
  nextCursor: ID
  hasMore: Boolean!
}

query listPetShops(filter: ListPetShopsFilter, limit: Int = 20, cursor: ID): PetShopPage!
```

---

### 3.2 `petShopBySlug` filtra em JavaScript

**Problema**: `apps/api/src/modules/petshops/queries.ts` faz `findMany({ where: { ativo: true } })` e filtra em JS pelo slug dentro do JSONB. Com 1.000 petshops, carrega tudo em memória a cada busca.

**Solução**: Extrair `slug` para uma coluna própria em `PetShop` com `@unique`, ou usar query nativa JSONB:

```ts
// Opção A: coluna extraída (migration + backfill)
// schema.prisma: slug String? @unique @@map("slug")

// Opção B: query JSONB nativa
const found = await ctx.prisma.$queryRaw`
  SELECT * FROM petshops
  WHERE ativo = true AND config_json->>'slug' = ${slug}
  LIMIT 1
`
```

---

### 3.3 N+1 em `listSystemAdmins`

**Problema**: Loop sequencial com chamada ao Firebase SDK para cada usuário:
```ts
for (const u of users) {
  const fbUser = await admin.auth().getUser(u.firebase_uid)  // N chamadas
```

**Solução**: Usar `admin.auth().getUsers(identifiers)` que aceita até 100 identificadores em uma única chamada:
```ts
const fbUsers = await admin.auth().getUsers(
  users.map(u => ({ uid: u.firebase_uid }))
)
```

---

### 3.4 DataLoaders criados mas nunca usados

`ctx.loaders` foi adicionado ao contexto (E12) mas nenhum resolver chama `ctx.loaders.petLoader.load(id)`. Os resolvers continuam fazendo queries diretas. Os loaders devem ser usados nos resolvers de lista que expandem relações (`mapAgendamento`, `atendimentoByAgendamento`, etc.) ou removidos para não gerar falsa sensação de otimização.

---

### 3.5 Índices faltando

| Tabela | Coluna | Uso | Ação |
|---|---|---|---|
| `pet_tutores` | `tutor_profile_id` | `myPets` filtra por tutor | Adicionar `@@index([tutor_profile_id])` |
| `agendamento_servicos` | `agendamento_id` | Sempre buscados por agendamento | Adicionar `@@index([agendamento_id])` |
| `pacote_item_debitos` | `pacote_pet_id` | `mapSaldo` filtra por pacote_pet | Adicionar `@@index([pacote_pet_id])` |
| `petshop_user_profiles` | `[petshop_id, ativo]` | `loadBanhistas` filtra por petshop+ativo | Adicionar `@@index([petshop_id, ativo])` |

---

## 4. Qualidade de Código e Testes

### 4.1 `debitarPacote` fora da transação

**Problema crítico**: Em `apps/api/src/modules/atendimentos/resolvers.ts`, a função `debitarPacote` é chamada fora da `$transaction` de `finalizarAtendimento`. O status do agendamento é atualizado na transação, mas o débito do pacote ocorre depois. Se o processo cair entre as duas operações, o agendamento fica `Finalizado` sem o pacote debitado.

**Solução**: Mover `debitarPacote` para dentro da transação, aceitando `tx` como parâmetro em vez de `ctx.prisma`.

---

### 4.2 Lógica de criação de usuário duplicada em 3 lugares

`createTutorAssisted`, `createPetShopOwner` e `createStaff` têm o mesmo padrão: criar no Firebase → criar no Postgres → rollback manual se Prisma falhar. Duplicação com risco de divergência.

**Solução**: Extrair `createFirebaseAndDbUser(params)` em `apps/api/src/lib/create-user.ts` compartilhado pelos três resolvers.

---

### 4.3 Cobertura de testes

Existe apenas `availability.service.test.ts` com 19 casos. Todo o restante sem cobertura:

| Módulo | Prioridade | Motivo |
|---|---|---|
| `agendamento.service.ts` | Alta | Lock pessimista é lógica crítica |
| `atendimentos/resolvers.ts` | Alta | `debitarPacote` tem edge cases de idempotência |
| `relatorios/resolvers.ts` | Média | Cálculos financeiros precisam de assertions exatas |
| `worker/main.ts` + `templates/email.ts` | Média | Loop de retry + templates de e-mail |
| `pacotes/resolvers.ts` | Média | `valor_total_snapshot` e cálculo de desconto |
| `auth/rbac.ts` | Baixa | Funções simples mas amplamente usadas |

---

### 4.4 `updatePetShopConfig` verifica slug em memória

`apps/api/src/modules/petshops/owner-mutations.ts`: carrega TODOS os petshops ativos para verificar unicidade do slug em JavaScript. Deveria ser substituído por `findFirst` com query JSONB ou coluna extraída com `@unique`.

---

## 5. Experiência do Desenvolvedor

### 5.1 Scripts faltando no `package.json` raiz

| Script | Sugestão |
|---|---|
| `dev` | `nx run-many -t serve` ou `concurrently` (api + worker + 3 frontends) |
| `codegen` | `pnpm --filter @patafy/graphql-client run codegen` |
| `db:seed` | `pnpm --filter @patafy/db exec prisma db seed` |
| `db:reset` | `db:migrate` + `db:seed` em sequência |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` |

### 5.2 Codegen requer API rodando

`codegen.ts` aponta para `http://localhost:3000/graphql`. Se a API estiver parada, o codegen falha.

**Solução**: Adicionar um script `db:schema:export` que usa `printSchema` do graphql-yoga para exportar `schema.graphql` e configurar o codegen para apontar para esse arquivo:

```ts
// codegen.ts
schema: './schema.graphql',  // arquivo local gerado
```

---

## 6. Frontend — UX e Polish

### 6.1 Toaster usado apenas para erros

O `toaster` do Ark UI está montado nas 3 apps mas só é chamado via `QueryCache.onError` / `MutationCache.onError`. Sucessos de mutations usam padrões inconsistentes: parágrafo verde inline, tela de sucesso full-screen, ou sem feedback algum.

**Solução**: Padronizar chamadas `toaster.create({ type: 'success', title: '...', description: '...' })` nos `onSuccess` handlers das mutations críticas (criar agendamento, finalizar atendimento, salvar configurações, etc.).

---

### 6.2 Estados de erro ausentes

- `AtendimentoDetalhe.tsx`: se a query falhar, exibe "Carregando..." indefinidamente (não há distinção entre `isLoading` e `isError`)
- `AgendarPage.tsx`: mesmo problema quando slug não existe
- `VenderPacotePage.tsx`: wizard sem tratamento de erro nas etapas intermediárias

**Solução**: Usar `isError` + `error` do `useQuery` para exibir mensagens de erro explícitas com botão de retry.

```tsx
if (isError) return (
  <div>
    <p style={{ color: 'red' }}>Erro ao carregar. {error?.message}</p>
    <button onClick={() => refetch()}>Tentar novamente</button>
  </div>
)
```

---

### 6.3 Formulários numéricos com `z.string()` em vez de `z.coerce.number()`

`ConfiguracoesPage.tsx` usa `z.string().optional()` para campos como `prazoCancelamento`, depois faz `Number(data.prazoCancelamento)` no submit. Se o usuário digitar `"abc"`, `NaN` é enviado ao servidor sem erro no formulário.

**Solução**: Usar `z.coerce.number().int().min(0).optional()` nos schemas Zod dos campos numéricos.

---

### 6.4 `AgendarPage.tsx` sem validação Zod

O wizard de agendamento usa `useState` puro sem nenhum schema de validação. Não há verificação de:
- `servicoVarianteIds` não-vazio antes de avançar
- Data selecionada no passado
- Slot realmente disponível ao avançar do step

---

## 7. Roadmap Pós-MVP — Funcionalidades

Funcionalidades fora do escopo do MVP que fazem sentido como próximos épicos:

| # | Funcionalidade | Valor | Complexidade |
|---|---|---|---|
| E13 | **Pagamentos online** — integração Stripe/Pagar.me, checkout na tela de agendamento, indicador `pago` automático | Alto | Alta |
| E14 | **App mobile** — React Native ou PWA offline-first para tutores; notificações push via FCM | Alto | Alta |
| E15 | **Geolocalização** — busca de petshops por proximidade (`listPetShops(near: NearInput)`), mapa na LojaPage | Alto | Média |
| E16 | **Multi-unidade** — petshop com múltiplas filiais sob o mesmo CNPJ, agenda consolidada | Médio | Alta |
| E17 | **Dashboard analytics** — gráficos de atendimentos, taxa de cancelamento, receita mensal via Recharts/Chart.js | Médio | Média |
| E18 | **Fidelidade / CRM** — sistema de pontos para tutores, histórico de relacionamento com o pet | Médio | Média |
| E19 | **Nota Fiscal** — integração com foco.nfe ou similar, geração automática ao finalizar atendimento | Médio | Alta |
| E20 | **WhatsApp** — notificações via WhatsApp API (Twilio/Z-API) como canal adicional além do e-mail | Alto | Média |
| E21 | **Avaliações** — tutores avaliam o serviço após finalização, petshop vê NPS por banhista | Médio | Baixa |
| E22 | **Paginação e busca full-text** — Elasticsearch ou Postgres FTS em pets, tutores e histórico | Baixo | Alta |

---

## Priorização Sugerida

### Sprint 1 — Estabilização (antes de crescer)
1. Graceful shutdown no worker + claim atômico com `SKIP LOCKED`
2. `next_retry_at` no schema para backoff real
3. `requireAuth` em `availableSlots`/`availableBanhistas`
4. `debitarPacote` dentro da transação de `finalizarAtendimento`
5. Validação Zod nos inputs de data e JSON da API

### Sprint 2 — Escala
1. Paginação cursor-based em `listPetShops`, `myAgendamentos`, `agendaPetShop`
2. Índices de banco faltando (migration)
3. `petShopBySlug` via coluna extraída ou query JSONB
4. N+1 em `listSystemAdmins` → `getUsers` em batch

### Sprint 3 — Qualidade
1. Testes para `agendamento.service`, `relatorios`, worker
2. Extração de `createFirebaseAndDbUser` compartilhado
3. Toaster de sucesso nas mutations críticas
4. Estados de erro em `AtendimentoDetalhe` e `AgendarPage`

### Sprint 4+ — Funcionalidades
> Conforme priorização de produto (E13 em diante)

---

*Última atualização: pós-E12 (MVP completo)*
