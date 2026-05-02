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
```

Run `pnpm --filter @workspace/db run push` to apply schema changes to the database.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild composite libs (run after schema changes)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Flutter SDK Requirement

The build pipeline requires Flutter SDK, Android SDK, and Java to be installed on the server. These must be added to PATH:
- `flutter doctor` — verify Flutter installation
- `flutter build apk` — compile to APK

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
