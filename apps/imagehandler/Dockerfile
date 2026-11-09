## --- Build Stage ---
FROM oven/bun:1.4.0 AS build

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install

COPY ./src ./src

# --- Production Stage ---
FROM oven/bun:1.4.0-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
RUN mkdir ./public

# Copy built node_modules and application code
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["bun", "run", "start"]
