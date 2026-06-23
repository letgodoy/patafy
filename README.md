# Patafy Care

Plataforma de agendamento de serviços para pet shops. Tutores agendam banhos e cuidados diretamente pelo app; pet shops gerenciam agenda, serviços, pacotes e notificações pelo painel administrativo.

## Estrutura do monorepo

```
apps/
  api/          → API GraphQL (Fastify + GraphQL Yoga + Prisma) — porta 3000
  worker/       → Worker de notificações e jobs periódicos
  web-tutor/    → SPA do tutor (React + Vite) — porta 5173
  web-petshop/  → SPA do pet shop (React + Vite) — porta 5174
  web-admin/    → SPA do admin do sistema (React + Vite) — porta 5175
packages/
  db/           → Prisma schema + client compartilhado
  shared-types/ → Enums e tipos TypeScript compartilhados
infra/
  docker-compose.yml → Ambiente de desenvolvimento completo
docs/
  PRD.md              → Requisitos do produto
  Arquitetura.md      → Decisões técnicas e ADRs
  Modelo-de-Dominio.md → Entidades, bounded contexts e diagrama ER
  epicos/             → Histórias de implementação (E00–E12)
```

## Pré-requisitos

- [Node.js](https://nodejs.org) v20+ (v26 recomendado — usa `--env-file` nativo)
- [pnpm](https://pnpm.io) v8+
- PostgreSQL 15 — via Docker **ou** Homebrew (macOS)

```bash
npm install -g pnpm
```

---

## Configuração inicial

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/letgodoy/patafy.git
cd patafy
pnpm install
```

### 2. Banco de dados

**Opção A — Docker**
```bash
docker compose -f infra/docker-compose.yml up postgres -d
```

**Opção B — Homebrew (macOS, sem Docker)**
```bash
brew install postgresql@15
brew services start postgresql@15
psql postgres -c "CREATE USER patafy WITH PASSWORD 'patafy' CREATEDB;"
psql postgres -c "CREATE DATABASE patafy OWNER patafy;"
```

### 3. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com as credenciais do projeto:

| Variável | Onde encontrar |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Configurações do projeto → Geral |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Console → Configurações → Contas de serviço → Gerar nova chave privada (cole o JSON em uma linha) |
| `VITE_FIREBASE_*` | Firebase Console → Configurações → Geral → Seus apps → SDK config |
| `DATABASE_URL` | Já preenchida para dev local (`postgresql://patafy:patafy@localhost:5432/patafy`) |

### 4. Migrations e seed

```bash
# Aplicar migrations
pnpm --filter @patafy/db run migrate

# Popular catálogo global (raças, portes, pelagens)
pnpm --filter @patafy/db run seed
```

### 5. Primeiro admin do sistema

Na primeira vez, crie o usuário admin via script (rode uma única vez):

```bash
# Edite o email/senha desejados dentro do arquivo antes de rodar
node --env-file=.env apps/api/node_modules/.bin/tsx apps/api/scripts/bootstrap-admin.ts
```

> O script está em `apps/api/scripts/bootstrap-admin.ts` e é ignorado pelo git.

---

## Rodando em desenvolvimento

Em terminais separados:

```bash
# API (porta 3000)
pnpm --filter @patafy/api run dev

# Frontend admin (porta 5175)
pnpm --filter @patafy/web-admin run dev

# Frontend tutor (porta 5173)
pnpm --filter @patafy/web-tutor run dev

# Frontend pet shop (porta 5174)
pnpm --filter @patafy/web-petshop run dev
```

### Verificando se está funcionando

```bash
curl http://localhost:3000/health/live    # → {"status":"ok"}
curl http://localhost:3000/health/ready  # → {"status":"ok"} (requer BD conectado)
```

GraphQL Playground: http://localhost:3000/graphql

---

## Comandos úteis

```bash
# Typecheck em todos os projetos
pnpm typecheck

# Lint em todos os projetos
pnpm lint

# Build de todos os projetos
pnpm build

# Gerar Prisma Client (após mudanças no schema)
pnpm --filter @patafy/db run generate

# Criar nova migration
pnpm --filter @patafy/db run migrate

# Popular catálogo com dados iniciais
pnpm --filter @patafy/db run seed

# Abrir Prisma Studio (interface visual do banco)
pnpm --filter @patafy/db run studio
```

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Monorepo | Nx + pnpm workspaces |
| API | Fastify + GraphQL Yoga + Prisma |
| Banco | PostgreSQL 15 |
| Frontends | React 19 + Vite + urql |
| Autenticação | Firebase Authentication |
| E-mail | Resend |
| Linguagem | TypeScript (strict) |

---

## Documentação

- [PRD](docs/PRD.md) — requisitos e funcionalidades
- [Arquitetura](docs/Arquitetura.md) — decisões técnicas, ADRs, fluxos
- [Modelo de Domínio](docs/Modelo-de-Dominio.md) — entidades e diagrama ER
- [Épicos](docs/epicos/README.md) — roadmap de implementação
