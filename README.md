# Cloud IDE

A production-ready browser-based code editor with Flutter and Android APK build pipelines.

**Live features:**
- Execute JavaScript, TypeScript, Python, and HTML in a secure sandbox
- Build Flutter APKs from a ZIP upload or file-map API
- Build Android (Gradle/Kotlin/Java) APKs
- Expo Snack instant preview for React Native projects
- Project persistence with version history (10 snapshots per project)
- Public project sharing with view/fork/run analytics
- JWT cookie authentication with optional Google Sign-In
- Bull Board admin dashboard at `/api/admin/queues`
- Interactive API docs at `/api/docs`

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js     | 20+     | 24 recommended |
| PostgreSQL  | 14+     | Neon or AWS RDS work well |
| Redis       | 6+      | Auto-started locally if not configured |
| pnpm        | 10+     | `npm install -g pnpm` |
| Flutter SDK | 3.x     | Optional — required only for Flutter APK builds |
| Android SDK + Java 17 | — | Optional — required only for Gradle builds |

---

## Environment Variables

Copy `.env.example` to `.env` inside `artifacts/api-server/` and fill in values.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | HTTP listen port | `8080` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Secret for JWT signing (≥ 32 chars) | `openssl rand -hex 32` |

### Optional — Auth & Security

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Separate JWT signing secret (falls back to `SESSION_SECRET`) | — |
| `GOOGLE_CLIENT_ID` | Enables `POST /api/auth/google` | — |
| `ADMIN_TOKEN` | Admin endpoint token (falls back to `SESSION_SECRET`) | — |

### Optional — Limits & Performance

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_CONCURRENT_RUNS` | BullMQ code-execution concurrency | `8` |
| `MAX_CONCURRENT_BUILDS` | BullMQ APK-build concurrency | `2` |
| `DAILY_RUN_LIMIT` | Max code executions per user per day | `50` |
| `DAILY_BUILD_LIMIT` | Max APK builds per user per day | `3` |
| `LOG_LEVEL` | Pino log level (`debug`/`info`/`warn`/`error`) | `info` (prod), `debug` (dev) |
| `NODE_ENV` | Runtime environment | `development` |

### Optional — Build SDKs

| Variable | Description |
|----------|-------------|
| `FLUTTER_PATH` | Path to `flutter` binary if not on `PATH` |
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | Android SDK root directory |
| `JAVA_HOME` | Java 17+ installation directory |

> **Auto-detection:** The server detects Flutter and Android SDK at startup via
> `which flutter` and `$ANDROID_HOME`. Missing SDKs log a warning and disable
> those build endpoints (HTTP 503) — the rest of the API continues normally.

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd workspace

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp artifacts/api-server/.env.example artifacts/api-server/.env
# Edit .env with your DATABASE_URL and SESSION_SECRET

# 4. Push database schema
pnpm --filter @workspace/db run push

# 5. Start development server (all services)
pnpm run dev       # starts API + Web IDE + Expo

# Or start just the API:
pnpm --filter @workspace/api-server run dev
```

---

## Running in Production

```bash
# Build all artifacts
pnpm --filter @workspace/api-server run build

# Start the compiled server
NODE_ENV=production node artifacts/api-server/dist/index.mjs
```

### With Docker

```bash
# Build image
docker build -t cloud-ide .

# Run (requires external PostgreSQL and Redis)
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  -e REDIS_URL="redis://your-redis:6379" \
  cloud-ide
```

### With Docker Compose (all-in-one)

```bash
docker compose up -d
```

Brings up:
- **api** — Express API server on port 8080
- **postgres** — PostgreSQL 16
- **redis** — Redis 7

---

## Verifying the Installation

```bash
# Health check
curl http://localhost:8080/api/healthz
# → { "status": "ok" }

# Run code
curl -X POST http://localhost:8080/api/run \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(42)"}'
# → { "stdout": "42\n", "exitCode": 0, "duration": 45, ... }

# Open API docs
open http://localhost:8080/api/docs
```

---

## Running Tests

```bash
# Manual end-to-end test script
bash tests/manual-test.sh http://localhost:8080

# TypeScript typecheck
pnpm run typecheck

# Full typecheck (libs + all packages)
pnpm run typecheck
```

---

## Project Structure

```
workspace/
├── artifacts/
│   ├── api-server/     Express API + BullMQ workers
│   ├── cloud-ide/      React + Vite web IDE (served at /ide/)
│   └── mobile/         Expo React Native app (served via Expo Go)
├── lib/
│   ├── db/             Drizzle ORM schema + PostgreSQL client
│   ├── api-spec/       OpenAPI 3.1 specification (source of truth)
│   ├── api-client-react/ React Query hooks (generated from spec)
│   └── api-zod/        Zod schemas (generated from spec)
├── tests/
│   └── manual-test.sh  End-to-end smoke tests
├── Dockerfile
├── docker-compose.yml
├── README.md
└── RUNBOOK.md
```

---

## API Reference

Interactive documentation is available at **`/api/docs`** (Swagger UI).

The raw OpenAPI 3.1 spec is at `/api/docs/spec.json` and `lib/api-spec/openapi.yaml`.

### Key endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/healthz` | — | Health check |
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Sign in |
| `POST` | `/api/run` | Optional | Execute code (buffered) |
| `POST` | `/api/run/stream` | Optional | Execute code (SSE stream) |
| `POST` | `/api/build` | Optional | Upload ZIP → APK build |
| `GET`  | `/api/status/:jobId` | — | Poll build status |
| `GET`  | `/api/download/:jobId` | — | Download APK |
| `GET`  | `/api/projects` | Required | List projects |
| `POST` | `/api/projects` | Required | Create project |
| `GET`  | `/api/explore` | — | Public project feed |
| `GET`  | `/api/usage` | Optional | Daily quota |
| `GET`  | `/api/metrics` | Admin | Runtime metrics |
| `GET`  | `/api/docs` | — | Swagger UI |

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full phase-by-phase feature history.

## Operational Runbook

See [RUNBOOK.md](./RUNBOOK.md) for startup checklists, troubleshooting, and scaling guides.
