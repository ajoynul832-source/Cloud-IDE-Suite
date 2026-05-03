# CloudIDE

A professional browser-based IDE — write, run, and share code in JavaScript, TypeScript, Python, HTML, Bash, C, C++, and more. No installs. No sign-up required to start.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Supported Languages](#supported-languages)
3. [Running Code](#running-code)
4. [File System](#file-system)
5. [Projects & Autosave](#projects--autosave)
6. [Sharing & Explore](#sharing--explore)
7. [Editor Features](#editor-features)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Terminal](#terminal)
10. [Templates](#templates)
11. [Mobile / React Native](#mobile--react-native)
12. [Build APK](#build-apk)
13. [Deploy](#deploy)
14. [AI Code Assistant](#ai-code-assistant)
15. [Git Integration](#git-integration)
16. [Environment Variables](#environment-variables)
17. [Authentication](#authentication)
18. [Billing & Plans](#billing--plans)
19. [Architecture](#architecture)
20. [Local Development](#local-development)
21. [Environment Variables Reference](#environment-variables-reference)

---

## Quick Start

1. Open the IDE at `/ide`
2. Pick a template from **New → Template** or start from scratch
3. Press **Run ▶** (or `Ctrl+Enter`) to execute
4. Sign in (free) to save projects permanently

---

## Supported Languages

| Language | Extension | Execution |
|---|---|---|
| JavaScript | `.js`, `.jsx`, `.mjs` | Node.js (server sandbox) |
| TypeScript | `.ts`, `.tsx` | ts-node (server sandbox) |
| Python | `.py` | Python 3 (server sandbox) |
| Bash | `.sh`, `.bash` | bash (server sandbox) |
| Perl | `.pl`, `.pm` | perl (server sandbox) |
| C | `.c`, `.h` | gcc compile + run |
| C++ | `.cpp`, `.cxx`, `.cc` | g++ -std=c++17 compile + run |
| HTML | `.html`, `.htm` | Instant live iframe preview |
| CSS | `.css`, `.scss` | Styled demo preview |
| Markdown | `.md` | Rendered HTML preview |
| JSON | `.json` | Tree viewer preview |
| SVG | `.svg` | Rendered image preview |

---

## Running Code

- **Run button** — toolbar green **Run ▶** button
- **Keyboard** — `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
- HTML/CSS/Markdown/JSON/SVG files show instant **in-browser previews** — no server round-trip
- All other languages execute in a secure server sandbox with a **10 second timeout**
- **Stdin** — expand the "Stdin" panel in the Console tab before running to provide program input (`input()`, `scanf`, etc.)
- **Free tier**: 50 code runs per day, resets at midnight UTC
- Run count shown in the bottom-right status bar

---

## File System

- Files stored in `localStorage` until you sign in
- **File Tree** (left panel) shows all project files with collapsible folders
- **New file**: click `+` in Explorer header, type a name, press Enter
- **Rename**: double-click any file in the tree, edit, press Enter
- **Delete**: hover a file → click `×` (confirmation required)
- **Folders**: use `/` in filenames — e.g. `src/index.ts` auto-creates `src/`
- **Ctrl+S** — saves to the cloud (requires sign-in)
- Status bar shows **Unsaved** (amber) when local changes exist

---

## Projects & Autosave

- Sign in to enable cloud projects
- Autosave triggers **3 seconds** after your last keystroke
- **Projects modal** (toolbar → Projects) — save, load, and delete
- Each project has full **version history** — restore any previous snapshot
- **Download ZIP** — toolbar archive icon downloads all files as `.zip`
- Projects are **private by default**

---

## Sharing & Explore

- **Share** button — creates a public read-only link
- Shared projects can be **Run** and **Forked** by anyone
- **Explore** page (`/explore`) — browse community-shared projects
  - Filter by language chip (JS, TS, Python, HTML, Flutter, React Native, Android)
  - Search by project name
  - Fork any project directly into your IDE

---

## Editor Features

| Feature | Details |
|---|---|
| Syntax highlighting | All supported languages via CodeMirror 6 + Lezer parsers |
| Syntax error linting | Real-time underlines for JS, TS, Python, HTML, CSS, JSON, Go, Rust, C/C++ |
| Code folding | Click `›` gutter icons to fold/unfold blocks |
| Auto-closing brackets | `(`, `[`, `{`, `"`, `'` auto-close |
| Bracket matching | Matching brackets highlighted |
| Multi-cursor | `Alt+Click` to add cursors; `Ctrl+D` selects next occurrence |
| Find & Replace | `Ctrl+F` — full search panel with regex support |
| Comment toggle | `Ctrl+/` — toggles line or block comment |
| Format code | `Ctrl+Shift+F` — Prettier (JS, TS, HTML, CSS, JSON) |
| Word wrap | `Alt+Z` or toolbar toggle |
| Font size | Status bar `−`/`+` or Settings panel (10–24 px) |
| Color themes | VS Code Dark, GitHub Dark, Dracula, Monokai |
| Cursor position | Line/column shown in bottom-left status bar |

### Settings Panel

Click the ⚙ gear icon (or press `Ctrl+,`) to open Settings:

- **Color Theme** — 4 built-in themes with live preview swatches
- **Font Size** — presets (11, 13, 15, 17) or fine ±1 control
- **Word Wrap** — toggle with animation

---

## Keyboard Shortcuts

Press `?` anywhere in the IDE to open the full shortcut reference.

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Run / Preview current file |
| `Ctrl+/` | Toggle line comment |
| `Ctrl+F` | Find in file |
| `Ctrl+Shift+F` | Format with Prettier |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `Ctrl+D` | Select next occurrence |
| `Alt+↑ / ↓` | Move line up / down |
| `Tab` / `Shift+Tab` | Indent / Dedent block |
| `Alt+Z` | Toggle word wrap |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+,` | Open settings |
| `?` | Open keyboard shortcuts panel |
| `Escape` | Close any modal |

---

## Terminal

The **Terminal** tab (right panel) gives you an interactive shell:

- Connects to `/api/terminal/ws` via WebSocket
- Falls back to HTTP polling if WebSocket is unavailable
- Supports ANSI colors and standard terminal control sequences
- Session resets on reconnect

---

## Templates

Open **New → Template** to choose from all available templates, organized by section:

### Runnable Now
Run instantly — results in seconds, no build needed:

| Template | Language | What it shows |
|---|---|---|
| JS Algorithms | JavaScript | Sorting (bubble/merge/quick), binary search, linked list, Fibonacci |
| TypeScript | TypeScript | Interfaces, generics, type guards, utility types |
| Python Data | Python | Statistics, grade distribution, quartiles from stdlib only |
| Python Script | Python | Classes, list comprehensions, closures, word frequency |
| HTML Page | HTML | Interactive page with live iframe — forms, counter |
| HTML Canvas | HTML | Bouncing balls physics animation with click-to-add |

### More Languages
- **JS Fetch API** — async fetch simulation, Promise.all, error handling
- **JS Promises** — promise chaining, async/await patterns
- **Bash Script** — variables, arrays, functions, word frequency
- **Python Input** — stdin demo for `input()` programs
- **C Program** — structs, pointers, qsort, linked list
- **C++ Program** — STL containers, lambdas, templates, algorithms

### Mobile Live Preview
- **Expo Starter** / **React Native TS** — in-browser phone simulator via Expo Snack

### Mobile / Build Required
- Flutter, Android Kotlin, Android Java — requires SDK

---

## Mobile / React Native

React Native projects use **Expo Snack** for live preview:

1. Choose **Expo Starter** or **React Native TS** template
2. IDE auto-syncs files to Expo Snack on every save
3. **Preview tab** shows a phone simulator running your app
4. Switch iOS / Android / Web with the platform selector
5. No build pipeline required

---

## Build APK

> **Honest status**: Flutter/Android SDK is **not available** in the hosted environment. The Build Log tab shows clear instructions and setup steps if you attempt a build.

To enable APK builds locally:
```bash
git clone https://github.com/flutter/flutter.git -b stable ~/flutter
export PATH="$PATH:$HOME/flutter/bin"
flutter doctor
```

The build pipeline uses BullMQ + Redis for async job processing. Poll `/api/build/:jobId/status` for real-time progress.

---

## Deploy

Click **Deploy** in the toolbar to publish a preview URL:

- Packages all project files
- Returns a shareable URL (valid 7 days)
- Great for sharing working HTML/JS demos
- POSTs to `/api/deploy` — requires sign-in

---

## AI Code Assistant

Click the **sparkle ✦** icon in the left sidebar to open AI Chat:

- Ask questions about your code, request refactors, explanations, new code
- Click **Insert into editor** on any code block to inject at the cursor
- Backed by `/api/ai/chat`

---

## Git Integration

Click the **branch** icon in the left sidebar:

- View current branch and repository status
- Stage, commit, push, pull with a GitHub PAT
- PAT stored in Environment Variables (never in code)
- Backend: `/api/git/*` routes using `simple-git`

---

## Environment Variables

Click the **key** icon in the left sidebar:

- Variables stored in `localStorage` under `cloudide_env_vars`
- Injected as `process.env` in run requests
- Never committed to project files or sent to the server in plaintext

---

## Authentication

### Email + Password
- Register / sign in at `/auth`
- Passwords hashed with bcrypt (12 rounds)
- Auth token stored as `httpOnly` cookie (7-day expiry)

### GitHub OAuth
- "Continue with GitHub" on the auth page
- Requires `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`
- Flow: `GET /api/auth/github` → GitHub → `GET /api/auth/github/callback`

### Google OAuth
- Requires `GOOGLE_CLIENT_ID`
- Uses `google-auth-library` ID token verification

---

## Billing & Plans

Visit `/billing` for full pricing.

| Plan | Price | Limits |
|---|---|---|
| Free | $0/forever | 50 runs/day, 5 projects, 1-day version history |
| Pro | $9/month | Unlimited runs, AI, Git, Deploy, 30-day history |
| Team | $29/month (coming soon) | Collaboration, SSO, custom domains |

> During beta, all Pro features are free.

---

## Architecture

```
/
├── artifacts/
│   ├── cloud-ide/          # React + Vite frontend (TypeScript)
│   │   └── src/
│   │       ├── components/ # Editor, FileTree, PreviewPanel, Toolbar, …
│   │       ├── pages/      # IDE, AuthPage, Explore, BillingPage, …
│   │       ├── hooks/      # useFileSystem, useRun, useBuild, useProjects, …
│   │       ├── contexts/   # AuthContext
│   │       └── lib/        # templates.ts, preview-generators.ts
│   └── api-server/         # Express 5 + TypeScript API
│       └── src/
│           ├── routes/     # run, build, projects, auth, share, ai, git, deploy, …
│           ├── lib/        # runner, builder, logger
│           └── middlewares/
├── packages/
│   └── db/                 # Drizzle ORM + PostgreSQL schema
└── pnpm-workspace.yaml
```

### Key Technologies

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, CodeMirror 6 |
| Backend | Express 5, TypeScript, Node.js |
| Database | PostgreSQL + Drizzle ORM |
| Job Queue | BullMQ + Redis |
| Auth | JWT (httpOnly cookies), bcrypt, Google OAuth, GitHub OAuth |
| Editor | CodeMirror 6 with 12+ language parsers |
| Terminal | WebSocket (`ws`) server |
| Code runner | Isolated per-language subprocess execution |

---

## Local Development

```bash
# Install all dependencies
pnpm install

# Start the frontend dev server
pnpm --filter @workspace/cloud-ide run dev

# Start the API server
pnpm --filter @workspace/api-server run dev

# Run database migrations
pnpm --filter @workspace/db run migrate
```

**Prerequisites**: Node.js 20+, pnpm 8+, PostgreSQL 15+, Redis 7+

---

## Environment Variables Reference

### API Server

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis URL (for BullMQ) |
| `JWT_SECRET` | ✅ | Token signing secret (min 32 chars) |
| `PORT` | — | API port (default: 8080) |
| `NODE_ENV` | — | `production` enables secure cookies |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | — | GitHub OAuth app client secret |
| `FRONTEND_URL` | — | Frontend base URL (for OAuth redirects) |
| `OPENAI_API_KEY` | — | OpenAI key (for AI code assistant) |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | — | API base URL override (default: same origin) |
