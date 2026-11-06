# syntax=docker/dockerfile:1
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install pnpm for monorepo workspace resolution
RUN bun install -g pnpm@11.8.0

# -------------------------------------------------------------
# Stage 1: Install dependencies
# -------------------------------------------------------------
FROM base AS dependencies

# Copy package manifests and lockfile first for better cache utilization
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/validation/package.json ./packages/validation/

# Install dependencies including workspace packages (excluding mobile)
RUN pnpm install --frozen-lockfile --filter @expert/server...

# -------------------------------------------------------------
# Stage 2: Production runner
# -------------------------------------------------------------
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=4000

# Copy installed dependencies and workspace structure
COPY --from=dependencies /app /app

# Copy application source code for server and internal packages
COPY apps/server ./apps/server
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared
COPY packages/validation ./packages/validation

# Run as non-root user provided by bun image
USER bun

WORKDIR /app/apps/server

EXPOSE 4000

CMD ["bun", "run", "start"]
