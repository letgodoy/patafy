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

- [Node.js](https://nodejs.org) v18+
- [pnpm](https://pnpm.io) v8+
- [Docker](https://www.docker.com) (para o PostgreSQL em dev)

### Instalar pnpm

```bash
npm install -g pnpm
```

## Configuração inicial

### 1. Clonar o repositório

```bash
git clone https://github.com/letgodoy/patafy.git
cd patafy
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e preencha ao menos:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL (já preenchida para dev local) |
| `FIREBASE_PROJECT_ID` | ID do projeto no Firebase Console |
| `RESEND_API_KEY` | Chave da API do Resend (usado no E09 — notificações) |

> As demais variáveis já têm valores padrão para desenvolvimento local.

---

## Rodando em desenvolvimento

### Opção A — Docker Compose (recomendado)

Sobe o banco, a API e o worker de uma vez:

```bash
# subir tudo
docker compose -f infra/docker-compose.yml up -d

# ver logs
docker compose -f infra/docker-compose.yml logs -f api
```

Depois rode as migrations:

```bash
pnpm --filter @patafy/db run migrate
```

### Opção B — Processos separados

**1. Banco de dados (PostgreSQL)**

```bash
docker compose -f infra/docker-compose.yml up postgres -d
```

**2. Migrations do Prisma**

```bash
pnpm --filter @patafy/db run migrate
```

**3. API** (em um terminal)

```bash
pnpm --filter @patafy/api run dev
```

**4. Worker** (em outro terminal)

```bash
pnpm --filter @patafy/worker run dev
```

**5. Frontends** (cada um em um terminal separado)

```bash
pnpm --filter @patafy/web-tutor run dev      # http://localhost:5173
pnpm --filter @patafy/web-petshop run dev    # http://localhost:5174
pnpm --filter @patafy/web-admin run dev      # http://localhost:5175
```

---

## Verificando se está funcionando

```bash
# API health check
curl http://localhost:3000/health/live    # → {"status":"ok"}
curl http://localhost:3000/health/ready  # → {"status":"ok"} (requer BD conectado)

# GraphQL playground
open http://localhost:3000/graphql
```

---

## Comandos úteis

```bash
# Instalar dependências de todos os pacotes
pnpm install

# Rodar lint em todos os projetos
pnpm lint

# Rodar typecheck em todos os projetos
pnpm typecheck

# Gerar Prisma Client (após mudanças no schema)
pnpm db:generate

# Criar nova migration
pnpm db:migrate

# Abrir Prisma Studio (interface visual do banco)
pnpm db:studio

# Build de todos os projetos
pnpm build
```

---

## Banco de dados

O schema Prisma fica em `packages/db/prisma/schema.prisma` e contém todas as entidades do modelo de domínio. Após qualquer alteração no schema:

```bash
# Gerar uma nova migration e aplicar
pnpm db:migrate

# Regenerar o Prisma Client
pnpm db:generate
```

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Monorepo | Nx + pnpm workspaces |
| API | Fastify + GraphQL Yoga + Prisma |
| Banco | PostgreSQL 15 |
| Frontends | React 18 + Vite + Park UI |
| Autenticação | Firebase Authentication |
| E-mail | Resend |
| Linguagem | TypeScript (strict) |

---

## Documentação

- [PRD](docs/PRD.md) — requisitos e funcionalidades
- [Arquitetura](docs/Arquitetura.md) — decisões técnicas, ADRs, fluxos
- [Modelo de Domínio](docs/Modelo-de-Dominio.md) — entidades e diagrama ER
- [Épicos](docs/epicos/README.md) — roadmap de implementação
