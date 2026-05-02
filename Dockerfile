# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace manifests first (layer-cache-friendly)
COPY package.json pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json             ./lib/db/
COPY lib/api-spec/package.json       ./lib/api-spec/
COPY lib/api-zod/package.json        ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY scripts/package.json            ./scripts/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.base.json tsconfig.json ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Build lib type declarations (needed before api-server build)
RUN pnpm run typecheck:libs

# Build the API server bundle
RUN pnpm --filter @workspace/api-server run build

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:24-slim AS production

WORKDIR /app

# Install runtime-only system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    redis-server \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 ide && mkdir -p /tmp/apk_builds /app/logs && chown -R ide:ide /app /tmp/apk_builds

# Copy built bundle
COPY --from=builder --chown=ide:ide /app/artifacts/api-server/dist ./dist
COPY --from=builder --chown=ide:ide /app/artifacts/api-server/package.json ./
COPY --from=builder --chown=ide:ide /app/lib/api-spec/openapi.yaml ../../lib/api-spec/openapi.yaml

# Install only production dependencies
RUN npm install -g pnpm@10 && pnpm install --prod --frozen-lockfile

USER ide

# ─── Runtime configuration ────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/api/healthz || exit 1

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
