# ----------------------------
# Base
# ----------------------------

# FROM oven/bun:1.3 AS base
# RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*2
# WORKDIR /app
#
# # ----------------------------
# # Prune monorepo
# # ----------------------------
# FROM base AS builder
#
# COPY . .
#
# RUN bun i && mkdir public
#
# EXPOSE 3000
# CMD ["bun", "run", "start"]
# FROM oven/bun AS build
#
# WORKDIR /app
#
# # Cache packages installation
# COPY package.json package.json
# COPY bun.lock bun.lock
#
# RUN bun install
#
# # Install ffmpeg and dependencies
# RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
#
# # Copy ffmpeg binary to a location where it can be copied later
# RUN mkdir -p /app/bin && cp $(which ffmpeg) /app/bin/ffmpeg
#
# COPY ./src ./src
#
# ENV NODE_ENV=production
#
# RUN bun build \
#   --compile \
#   --minify-whitespace \
#   --minify-syntax \
#   --outfile server \
#   src/index.ts
#
# FROM gcr.io/distroless/base
#
# WORKDIR /app
#
# # Copy the compiled server and ffmpeg binary
# COPY --from=build /app/server server
# COPY --from=build /app/bin/ffmpeg /usr/local/bin/ffmpeg
#
# ENV NODE_ENV=production
#
# CMD ["./server"]
#
# EXPOSE 3000
#
# FROM oven/bun:1.4.0 AS build
#
# WORKDIR /app
#
# COPY package.json bun.lock ./
#
# # Install dependencies including native binaries for target platform
# RUN bun install --frozen-lockfile
#
# COPY ./src ./src
#
# ENV NODE_ENV=production
#
# # Compile without marking sharp as external
# RUN bun build \
#   --compile \
#   --minify-whitespace \
#   --minify-syntax \
#   --outfile server \
#   src/index.ts
#
# # Install ffmpeg
# RUN apt-get update \
#   && apt-get install -y --no-install-recommends ffmpeg \
#   && rm -rf /var/lib/apt/lists/*
#
# RUN mkdir -p /app/bin \
#   && cp "$(which ffmpeg)" /app/bin/ffmpeg
#
#
# # Runtime Stage: Use debian-slim or distroless/cc for native C++ dynamic bindings
# FROM gcr.io/distroless/cc-debian12
#
# WORKDIR /app
#
# COPY --from=build /app/server ./server
# COPY --from=build /app/bin/ffmpeg /usr/local/bin/ffmpeg
#
# # Copy required system libraries for Sharp/vips if needed, or stick to the compiled binary
# ENV NODE_ENV=production
#
# EXPOSE 3000
#
# ENTRYPOINT ["./server"]
#
## --- Build Stage ---
FROM oven/bun:1.4.0 AS build

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY ./src ./src

# Install ffmpeg binary into /app/bin
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /app/bin \
  && cp "$(which ffmpeg)" /app/bin/ffmpeg

# --- Production Stage ---
FROM oven/bun:1.4.0-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
RUN mkdir ./public

# Copy built node_modules and application code
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["bun", "run", "start"]
