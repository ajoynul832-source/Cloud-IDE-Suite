# Flutter APK Builder — Cloud IDE System

## Overview

A mobile-first cloud IDE system with two frontends:
1. **Expo mobile app** — for submitting Flutter ZIPs via URL and tracking builds
2. **Web Cloud IDE** — full browser-based code editor supporting 10+ mobile development languages with APK build pipeline, SSE code execution, and PostgreSQL project storage

## Architecture

- **Expo Mobile App** (`artifacts/mobile`) — Frontend app at `/` (served via REPLIT_EXPO_DEV_DOMAIN)
- **Web Cloud IDE** (`artifacts/cloud-ide`) — React+Vite IDE at `/ide/`
- **API Server** (`artifacts/api-server`) — Express backend at `/api`
- **Shared DB** (`lib/db`) — Drizzle ORM schema + PostgreSQL client (`@workspace/db`)
- **Shared API Client** (`lib/api-client-react`) — React Query hooks generated from OpenAPI spec
- **Shared Zod Schemas** (`lib/api-zod`) — Generated from OpenAPI spec

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (catalog version), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo SDK 54, Expo Router, React Native 0.81.5
- **TypeScript execution**: `tsx` (installed in api-server)

## Authentication (Phase 1 — Complete)

### How It Works
- **JWT** signed with `JWT_SECRET` env var, 7-day expiry, stored in an `httpOnly` cookie (`auth_token`)
- `requireAuth` middleware: reads cookie → `Authorization: Bearer` fallback → attaches `req.user.userId`
- `optionalAuth` middleware: same but never returns 401 (for run/stream and usage endpoints)
- All `/api/projects/*` and `/api/auth/*` routes require or use auth
- Shared project viewing and Explore feed are fully public (no auth required)

### Auth Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | email + password → bcrypt (cost 12) → JWT cookie |
| POST | `/api/auth/login` | verify bcrypt → JWT cookie |
| POST | `/api/auth/google` | verify Google idToken → upsert user → JWT cookie (requires `GOOGLE_CLIENT_ID` env var) |
| POST | `/api/auth/logout` | clears auth cookie |
| GET | `/api/auth/me` | returns `{ userId, email, oauthProvider }` for current session |

### Key Files
- `artifacts/api-server/src/middlewares/require-auth.ts` — `requireAuth`, `optionalAuth`, `signToken`, `setAuthCookie`
- `artifacts/api-server/src/routes/auth.ts` — all auth endpoints
- `artifacts/cloud-ide/src/contexts/AuthContext.tsx` — `AuthProvider` + `useAuth()` hook
- `artifacts/cloud-ide/src/pages/AuthPage.tsx` — login/register page (shown when not authenticated)

### Frontend Auth Flow
1. `AuthProvider` (in `App.tsx`) calls `GET /api/auth/me` on mount
2. If authenticated → renders the IDE
3. If unauthenticated → `ProtectedRoute` in `App.tsx` renders `<AuthPage />`
4. All project API fetches use `credentials: "include"` (no X-User-Key header)
5. Toolbar shows user email + logout button when authenticated

### Environment Variables Required
| Var | Purpose |
|-----|---------|
| `JWT_SECRET` | Signs/verifies JWT tokens (auto-generated on setup) |
| `SESSION_SECRET` | Express session fallback (pre-existing) |
| `GOOGLE_CLIENT_ID` | Optional: enables Google OAuth sign-in button |

## Cloud IDE Features (`artifacts/cloud-ide`)

- **CodeMirror 6 editor** with syntax highlighting for 15+ languages
- **Multi-tab editor** with localStorage-based file persistence
- **File tree** with folder grouping, language icons, inline rename, create/delete
- **Project templates** for 10 mobile stacks (see below)
- **SSE streaming execution** — real-time line-by-line output via `POST /api/run/stream`
- **Project save/load** — PostgreSQL-backed, scoped per authenticated user
- **APK Build pipeline**: zips files in-browser → uploads to `/api/build` → polls status → streams logs
- **Resizable panels**: file tree, editor, preview/log panel
- **Language badge** in toolbar shows detected language of active file
- **HTML live preview** — running an HTML file renders it directly in the Preview iframe
- **Version history** — up to 10 snapshots per project with restore

### Supported Languages (CodeMirror 6)

| Language | Extension | Package |
|----------|-----------|---------|
| Dart/Flutter | .dart | JS fallback |
| Kotlin | .kt, .kts | @codemirror/lang-java |
| Java | .java | @codemirror/lang-java |
| Swift | .swift | JS fallback |
| Python | .py | @codemirror/lang-python |
| C# | .cs | @codemirror/lang-cpp |
| C/C++ | .c/.cpp/.h | @codemirror/lang-cpp |
| Rust | .rs | @codemirror/lang-rust |
| Go | .go | @codemirror/lang-go |
| JavaScript/JSX | .js/.jsx | @codemirror/lang-javascript |
| TypeScript/TSX | .ts/.tsx | @codemirror/lang-javascript |
| HTML | .html | @codemirror/lang-html |
| CSS/SCSS | .css | @codemirror/lang-css |
| JSON | .json | @codemirror/lang-json |
| XML | .xml | @codemirror/lang-xml |
| Markdown | .md | @codemirror/lang-markdown |

### Project Templates

| Template | Language | Framework |
|----------|----------|-----------|
| Flutter | Dart | Flutter SDK |
| React Native (TypeScript) | TypeScript | React Native 0.73 |
| Android Kotlin | Kotlin | Android SDK |
| Android Java | Java | Android SDK |
| iOS Swift | Swift | SwiftUI |
| Python Kivy | Python | Kivy + buildozer |
| .NET MAUI | C# | .NET 8 |
| Ionic / Capacitor | TypeScript | Ionic Angular |
| Rust Tauri Mobile | Rust | Tauri 2.0 |
| Go gomobile | Go | golang.org/x/mobile |
| C++ NDK | C++ | Android NDK |

## Execution Queue — Phase 2 (Complete)

### Infrastructure
- **Redis** installed via Nix (`pkgs.redis`), auto-started as a background subprocess by the API server on boot if no `REDIS_URL` env var is set (default: `redis://localhost:6379`)
- **BullMQ** (`bullmq` + `ioredis`) replaces the old in-memory semaphore
- Queue name: `codeRuns`, max 8 concurrent workers, max 1 attempt, retain last 100 completed / 50 failed

### Key Files
| File | Purpose |
|------|---------|
| `lib/execution.ts` | All language handlers, `spawnStream`, `resolveHandler` — shared by routes and worker |
| `lib/redis.ts` | `ensureRedis()`, `getSharedRedis()`, `redisConnectionOpts()` |
| `lib/queue.ts` | `getQueue()`, `getQueueEvents()`, `startWorker()` |
| `workers/runJob.ts` | BullMQ processor — executes code, streams chunks to Redis list |

### Streaming Architecture
- Worker pushes `ExecEvent` JSON objects to Redis list `run:chunks:{runId}` as they arrive
- SSE endpoint polls the list with `LRANGE` every 50 ms, forwarding new events to the client
- Max SSE wait: 60 s; client disconnect detected via `req.on('close')`
- Chunk list TTL: 5 minutes after job completion

### New Endpoint
`GET /api/run/job/:jobId` — look up a BullMQ job by ID; returns `{ jobId, runId, status, result, failedReason, timestamp }`

### Spec Tests (all pass)
| Test | Result |
|------|--------|
| Buffered `/api/run` — stdout captured, backward-compat format | ✅ |
| SSE `/api/run/stream` — `stdout` + `done` events arrive | ✅ |
| Job status endpoint returns 404 for unknown jobId | ✅ |
| Python SSE execution returns correct output | ✅ |
| 10 concurrent runs all complete (queue cap = 8) | ✅ |
| Daily usage endpoint returns remaining counts | ✅ |

## Execution Engine

Language handler plugin map in `artifacts/api-server/src/lib/execution.ts`:

| Language | Handler | Approach |
|----------|---------|----------|
| javascript | `javascriptHandler` | Node.js .mjs (ESM, top-level await via IIFE wrapper) |
| typescript | `typescriptHandler` | `tsx` binary for full TS support (generics, decorators) |
| python | `pythonHandler` | `python3` with resource limits (128MB RAM, 30s CPU) |
| html | `htmlHandler` | Returns HTML via SSE `done.chunk` for iframe preview |

All handlers stream via Server-Sent Events (`POST /api/run/stream`). Each line of stdout/stderr arrives as a separate SSE event. Execution is sandboxed in `/tmp/ide_exec_{uuid}/` temp directories (auto-cleaned).

## Rate Limiting (`artifacts/api-server/src/middlewares/rate-limit.ts`)

Key resolution order: `userId` from JWT → `X-User-Key` header → IP address

| Limiter | Route | Limit |
|---------|-------|-------|
| `runLimiter` | `/api/run`, `/api/run/stream` | 30 req/min per user |
| `buildLimiter` | `/api/build`, `/api/build/project` | 5 req/min per user |
| `projectLimiter` | `/api/projects/*` | 60 req/min per user |
| `shareLimiter` | `/api/share/*`, `/api/explore` | 20 req/min per IP |

## Daily Usage Limits

- 50 runs/day per user (authenticated: by userId; anonymous: by IP)
- 3 builds/day per user
- Tracked in `usageTable` in Postgres

## Project Sharing System

### Backend
- `POST /api/projects/:id/share` — generates (or reuses) an 8-char hex share ID, stores in `sharesTable`. Requires auth; must own the project.
- `GET /api/share/:shareId` — public (no auth). Returns full project data + stats.
- `GET /api/explore` — public ranked feed: `(forks×5) + (runs×2) + uniqueViews`

### Share URL Format
`/ide/p/<shareId>` — e.g. `/ide/p/5501de83`

### Shared View
- Full read-only CodeMirror 6 editor
- Run button works (anonymous, usage tracked by IP)
- "Fork Project" button → requires login → creates copy under authenticated user

## Flutter APK Build System — Phase 3 (Complete)

### Infrastructure
- **Pre-flight check** — `checkFlutter()` runs on startup: sets `FLUTTER_DISABLED=1` if flutter binary is absent; logs CRITICAL error. All build endpoints return 503 when disabled.
- **APK storage** — `/tmp/apk_builds` (or `APK_STORAGE_PATH` env var). Max 50 APKs; oldest pruned when cap exceeded.
- **BullMQ `buildJobs` queue** — concurrency 2, backed by Redis. Separate from the code-execution queue.

### `builds` Table
```
builds:
  id            uuid PK (gen_random_uuid())
  user_id       uuid nullable FK → users(id) ON DELETE SET NULL
  project_id    uuid nullable FK → projects(id) ON DELETE SET NULL
  language      text ('flutter' | 'react-native' | 'android')
  status        text ('queued' | 'building' | 'complete' | 'failed')
  stage         text nullable ('uploading' | 'extracting' | 'running-pub-get' | 'building-apk' | 'packaging')
  queue_position integer
  log_text      text (accumulating build log; live-streamed via SSE)
  apk_path      text nullable (permanent storage path; survives restart)
  apk_size      integer nullable
  error_message text nullable
  preview_url / embed_url / qr_url  text nullable (react-native Expo Snack)
  created_at    timestamp
  completed_at  timestamp nullable
```

### Worker Stages (buildJob.ts)
1. `extracting` — unzip to temp dir, validate pubspec.yaml + lib/main.dart
2. `running-pub-get` — `flutter pub get`
3. `building-apk` — `flutter build apk --debug`
4. `packaging` — copy APK to `/tmp/apk_builds/{buildId}-{ts}.apk`, record path + size in DB

All stdout/stderr appended to `builds.log_text` in real time.

### Key Files
| File | Purpose |
|------|---------|
| `lib/flutter.ts` | Pre-flight check, `isFlutterAvailable()`, `flutterBin()` |
| `lib/apk-storage.ts` | `storeApk()`, `apkExists()`, `pruneOldApks()` |
| `lib/build-queue.ts` | `getBuildQueue()`, `startBuildWorker()` |
| `workers/buildJob.ts` | Full Flutter build pipeline processor |
| `routes/build.ts` | All build HTTP endpoints (status, download, logs, history) |
| `routes/project-build.ts` | POST /api/build/project (Expo Snack + Flutter/Android) |

### Rebuild Loop Prevention
- 10 active builds per authenticated user max → 429 `QUEUE_FULL`
- 3 builds/day per user → 429 `DAILY_LIMIT_REACHED`

### Phase 3 Spec Tests (all pass)
| Test | Result |
|------|--------|
| Flutter binary not found → CRITICAL log + FLUTTER_DISABLED=1 | ✅ |
| POST /api/build returns 503 when Flutter disabled | ✅ |
| POST /api/build/project flutter returns 503 | ✅ |
| GET /api/status/:jobId — valid UUID not in DB → 404 | ✅ |
| GET /api/download/:jobId — not in DB → 404 | ✅ |
| GET /api/logs/:jobId — not in DB → 404 | ✅ |
| APK storage directory created on startup | ✅ |
| React Native Expo Snack build creates DB record | ✅ |
| 4th build in one day → 429 DAILY_LIMIT_REACHED | ✅ |
| GET /api/projects/:projectId/builds returns [] for unknown project | ✅ |
| Build DB records survive restart (DB-backed, not in-memory) | ✅ |

## Bull Board Admin Dashboard

Real-time queue monitor served at **`/api/admin/queues`**.

- Shows both queues: `codeRuns` (concurrency 8) and `buildJobs` (concurrency 2)
- Per-job details: data payload, logs, attempt count, timestamps, error messages
- Actions: retry failed jobs, clean completed/failed sets, pause/resume queues
- Title: "Cloud IDE Queues"

### Access

**Protected by HTTP Basic Auth.**  
Use any username + the value of `ADMIN_TOKEN` env var as the password.  
Falls back to `SESSION_SECRET` if `ADMIN_TOKEN` is not set.

```
# Browser: visit /api/admin/queues — browser will prompt for credentials
# curl:
curl -u admin:$ADMIN_TOKEN http://localhost:80/api/admin/queues/
```

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/bull-board.ts` | `mountAdminBoard(app)` — creates board, wires both queues, mounts with auth |

### Mounted After Workers Start
`mountAdminBoard(app)` is called in `index.ts` after both `startWorker()` and `startBuildWorker()` so queue instances are guaranteed to exist when the board registers them.

## Core API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/me` | required | Get current user |
| POST | `/api/auth/register` | none | Register with email+password |
| POST | `/api/auth/login` | none | Login with email+password |
| POST | `/api/auth/logout` | none | Clear auth cookie |
| POST | `/api/run` | optional | Buffered code execution |
| POST | `/api/run/stream` | optional | SSE streaming execution |
| POST | `/api/build` | none | Upload Flutter ZIP, queue APK build |
| POST | `/api/build/project` | none | Build from project files |
| GET | `/api/status/:jobId` | none | Poll build status |
| GET | `/api/download/:jobId` | none | Download compiled APK |
| GET | `/api/logs/:jobId` | none | Fetch build logs |
| GET | `/api/projects` | required | List user's projects |
| POST | `/api/projects` | required | Create project |
| GET | `/api/projects/:id` | required | Get single project |
| PUT | `/api/projects/:id` | required | Update project |
| DELETE | `/api/projects/:id` | required | Delete project |
| GET | `/api/explore` | none | Browse shared projects |
| GET | `/api/share/:shareId` | none | Load shared project |
| GET | `/api/usage` | optional | Daily usage stats |
| GET | `/api/healthz` | none | Health check |
| GET | `/api/admin/queues` | ADMIN_TOKEN | Bull Board queue dashboard |

## Database Schema (`lib/db`)

```
usersTable:
  id            uuid PK (gen_random_uuid())
  email         text NOT NULL UNIQUE
  password_hash text nullable      — null for OAuth-only accounts
  oauth_provider text nullable     — 'google' | null
  oauth_id      text nullable
  created_at    timestamp
  updated_at    timestamp

projectsTable:
  id          uuid PK
  user_key    text NOT NULL        — legacy field; set to userId for auth'd projects
  user_id     uuid nullable FK → users(id) ON DELETE CASCADE
  name        text NOT NULL
  project_type text NOT NULL
  files       jsonb NOT NULL       — { filename: content } map
  created_at  timestamp
  updated_at  timestamp

sharesTable:
  share_id    text PK (8-char hex)
  project_id  uuid FK → projects(id) ON DELETE CASCADE
  total_views / unique_views / forks_count / runs_count  integer

versionsTable:
  id          uuid PK
  project_id  uuid FK
  files       jsonb
  label       text
  created_at  timestamp

usageTable:
  user_key    text PK (composite)
  date        text PK (YYYY-MM-DD)
  runs_count  integer
  builds_count integer
buildsTable:
  id            uuid PK
  user_id       uuid nullable
  project_id    uuid nullable FK → projects(id)
  language      text (flutter | android)
  status        text (queued | building | failed-will-retry | complete | failed)
  stage         text nullable (extracting | running-pub-get | building-apk | packaging | assembling | etc.)
  queue_position integer
  log_text      text (append-only build log)
  apk_path      text nullable
  apk_size      integer nullable
  error_message text nullable
  error_type    text nullable  — Phase 5: system | permanent | retriable
  retry_count   integer        — Phase 5: number of retries attempted
  last_error_at timestamp      — Phase 5: when the last error occurred
  preview_url / embed_url / qr_url  text nullable (Snack embeds)
  created_at    timestamp
  completed_at  timestamp nullable
```

Run `pnpm --filter @workspace/db run push` to apply schema changes to the database.
Always run `pnpm run typecheck:libs` after schema changes to regenerate Drizzle types before typechecking leaf packages.

## Phase 5 — Build Resilience (Complete)

- **Retry policy**: BullMQ configured with `attempts: 2`, exponential backoff (5 s base delay)
- **Error classification** (`lib/build-resilience.ts`): `system` (OOM/disk) and `permanent` (bad project/missing SDK) → `UnrecoverableError` (no retry); `retriable` (timeout/network/pub-get) → re-throw → BullMQ retries
- **Status lifecycle**: `queued → building → failed-will-retry → building (retry) → complete | failed`
- **Status endpoint** now returns: `retryCount`, `errorType`, `willRetry`, `lastErrorAt`
- **Admin error log**: `GET /api/admin/build-errors` (Bearer or Basic auth with `ADMIN_TOKEN ?? SESSION_SECRET`)
- **APK filename** is now language-prefixed: `flutter-{jobId}.apk` / `android-{jobId}.apk`
- **Build error JSONL log**: written to `/tmp/build_errors.jsonl` via `logBuildError()`

## Phase 6 — Security Hardening (Complete)

### Security Headers (app.ts)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'; ...`
- `Strict-Transport-Security` (production only)

### CORS (app.ts)
- Allows `REPLIT_DOMAINS` + `*.replit.dev` + `*.replit.app` + `localhost`

### Rate Limiting (middlewares/rate-limit.ts)
- **Global**: 100 req/hr per IP (`globalLimiter`, applied before all routes)
- **Run**: 20 req/min per IP/user
- **Build**: 5 uploads/min per IP/user

### Code Execution Linting (lib/execution.ts)
- `checkFilename()` — blocks `..` traversal, absolute paths, disallowed chars → HTTP 400
- `checkForDangerousCode()` — JS/TS only, regex-based, blocks:
  - `require()` / ESM `import` / dynamic `import()` of: `http`, `https`, `net`, `tls`, `dgram`, `dns`, `fs`, `child_process`, `cluster`, `worker_threads`, `vm`, `v8`, `module`
  - `fetch()`, `XMLHttpRequest`, `WebSocket()`
  - `process.env`, `process.exit()`, `__dirname`, `__filename`
  - Returns HTTP 403
- Code > 500 KB → HTTP 413

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild composite libs (run after schema changes)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Phase 9 — Final Integration & Polish (Complete)

### DB Performance Indexes (lib/db/src/schema/)
9 new indexes pushed to Postgres (previously only PKs existed):
| Index | Table | Columns |
|-------|-------|---------|
| `builds_user_id_idx` | builds | user_id |
| `builds_status_idx` | builds | status |
| `builds_created_at_idx` | builds | created_at |
| `builds_project_id_idx` | builds | project_id |
| `projects_user_id_idx` | projects | user_id |
| `projects_updated_at_idx` | projects | updated_at |
| `versions_project_id_idx` | versions | project_id |
| `versions_created_at_idx` | versions | created_at |
| `shares_project_id_idx` | shares | project_id |

### API Response Compression (`artifacts/api-server/src/app.ts`)
- `compression` middleware added (after CORS, before rate limiting)
- SSE streams (`text/event-stream`) explicitly excluded — they must not be buffered
- `Vary: Accept-Encoding` header now present on all JSON responses

### ShareModal Credential Fix (`artifacts/cloud-ide/src/components/ShareModal.tsx`)
- **Bug**: `POST /api/projects/:id/share` was missing `credentials: "include"` → 401 for all authenticated users trying to share
- **Fix**: Added `credentials: "include"`, removed stale `X-User-Key` header

### Logout Response Consistency (`artifacts/api-server/src/routes/auth.ts`)
- Changed `{ ok: true }` → `{ success: true }` for consistency with the OpenAPI spec

### Session Expiry Handling (`artifacts/cloud-ide/src/contexts/AuthContext.tsx`)
- Added `sessionExpired` state + `dismissSessionExpiry()` to `AuthContextValue`
- `AuthProvider` listens for custom DOM event `cloud-ide:session-expired`
- When a previously-valid session returns 401, shows a sticky bottom banner:
  *"Session expired — sign in again to save your work."*
- Banner disappears on dismiss or successful re-login

### Session Expiry Dispatch (`artifacts/cloud-ide/src/hooks/useProjects.ts`)
- `authFetch()` now dispatches `cloud-ide:session-expired` event on any 401 response
- AuthContext catches it and surfaces the banner without page reload

### Vite Code Splitting (`artifacts/cloud-ide/vite.config.ts`)
- `rollupOptions.output.manualChunks` splits Monaco editor, react-dom, and tanstack into separate chunks for faster initial page load

### Load Test Results
10 concurrent JS executions via `/api/run`: **10/10 succeeded, 0 failures** in 197ms total wall time

### Smoke Test
39/39 tests pass after all Phase 9 changes.

## Phase 7 — Monitoring & Observability (Complete)

### Structured Logging (`lib/logger.ts`)
Pino with multistream — every entry carries `{ time, level, service: "api-server", env, ...fields }`:
- **Console**: pino-pretty (dev) / raw JSON (prod)
- **`logs/app.log`**: INFO and above, async, JSON
- **`logs/errors.log`**: ERROR and above, async, JSON
- Redacts `authorization`, `cookie`, `set-cookie`, `*.password`, `*.token`
- Debug level active in dev (`LOG_LEVEL` env override supported)

### Metrics Singleton (`lib/metrics.ts`)
In-memory counters with Redis HINCRBY write-through for crash recovery.
Daily-scoped Redis hash key: `metrics:{YYYY-MM-DD}` with 48h TTL.
Queue depths and active-user counts refreshed every 30 seconds.

Recorded events:
| Caller | Method | What it tracks |
|--------|--------|----------------|
| `workers/runJob.ts` | `metrics.recordRun()` | language, durationMs, success/error |
| `workers/buildJob.ts` | `metrics.recordBuild()` | language, durationMs, success/error |
| `workers/androidJob.ts` | `metrics.recordBuild()` | same |
| Both build workers | `metrics.recordBuildRetry()` | Phase 5 retry events |
| All rate limiters | `metrics.recordRateLimitHit()` | every 429 response |

### Metrics Endpoint (`routes/metrics.ts`)
`GET /api/metrics` — admin-gated (same `ADMIN_TOKEN ?? SESSION_SECRET` Bearer/Basic auth).

Response shape:
```json
{
  "generatedAt": "ISO timestamp",
  "period": "YYYY-MM-DD",
  "uptimeSeconds": 3600,
  "runs": {
    "total": 142, "errors": 4, "errorRate": "2.8%",
    "byLanguage": { "javascript": { "count": 100, "durationSum": 5000 } },
    "avgDurationMs": { "javascript": 50, "typescript": 200, "python": 80 }
  },
  "builds": {
    "total": 8, "errors": 1, "retries": 2,
    "errorRate": "12.5%", "avgDurationMs": 30000
  },
  "rateLimitHits": 17,
  "queues": { "runs": { "waiting": 0, "active": 2 }, "builds": { "waiting": 1, "active": 1 } },
  "activeUsers24h": 23,
  "logFiles": {
    "app":    { "path": "logs/app.log",    "sizeBytes": 51200 },
    "errors": { "path": "logs/errors.log", "sizeBytes": 1024  }
  }
}
```

### Rate Limiter Observability (`middlewares/rate-limit.ts`)
All 5 limiters now use a custom `handler` that:
1. Logs `WARN` with `{ limiter, ip, path, method, userId }` — appears in both console and `logs/app.log`
2. Calls `metrics.recordRateLimitHit()` for the metrics counter

## Flutter SDK Requirement

The build pipeline requires Flutter SDK, Android SDK, and Java to be installed on the server. These must be added to PATH:
- `flutter doctor` — verify Flutter installation
- `flutter build apk` — compile to APK

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
