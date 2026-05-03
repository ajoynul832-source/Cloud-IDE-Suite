# CloudIDE

A professional, browser-based code editor and execution environment. Write, run, preview, and share code across 10+ languages — no install required.

---

## Features

### Editor
- **CodeMirror 6** editor with full syntax highlighting for 20+ languages
- **4 themes**: VS Code Dark, GitHub Dark, Dracula, Monokai (persisted to localStorage)
- **Inline linting**: real-time syntax-error underlines via Lezer parser (JS, TS, HTML, CSS, JSON, Python, C/C++, Rust, Go)
- **Prettier formatting**: Ctrl+Shift+F formats JS/TS/JSON/HTML/CSS/Markdown
- **Keyboard shortcuts**: Ctrl+Enter (run), Ctrl+/ (comment), Ctrl+F (find), Tab (indent), Shift+Tab (dedent)
- **Word wrap** toggle, font size controls (10–24 px), adjustable panels
- **Multi-file workspace** with tab bar, inline file creation, double-click rename, folder collapse

### Execution
| Language | How | Timeout |
|---|---|---|
| JavaScript / JSX | Node.js 20 (ESM) | 10 s |
| TypeScript / TSX | tsx (esbuild) | 10 s |
| Python 3 | CPython + resource limits | 10 s |
| Bash / Shell | bash subprocess | 10 s |
| Perl | perl -w | 10 s |
| C | gcc -std=c11 -Wall | 10 s |
| C++ | g++ -std=c++17 -Wall | 10 s |

- Real-time **SSE streaming** output (stdout + stderr as they arrive)
- 50 runs/day per user (resets midnight UTC); guests share an IP-based quota
- Security sandbox: network access, dangerous modules, `process.env`, and `process.exit` blocked for JS/TS
- Output copy button, timestamp toggle, clear button

### Live Preview
Automatically renders in the Preview panel (no Run click needed):
| File type | Preview |
|---|---|
| HTML / HTM | Live iframe (auto-refresh on every keystroke, 500 ms debounce) |
| CSS | Styled demo page |
| Markdown | Rendered HTML |
| JSON | Formatted, colorized viewer |
| SVG | Rendered graphic |

### Templates (Quick Start — run instantly)
| Template | Language | What it demos |
|---|---|---|
| JS Algorithms | JavaScript | Bubble/merge/quicksort, binary search, linked list, memoized fibonacci |
| TypeScript | TypeScript | Interfaces, generics, utility types, type guards |
| Python Data | Python | Statistics, grade distribution, word frequency |
| Python | Python | Classes, closures, list comprehensions |
| HTML Page | HTML | Responsive page with CSS + vanilla JS counter |
| HTML Canvas | HTML | Animated particle system on canvas |

### Projects & Sharing
- **Save / load projects** (requires sign-in) with auto-save every 3 s
- **Project versioning** on each save
- **Share via link** — generates a `/p/:shareId` read-only view
- **Fork** any shared project into your own account
- **Download ZIP** of all workspace files (Archive button)

### Explore Gallery
Community-shared projects with search, language filter chips, view counts, fork counts, and one-click fork-to-edit.

### Build APK (Flutter / Android / React Native)
- Flutter & Android: ZIP upload → BullMQ job → (requires SDK on PATH)
- React Native: instant Expo Snack preview (no build step)
- Honest error messaging when Flutter/Android SDK is not installed

### Authentication
- JWT httpOnly cookie auth (no third-party OAuth required)
- Email + password register/sign-in
- Guest mode: full editor, 50 runs/day, no save — upgrade prompt shown

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+Enter (⌘↩ on Mac) | Run / Preview current file |
| Ctrl+Shift+F | Format with Prettier |
| Ctrl+/ | Toggle line comment |
| Ctrl+F | Find & replace |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Tab | Indent selection |
| Shift+Tab | Dedent selection |
| Alt+↑/↓ | Move line up/down |
| Ctrl+, | Open settings panel |
| ? | Open keyboard shortcuts |

---

## Architecture

```
monorepo (pnpm workspaces)
├── artifacts/
│   ├── cloud-ide/          React + Vite (Tailwind, CodeMirror 6, Lucide)
│   └── api-server/         Express 5, BullMQ, Drizzle ORM
├── lib/
│   ├── api-client-react/   Generated React Query hooks (openapi-codegen)
│   ├── api-zod/            Zod schemas from OpenAPI spec
│   └── api-spec/           OpenAPI 3.1 YAML spec
```

### API Server
- **Express 5** with TypeScript
- **PostgreSQL** (Drizzle ORM) — users, projects, project versions, share links, analytics
- **Redis + BullMQ** — code execution queue and APK build jobs
- **JWT** httpOnly cookies — `POST /api/auth/login`, `POST /api/auth/register`
- **SSE streaming** — `POST /api/run/stream` (real-time execution output)
- **Rate limiting** — per-user and per-IP run quotas (50/day)
- **File execution engine** — language handlers in `src/lib/execution.ts`

### Cloud IDE Client
- **React 18** + **Vite** (base path `/ide/`)
- **CodeMirror 6** with Lezer grammar per language
- **Prettier** (dynamic plugin import per file type)
- **JSZip** — ZIP download
- **wouter** — client-side routing (`/`, `/ide`, `/auth`, `/explore`, `/p/:shareId`)
- localStorage: `cloudide_files_v3`, `cloudide_font_size`, `cloudide_word_wrap`, `cloudide_theme`

---

## Development

```bash
# Install all workspace dependencies
pnpm install

# Start both servers (runs on PORT from .env)
pnpm --filter @workspace/api-server run dev   # API :8080
pnpm --filter @workspace/cloud-ide run dev    # IDE  :5173
```

### Environment Variables
| Variable | Description |
|---|---|
| `PORT` | API server port (default 8080) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |

---

## Supported Languages (full list)

Execution: JavaScript, TypeScript, Python 3, Bash, Perl, C (gcc), C++  
Syntax highlighting only: HTML, CSS, SCSS, JSON, XML, Markdown, SVG, Java, Kotlin, Rust, Go, Dart, Swift, C#  
Live preview: HTML, CSS, Markdown, JSON, SVG
