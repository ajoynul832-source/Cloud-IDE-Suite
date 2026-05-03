# CloudIDE — Master Build Document

> **Version**: 2.2 | **Updated**: May 2026
>
> This is the single source of truth for the CloudIDE product.
> It documents every feature that works, every bug that exists,
> the full competitive landscape, and a phased roadmap to beat every competitor.
> Read this before touching a single line of code.

---

## What CloudIDE Is

A professional, browser-based cloud IDE with real code execution, live previews, mobile app building, JWT authentication, and a community explore gallery.

**The core promise:** Write code in your browser, see it run immediately. No setup, no installs, no waiting.

---

## Features

### Core Editor
- **Monaco-style editor** powered by CodeMirror 6 — syntax highlighting for 20+ languages
- **Multi-file workspace** — full file tree with create, rename, delete, expand/collapse folders
- **Tabs** — multiple open files, close with ✕
- **Autosave** — 3-second debounce autosave to PostgreSQL (when signed in)
- **Prettier formatting** — Ctrl+Shift+F formats JS/TS/HTML/CSS/JSON/Markdown
- **Word wrap toggle** — toolbar button + Alt+Z
- **Font size controls** — status bar +/- buttons, persisted to localStorage
- **Line/column display** — real-time cursor position in status bar
- **Theme switching** — VS Code Dark, GitHub Dark, Dracula, Monokai (settings panel)

### Code Execution
- **JavaScript / TypeScript** — Node.js (backend sandboxed child process)
- **Python** — python3 (backend)
- **Bash / Perl** — shell execution (backend)
- **C / C++** — gcc/g++ compile + run (backend)
- **50 runs/day** — per-user rate limit, resets midnight UTC
- **Stdin support** — expandable stdin textarea in console panel
- **Streaming output** — real-time stdout/stderr via SSE

### Live Previews (no backend needed)
- **HTML** — runs in sandboxed iframe instantly (Refresh + Open in new tab buttons)
- **CSS** — applied to a rich demo page with common UI patterns
- **Markdown** — rendered to styled GitHub-flavoured HTML
- **JSON** — colorized tree viewer
- **SVG** — rendered preview with dimensions
- **React (CDN)** — React 18 + Babel standalone, JSX works out of the box
- **Vue 3 (CDN)** — Composition API, no build step
- **Three.js** — UMD build, full 3D canvas via WebGL
- **p5.js** — creative coding, Perlin noise, generative art
- **Chart.js** — 4-panel responsive dashboard

### Mobile / React Native
- **React Native Web runner** — Expo Starter and RN templates run live in the browser via React Native Web 0.19 + Babel standalone. No Expo Snack API needed for web preview.
- **Android / iOS QR codes** — Expo Snack sync for testing on real devices via Expo Go
- **APK build pipeline** — Flutter/Kotlin/Java projects can be compiled (requires Flutter SDK on server)

### Auth & Projects
- **JWT httpOnly cookies** — secure session, bcrypt passwords
- **Projects saved to PostgreSQL** — load/save from Projects panel
- **Version history** — auto-snapshot on save
- **Share** — generate public read-only link for any project

### Explore Gallery
- **Browse public projects** — search by name, filter by language
- **Fork** — one-click fork into your own IDE workspace
- **Back button** goes to /ide (not the landing page)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, CodeMirror 6, wouter |
| Backend API | Express 5, TypeScript, Drizzle ORM |
| Database | PostgreSQL (Neon serverless) |
| Job Queue | BullMQ + Redis (Upstash) |
| Auth | JWT httpOnly cookies, bcrypt |
| Mobile preview | React Native Web 0.19.12, Babel standalone 7.23 |
| Code execution | Node.js child_process sandboxed subprocess |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
workspace/
├── artifacts/
│   ├── api-server/              Express 5 API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts      POST /auth/register, /login, /logout, GET /me
│   │   │   │   ├── run.ts       POST /run  (code execution + rate limiting)
│   │   │   │   ├── projects.ts  CRUD /projects
│   │   │   │   ├── build.ts     POST /build, GET /build/:jobId, GET /download/:jobId
│   │   │   │   ├── snack.ts     POST /snack  (Expo Snack proxy for QR codes)
│   │   │   │   └── explore.ts   GET /explore, GET /explore/:id
│   │   │   ├── db/
│   │   │   │   ├── schema.ts    Drizzle schema (users, projects, run_usage, versions)
│   │   │   │   └── index.ts     DB client
│   │   │   ├── lib/
│   │   │   │   ├── executor.ts  Sandboxed code runner
│   │   │   │   └── queue.ts     BullMQ build queue
│   │   │   └── index.ts         Server entry point
│   │   └── drizzle.config.ts
│   └── cloud-ide/               React + Vite frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── Editor.tsx           CodeMirror 6 wrapper with EditorRef
│       │   │   ├── Toolbar.tsx          Top bar with Run, Build, Nav, Settings
│       │   │   ├── FileTree.tsx         Multi-file tree with CRUD
│       │   │   ├── PreviewPanel.tsx     Tabbed right panel (Preview/Console/Build)
│       │   │   ├── MobilePreview.tsx    RNW runner + Expo Snack QR codes
│       │   │   ├── ConsoleOutput.tsx    Streaming stdout/stderr display
│       │   │   ├── BuildLog.tsx         APK build log with honest errors
│       │   │   ├── StatusBar.tsx        Language, cursor pos, font size
│       │   │   ├── TemplateSelector.tsx Template picker modal
│       │   │   ├── SettingsPanel.tsx    Slide-out settings (theme, font, wrap)
│       │   │   └── KeyboardShortcutsModal.tsx  "?" modal
│       │   ├── hooks/
│       │   │   ├── useFileSystem.ts     In-memory file store
│       │   │   ├── useRun.ts            Code execution + SSE streaming
│       │   │   ├── useBuild.ts          APK build job polling
│       │   │   ├── useProjects.ts       Save/load/version projects
│       │   │   └── useSnackSync.ts      Expo Snack debounced sync
│       │   ├── lib/
│       │   │   ├── templates.ts         ~35 project templates with full file content
│       │   │   └── preview-generators.ts  HTML generators for CSS/MD/JSON/SVG/RNW
│       │   └── pages/
│       │       ├── IDE.tsx              Main IDE orchestration (800 lines)
│       │       ├── Landing.tsx          Marketing landing page
│       │       ├── AuthPage.tsx         Sign in / sign up
│       │       ├── Explore.tsx          Community gallery
│       │       └── SharedProject.tsx    Read-only shared project view
│       └── vite.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL database (Neon works great, free tier)
- Redis instance (Upstash works, free tier)

### Install

```bash
pnpm install
```

### Environment Variables

Set these in your environment (or `.env` file in `artifacts/api-server/`):

```env
DATABASE_URL=postgresql://user:password@host/db
REDIS_URL=redis://default:token@host:port
JWT_SECRET=your-random-secret-at-least-32-characters
NODE_ENV=development
PORT=8080
```

### Run (development)

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (Vite dev server)
pnpm --filter @workspace/cloud-ide run dev
```

The IDE is available at `/ide/`, the landing page at `/`.

### Database migrations

```bash
pnpm --filter @workspace/api-server run db:push
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Run / Preview current file |
| `Ctrl+Shift+P` | **Command palette** (search all commands, files, templates) |
| `Ctrl+Shift+F` | Format with Prettier |
| `Ctrl+,` | Toggle settings panel |
| `?` | Keyboard shortcuts reference |
| `Alt+Z` | Toggle word wrap |
| `Ctrl+/` | Toggle line comment |
| `Ctrl+]` / `Ctrl+[` | Indent / dedent |
| `Ctrl+D` | Select next occurrence |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |
| `Ctrl+F` | Find in file |
| `Ctrl+G` | Go to line |

---

## Supported Languages

| Language | Execution | Live Preview |
|---|---|---|
| JavaScript (.js, .jsx, .mjs) | Node.js backend | — |
| TypeScript (.ts, .tsx) | ts-node backend | — |
| Python (.py) | python3 backend | — |
| Bash (.sh) | bash backend | — |
| Perl (.pl) | perl backend | — |
| C (.c) | gcc → run | — |
| C++ (.cpp, .cxx) | g++ → run | — |
| HTML (.html) | — | Sandboxed iframe (instant) |
| CSS (.css) | — | Styled demo page |
| Markdown (.md) | — | GitHub-flavoured HTML |
| JSON (.json) | — | Colorized tree |
| SVG (.svg) | — | Rendered image |
| React CDN (.html) | — | React 18 + Babel standalone |
| Vue 3 CDN (.html) | — | Composition API via CDN |
| Three.js (.html) | — | WebGL 3D canvas |
| p5.js (.html) | — | Creative coding canvas |
| Chart.js (.html) | — | Responsive chart dashboard |
| React Native (.js) | — | React Native Web (browser) |
| Go, Rust, Kotlin, Swift, … | — | Syntax highlight only |

---

## API Routes

All routes prefixed with `/api`.

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register, returns JWT cookie |
| `POST` | `/auth/login` | Login, returns JWT cookie |
| `POST` | `/auth/logout` | Clear JWT cookie |
| `GET` | `/auth/me` | Current user info |

### Code Execution
| Method | Path | Description |
|---|---|---|
| `POST` | `/run` | Execute code — body: `{ language, code, stdin?, filename? }` |
| `GET` | `/usage` | `{ runsRemaining: number }` |

### Projects
| Method | Path | Description |
|---|---|---|
| `GET` | `/projects` | List user's projects |
| `POST` | `/projects` | Save/create project |
| `GET` | `/projects/:id` | Load project files |
| `DELETE` | `/projects/:id` | Delete project |

### Build
| Method | Path | Description |
|---|---|---|
| `POST` | `/build` | Queue APK build — body: `{ files }` |
| `GET` | `/build/:jobId` | Poll job status |
| `GET` | `/download/:jobId` | Stream APK download |

### Explore
| Method | Path | Description |
|---|---|---|
| `GET` | `/explore` | List public projects (search/filter) |
| `GET` | `/explore/:id` | Get shared project |
| `POST` | `/explore/:id/fork` | Fork project to your account |

---

## Templates

35+ project templates in `artifacts/cloud-ide/src/lib/templates.ts`:

**Quick Start** (featured 6, run in < 2 seconds):
- React 18 CDN, TypeScript Starter, Python Data Science
- Three.js 3D, p5.js Flow Field, Chart.js Dashboard

**More Languages** (also runnable in the sandbox):
- JS Algorithms, TS Types/Generics, TS OOP, TS Async
- Python ML, Python Regex, Python Web Scrape
- Bash Script, C Program, C++ Program, Perl Script
- Vue 3 CDN, HTML Page, HTML Canvas, CSS Animations, CSS Grid
- Markdown Doc, JSON Explorer, SVG Art, API Mock

**Mobile Live Preview** (runs in-browser, no build):
- Expo Starter (React Native Web)
- React Native TypeScript (React Native Web)

**Mobile — Build Required**:
- Flutter, Android Kotlin, Android Java, iOS Swift, Python Kivy

### Adding a template

```typescript
// In artifacts/cloud-ide/src/lib/templates.ts
{
  id: "my-template",        // unique slug
  name: "My Template",
  description: "Short description",
  icon: "🎯",               // emoji
  language: "JavaScript",
  runnable: true,           // appears in "Runnable Now" section
  files: {
    "main.js": `// your starter code here\nconsole.log("Hello!");`,
  },
}
```

---

## React Native Web Preview (How It Works)

Mobile templates run live in the browser — no Expo API dependency for the web tab:

1. `useSnackSync` detects RN imports (`from 'react-native'`, `from 'expo'`)
2. IDE switches the right panel to "Phone Preview" automatically
3. `MobilePreview.tsx` receives the `files` prop from `PreviewPanel`
4. On each file change (debounced 2 seconds), `generateReactNativeWebPreview(files)` is called
5. `transformRNCode()` rewrites imports:
   - `import { View } from 'react-native'` → `const { View } = ReactNativeWeb;`
   - `import React, { useState } from 'react'` → `const { useState } = React;`
   - `export default function App()` → `function App()`
6. The transformed code is JSON-encoded and embedded in a self-contained HTML page
7. CDN scripts load: React 18 UMD, ReactDOM 18 UMD, React Native Web 0.19.12, Babel standalone 7.23
8. Babel transforms JSX at runtime; indirect `eval()` runs the code in global scope
9. `AppRegistry.runApplication()` mounts `window.App` into `<div id="root">`
10. The HTML page is served from a `blob://` URL in an iframe

The Android/iOS Expo Go prompt has been removed — the preview is **Web-only** (React Native Web in-browser). No download prompts, no Expo Go app required.

---

## Build Pipeline

The APK build is real but requires server-side SDKs:

1. User clicks **Build APK** → `POST /api/build`
2. BullMQ job queued in Redis
3. Worker: copies files to temp dir, runs `flutter build apk --release` or `./gradlew assembleDebug`
4. Frontend polls `GET /api/build/:jobId` every 2 seconds
5. Success → `GET /api/download/:jobId` streams the `.apk`
6. Failure → real compiler error shown in Build Log panel (no vague messages)

> **Without Flutter/Android SDK on the server**, the build fails with an honest error.
> The Build Log shows the actual stderr output so you know exactly what's missing.

---

## Rate Limiting

- **50 executions per user per day**
- Resets at midnight UTC
- Tracked in PostgreSQL `run_usage` table
- Guest (unauthenticated) users: IP-based limit
- Toolbar Run button shows remaining count; disables at 0

---

## Known Limitations

| Feature | Status | Notes |
|---|---|---|
| APK build | Needs SDK | Requires Flutter/Android SDK on server |
| Go / Rust execution | Not implemented | Templates show code only |
| Multi-user collaboration | Not implemented | One user per session |
| File upload | Not implemented | Files created in-IDE only |
| Custom domains | Not implemented | Roadmap item |
| Mobile exports (`.ipa`) | Not implemented | Apple signing complexity |

---

## Security

- JWT secrets stored in environment variables only
- httpOnly, SameSite=Strict cookies
- Code executed in child process with resource limits (CPU/memory timeout)
- User files sandboxed per execution — no cross-user file access
- SQL injection prevented by Drizzle ORM parameterized queries
- Rate limiting prevents execution abuse

---

## Deployment

Two services to deploy:

### API Server
```bash
pnpm --filter @workspace/api-server run build
node artifacts/api-server/dist/index.js
```
Requires: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `PORT=8080`

### Frontend
```bash
pnpm --filter @workspace/cloud-ide run build
# Serve artifacts/cloud-ide/dist as static files
```
The frontend proxies `/api/*` to the API server in dev. In production, configure your reverse proxy:

```nginx
location /api/  { proxy_pass http://localhost:8080/api/; }
location /ide/  { root /srv; try_files $uri /ide/index.html; }
location /      { root /srv; try_files $uri /index.html; }
```

---

## Roadmap

### Phase 2 (Next)
- [ ] Real-time collaborative editing (Y.js / Liveblocks)
- [ ] AI code completion (OpenAI / Claude API)
- [ ] More languages: Go, Rust, Ruby, PHP execution
- [ ] File upload + image assets in projects
- [ ] Custom subdomain per shared project

### Phase 3
- [ ] Teams & organizations
- [ ] Private projects (paid tier)
- [ ] Custom domains for deployed projects
- [ ] Package.json support — `npm install` in sandbox
- [ ] Persistent filesystem between runs

---

## License

MIT
