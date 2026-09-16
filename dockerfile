# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Base común
# ---------------------------------------------------------------------------
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apk add --no-cache dumb-init
RUN npm install -g pnpm@11.16.0
WORKDIR /app

# ---------------------------------------------------------------------------
# deps: dev + prod, base para dev y build
# ---------------------------------------------------------------------------
FROM base AS deps
ENV HUSKY=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# prod-deps: solo producción
# ---------------------------------------------------------------------------
FROM base AS prod-deps
ENV HUSKY=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --prod

# ---------------------------------------------------------------------------
# build: compila TypeScript a dist/
# ---------------------------------------------------------------------------
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm run build

# ---------------------------------------------------------------------------
# development: hot reload dentro del container
# ---------------------------------------------------------------------------
FROM deps AS development
ENV NODE_ENV=development

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY docker ./docker

RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000 4000
CMD ["pnpm", "run", "dev"]

# ---------------------------------------------------------------------------
# production: imagen mínima
# ---------------------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build     /app/dist        ./dist
COPY package.json ./
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && \
    mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
ENTRYPOINT ["dumb-init", "--", "/app/entrypoint.sh"]