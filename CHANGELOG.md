# Changelog

All significant changes to the Cloud IDE platform are documented here.

---

## [1.0.0] — Phase 10: Launch (Production-Ready)

### Added
- **Deep health check** — `GET /api/healthz` now checks DB (`SELECT 1`) and Redis (`PING`) with per-component response times; returns HTTP 503 when any component is degraded
- **APK time-based cleanup** — `pruneStaleApks()` deletes APKs older than 30 days; scheduled every 6 hours + runs once at startup (configurable via `APK_MAX_AGE_DAYS`)
- **Redis memory safety** — `ensureRedis()` now applies `maxmemory 512mb` + `allkeys-lru` eviction policy automatically; configurable via `REDIS_MAX_MEMORY` env var
- **`.env` in .gitignore** — added `.env`, `.env.local`, `.env.*.local`, `.env.production`, `.env.staging` patterns

### Changed
- **DB connection pool** — `max: 20` connections (was default 10), `idleTimeoutMillis: 30 000 ms`, `connectionTimeoutMillis: 5 000 ms`
- **Version** — bumped to `1.0.0` in health check response and package metadata

---

## [0.9.0] — Phase 9: Final Integration & Polish

### Added
- **9 DB performance indexes** — `builds` (user_id, status, created_at, project_id), `projects` (user_id, updated_at), `versions` (project_id, created_at), `shares` (project_id)
- **Vite code splitting** — Monaco editor, react-dom, and TanStack Query emitted as separate chunks for faster initial load
- **Session expiry banner** — `AuthProvider` listens for `cloud-ide:session-expired` DOM events and shows a sticky bottom banner; `useProjects` dispatches the event on any 401 response
- **Gzip compression** — `compression` middleware on all Express JSON responses (SSE streams excluded)

### Fixed
- **ShareModal credential bug** — `POST /api/projects/:id/share` was missing `credentials: "include"` → authenticated share generation now works correctly
- **Logout response** — changed `{ ok: true }` to `{ success: true }` for OpenAPI consistency

---

## [1.0.0-rc.1] — Phase 8: Documentation & Deployment

### Added
- **Interactive API docs** at `/api/docs` (Swagger UI, served by `swagger-ui-express`)
- **Raw OpenAPI spec** at `/api/docs/spec.json` — full OpenAPI 3.1.0 with all 34 endpoints
- **README.md** — prerequisites, installation, Docker setup, environment variables, API reference
- **RUNBOOK.md** — startup checklist, troubleshooting guide, scaling architecture
- **Dockerfile** — multi-stage Node.js 24 production image
- **docker-compose.yml** — full stack: API + PostgreSQL 16 + Redis 7
- **tests/manual-test.sh** — end-to-end smoke test script covering all major flows

### Changed
- `lib/api-spec/openapi.yaml` — expanded from 18 to 34 endpoints with security schemes, rate-limit documentation, Phase 5 resilience fields, and admin endpoint specs

---

## [0.8.0] — Phase 7: Monitoring & Observability

### Added
- **Structured logging** — pino multistream: console (pretty dev / JSON prod) + `logs/app.log` (INFO+) + `logs/errors.log` (ERROR+)
- **Metrics singleton** (`lib/metrics.ts`) — in-memory counters with Redis HINCRBY write-through, daily-scoped
- **`GET /api/metrics`** — admin-gated runtime snapshot: runs, builds, error rates, queue depths, active users 24 h, log file sizes
- **Rate limiter observability** — every 429 response emits a structured WARN log and increments `rateLimitHits` metric
- **Worker instrumentation** — run and build workers call `metrics.recordRun()` / `metrics.recordBuild()` / `metrics.recordBuildRetry()`
- **Debug-level logging** — detailed execution trace in development; suppressed in production
- Base fields on every log entry: `{ service: "api-server", env, time }`

### Changed
- `logger.ts` — upgraded from single-stream to pino multistream
- All rate limiters — added `handler` callback for WARN logging + metrics

---

## [0.7.0] — Phase 6: Security Hardening

### Added
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Content-Security-Policy`, `Strict-Transport-Security` (production only)
- **CORS tightening** — limited to `REPLIT_DOMAINS`, `*.replit.dev`, `*.replit.app`, and localhost
- **Global rate limiter** — 100 req/hr per IP, applied before all routes
- **Code execution sandbox** (`lib/execution.ts`):
  - `checkFilename()` — blocks path traversal (`..`), absolute paths, invalid characters → HTTP 400
  - `checkForDangerousCode()` — lints JS/TS for blocked modules and APIs → HTTP 403
  - Blocked modules: `http`, `https`, `net`, `tls`, `dgram`, `dns`, `fs`, `child_process`, `cluster`, `worker_threads`, `vm`, `v8`, `module`
  - Blocked APIs: `fetch()`, `XMLHttpRequest`, `WebSocket()`, `process.env`, `process.exit()`, `__dirname`, `__filename`
- Code > 500 KB rejected with HTTP 413

### Changed
- All rate limiters — added `handler` option (express-rate-limit v8 pattern)

---

## [0.6.0] — Phase 5: Build Resilience

### Added
- **BullMQ retry** — `attempts: 2`, exponential backoff (5 s base) for both Flutter and Android pipelines
- **Error classification** (`lib/build-resilience.ts`):
  - `permanent` — bad project structure, missing SDK → `UnrecoverableError` (no retry)
  - `system` — OOM, disk full → `UnrecoverableError` (no retry)
  - `retriable` — timeout, network, `pub get` failure → re-throw → BullMQ retries
- **`failed-will-retry` build status** — visible in poll endpoint during retry window
- **Phase 5 fields on `GET /api/status/:id`** — `errorType`, `retryCount`, `willRetry`, `lastErrorAt`
- **`GET /api/admin/build-errors`** — structured JSONL error log, admin-gated
- **Build error JSONL log** at `/tmp/build_errors.jsonl`
- **Language-prefixed APK filenames** — `flutter-{id}.apk` / `android-{id}.apk`
- **New DB columns** — `error_type`, `retry_count`, `last_error_at` on `builds` table

### Migration
```bash
pnpm --filter @workspace/db run push
```

---

## [0.5.0] — Phase 4: Android Build Pipeline

### Added
- **Android SDK detection** at startup (`lib/android.ts`)
- **Android/Gradle build processor** (`workers/androidJob.ts`)
  - Stages: `extracting → configuring → assembling → packaging`
  - Writes `local.properties` with `sdk.dir`
  - Supports project `gradlew` or system Gradle
  - Recursive APK finder for non-standard output paths
- **ZIP content auto-detection** — `pubspec.yaml` → Flutter, `build.gradle` → Android
- **`POST /api/build/project`** extended to route `android` type to the Gradle pipeline
- `GET /api/status/:id` — returns `language` field for APK filename context

---

## [0.4.0] — Phase 3: Flutter APK Build Pipeline

### Added
- **Flutter SDK detection** at startup (`lib/flutter.ts`) — logs CRITICAL if absent, returns HTTP 503 on build endpoints
- **Flutter build worker** (`workers/buildJob.ts`)
  - Stages: `extracting → running-pub-get → building-apk → packaging`
  - ZIP extraction with nested-project handling
  - `pubspec.yaml` + `lib/main.dart` structure validation
- **BullMQ build queue** (`buildJobs`) — separate from code-execution queue, concurrency 2
- **APK storage** (`lib/apk-storage.ts`) — writes to `$TMPDIR/apk_builds/`
- **Build routes**:
  - `POST /api/build` — multipart ZIP upload → build queue
  - `GET /api/status/:id` — DB-backed status polling
  - `GET /api/download/:id` — APK binary download
  - `GET /api/logs/:id` — SSE real-time build log streaming
  - `GET /api/projects/:id/builds` — last 10 builds
- **Bull Board** admin dashboard at `/api/admin/queues`

---

## [0.3.0] — Phase 2: Project Persistence & Sharing

### Added
- **Project CRUD** — `GET/POST/PUT/DELETE /api/projects`, `POST /api/projects/:id/duplicate`
- **Version history** — up to 10 file snapshots per project with restore
- **Project sharing** — 8-char hex share IDs with view/fork/run analytics
- **Public Explore feed** — `GET /api/explore` ranked by engagement
- **JWT authentication** — cookie-based (`httpOnly`, 7-day expiry)
- **Google Sign-In** — `POST /api/auth/google` (requires `GOOGLE_CLIENT_ID`)
- **Usage tracking** — `GET /api/usage`, daily quotas stored in PostgreSQL
- **Rate limiters** — per-route express-rate-limit (run/build/project/share)

### New env vars
- `SESSION_SECRET` (required)
- `GOOGLE_CLIENT_ID` (optional)

### Migration
```bash
pnpm --filter @workspace/db run push
```

---

## [0.2.0] — Phase 1: Code Execution Engine

### Added
- **BullMQ code-execution queue** (`codeRuns`) — concurrency 8, Redis-backed
- **Language handlers** (JavaScript, TypeScript, Python, HTML) in `lib/execution.ts`
- **`POST /api/run`** — buffered JSON execution (30 s timeout)
- **`POST /api/run/stream`** — SSE real-time output polling from Redis list
- **`GET /api/run/job/:id`** — BullMQ job status lookup
- **Output limits** — 100 KB stdout cap, 10 s execution timeout
- **Sandbox env** — minimal `PATH/HOME/TMPDIR`, no server secrets exposed
- **Python sandbox** — CPU resource limits via `resource.setrlimit`

---

## [0.1.0] — Phase 0: Foundation

### Added
- **pnpm monorepo** — `artifacts/`, `lib/`, `scripts/` workspaces
- **Express 5 API server** — esbuild bundle, pino-http request logging
- **PostgreSQL + Drizzle ORM** — schema in `lib/db/`
- **Redis** — auto-started locally via `redis-server`, managed via ioredis
- **OpenAPI 3.1 spec** — source of truth in `lib/api-spec/openapi.yaml`
- **Orval codegen** — generates React Query hooks + Zod schemas from spec
- **Vite + React cloud IDE** — Monaco editor, file tree, terminal, output panel
- **Expo React Native mobile app** — build submission + status tracking
- **Health check** — `GET /api/healthz`
- **Graceful shutdown** — SIGTERM closes BullMQ workers before exit
