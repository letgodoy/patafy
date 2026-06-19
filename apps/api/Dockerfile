FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/db ./packages/db
COPY apps/api ./apps/api
RUN pnpm --filter @patafy/db exec prisma generate
CMD ["pnpm", "--filter", "@patafy/api", "dev"]

FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/db ./packages/db
COPY apps/api ./apps/api
RUN pnpm --filter @patafy/db exec prisma generate
RUN pnpm --filter @patafy/api build

FROM node:22-alpine AS prod
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/db/src/generated ./packages/db/src/generated
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
