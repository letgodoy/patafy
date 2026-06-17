# E00 — Fundação da Plataforma

| Campo | Valor |
| --- | --- |
| **ID** | E00 |
| **Fase** | MVP — bloqueante |
| **Dependências** | Nenhuma |
| **Apps** | `api`, `worker`, `web-tutor`, `web-petshop`, `web-admin` |
| **Rastreabilidade** | RNF01, RNF02, RNF04; ADR-001, ADR-007 |

## Objetivo

Criar o esqueleto técnico do monorepo Nx com três SPAs, API GraphQL, worker e schema Prisma alinhado ao modelo de domínio — base para todos os épicos seguintes.

## Escopo

### Monorepo Nx

```
apps/
  api/                 # Fastify + GraphQL Yoga + Prisma
  worker/              # Outbox + jobs periódicos
  web-tutor/           # React + Vite + Park UI
  web-petshop/       # React + Vite + Park UI
  web-admin/           # React + Vite + Park UI
packages/
  db/                  # schema.prisma + client (recomendado)
  graphql-client/      # tipos gerados (GraphQL Code Generator)
  ui/                  # componentes Park UI partilhados (opcional neste épico)
  shared-types/        # enums, config JSON types
infra/
  docker-compose.yml   # postgres + api + worker
```

- Gestor de pacotes: **pnpm** (recomendado) ou npm
- TypeScript strict em todos os projetos
- ESLint + Prettier partilhados

### API (`apps/api`)

- **Fastify** com plugins: CORS (três origens), helmet, logging
- Rotas HTTP:
  - `GET /health/live` → 200
  - `GET /health/ready` → 200 se PostgreSQL conectado
- **GraphQL Yoga** em `POST /graphql` com schema mínimo: `Query { health: String! }`
- Estrutura de pastas por bounded context (pastas vazias com README ou index):
  `auth`, `catalogo-global`, `petshops`, `pets`, `servicos`, `pacotes`, `agendamentos`, `atendimentos`, `notificacoes`, `auditoria`, `relatorios`
- Política de erros Yoga: `extensions.code` estável (definir enum inicial em `shared-types`)

### Prisma (`packages/db` ou `apps/api/prisma`)

Migração inicial com **todas** as entidades do modelo de domínio, mais extensões acordadas:

**Entidades base (modelo de domínio):**
`User`, `TutorProfile`, `PetshopUserProfile`, `TipoAnimal`, `Raca`, `Porte`, `Pelagem`, `Pet`, `PetTutor`, `PetTutorConvite`, `PetShop`, `Servico`, `ServicoVariante`, `CategoriaServico`, `Pacote`, `PacoteItem`, `PacoteItemDebito`, `PacotePet`, `Agendamento`, `AgendamentoServico`, `Atendimento`, `BloqueioAgenda`, `NotificacaoOutbox`, `RegistroOperacional`

**Extensões deste projeto:**

```prisma
model PetShop {
  // campos existentes do modelo de domínio +
  cidade    String   // filtro MVP tutor
  estado    String   // UF, 2 chars — filtro MVP tutor
  latitude  Decimal? @db.Decimal(10, 7)  // evolução geolocalização
  longitude Decimal? @db.Decimal(10, 7)
}

model CategoriaServico {
  id          String   @id @default(uuid())
  petshop_id  String
  nome        String
  ordem       Int?
  ativo       Boolean  @default(true)
  petshop     PetShop  @relation(...)
  servicos    Servico[]
}

model Servico {
  // campos existentes +
  categoria_id String?
  categoria    CategoriaServico? @relation(...)
}

enum AgendamentoStatus {
  AguardandoConfirmacao
  Confirmado
  Cancelado
  EmAndamento
  Atrasado
  Pronto
  Finalizado
  NaoCompareceu   // status separado (decisão produto #10)
}
```

- Convenções: UUID, `timestamptz`, `numeric(12,2)` para preços
- Índices críticos documentados em comentários no schema (agenda, outbox)

### Worker (`apps/worker`)

- Processo Node que importa Prisma client e serviços da API (ou `packages/db`)
- Loop de polling vazio (placeholder) com intervalo configurável
- Health log a cada ciclo

### Frontends (3 apps)

Cada app: React 18 + Vite + Park UI + React Router

- Shell com layout vazio, rota `/` e página 404
- Firebase SDK instalado (config via env) — sem fluxos ainda
- Cliente GraphQL (urql ou Apollo) apontando para `VITE_API_URL`
- GraphQL Code Generator configurado (schema introspection ou SDL commitado)
- `manifest.webmanifest` + ícones placeholder (PWA base)

### Docker Compose (dev)

- `postgres:15` com volume
- `api` com hot reload
- `worker`
- Variáveis documentadas em `.env.example`:

```
DATABASE_URL=
FIREBASE_PROJECT_ID=
CORS_ORIGIN_TUTOR=
CORS_ORIGIN_PETSHOP=
CORS_ORIGIN_ADMIN=
APP_BASE_URL=
RESEND_API_KEY=          # usado no E09
```

### CI (mínimo)

- `nx run-many -t lint,typecheck,test` nos projetos afetados
- `prisma migrate deploy` em pipeline de staging (documentar)

## Fora do escopo

- Lógica de negócio, autenticação real, deploy produção
- Implementação de resolvers além de `health`
- Templates de e-mail

## Critérios de aceite

- [ ] `docker compose up` sobe Postgres + API + worker sem erro
- [ ] `GET /health/ready` retorna 200 com BD conectado
- [ ] `nx run web-tutor:build`, `web-petshop:build`, `web-admin:build` passam
- [ ] `prisma migrate dev` cria todas as tabelas incluindo `CategoriaServico` e enum com `NaoCompareceu`
- [ ] Três SPAs carregam no browser em portas distintas
- [ ] Codegen gera tipos TS a partir do schema GraphQL

## Histórias sugeridas

1. Inicializar monorepo Nx com 5 apps e packages
2. Prisma schema completo + migração inicial
3. Fastify + Yoga skeleton + estrutura de módulos
4. Worker skeleton com polling
5. Docker compose + `.env.example`
6. Shell das 3 SPAs + codegen GraphQL
7. CI básico (lint + typecheck + build)

## Definição de pronto

Monorepo buildável; BD migrada; API responde health; três fronts abrem; worker roda em loop; documentação de setup no README raiz do repo (se não existir, criar seção mínima de dev setup).
