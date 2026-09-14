# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Base común
# ---------------------------------------------------------------------------
FROM node:24-alpine AS base

# Instala pnpm 12 a nivel global.
RUN npm install -g pnpm@12
WORKDIR /app

# ---------------------------------------------------------------------------
# Dependencias de producción (para copiar al runtime)
# ---------------------------------------------------------------------------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --prod --ignore-scripts=false

# ---------------------------------------------------------------------------
# Build (con dev deps para compilar TS)
# ---------------------------------------------------------------------------
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build     /app/dist        ./dist
COPY package.json ./
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]