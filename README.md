# ☁ CloudIDE — Complete Product Documentation

> A professional browser-based cloud IDE with real-time code execution, live HTML preview,
> multi-language support, JWT authentication, BullMQ job queues, PostgreSQL storage,
> and a Flutter/Android APK build pipeline.
>
> **No install. No signup required. Open the editor and run code in seconds.**

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [What Works Right Now](#2-what-works-right-now)
3. [Architecture](#3-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Directory Structure](#5-directory-structure)
6. [Running Locally](#6-running-locally)
7. [Environment Variables](#7-environment-variables)
8. [API Reference — Authentication](#8-api-reference--authentication)
9. [API Reference — Code Execution](#9-api-reference--code-execution)
10. [API Reference — Projects & Versions](#10-api-reference--projects--versions)
11. [API Reference — Sharing & Explore](#11-api-reference--sharing--explore)
12. [API Reference — APK Build](#12-api-reference--apk-build)
13. [Code Execution Engine](#13-code-execution-engine)
14. [Security Model](#14-security-model)
15. [Rate Limiting](#15-rate-limiting)
16. [Real-Time SSE Streaming](#16-real-time-sse-streaming)
17. [Authentication System](#17-authentication-system)
18. [Database Schema](#18-database-schema)
19. [BullMQ Job Queues](#19-bullmq-job-queues)
20. [Redis & Auto-Start](#20-redis--auto-start)
21. [Frontend Architecture](#21-frontend-architecture)
22. [Editor Component](#22-editor-component)
23. [File System & localStorage](#23-file-system--localstorage)
24. [Templates Library](#24-templates-library)
25. [UI Components Reference](#25-ui-components-reference)
26. [Routing](#26-routing)
27. [Keyboard Shortcuts](#27-keyboard-shortcuts)
28. [Build Pipeline (APK)](#28-build-pipeline-apk)
29. [Known Limitations](#29-known-limitations)
30. [Roadmap](#30-roadmap)
31. [Deployment](#31-deployment)
32. [Troubleshooting](#32-troubleshooting)

---

## 1. Product Overview

CloudIDE is a **full-stack, browser-based development environment** competing with Replit,
CodeSandbox, and Glitch. Users write, run, share, and version code without installing anything.

### Pages at a Glance

| URL | Description |
|-----|-------------|
| `/` or `/ide/` | **Landing page** — hero, features, pricing, CTA |
| `/ide/ide` | **The IDE** — full editor experience |
| `/ide/explore` | **Explore** — community-shared project gallery |
| `/ide/auth` | **Auth** — sign in / create account |
| `/ide/p/:shareId` | **Shared project** — read-only view + fork |

### Value Proposition
- **Zero friction** — no sign-up to start coding, editor opens instantly
- **Real execution** — JavaScript, TypeScript, Python run in a real sandboxed subprocess
- **Live HTML preview** — HTML renders as an iframe the moment you click Run
- **Streaming output** — output appears in real time, not after the process exits
- **Community gallery** — browse, fork, remix public projects
- **APK builder** — Flutter/Android build pipeline when SDKs are available
- **Professional design** — dark theme, status bar, polished toolbar

---

## 2. What Works Right Now

### ✅ Fully Working (Zero Config)

| Feature | How it Works |
|---------|-------------|
| **JavaScript execution** | Node.js subprocess, ES modules, async/await, full stdlib |
| **TypeScript execution** | `tsx` transpiler, full TS features, no tsconfig needed |
| **Python execution** | `python3`, all stdlib, unbuffered real-time output |
| **HTML live preview** | Renders in sandboxed `<iframe>`, inline CSS + JS work |
| **Real-time output streaming** | SSE (Server-Sent Events) — chunks appear as they print |
| **Ctrl+Enter / ⌘+Enter to Run** | Editor keyboard shortcut, works on any open runnable file |
| **Multi-file workspace** | Create, rename, delete files; folder grouping in file tree |
| **Project save & load** | JWT-authenticated PostgreSQL save; named projects |
| **Project version history** | Snapshot at any point; restore any version with one click |
| **Public share links** | Generate `/p/:shareId` link; anyone can view + fork |
| **Community Explore** | Infinite-scroll gallery; filter by language; open/fork |
| **JWT authentication** | httpOnly cookie, 24h expiry, bcrypt passwords |
| **Usage tracking** | 50 runs/day per user/IP; live counter in toolbar + status bar |
| **Templates** | 15+ templates: JS, TS, Python, HTML, Flutter, RN, Android… |
| **Font size control** | +/− buttons in status bar; persisted to localStorage |
| **Line/col indicator** | Live cursor position in status bar |
| **Console clear** | Trash button after each run |
| **Reset workspace** | Reset button → back to default JS in one click |
| **Status bar** | Language, file name, cursor pos, run count, Home link |
| **Welcome screen** | Quick-start tiles when no file is open |
| **Autosave** | Debounced 3s autosave when a project is loaded |

### ⚠️ Requires Additional Server Setup

| Feature | Requirement |
|---------|-------------|
| Flutter APK build | Install Flutter SDK, add to PATH |
| Android APK build | Java 17+, Android SDK, `ANDROID_HOME` env var |

### ❌ Planned / Not Yet Built

| Feature | ETA |
|---------|-----|
| Real-time collaboration | Medium term |
| npm/pip package installer | Medium term |
| GitHub import | Medium term |
| Version diff viewer | Short term |
| Command palette (Ctrl+K) | Short term |
| Embed mode (`<iframe>` any project) | Short term |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          Browser                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │    React + Vite SPA  (Vite dev: port 21471, base /ide/)  │    │
│  │                                                           │    │
│  │  / (LandingPage)  /ide (IDE)  /explore  /auth  /p/:id    │    │
│  └──────────────────────┬────────────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────────────┘
                          │  HTTPS  (Replit mTLS proxy)
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│              Express 5 API  (port 8080 → /api/*)                 │
│                                                                   │
│  POST /api/run/stream    → SSE code execution (direct, <1ms)    │
│  POST /api/build         → APK job enqueue (BullMQ)             │
│  GET  /api/build/:id     → job status poll                       │
│  GET  /api/download/:id  → APK file stream                       │
│  /api/auth/*             → register / login / me / logout        │
│  /api/projects/*         → CRUD + versions                       │
│  /api/share/*            → create + read share links             │
│  GET  /api/explore       → paginated public feed                 │
│  GET  /api/usage         → runs remaining today                  │
│  GET  /api/admin/queues  → Bull Board (dev only)                 │
└──────────┬──────────────────────────┬────────────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────────┐   ┌──────────────────────────────┐
│  PostgreSQL (Replit)  │   │  Redis  (auto-start port 6379)│
│                       │   │                               │
│  users                │   │  BullMQ queues:               │
│  projects             │   │   code-run-queue (concur: 8)  │
│  project_versions     │   │   build-queue (concur: 2)     │
│  share_links          │   │                               │
└──────────────────────┘   │  Rate-limit counters           │
                            └──────────────────────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │    Sandbox Workers     │
                            │                        │
                            │  node main.mjs         │
                            │  tsx main.ts           │
                            │  python3 main.py       │
                            │  flutter build apk     │
                            │  gradle assembleDebug  │
                            └────────────────────────┘
```

---

## 4. Tech Stack

### Frontend (`artifacts/cloud-ide/`)

| Package | Version | Role |
|---------|---------|------|
| React | 18 | UI framework |
| Vite | 7 | Dev server + build |
| TypeScript | 5 | Type safety |
| Wouter | 3 | Client-side routing |
| CodeMirror 6 | 6.x | Code editor engine |
| TailwindCSS | 4 | Utility-first styling |
| TanStack Query | 5 | Server state management |
| Lucide React | latest | Icon set |
| shadcn/ui | custom | Base component library |
| JSZip | 3 | ZIP creation for APK build upload |

### Backend (`artifacts/api-server/`)

| Package | Version | Role |
|---------|---------|------|
| Node.js | 20 | Runtime |
| Express | 5 | HTTP framework |
| TypeScript | 5 | Type safety |
| Drizzle ORM | 0.38 | Type-safe DB queries |
| PostgreSQL | 16 | Primary data store |
| Redis | 7 | Queue + rate limit backing |
| BullMQ | 5 | Job queue (runs + builds) |
| ioredis | 5 | Redis client |
| bcryptjs | 2 | Password hashing |
| jsonwebtoken | 9 | JWT session tokens |
| pino | 9 | Structured logging |
| esbuild | 0.24 | Fast server bundler |

---

## 5. Directory Structure

```
workspace/
├── artifacts/
│   ├── cloud-ide/                   ← Frontend SPA
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── LandingPage.tsx  ← / — marketing home
│   │   │   │   ├── IDE.tsx          ← /ide — editor
│   │   │   │   ├── Explore.tsx      ← /explore — gallery
│   │   │   │   ├── AuthPage.tsx     ← /auth — sign in
│   │   │   │   └── SharedProject.tsx← /p/:id — read-only
│   │   │   ├── components/
│   │   │   │   ├── Editor.tsx       ← CodeMirror 6 wrapper
│   │   │   │   ├── Toolbar.tsx      ← Top bar
│   │   │   │   ├── StatusBar.tsx    ← Bottom info bar
│   │   │   │   ├── TabBar.tsx       ← Open file tabs
│   │   │   │   ├── FileTree.tsx     ← Left sidebar
│   │   │   │   ├── PreviewPanel.tsx ← Right panel
│   │   │   │   ├── ConsoleOutput.tsx← Console tab
│   │   │   │   ├── BuildLog.tsx     ← Build log tab
│   │   │   │   ├── TemplateSelector.tsx
│   │   │   │   ├── ProjectsModal.tsx
│   │   │   │   └── ShareModal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useRun.ts        ← SSE code execution
│   │   │   │   ├── useBuild.ts      ← APK build + polling
│   │   │   │   ├── useFileSystem.ts ← File state + localStorage
│   │   │   │   └── useProjects.ts   ← Project CRUD
│   │   │   ├── contexts/
│   │   │   │   └── AuthContext.tsx  ← Auth state + API
│   │   │   ├── lib/
│   │   │   │   └── templates.ts     ← 15+ project templates
│   │   │   └── App.tsx              ← Router setup
│   │   └── vite.config.ts
│   │
│   └── api-server/                  ← Backend API
│       ├── src/
│       │   ├── index.ts             ← Entry: Express + workers
│       │   ├── routes/
│       │   │   ├── run.ts           ← POST /api/run/stream
│       │   │   ├── build.ts         ← POST /api/build
│       │   │   ├── auth.ts          ← /api/auth/*
│       │   │   ├── projects.ts      ← /api/projects/*
│       │   │   ├── share.ts         ← /api/share/*
│       │   │   ├── explore.ts       ← GET /api/explore
│       │   │   └── usage.ts         ← GET /api/usage
│       │   ├── lib/
│       │   │   ├── execution.ts     ← Language handlers + sandbox
│       │   │   ├── redis.ts         ← Redis + auto-start
│       │   │   └── db.ts            ← Drizzle + schema
│       │   ├── workers/
│       │   │   ├── codeRunWorker.ts ← BullMQ code-run worker
│       │   │   └── buildWorker.ts   ← BullMQ APK build worker
│       │   └── middlewares/
│       │       └── auth.ts          ← JWT verification
│       └── build.mjs                ← esbuild bundler
│
├── pnpm-workspace.yaml
├── package.json
└── README.md                        ← This file
```

---

## 6. Running Locally

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL (Replit DB auto-configured)
- Redis 7 (auto-started if not running)

### Install all dependencies
```bash
pnpm install
```

### Start API server
```bash
pnpm --filter @workspace/api-server run dev
# Builds with esbuild → starts on port 8080
# Workflow name: "API Server"
```

### Start frontend
```bash
pnpm --filter @workspace/cloud-ide run dev
# Vite dev server on port 21471, base path /ide/
# Workflow name: "artifacts/cloud-ide: web"
```

### On Replit
Both workflows start automatically. Select them from the workflow dropdown in the IDE:
- **API Server** (or `artifacts/api-server: API Server`)
- **artifacts/cloud-ide: web**

---

## 7. Environment Variables

Set these in Replit's Secrets panel (never commit to git).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | 64+ char random string for JWT signing |
| `SESSION_SECRET` | Optional | Fallback if `JWT_SECRET` not set |
| `PORT` | Auto | API listen port (default: 8080) |
| `NODE_ENV` | Auto | `development` or `production` |
| `FLUTTER_PATH` | Optional | Path to Flutter binary if not on PATH |
| `ANDROID_HOME` | Optional | Android SDK root directory |
| `JAVA_HOME` | Optional | Java 17+ installation |
| `LOG_LEVEL` | Optional | Pino level: `debug`/`info`/`warn`/`error` |

Generate `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 8. API Reference — Authentication

### `POST /api/auth/register`
Create a new account. Sets `session` httpOnly cookie on success.

**Request body:**
```json
{ "email": "you@example.com", "password": "minimum8chars" }
```

**Response 200:**
```json
{ "user": { "id": "uuid", "email": "you@example.com" } }
```

**Errors:**
- `400` — email already exists
- `400` — password too short (< 8 chars)
- `422` — invalid email format

---

### `POST /api/auth/login`
Sign in. Sets `session` httpOnly cookie on success.

**Request body:**
```json
{ "email": "you@example.com", "password": "yourpassword" }
```

**Response 200:**
```json
{ "user": { "id": "uuid", "email": "you@example.com" } }
```

**Errors:**
- `401` — invalid email or password

---

### `GET /api/auth/me`
Get the currently authenticated user.

**Response 200 (logged in):**
```json
{ "user": { "id": "uuid", "email": "you@example.com" } }
```

**Response 401 (not logged in):**
```json
{ "error": "Not authenticated" }
```

---

### `POST /api/auth/logout`
Clear the session cookie.

**Response 200:**
```json
{ "ok": true }
```

---

## 9. API Reference — Code Execution

### `POST /api/run/stream`

Execute code and stream output via **Server-Sent Events**.

**Request headers:**
```
Content-Type: application/json
Cookie: session=<jwt>   (optional — for run-count tracking)
```

**Request body:**
```json
{
  "language": "javascript",
  "code": "console.log('hello world')",
  "filename": "index.js"
}
```

**Supported language values:**

| Value | Aliases | Runtime |
|-------|---------|---------|
| `javascript` | `js`, `jsx` | Node.js 20 |
| `typescript` | `ts`, `tsx` | tsx (Node.js 20) |
| `python` | `py`, `python3` | python3 |
| `html` | `htm` | iframe (no subprocess) |

**Response — streaming SSE:**
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no

data: {"type":"stdout","chunk":"hello world\n"}

data: {"type":"done","exitCode":0,"duration":38}

data: {"type":"usage","remaining":49}
```

**SSE Event types:**

| `type` | Extra fields | Meaning |
|--------|-------------|---------|
| `stdout` | `chunk: string` | Normal output printed by user code |
| `stderr` | `chunk: string` | Error output (stderr) — shown in red |
| `error` | `error: string`, `chunk?: string` | Sandbox error (timeout, blocked module) |
| `done` | `exitCode: number`, `duration: number` | Process finished |
| `usage` | `remaining: number` | Updated daily run counter |

**HTML special flow:**
When language is `html`, no subprocess runs. Instead:
1. `stdout` event carries `__HTML_PREVIEW__` as chunk (signals iframe mode)
2. `done` event carries the raw HTML as its `chunk`
3. Frontend renders `chunk` as `srcDoc` in a sandboxed `<iframe>`

**Error responses (non-streaming):**

```json
HTTP 429
{ "error": "Daily run limit reached", "remaining": 0 }

HTTP 400
{ "error": "Module \"fs\" is not allowed in the sandbox" }

HTTP 400
{ "error": "Language not supported: ruby" }

HTTP 400
{ "error": "Invalid filename: path traversal not allowed" }
```

---

## 10. API Reference — Projects & Versions

All project endpoints require `Cookie: session=<jwt>`.

### `GET /api/projects`
List all projects for the current user, newest first.

**Response 200:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "My Counter App",
      "projectType": "javascript",
      "createdAt": "2025-05-01T12:00:00Z",
      "updatedAt": "2025-05-01T13:30:00Z"
    }
  ]
}
```

---

### `POST /api/projects`
Create or update a project. Pass `id` to update an existing project.

**Request body:**
```json
{
  "name": "My Counter App",
  "projectType": "javascript",
  "files": {
    "index.js": "let count = 0;\nconsole.log(++count);"
  },
  "id": "optional-uuid-to-update"
}
```

**Response 200:**
```json
{
  "project": {
    "id": "uuid",
    "name": "My Counter App",
    "projectType": "javascript",
    "files": { "index.js": "..." },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### `GET /api/projects/:id`
Get a single project with all files.

---

### `DELETE /api/projects/:id`
Delete a project and all its versions.

---

### `POST /api/projects/:id/versions`
Create a named snapshot of the current project state.

**Request body:**
```json
{ "label": "v1.0 - first working version" }
```

**Response 200:**
```json
{ "version": { "id": "uuid", "label": "v1.0 - first working version", "createdAt": "..." } }
```

---

### `GET /api/projects/:id/versions`
List all versions for a project, newest first.

**Response 200:**
```json
{
  "versions": [
    { "id": "uuid", "label": "v1.0", "createdAt": "...", "files": { ... } }
  ]
}
```

---

## 11. API Reference — Sharing & Explore

### `POST /api/share`
Create a public share link. Project must belong to the authenticated user.

**Request body:**
```json
{ "projectId": "uuid" }
```

**Response 200:**
```json
{
  "shareId": "abc12345",
  "url": "/p/abc12345"
}
```

---

### `GET /api/share/:shareId`
Get the files and metadata for a shared project. Public — no auth required.

**Response 200:**
```json
{
  "project": {
    "name": "My Counter App",
    "projectType": "javascript",
    "files": { "index.js": "..." }
  }
}
```

---

### `POST /api/share/:shareId/event`
Record an analytics event (view, fork, run).

**Request body:**
```json
{ "event": "view" }
```

Supported events: `"view"`, `"fork"`, `"run"`

---

### `GET /api/explore`
Paginated public project feed, ranked by engagement score.

**Query parameters:**
- `limit` — results per page (default: `20`, max: `50`)
- `offset` — pagination offset (default: `0`)

**Response 200:**
```json
{
  "projects": [
    {
      "shareId": "abc12345",
      "title": "My Counter App",
      "projectType": "javascript",
      "totalViews": 142,
      "uniqueViews": 98,
      "forksCount": 12,
      "runsCount": 67,
      "score": 231,
      "createdAt": "2025-05-01T12:00:00Z"
    }
  ],
  "hasMore": true
}
```

**Score formula:** `totalViews + (uniqueViews × 2) + (forksCount × 10) + (runsCount × 5)`

---

### `GET /api/usage`
Get the current user's run quota status.

**Response 200:**
```json
{ "runsRemaining": 47, "limit": 50 }
```

---

## 12. API Reference — APK Build

### `POST /api/build`
Start a Flutter or Android APK build job.

For **Flutter/Android**: send files as a ZIP form upload.
For **React Native**: send files as JSON body.

**Flutter/Android request (multipart):**
```
POST /api/build
Content-Type: multipart/form-data

project=<zip-file-blob>
```

**React Native request (JSON):**
```json
POST /api/build/project
{
  "type": "react-native",
  "name": "My App",
  "files": { "App.tsx": "..." }
}
```

**Response 200:**
```json
{ "jobId": "uuid", "status": "queued" }
```

**Response 503 (SDK missing):**
```json
{ "error": "Flutter SDK not available. Install Flutter and ensure it is on PATH." }
```

---

### `GET /api/build/:jobId`
Poll build status. Call every 2 seconds until `status` is `"success"` or `"failed"`.

**Response 200:**
```json
{
  "jobId": "uuid",
  "status": "queued" | "active" | "success" | "failed",
  "progress": 0–100,
  "logs": "Running flutter pub get...\n",
  "apkUrl": "/api/download/uuid"
}
```

---

### `GET /api/download/:jobId`
Download the compiled APK file.

**Response:** Binary stream, `Content-Type: application/vnd.android.package-archive`

---

## 13. Code Execution Engine

File: `artifacts/api-server/src/lib/execution.ts`

### Execution pipeline (per run)

```
1. Receive POST /api/run/stream
2. Check rate limit → 429 if exhausted
3. Resolve language handler by language string or file extension
4. Run checkForDangerousCode() → 400 if blocked pattern found
5. Check filename for path traversal → 400 if invalid
6. Allocate execId (6-byte hex random)
7. Create temp dir: /tmp/ide_exec_{execId}/
8. Write code to temp file (main.mjs / main.ts / main.py)
9. Spawn subprocess with sandboxed env (no secrets, no real HOME)
10. Start 10s timeout timer
11. Stream stdout/stderr chunks → SSE response
12. On process exit → emit "done" event + usage update
13. Delete temp dir
```

### JavaScript handler
```bash
node --max-old-space-size=128 --no-warnings --no-deprecation main.mjs
```
Code wrapped in async IIFE:
```js
(async () => {
  // YOUR CODE
})().catch(e => { process.stderr.write(String(e) + '\n'); process.exit(1); });
```
This allows top-level `await` without `--experimental-vm-modules`.

### TypeScript handler
```bash
tsx --max-old-space-size=128 --no-warnings main.ts
```
`tsx` (TypeScript Execute) transpiles on the fly — no tsconfig or tsc needed.

### Python handler
```bash
python3 -u main.py
```
Resource limits prepended automatically:
```python
import resource as _r
_r.setrlimit(_r.RLIMIT_CPU, (10, 10))  # 10 second CPU limit
```
`-u` flag disables output buffering for real-time streaming.

### HTML handler
No subprocess. Returns an SSE sequence:
1. `stdout: "__HTML_PREVIEW__"` — signals frontend to switch to iframe mode
2. `done: chunk=<html>` — the raw HTML content
Frontend renders it as `<iframe sandbox="allow-scripts" srcDoc={html} />`

---

## 14. Security Model

### Sandbox isolation
User code runs with:
- **Temp directory only** — no access to server filesystem
- **Minimal env** — `PATH`, `HOME=/tmp`, `TMPDIR=/tmp`, `TERM=dumb`, no secrets
- **128 MB Node.js heap** — prevents memory exhaustion
- **10 second timeout** — `SIGKILL` after 10s
- **100 KB output cap** — `SIGKILL` + truncation message at 100 KB
- **Blocked node modules:** `fs`, `http`, `https`, `net`, `tls`, `child_process`, `cluster`, `worker_threads`, `vm`, `v8`
- **Blocked APIs:** `fetch()`, `XMLHttpRequest`, `WebSocket`, `process.env`, `process.exit()`, `__dirname`, `__filename`

All blocking is done via fast regex pattern matching before execution starts.

### Web security headers
- `helmet()` middleware: `X-Frame-Options`, `X-Content-Type-Options`, etc.
- HTML preview iframe: `sandbox="allow-scripts"` (no `allow-same-origin`)
- Cookies: `httpOnly`, `SameSite=strict`, `secure` in production

### Auth security
- Passwords: `bcryptjs` with 10 salt rounds
- JWTs: `HS256`, 24h expiry, signed with 64+ char secret
- Sessions: httpOnly cookie, never exposed to JavaScript
- No secrets in localStorage, URL params, or response bodies

### Input validation
- Zod schemas on all API inputs
- Filename path-traversal detection (`..`, absolute paths, control chars)
- Code size limit: 512 KB per request
- Rate limiting: separate limits for auth endpoints (brute-force protection)

---

## 15. Rate Limiting

### Run limit
| User type | Limit | Reset |
|-----------|-------|-------|
| Anonymous (IP-based) | 50/day | Midnight UTC |
| Authenticated user | 50/day | Midnight UTC |

Implementation: Redis key `runs:{userId_or_ip}:{YYYY-MM-DD}` with TTL = seconds until midnight.

On limit exceeded:
```
HTTP 429
{ "error": "Daily run limit reached", "remaining": 0 }
```

The SSE stream also emits:
```
data: {"type":"usage","remaining":49}
```
…after each successful run so the UI counter stays in sync.

### API rate limit
- General: 100 req/min per IP
- Auth endpoints: 10 req/min per IP

---

## 16. Real-Time SSE Streaming

Code execution output streams via **Server-Sent Events (SSE)** — a unidirectional HTTP/1.1 push protocol.

### Why SSE instead of WebSocket?
- One-way (server → client) — perfect for process output
- Works through HTTP/2 and reverse proxies without special config
- Native `EventSource` browser API
- No handshake overhead vs WebSocket

### SSE wire format
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no        ← Disables nginx buffering

data: {"type":"stdout","chunk":"Line 1\n"}

data: {"type":"stdout","chunk":"Line 2\n"}

data: {"type":"done","exitCode":0,"duration":42}
```

Each SSE message is `data: <json>\n\n`.

### Frontend SSE client (useRun.ts)
Uses `fetch()` + `ReadableStream` (NOT `EventSource`):
- `EventSource` doesn't support POST or custom headers
- `fetch()` with `credentials: "include"` sends the auth cookie
- Manual SSE parsing: split on `\n\n`, find `data: ` prefix, parse JSON

### Back-pressure
The stream is push-only. If the client disconnects, the server detects it via `res.on("close")` and kills the subprocess.

---

## 17. Authentication System

File: `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/middlewares/auth.ts`

### Registration flow
1. Validate email + password (Zod)
2. Check email uniqueness in `users` table
3. Hash password: `bcryptjs.hash(password, 10)`
4. Insert user row
5. Sign JWT: `jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "24h" })`
6. Set cookie: `res.cookie("session", token, { httpOnly: true, sameSite: "strict" })`
7. Return `{ user: { id, email } }`

### Login flow
1. Validate email + password (Zod)
2. Find user by email
3. Compare: `bcryptjs.compare(password, user.password)`
4. If match → sign JWT + set cookie + return user
5. If no match → `401 { error: "Invalid email or password" }`

### Request authentication (middleware)
```ts
function authenticateRequest(req, res, next) {
  const token = req.cookies.session;
  if (!token) return next();          // anonymous — req.user = undefined
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie("session");
    res.status(401).json({ error: "Session expired" });
  }
}
```

### Frontend auth (AuthContext.tsx)
```
GET /api/auth/me on mount → populate user state
login()  → POST /api/auth/login  → update user state
logout() → POST /api/auth/logout → clear user state
```
Auth state drives: toolbar user indicator, sign-in modal, autosave gating.

---

## 18. Database Schema

File: `artifacts/api-server/src/lib/db.ts` (Drizzle ORM)

### `users`
```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,          -- bcrypt hash
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);
```

### `projects`
```sql
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  project_type TEXT NOT NULL DEFAULT 'web',
  files        JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_projects_user ON projects(user_id);
```

### `project_versions`
```sql
CREATE TABLE project_versions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  files      JSONB NOT NULL,         -- full snapshot
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_versions_project ON project_versions(project_id);
```

### `share_links`
```sql
CREATE TABLE share_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id     TEXT UNIQUE NOT NULL,  -- e.g. "abc12345"
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_views  INT DEFAULT 0,
  unique_views INT DEFAULT 0,
  forks_count  INT DEFAULT 0,
  runs_count   INT DEFAULT 0,
  score        INT GENERATED ALWAYS AS
               (total_views + unique_views*2 + forks_count*10 + runs_count*5) STORED,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_share_score ON share_links(score DESC);
```

---

## 19. BullMQ Job Queues

### Queues

| Queue | Worker | Concurrency | Purpose |
|-------|--------|-------------|---------|
| `code-run-queue` | `codeRunWorker.ts` | 8 | Async code execution jobs |
| `build-queue` | `buildWorker.ts` | 2 | Flutter/Android APK builds |

> **Note:** `/api/run/stream` executes code **directly** (not via queue) to minimize latency. The queue is a fallback path. APK builds always use the queue.

### Job lifecycle
```
queued → active → completed
                ↘ failed
```

### Job retention
- Completed jobs: kept for 1 hour
- Failed jobs: kept for 24 hours (for debugging)

### Bull Board Admin
Visit `GET /api/admin/queues` in development to see a visual dashboard showing:
- Queue depth
- Active/completed/failed job counts
- Per-job logs and metadata

---

## 20. Redis & Auto-Start

File: `artifacts/api-server/src/lib/redis.ts`

Redis is required for BullMQ. If it's not running, the API server starts it automatically:

```ts
async function ensureRedis() {
  try {
    await redis.ping();  // already running
  } catch (e) {
    if (e.code === "ECONNREFUSED") {
      spawn("redis-server", ["--port", "6379", "--daemonize", "yes"]);
      await waitForReady();
      await redis.config("SET", "maxmemory", "512mb");
      await redis.config("SET", "maxmemory-policy", "allkeys-lru");
    }
  }
}
```

This runs at server startup, so Redis is always available.

---

## 21. Frontend Architecture

### State management overview

| Concern | Solution |
|---------|----------|
| Auth (user session) | `AuthContext` — React Context + cookie |
| File contents | `useFileSystem` — React state + localStorage |
| Run output | `useRun` — SSE stream → React state |
| Build status | `useBuild` — polling → TanStack Query |
| Projects list | `useProjects` — TanStack Query → API |
| UI layout | Local `useState` in `IDE.tsx` |

### Key data flows

#### Writing and running code
```
User types in Editor
    → onChange() fires
    → saveFile(path, content) debounce-persists to localStorage
    → if project loaded: scheduleAutosave() (3s debounce → POST /api/projects)

User presses Ctrl+Enter or clicks Run
    → IDE.handleRun()
    → Pre-flight: detect mobile imports → show client error if found
    → useRun.runCode(language, code)
    → POST /api/run/stream with SSE
    → Chunks stream in → ConsoleOutput renders in real time
    → done event → show exit status + duration
```

#### Saving and loading projects
```
User clicks Projects → ProjectsModal opens
    → GET /api/projects (TanStack Query)
    → List shows all saved projects

User clicks Save
    → POST /api/projects (create or update)
    → setCurrentProjectId / setCurrentProjectName
    → Autosave now active on future edits

User clicks Load
    → loads files into useFileSystem
    → opens first file in editor
```

### localStorage versioning
Current key: `cloudide_files_v3`

On load:
1. Delete stale keys: `cloudide_files`, `cloudide_files_v2`
2. Parse saved files
3. Reject mobile-only saves (no runnable `.js/.ts/.py/.html` file)
4. Fall back to default JS files if reject or parse error

---

## 22. Editor Component

File: `artifacts/cloud-ide/src/components/Editor.tsx`

Engine: **CodeMirror 6** (not Monaco — smaller bundle, more extensible)

### Props
```ts
interface EditorProps {
  initialContent:    string;
  filename:          string;
  onChange:          (content: string) => void;
  onRun?:            () => void;    // called on Ctrl+Enter / ⌘+Enter
  onCursorChange?:   (line: number, col: number) => void;
  fontSize?:         number;        // default: 13
  readOnly?:         boolean;       // for SharedProject view
}

interface EditorRef {
  getContent: () => string;
  getCursorPosition: () => { line: number; col: number };
}
```

### Features
- Syntax highlighting for 20+ languages
- Bracket matching + auto-close
- Indent with Tab (4 spaces)
- Undo/redo history
- Line numbers
- Active line highlight
- Autocomplete (CodeMirror built-in)
- Ctrl+Enter / ⌘+Enter → calls `onRun` prop

### Supported syntax highlighting
HTML, CSS, SCSS, JavaScript (JSX), TypeScript (TSX), JSON, XML, Markdown,
Java, Kotlin, C, C++, C#, Python, Rust, Go, Dart, Swift, YAML, TOML, Shell

---

## 23. File System & localStorage

File: `artifacts/cloud-ide/src/hooks/useFileSystem.ts`

### Storage key
`cloudide_files_v3` — bump the version suffix any time default files change.

### Default files (v3)
```
index.js    — JS demo (async/await, array methods)
index.html  — HTML with interactive button (demonstrates live preview)
README.md   — Quick-start guide
```

### API
```ts
const {
  files,           // Record<string, string> — filename → content
  saveFile,        // (path, content) → void
  createFile,      // (path, content?) → boolean
  renameFile,      // (oldPath, newPath) → boolean
  deleteFile,      // (path) → void
  loadTemplate,    // (files) → void (replaces all files)
  resetToDefaults, // () → void (back to index.js + index.html)
} = useFileSystem();
```

---

## 24. Templates Library

File: `artifacts/cloud-ide/src/lib/templates.ts`

### Section 1: Web / Runnable (instant execution in sandbox)

| ID | Name | Language | Features |
|----|------|----------|---------|
| `js-starter` | JavaScript Starter | JavaScript | Console demo, async/await |
| `js-algorithms` | JS Algorithms | JavaScript | Sorting, searching, recursion |
| `ts-starter` | TypeScript Starter | TypeScript | Interfaces, generics, classes |
| `python-starter` | Python Script | Python | Functions, comprehensions |
| `python-data` | Python Data | Python | Statistics, data processing |
| `html-page` | HTML Page | HTML | Styled page with JS interactivity |
| `html-canvas` | HTML Canvas | HTML | `<canvas>` animation demo |

### Section 2: Mobile / Build Required

| ID | Name | Language | Build Method |
|----|------|----------|-------------|
| `flutter` | Flutter | Dart | `flutter build apk` |
| `react-native-ts` | React Native (TS) | TypeScript | Expo Snack preview |
| `android-kotlin` | Android (Kotlin) | Kotlin | Gradle `assembleDebug` |
| `android-java` | Android (Java) | Java | Gradle `assembleDebug` |
| `ios-swift` | iOS (Swift) | Swift | Xcode (macOS only) |
| `python-kivy` | Python (Kivy) | Python | Buildozer |
| `dotnet-maui` | .NET MAUI (C#) | C# | dotnet build |

---

## 25. UI Components Reference

### Toolbar (`Toolbar.tsx`)
Top navigation bar, height 44px.
- **Left:** CloudIDE logo (→ `/`), New, Projects, Explore, Share, Reset
- **Right:** Run (green, glows when enabled), Build APK, Download APK (after build), Sign in/out

Run button states:
- `bg-[#4ade80] text-black shadow-glow` — enabled, ready
- `bg-white/8 text-white/30` — disabled (no runnable file, or limit hit)
- Shows spinner + "Running…" while executing

### StatusBar (`StatusBar.tsx`)
Bottom info bar, height 24px.
- **Left:** Home link, active filename
- **Right:** Running/Building status indicator, language, runs remaining
- Font size +/− buttons (when file is open)

### FileTree (`FileTree.tsx`)
Left sidebar. Auto-groups files into folders.
- Click → open file in editor
- Double-click → inline rename
- Hover → delete (×) button appears
- "+ File" button → `prompt()` for filename

### TabBar (`TabBar.tsx`)
Open file tabs above editor.
- Active tab: green top border (`border-t-[#4ade80]`)
- × button to close
- Overflow scrolls horizontally

### ConsoleOutput (`ConsoleOutput.tsx`)
Console output panel.
- Real-time SSE streaming
- `stdout` = white, `stderr` = red
- Status bar: running indicator, exit code, duration (ms)
- Trash icon to clear after run
- Auto-scrolls to bottom

### PreviewPanel (`PreviewPanel.tsx`)
Right panel with 3 tabs:
- **Preview** — HTML iframe or instructions
- **Console** — ConsoleOutput
- **Build Log** — APK build progress

### TemplateSelector (`TemplateSelector.tsx`)
Full-screen modal. Two sections:
1. **Run Instantly** (green badge) — JS/TS/Python/HTML
2. **Mobile / Build Required** (orange badge) — Flutter, RN, Android, iOS

### ProjectsModal (`ProjectsModal.tsx`)
Save/load/version project. Requires auth.

### ShareModal (`ShareModal.tsx`)
Generates a share link. Shows copyable URL.

### WelcomeScreen (inline in `IDE.tsx`)
Shown when no file is open. Quick-start tiles for JS/TS/Python/HTML.

---

## 26. Routing

### Vite base path
Vite is configured with `base: "/ide/"` (see `vite.config.ts`). This means:
- All static assets are served under `/ide/`
- Wouter uses `base="/ide/"` for URL matching

### Frontend routes (Wouter)
| Wouter path | Browser URL | Component |
|-------------|-------------|-----------|
| `/` | `/ide/` | `LandingPage` |
| `/ide` | `/ide/ide` | `IDE` |
| `/explore` | `/ide/explore` | `Explore` |
| `/auth` | `/ide/auth` | `AuthPage` |
| `/p/:shareId` | `/ide/p/:id` | `SharedProject` |
| (no match) | anything else | `NotFound` |

### API base
All backend routes are prefixed `/api/`. The Replit proxy forwards:
- `/api/*` → port 8080 (API server)
- `/ide/*` → port 21471 (Vite dev server / static)

---

## 27. Keyboard Shortcuts

| Shortcut | Action | Where |
|----------|--------|-------|
| `Ctrl+Enter` / `⌘+Enter` | Run current file | Editor |
| `Tab` | Indent 4 spaces | Editor |
| `Shift+Tab` | Dedent | Editor |
| `Ctrl+Z` / `⌘+Z` | Undo | Editor |
| `Ctrl+Y` / `⌘+Shift+Z` | Redo | Editor |
| `Ctrl+/` | Toggle comment | Editor (language-dependent) |
| `Ctrl+D` / `⌘+D` | Select next occurrence | Editor |
| `Ctrl+F` / `⌘+F` | Find in file | Editor |

---

## 28. Build Pipeline (APK)

### Current status
> Flutter SDK and Android SDK are **not installed** in this environment.
> The Build APK button shows a 503 error with a clear explanation.
> To enable builds, install the required SDKs (see below).

### Enabling Flutter builds
```bash
# 1. Install Flutter SDK
git clone https://github.com/flutter/flutter.git -b stable $HOME/flutter
export PATH="$PATH:$HOME/flutter/bin"

# 2. Download Dart SDK (included with Flutter)
flutter precache

# 3. Accept licenses
flutter doctor --android-licenses

# 4. Verify
flutter doctor
# Should show: Flutter (Channel stable), Dart SDK

# 5. Add FLUTTER_PATH to Replit Secrets
# FLUTTER_PATH = /home/runner/flutter/bin/flutter
```

### Enabling Android builds
```bash
# 1. Install Java 17
apt-get install openjdk-17-jdk

# 2. Download Android command-line tools
# https://developer.android.com/studio#command-line-tools-only

# 3. Set env vars (Replit Secrets)
# ANDROID_HOME = /path/to/android-sdk
# JAVA_HOME = /usr/lib/jvm/java-17-openjdk-amd64

# 4. Install build tools
sdkmanager "build-tools;34.0.0" "platforms;android-34"
```

### How the build pipeline works (when SDKs installed)

```
1. POST /api/build (multipart ZIP)
2. ZIP extracted to /tmp/build_{jobId}/
3. BullMQ job enqueued in build-queue
4. Worker picks up job:
   - Flutter: flutter pub get && flutter build apk --release
   - Android: ./gradlew assembleDebug
5. stdout/stderr logged in real time
6. APK copied to /tmp/apk_builds/{jobId}/app.apk
7. Job status → "success"
8. Frontend polls GET /api/build/:jobId every 2s
9. "Download APK" button appears in toolbar
10. GET /api/download/:jobId → binary stream
```

---

## 29. Known Limitations

| Limitation | Impact | Notes |
|-----------|--------|-------|
| Flutter/Android SDK missing | Build APK returns 503 | Install SDKs to enable |
| 50 runs/day cap | Power users hit limit | Sign in; Pro tier planned |
| 10 second execution timeout | Long computations fail | Optimize code or split into smaller scripts |
| No npm/pip install | Only stdlib available | Use CDN script tags in HTML for libraries |
| No persistent filesystem | Each run is a fresh temp dir | Save state in file content |
| `fetch()` blocked in sandbox | No HTTP calls from JS/TS | By design (security) |
| HTML preview: no external resources | CDN links load, but `fetch()` inside doesn't | Use inline data |
| No real-time collaboration | Single-user sessions only | Planned for medium term |
| No file upload | Can't import existing projects | Copy-paste code manually |
| Share requires auth | Anonymous users can't share | Create free account |
| Anonymous limit is IP-based | Shared IPs hit limit faster | Sign in for per-user limit |

---

## 30. Roadmap

### Short Term (next sprint)
- [ ] Settings panel — font size, word wrap, theme toggle
- [ ] Command palette — Ctrl+K modal with all actions
- [ ] Explore page search + language filter
- [ ] Version diff viewer — side-by-side file comparison
- [ ] Better Build APK page — SDK install guide + status

### Medium Term
- [ ] npm/pip package installer — sidebar panel
- [ ] GitHub import — paste repo URL, load files
- [ ] Embed mode — `<iframe>` embed any shared project
- [ ] PWA install — desktop app icon
- [ ] Version history restore UI — click to restore any snapshot

### Long Term (Pro Tier)
- [ ] Real-time collaboration (WebSocket + CRDT)
- [ ] Custom domains for HTML projects
- [ ] Database sandbox (SQLite via WASM)
- [ ] Private projects
- [ ] Team workspaces
- [ ] Unlimited runs (Pro tier)
- [ ] CI/CD integration (GitHub Actions trigger)

---

## 31. Deployment

### Deploy to Replit
1. Ensure `DATABASE_URL` and `JWT_SECRET` are set in Secrets
2. Click **Deploy** in the Replit header (or use the deploy tool)
3. Replit builds and hosts both services automatically

### Post-deploy verification
```bash
# 1. Landing page loads
curl -I https://your-app.replit.app/ide/

# 2. API health
curl https://your-app.replit.app/api/health

# 3. Code execution
curl -X POST https://your-app.replit.app/api/run/stream \
  -H "Content-Type: application/json" \
  -d '{"language":"python","code":"print(2+2)"}'
# Should stream: data: {"type":"stdout","chunk":"4\n"}

# 4. Auth round-trip
curl -c cookies.txt -X POST https://your-app.replit.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass123"}'
```

### Environment differences

| Setting | Development | Production |
|---------|------------|------------|
| Error details | Full stack traces | Generic messages |
| Bull Board | Accessible at /api/admin/queues | Hidden |
| Logging | Pino pretty-print | JSON (structured) |
| CORS | Permissive | Strict same-origin |
| Cookie `secure` | false | true |

---

## 32. Troubleshooting

### "502 Bad Gateway" on first open
**Cause:** Replit proxy cold start (~1–2 seconds).
**Fix:** Refresh the page. Happens only once after a long idle period.

### Build APK returns 503
**Cause:** Flutter/Android SDK not installed.
**Fix:** See §28 "Enabling Flutter/Android builds".

### "No runs left today"
**Cause:** 50/day limit hit.
**Fix:** Midnight UTC reset. Sign in to get a fresh 50-run counter per account.

### TypeScript fails with "tsx not found"
**Cause:** `tsx` binary not installed.
**Fix:**
```bash
cd artifacts/api-server
pnpm install
```

### Editor shows wrong syntax highlighting
**Cause:** File extension not recognized.
**Fix:** Rename the file to use the correct extension (`.js`, `.ts`, `.py`, `.html`).

### Old/broken files load on open
**Cause:** Stale localStorage from a previous session.
**Fix:** Click **Reset** in the toolbar. This clears to default JS files.
Or manually: `localStorage.removeItem("cloudide_files_v3")` in browser console.

### Autosave not working
**Cause:** No project loaded (only works after you explicitly Save a project).
**Fix:** Click Projects → Save (or create a new project). Autosave kicks in after first save.

### Python code hangs
**Cause:** Infinite loop or blocking `input()` call.
**Fix:** The 10s timeout kills it automatically. Avoid `input()` in sandbox code.

### Session expired / 401 errors
**Cause:** JWT cookie expired (24h TTL) or cleared.
**Fix:** Sign in again at `/ide/auth`.

### Redis errors in API logs
**Cause:** `redis-server` binary not available.
**Fix:**
```bash
which redis-server  # check if installed
# If not:
apt-get install redis-server
# Restart the API Server workflow
```

### Console shows nothing after clicking Run
**Cause 1:** The console tab is not selected — check the right panel tab.
**Cause 2:** The file is HTML — HTML goes to Preview tab, not Console.
**Cause 3:** Rate limit hit — look at the "runs remaining" counter in the toolbar.

### Explore page shows "No shared projects yet"
**Cause:** No one has created a public share link yet.
**Fix:** Open the IDE, save a project, share it via the Share button, then revisit Explore.

---

*CloudIDE — Built with ❤️ | Documentation last updated: May 2025*
