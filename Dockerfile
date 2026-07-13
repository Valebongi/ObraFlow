# ─── ObraFlow API — multi-stage build ───────────────────────────────
# Turbo monorepo: builds @obraflow/shared then @obraflow/api (NestJS),
# ships a slim runtime image serving the API + built frontend (public/).

# ---- Stage 1: build ------------------------------------------------
FROM node:20-slim AS builder

# OpenSSL is required by Prisma engines
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY turbo.json tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all workspace deps (incl. dev — needed to build). Peer conflict
# (@nestjs/serve-static@5 wants nest 11 while the API is on nest 10) → legacy resolution.
RUN npm install --legacy-peer-deps

# Copy the rest of the source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Generate Prisma client, then build shared + api + web.
# The web app (Vite) builds into apps/api/public, which the API serves statically.
# Invoke the hoisted Prisma binary directly from the repo root so the schema path
# resolves correctly and the pinned v6 is used (not whatever npx would fetch).
RUN node node_modules/prisma/build/index.js generate --schema apps/api/prisma/schema.prisma
RUN npm run build

# ---- Stage 2: runtime ----------------------------------------------
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Runtime artifacts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/public ./apps/api/public

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main"]
