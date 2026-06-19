FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/db ./packages/db
COPY apps/worker ./apps/worker
RUN pnpm --filter @patafy/db exec prisma generate
CMD ["pnpm", "--filter", "@patafy/worker", "dev"]

FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/db ./packages/db
COPY apps/worker ./apps/worker
RUN pnpm --filter @patafy/db exec prisma generate
RUN pnpm --filter @patafy/worker build

FROM node:22-alpine AS prod
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/packages/db/src/generated ./packages/db/src/generated
EXPOSE 3000
CMD ["node", "apps/worker/dist/main.js"]
