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
- **Database**: PostgreSQL + Drizzle ORM (`projectsTable` — uuid PK, userKey, name, projectType, files jsonb)
- **Validation**: Zod (catalog version), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo SDK 54, Expo Router, React Native 0.81.5
- **TypeScript execution**: `tsx` (installed in api-server)

## Cloud IDE Features (`artifacts/cloud-ide`)

- **CodeMirror 6 editor** with syntax highlighting for 15+ languages
- **Multi-tab editor** with localStorage-based file persistence
- **File tree** with folder grouping, language icons, inline rename, create/delete
- **Project templates** for 10 mobile stacks (see below)
- **SSE streaming execution** — real-time line-by-line output via `POST /api/run/stream`
- **Project save/load** — PostgreSQL-backed, scoped per browser via `X-User-Key` UUID header
- **Per-browser user key** — `crypto.randomUUID()` in localStorage key `cloudide-user-key`
- **APK Build pipeline**: zips files in-browser → uploads to `/api/build` → polls status → streams logs
- **Resizable panels**: file tree, editor, preview/log panel
- **Language badge** in toolbar shows detected language of active file
- **HTML live preview** — running an HTML file renders it directly in the Preview iframe

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

## Execution Engine

Language handler plugin map in `artifacts/api-server/src/routes/run.ts`:

| Language | Handler | Approach |
|----------|---------|----------|
| javascript | `javascriptHandler` | Node.js .mjs (ESM, top-level await via IIFE wrapper) |
| typescript | `typescriptHandler` | `tsx` binary for full TS support (generics, decorators) |
| python | `pythonHandler` | `python3` with resource limits (128MB RAM, 30s CPU) |
| html | `htmlHandler` | Returns HTML via SSE `done.chunk` for iframe preview |

All handlers stream via Server-Sent Events (`POST /api/run/stream`). Each line of stdout/stderr arrives as a separate SSE event. Execution is sandboxed in `/tmp/ide_exec_{uuid}/` temp directories (auto-cleaned).

## Rate Limiting (`artifacts/api-server/src/middlewares/rate-limit.ts`)

| Limiter | Route | Limit |
|---------|-------|-------|
| `runLimiter` | `/api/run`, `/api/run/stream` | 30 req/min per IP |
| `buildLimiter` | `/api/build`, `/api/build/project` | 5 req/min per IP |
| `projectLimiter` | `/api/projects/*` | 60 req/min per IP |

## Project Sharing System

### Backend
- `POST /api/projects/:id/share` — generates (or reuses) an 8-char hex share ID (e.g. `abc12345`), stores in `sharesTable`, returns `{ shareUrl: "/ide/p/abc12345", shareId }`. Idempotent — same project always gets the same link.
- `GET /api/share/:shareId` — public endpoint (no auth). Returns full project data without userKey. Rate-limited to 20 req/min by IP.

### Share URL Format
`/ide/p/<shareId>` — e.g. `/ide/p/5501de83`

### Shared View (`/p/:shareId` route in cloud-ide router)
- Full read-only CodeMirror 6 editor (non-editable via `EditorState.readOnly` + `EditorView.editable`)
- File explorer, tab bar, Preview + Console panels
- Run button (executes via SSE, no auth required)
- "read-only · fork to edit" watermark in editor
- "read-only" badge in toolbar

### Fork Flow
"Fork Project" button → `POST /api/projects` under forker's user key → navigates to `/` (main IDE). Original project is untouched.

### Share Button in IDE
Toolbar shows "Share" button only when `currentProjectId` is set (project has been saved). Opens `ShareModal` with:
- "Generate Share Link" button (calls `/api/projects/:id/share`)
- Displays full URL once generated
- "Copy Link" (clipboard) + "Preview" (new tab) actions

### Database Table
```
sharesTable:
  shareId    text PK (8-char hex, e.g. "5501de83")
  projectId  uuid NOT NULL references projects(id) ON DELETE CASCADE
  createdAt  timestamp default now()
```

## Core API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/run` | Buffered code execution (returns full output) |
| POST | `/api/run/stream` | SSE streaming execution (line-by-line) |
| POST | `/api/build` | Upload Flutter ZIP, queue APK build |
| POST | `/api/build/project` | Build from project files directly |
| GET | `/api/status/:jobId` | Poll build status |
| GET | `/api/download/:jobId` | Download compiled APK |
| GET | `/api/logs/:jobId` | Fetch build logs |
| GET | `/api/projects` | List user's projects (requires X-User-Key) |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get single project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/healthz` | Health check |

## Database Schema (`lib/db`)

```
projectsTable:
  id          uuid PK (default gen_random_uuid())
  userKey     text NOT NULL        — per-browser UUID from X-User-Key header
  name        text NOT NULL        — project name (max 120 chars)
  projectType text NOT NULL        — e.g. "javascript", "flutter"
  files       jsonb NOT NULL       — { filename: content } map
  createdAt   timestamp default now()
  updatedAt   timestamp default now()
```

Run `pnpm --filter @workspace/db run push` to apply schema changes to the database.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Flutter SDK Requirement

The build pipeline requires Flutter SDK, Android SDK, and Java to be installed on the server. These must be added to PATH:
- `flutter doctor` — verify Flutter installation
- `flutter build apk` — compile to APK

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
