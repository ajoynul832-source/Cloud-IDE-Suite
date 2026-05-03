# CloudIDE — Master Build Document

> **Version**: 2.1 | **Updated**: May 2026
>
> This is the single source of truth for the CloudIDE product.
> It documents every feature that works, every bug that exists,
> the full competitive landscape, and a phased roadmap to beat every competitor.
> Read this before touching a single line of code.

---

## Table of Contents

1. [What CloudIDE Is](#1-what-cloudide-is)
2. [Current Feature Inventory](#2-current-feature-inventory)
3. [Known Bugs & What to Fix First](#3-known-bugs--what-to-fix-first)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Unique Differentiators We Can Own](#5-unique-differentiators-we-can-own)
6. [Full Build Roadmap — Phase by Phase](#6-full-build-roadmap--phase-by-phase)
7. [Architecture Deep Dive](#7-architecture-deep-dive)
8. [Complete File Map](#8-complete-file-map)
9. [API Reference](#9-api-reference)
10. [Environment Variables](#10-environment-variables)
11. [Database Schema](#11-database-schema)
12. [Security Model](#12-security-model)
13. [Deployment](#13-deployment)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. What CloudIDE Is

CloudIDE is a **professional browser-based code editor** with real server-side execution,
live in-browser previews, a mobile APK build pipeline, JWT authentication, and a social
explore/fork/share community. **No install. No setup. Open a browser and code.**

### Core Value Props
- **Run 7 languages** server-side (JS, TS, Python, Bash, Perl, C, C++) — real execution, not eval()
- **Preview 5 formats** client-side with zero latency (HTML, CSS, Markdown, JSON, SVG)
- **Build Flutter/Android APKs** in the browser (pipeline built; SDK install required on host)
- **Save, version, share, and fork** projects backed by PostgreSQL
- **Community explore feed** with search, language filter, infinite scroll, and one-click fork

### Who Uses It
| User | Why They Come | What Keeps Them |
|------|--------------|-----------------|
| Students | No friction — works instantly without installing anything | Templates, run quota resets daily |
| Developers | Quick scripting, algorithm testing, prototyping | Bash/C/C++ execution, version history |
| Mobile devs | Cloud Flutter/Android builds | APK download (once SDK installed) |
| Interview prep | Multi-language with C++ support | All LC languages, fast execution |
| Teams | Share runnable code snippets | Fork & edit, Explore feed |

---

## 2. Current Feature Inventory

### ✅ FULLY WORKING

#### Editor
| Feature | Details |
|---------|---------|
| CodeMirror 6 editor | Syntax highlighting for 20+ languages |
| Multi-tab editing | Independent state per tab, localStorage-backed |
| File tree | Create / rename (double-click) / delete files; folder grouping with collapse |
| Font size | +/- in StatusBar + presets (11/13/15/17) in SettingsPanel; saved to localStorage |
| Word wrap | Toggle in SettingsPanel; saved to localStorage |
| Ctrl+Enter | Runs current file from anywhere in editor (Cmd+Enter on Mac) |
| Cursor position | Live Ln/Col in StatusBar, fed from CodeMirror updateListener |
| Keyboard shortcuts | "?" key opens modal; Ctrl+, opens settings |
| Bracket matching | Auto-closes brackets, parentheses, quotes |
| Auto-indent | `indentOnInput` + `indentWithTab` wired |
| History | Undo/redo via CodeMirror history extension |
| Read-only mode | Used in SharedProject page |

#### Execution (Backend — BullMQ + Redis + SSE)
| Language | How It Runs | Timeout | Security |
|----------|-------------|---------|----------|
| JavaScript | Node.js via `node` binary with blocked module list | 10s | Blocks fs/net/http/child_process/fetch |
| TypeScript | `tsx` runner, same blocked list | 10s | Same |
| Python 3 | `python3` + `resource.setrlimit(RLIMIT_CPU, 10)` | 10s | No network |
| Bash/Shell | `bash` binary, temp file | 10s | No sudo, minimal env |
| Perl | `perl -w` binary | 10s | No network |
| C | `gcc -std=c11 -lm -Wall` → run binary | 10s | Minimal env |
| C++ | `g++ -std=c++17 -lm -Wall` → run binary | 10s | Minimal env |

**Execution pipeline**:
1. POST `/api/run/stream` → rate-limit check → dangerous code scan → BullMQ enqueue
2. Return `{ runId, jobId }`
3. Client opens SSE: `GET /api/run/stream?runId=xxx`
4. Worker executes, pushes chunks to Redis list `run:chunks:{runId}` every 50ms
5. SSE reader polls Redis, forwards to client as `{ type, chunk, exitCode, duration }`
6. 100KB output cap (truncated with message); 10s hard SIGKILL; temp dir cleaned up

#### Previews (Client-side, Zero Backend Load)
| Format | How | Output |
|--------|-----|--------|
| HTML | Raw content in `sandbox="allow-scripts"` iframe | Rendered page |
| CSS | Wrapped in page with 50+ sample elements (buttons, cards, tables, nav, badges) | Styled preview |
| Markdown | Inline JS parser (headings, tables, code blocks, task lists, links, images) | Rendered HTML |
| JSON | Validates, syntax-highlights keys/strings/numbers/booleans/null | Pretty viewer |
| SVG | DOMParser renders in sandboxed iframe with error reporting | Vector preview |

#### Authentication
- Email/password: bcrypt (cost 12) → JWT httpOnly cookie (7-day expiry)
- Google OAuth: `POST /api/auth/google` with `idToken` (requires `GOOGLE_CLIENT_ID` env var)
- `requireAuth` / `optionalAuth` middlewares on all relevant routes
- Auth context (`useAuth()`) with `user`, `login`, `register`, `logout`
- Dark-themed Auth page at `/auth` with Login / Register tabs

#### Projects & Storage
- Save project → PostgreSQL `projects` table (files stored as JSON column)
- Auto-save: 3-second debounce after last edit when `currentProjectId` is set
- Version history: up to 10 snapshots per project; restore any version
- Templates: 21 runnable + 11 mobile build templates (see Templates section)
- File persistence: localStorage `cloudide_files_v3` (guest) + PostgreSQL (authenticated)

#### Sharing & Community
- Generate share link → `POST /api/share` → unique `shareId`
- Shared project page (`/p/:shareId`): read-only view, run, copy link, Fork & Edit
- Fork: saves to authenticated user's projects, increments `forksCount`
- Explore feed: public gallery with search (client-side), language filter chips, infinite scroll
- Stats: `totalViews`, `uniqueViews`, `forksCount`, `runsCount` per project

#### Build Pipeline (Infrastructure Ready, SDKs Not Installed)
- BullMQ build queue for Flutter and Android jobs
- Honest 503 errors: "Flutter SDK not installed" / "Android SDK not configured"
- React Native: creates Expo Snack preview (no build required)
- Build status polling every 2s via `GET /api/build/:jobId/status`
- Real-time build log streaming via `logs` field
- APK download: `GET /api/download/:jobId`

#### UI & Panels
- Resizable 3-panel layout: FileTree | Editor | PreviewPanel
- PreviewPanel tabs: Preview / Console / Build Log
- Console: streaming output, timestamp toggle, clear button, status dot (running/pass/fail)
- StatusBar: Home link, filename, cursor pos, Running indicator, font controls, language badge, run quota
- Toolbar: Run (green CTA), Build APK, Download APK, Settings gear, "?" shortcuts, user email, logout
- Settings panel: slide-out from top-right, font size presets + stepper, word-wrap toggle
- Keyboard shortcuts modal: all shortcuts with Mac variants (auto-detected)
- Template selector: 2-section modal (Run Instantly + Mobile/Build Required)
- Projects modal: save/load/delete with search, fork-on-load, version restore
- Share modal: generates + copies link with one click
- Welcome screen: 4 quick-start tiles (JS/TS/Python/HTML) + "New project from template"
- Landing page: full marketing page (hero, features, template grid, how-it-works, pricing)

---

### ⚠️ PARTIAL — Works but Has Gaps

| Feature | What Works | Gap |
|---------|-----------|-----|
| Run quota | Server tracks per-user (50/day) | Anonymous users bypass (no IP fallback) |
| Guest file persistence | localStorage saves files | Clearing storage / private browsing loses everything |
| Explore pagination | API has limit/offset, frontend has IntersectionObserver | Client-side filter only searches loaded items, not full DB |
| Fork → load project | Fork saves to account + navigates to /ide | Editor opens last localStorage state, NOT the forked project |
| Google OAuth | Auth route exists | Requires `GOOGLE_CLIENT_ID` in env; no graceful fallback UI |
| C/C++ errors | GCC/G++ errors stream to console | Full temp path shown (`/tmp/ide_exec_abc/main.c:7:`) |
| Python errors | Stack traces stream | Line numbers offset +5 (resource limit prepend adds lines) |
| stdin programs | Code runs | Any `input()` / `scanf()` / `readline()` blocks → 10s timeout |
| TypeScript errors | `tsx` errors appear in console | Not shown as inline squiggles in editor |
| Build APK button | Visible in toolbar | Shows for all project types, even pure JS files |

---

### ❌ NOT YET BUILT

#### Critical (Losing Users Without These)
- [ ] **AI code assistant** — explain, fix, generate. This is the #1 missing feature. Replit has Ghostwriter, Bolt is AI-first. We have nothing.
- [ ] **stdin / interactive input** — programs that call `input()` or `scanf()` hang forever. Users get confused.
- [ ] **Multi-file imports** — `import utils from './utils.js'` fails. Each file runs in isolation.
- [ ] **npm/pip package installation** — `import numpy` or `import lodash` fails with module not found.

#### Important (Blocking Pro Usage)
- [ ] **Code formatting** — Prettier (JS/TS), Black (Python), clang-format (C/C++), `POST /api/format`
- [ ] **Find & Replace** — Ctrl+H; CodeMirror 6 has the `@codemirror/search` extension, just not enabled
- [ ] **Stripe billing** — Pro plan ($9/mo) is "Coming soon" with no implementation
- [ ] **Light theme** — Dark only; blocks users who prefer light mode
- [ ] **Download project as ZIP** — No way to export all files; JSZip already in project
- [ ] **GitHub import** — Clone a public repo URL into a new project
- [ ] **Auth redirect** — After sign-in, should return to where user was (e.g. back to /p/:shareId for fork)

#### Social & Growth
- [ ] **User profile page** — `/u/:username` showing public projects, bio, stats
- [ ] **Project likes/stars** — Star projects in Explore feed
- [ ] **Embed mode** — `<iframe src="/embed/:shareId">` for external blog embeds
- [ ] **Comments** — Comment on shared projects
- [ ] **Trending feed** — Sort Explore by recent activity, not just creation time

#### Advanced Execution
- [ ] **Web server preview** — Run Express/Flask and browse the live server in the Preview tab
- [ ] **SQLite in sandbox** — User code can create and query a local SQLite DB
- [ ] **Python matplotlib output** — Capture `plt.show()` as image in Preview tab
- [ ] **Pre-approved packages** — Whitelist of popular packages installable before run
- [ ] **Multi-file bundling** — Bundle all project files before JS execution (esbuild in memory)
- [ ] **Environment variables** — Let users set `process.env.FOO = "bar"` safely per-project

#### PWA & Mobile
- [ ] **Progressive Web App** — Installable, works offline (editor + client-side previews)
- [ ] **Mobile responsive editor** — Touch keyboard handling, gesture navigation
- [ ] **Service worker** — Cache assets, queue runs when offline

#### Collaboration
- [ ] **Real-time collaboration** — Yjs CRDT + WebSocket (y-codemirror.next); presence cursors
- [ ] **Team workspaces** — Shared projects, multiple editors, roles

---

## 3. Known Bugs & What to Fix First

Fix these before any new features. Users who hit bugs don't come back.

### 🔴 Severity 1 — Users Hit These Every Day

**BUG-01: stdin programs freeze** (`input()`, `scanf()`, `readline()`)
- Any code that reads stdin blocks forever, hits the 10s timeout, shows "Timed out after 10s"
- Users don't know why their Python program with `name = input("Enter your name: ")` doesn't work
- **Fix A (quick)**: Detect stdin patterns before execution, show specific error: `"This program uses input(). Interactive stdin is not yet supported — remove the input() call or provide input at the top of your code."`
- **Fix B (proper)**: Add a collapsible "Stdin" textarea above the Console; send `stdin` in POST body; pipe to `proc.stdin`
- **Files**: `execution.ts` (add detection), `ConsoleOutput.tsx` + `IDE.tsx` (add stdin input), `routes/run.ts` (pipe stdin)

**BUG-02: Fork doesn't load the forked project**
- After forking a shared project, `navigate("/ide")` loads the IDE but shows whatever was last in localStorage
- User sees their old code, not the fork — very confusing
- **Fix**: After `saveProject()` succeeds, store the forked project in sessionStorage:
  ```typescript
  sessionStorage.setItem("cloudide_pending_load", JSON.stringify({ id: saved.id, files }));
  navigate("/ide");
  // IDE.tsx on mount:
  const pending = sessionStorage.getItem("cloudide_pending_load");
  if (pending) { sessionStorage.removeItem("cloudide_pending_load"); /* load it */ }
  ```
- **Files**: `SharedProject.tsx` (store), `Explore.tsx` (same issue), `IDE.tsx` (read on mount)

**BUG-03: Python line numbers are off by 5**
- Python handler prepends 5 lines of `resource.setrlimit` code before the user's code
- When Python throws `File "main.py", line 8`, the user's actual code is at line 3
- **Fix**: Post-process Python stderr: parse `File "...main.py", line N` and subtract 5
  ```typescript
  stderr = stderr.replace(/line (\d+)/g, (_, n) => `line ${Math.max(1, parseInt(n) - 5)}`);
  ```
- **Files**: `execution.ts` (pythonHandler, post-process stderr)

**BUG-04: C/C++ errors show ugly temp paths**
- GCC outputs: `/tmp/ide_exec_3f2a1b/main.c:7:3: error: expected ';'`
- User sees a weird path, not just `main.c:7:3: error: expected ';'`
- **Fix**: Strip temp dir prefix from all stderr output:
  ```typescript
  stderr = stderr.replace(/\/tmp\/ide_exec_[a-f0-9]+\//g, "");
  ```
- **Files**: `execution.ts` or `runJob.ts` (post-process cHandler/cppHandler stderr)

**BUG-05: Anonymous users bypass run quota**
- `optionalAuth` middleware: if not logged in, `req.user` is undefined → quota not decremented
- Anonymous users get unlimited runs; logged-in users are rate-limited
- **Fix**: Add IP-based quota in Redis for anonymous users: `run:quota:ip:{clientIp}` with same TTL
- **Files**: `routes/run.ts`, `routes/usage.ts`

### 🟡 Severity 2 — Annoying, Workarounds Exist

**BUG-06: Build APK button shows for non-mobile projects**
- The "Build APK" button is always visible, even for a pure JavaScript project
- Users click it, see "Flutter SDK not installed" → confusion
- **Fix**: Only show Build APK when project contains `.dart`, `.kt`, `.java`, `.swift`, `pubspec.yaml`, or `buildozer.spec`
  ```typescript
  const showBuildButton = Object.keys(files).some(f =>
    /\.(dart|kt|java|swift)$/.test(f) || f.includes("pubspec.yaml") || f.includes("buildozer.spec")
  );
  ```
- **Files**: `Toolbar.tsx` (add `showBuildButton` prop), `IDE.tsx` (compute and pass)

**BUG-07: Explore search only searches loaded items, not full database**
- The API supports `?q=` search param, but the frontend does client-side filtering on fetched items
- If you have 1000 projects and search for "fibonacci", you only search the first 20 that loaded
- **Fix**: Debounce search input, send `?q=searchQuery` to API, reset `offset` to 0
- **Files**: `Explore.tsx` (wire search to API param)

**BUG-08: Console output lost when switching files**
- Run a file, switch to a different file tab, switch back → Console is cleared
- The `stream` state in `useRun` is global, not per-file — switching active file doesn't clear it,
  but the Console empty state shows when `!hasContent && !isRunning`
- **Fix**: Store last stream result per filename in a `Map<string, StreamState>` in `useRun`; restore on file switch
- **Files**: `useRun.ts`, `IDE.tsx`

**BUG-09: "Saves" lost when autosave is in-flight during page close**
- If user closes the browser while autosave debounce is pending (3s), the save never fires
- **Fix**: Use `window.addEventListener("beforeunload", ...)` to force an immediate save
- **Files**: `IDE.tsx`

**BUG-10: TypeScript errors not shown inline**
- `tsx` compiler errors stream as plain text: `main.ts:5:3 - error TS2345: Argument of type...`
- CodeMirror 6 supports inline diagnostics (`@codemirror/lint`), but not wired up
- **Fix**: Parse tsx stderr for `file:line:col - error TSxxxx: message` patterns; feed to CodeMirror `setDiagnostics()`
- **Files**: `useRun.ts` (parse errors), `Editor.tsx` (expose `setDiagnostics` via ref)

---

## 4. Competitive Landscape

### Direct Competitors

| Product | Strong Points | Weak Points | How We Win |
|---------|--------------|-------------|------------|
| **Replit** | Full Linux containers, multiplayer, AI (Ghostwriter), teams, bounties | 30s+ cold start, $20+/mo, complex UX, overkill for simple scripts | Instant start (<1s), simpler UX, free tier, APK builds |
| **CodeSandbox** | Real npm installs (microcontainers), GitHub integration, PR previews | JS/Web only, no Bash/C/C++, expensive for teams | More languages, APK builds, simpler sharing |
| **StackBlitz** | WebContainers (Node.js in browser), GitHub import/export | Node.js only, no Python/Bash/C/Perl, no mobile | Multi-language server-side execution, APK builds |
| **CodePen** | Huge community, HTML/CSS/JS pens, social features | JS/HTML/CSS only, no execution of compiled langs | Real server-side execution (C/C++/Python/Bash) |
| **JSFiddle** | Simple, fast, instant sharing | Ancient UX, JS only, no persistence | Everything |
| **GitHub Codespaces** | Full VS Code, any language, Linux container | $0.18/hr cost, 30s spin-up, complex setup required | Free, instant, no setup at all |
| **Bolt.new** | AI generates full-stack apps from prompt | Expensive per generation, JS/web only | More language diversity, APK builds |
| **Gitpod** | Full OS containers, VS Code, pre-built envs | Complex, expensive, major overkill | Simpler, faster, free |

### Where We Win Right Now
1. **Language breadth for a free tool**: JS, TS, Python, Bash, Perl, C, C++ — more executable languages than CodePen/JSFiddle/StackBlitz combined
2. **Preview breadth**: CSS live preview, Markdown rendering, JSON viewer, SVG renderer — nobody else does all of these
3. **APK build pipeline**: Infrastructure built; once SDK installed, nobody else does this from a browser
4. **Instant execution**: Sub-1-second run time — no container spin-up
5. **Social sharing with fork**: Cleaner fork flow than Replit

### Where We Lose Right Now
1. **No AI**: Every major competitor is AI-first. We have nothing. This is the #1 gap.
2. **No stdin**: Interactive programs hang. Every competitor handles this gracefully.
3. **No package install**: `import numpy` fails. Blocks data science users.
4. **Files lost for guests**: Browser refresh can lose work. Replit auto-saves everything.
5. **No GitHub integration**: CodeSandbox/StackBlitz both have this; developers expect it.
6. **No web server preview**: Can't run Express/Flask and browse the running app.

---

## 5. Unique Differentiators We Can Own

These are features NO major competitor does well. Building these creates a moat.

### 🏆 #1: AI + APK Builder in One Flow
**The pitch**: "Describe your mobile app → AI writes Flutter/Dart code → CloudIDE builds the APK → Download and install in 3 minutes"

No competitor connects AI code generation with mobile APK building. This is a completely unique product experience.

**Implementation**: AI panel → Anthropic API streams Dart code into editor → auto-triggers APK build → download link appears

### 🏆 #2: Universal Language + Preview Engine
**The pitch**: "The IDE that does everything. CSS on real elements. Markdown rendered. JSON highlighted. C++ compiled. SVG live. Bash executed."

No single free tool runs Bash + C++ + previews CSS + renders Markdown. This is our technical moat.

**Extend with**: SQL runner (sql.js in browser), YAML/TOML viewer, regex playground, diff viewer, base64 encoder/decoder

### 🏆 #3: Best Mobile-First IDE
**The pitch**: "The only cloud IDE that actually works on a phone."

Every competitor is desktop-first and unusable on mobile. We could own this niche completely.

**Implementation**: Responsive editor layout, touch-friendly file tree, swipe to switch panels, PWA installation prompt, virtual keyboard handling

### 🏆 #4: Interview Mode
**The pitch**: "Practice coding interviews in any language — including C++ — with timing, test cases, and AI feedback."

LeetCode (web only), HackerRank (limited), Coderbyte — none support our language range + previews.

**Implementation**: Challenge bank → timer UI → auto-grade output → AI solution explanation

### 🏆 #5: Offline-First PWA
**The pitch**: "Code on a plane. No wifi? No problem."

Editor works offline. CSS/MD/JSON/SVG previews work offline. Runs queue when online.

**Implementation**: Vite PWA plugin + service worker + IndexedDB for files

---

## 6. Full Build Roadmap — Phase by Phase

### Priority: Fix Bugs Before Adding Features
An app with 5 bugs and 0 new features grows better than one with 10 new features and 5 bugs. Users who hit bugs don't return.

---

### Phase 1 — Critical Bug Fixes (2–3 hours)

**1.1 — stdin detection** (`execution.ts`, `ConsoleOutput.tsx`)
```typescript
// execution.ts — before executing, check for stdin usage:
const STDIN_PATTERNS = [/\binput\s*\(/, /\bscanf\s*\(/, /\bgetline\s*\(/, /\breadline\s*\(/, /\bgets\s*\(/];
if (STDIN_PATTERNS.some(p => p.test(code))) {
  yield { type: "stderr", chunk: "[CloudIDE] This program uses interactive input (stdin).\nStdin is not yet supported — remove the input() call, or hardcode values at the top.\nExample: name = 'Alice'  # was: name = input('Enter name: ')\n" };
  yield { type: "done", exitCode: 1, duration: 0 };
  return;
}
```

**1.2 — Python line number fix** (`execution.ts`)
```typescript
// After collecting Python stderr, subtract 5 from line numbers
stderr = stderr.replace(/\bline (\d+)\b/g, (_, n) => `line ${Math.max(1, parseInt(n) - 5)}`);
```

**1.3 — C/C++ path cleanup** (`execution.ts`)
```typescript
// Strip temp dir prefix from gcc/g++ output
const cleanErr = raw.replace(/\/tmp\/ide_exec_[a-f0-9_]+\//g, "");
```

**1.4 — Fork → load project** (`SharedProject.tsx`, `Explore.tsx`, `IDE.tsx`)
```typescript
// After fork succeeds:
sessionStorage.setItem("cloudide_pending_load", JSON.stringify({ id: saved.id, files: sourceFiles }));
navigate("/ide");

// IDE.tsx on mount (in useEffect):
const pending = sessionStorage.getItem("cloudide_pending_load");
if (pending) {
  const { id, files } = JSON.parse(pending);
  sessionStorage.removeItem("cloudide_pending_load");
  loadTemplate(files);
  setCurrentProjectId(id);
  const first = Object.keys(files).sort()[0];
  if (first) { setOpenFiles([first]); setActiveFile(first); }
}
```

**1.5 — Hide Build APK for non-mobile projects** (`IDE.tsx`, `Toolbar.tsx`)
```typescript
const MOBILE_EXTENSIONS = [".dart", ".kt", ".java", ".swift", ".m", ".cs"];
const MOBILE_FILES = ["pubspec.yaml", "buildozer.spec", "AndroidManifest.xml"];
const isMobileProject = Object.keys(files).some(f =>
  MOBILE_EXTENSIONS.some(ext => f.endsWith(ext)) || MOBILE_FILES.some(mf => f.includes(mf))
);
```

**1.6 — "Sign in to save" warning banner for guests** (`IDE.tsx`)
```tsx
{!user && Object.keys(files).length > 0 && (
  <div className="shrink-0 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 text-[11px] font-mono text-yellow-300/80 flex items-center gap-2">
    <AlertTriangle size={11} />
    Your files are saved in this browser only — sign in to save permanently.
    <button onClick={() => setShowSignIn(true)} className="underline ml-auto hover:text-yellow-200">Sign in free →</button>
  </div>
)}
```

---

### Phase 2 — Stdin Support (2 hours)

Allow users to provide input for programs that call `input()` / `scanf()` / `readline()`.

**New component**: `StdinInput.tsx` — collapsible textarea above Console
```tsx
interface StdinInputProps {
  value: string;
  onChange: (v: string) => void;
}
export function StdinInput({ value, onChange }: StdinInputProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono text-white/40 hover:text-white/70">
        <Terminal size={10} />
        Program Input (stdin)
        <ChevronDown size={10} className={expanded ? "rotate-180" : ""} />
      </button>
      {expanded && (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type program input here (one line per press of Enter)"
          rows={3}
          className="w-full bg-black/20 px-3 py-2 text-[11px] font-mono text-white/70 placeholder:text-white/20 focus:outline-none resize-none border-t border-white/8"
        />
      )}
    </div>
  );
}
```

**Backend change** (`execution.ts`): All language handlers accept optional `stdin` string, pipe it to `proc.stdin`.

**Frontend change** (`IDE.tsx`, `useRun.ts`): Thread `stdin` state through `handleRun` → `runCode(target, content, filename, stdin)`.

---

### Phase 3 — AI Code Assistant (4–6 hours) 🏆 Highest Impact

**The most important feature to ship. Adds to every interaction.**

**Backend**: `POST /api/ai/chat` → Anthropic/OpenAI via Replit AI proxy → stream response as SSE

```typescript
// routes/ai.ts
router.post("/chat", optionalAuth, aiLimiter, async (req, res) => {
  const { message, language, code, lastError } = req.body;
  const systemPrompt = `You are CloudIDE's AI assistant. The user is coding in ${language}.
Current file:\n\`\`\`${language}\n${code.slice(0, 3000)}\n\`\`\`
${lastError ? `Last run error:\n${lastError}` : ""}
Be concise. Show code. Use markdown.`;

  // Stream from Anthropic/OpenAI → client SSE
});
```

**Frontend**: 4th tab in PreviewPanel: "AI" | Three modes:
1. **Chat** — type a question, get answer with code blocks
2. **Fix error** — "Fix this" button in Console after a failed run
3. **Explain** — right-click selected code → "Explain this"

**Free tier limit**: 10 AI queries/day (tracked in Redis `ai:quota:{userId}`)
**Pro tier**: Unlimited AI queries

---

### Phase 4 — Code Formatting (1–2 hours)

**Backend** (`POST /api/format`):
```typescript
import prettier from "prettier";
import { execSync } from "child_process";

const formatters: Record<string, (code: string) => Promise<string>> = {
  javascript: (c) => prettier.format(c, { parser: "babel", semi: true, singleQuote: false }),
  typescript: (c) => prettier.format(c, { parser: "typescript", semi: true }),
  json:       (c) => JSON.stringify(JSON.parse(c), null, 2),
  css:        (c) => prettier.format(c, { parser: "css" }),
  markdown:   (c) => prettier.format(c, { parser: "markdown" }),
  python:     (c) => { /* write to temp, run black, read back */ },
  c:          (c) => { /* write to temp, run clang-format, read back */ },
  cpp:        (c) => { /* write to temp, run clang-format, read back */ },
};
```

**Frontend** (`Toolbar.tsx`): Add format button (Shift+Alt+F). POST to `/api/format` with `{ language, code }`. Replace editor content.

---

### Phase 5 — Find & Replace (30 minutes)

CodeMirror 6 has this built-in — just enable it:

```typescript
// Editor.tsx
import { search, openSearchPanel } from "@codemirror/search";

const extensions = [
  // ... existing
  search({ top: true }),  // adds Ctrl+F for find, Ctrl+H for find & replace
];
```

Also expose `openSearchPanel` via `EditorRef` so Toolbar can trigger it with a button.

---

### Phase 6 — Download Project as ZIP (1 hour)

```typescript
// In ProjectsModal.tsx or Toolbar — no backend needed:
import JSZip from "jszip";   // already in project deps via SharedProject

async function downloadZip(files: Record<string, string>, projectName: string) {
  const zip = new JSZip();
  Object.entries(files).forEach(([path, content]) => zip.file(path, content));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${projectName.replace(/\s+/g, "-")}.zip`; a.click();
  URL.revokeObjectURL(url);
}
```

Also add **Import ZIP** via drag-and-drop: `<input type="file" accept=".zip">` → JSZip.loadAsync() → extract to files.

---

### Phase 7 — Stripe Billing (3–4 hours)

**Pro plan features** ($9/month):
- Unlimited runs/day (vs 50 free)
- Unlimited AI queries (vs 10/day free)
- Unlimited saved projects (vs effectively unlimited now, but gate at 10 for free)
- Private projects (toggle visibility)
- Priority execution queue (separate BullMQ queue)
- All language execution (gate Bash/C/C++ behind Pro eventually)

**Backend**:
```typescript
// routes/billing.ts
POST /api/billing/subscribe     → create Stripe Checkout session
POST /api/billing/webhook       → update user plan on payment success/cancel
GET  /api/billing/portal        → Stripe Customer Portal
GET  /api/billing/status        → { plan, renewsAt, runsUsed }
```

**DB change**: Add `plan: "free" | "pro"`, `stripeCustomerId`, `planExpiresAt` to `users` table.

---

### Phase 8 — GitHub Integration (4–6 hours)

**Import** (public repos only, no auth required):
```typescript
// POST /api/github/import { repoUrl }
const [owner, repo] = parseGitHubUrl(repoUrl);
// GET https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1
// Fetch file contents for blobs under 100KB
// Return { files: { "path": "content", ... } }
```

**Export** (requires GitHub OAuth):
1. User connects GitHub account via OAuth
2. `POST /api/github/export { files, projectName }` → create/update repo
3. Show link to created repo

**Frontend**: "Import from GitHub" in template selector; "Push to GitHub" in Projects modal.

---

### Phase 9 — Web Server Preview (6–8 hours) 🔑 Key Differentiator

**The hardest feature but the most powerful — lets users run Express/Flask and see the live server.**

**Architecture**:
1. New execution mode: `web-server` — process stays alive (not killed after output)
2. Random port assigned: `8100 + (parseInt(execId.slice(0,4), 16) % 900)`
3. Reverse proxy in Express: `GET /preview/:execId/*` → `http://localhost:{port}/{rest}`
4. Frontend detects special chunk `__WEB_SERVER_PORT__:{port}` → switches Preview iframe to proxy URL

**Detection** (auto-detect web server projects):
```typescript
const WEB_SERVER_PATTERNS = [
  /app\.listen\s*\(/,       // Express/Koa
  /http\.createServer/,     // Node http
  /Flask\s*\(__name__\)/,   // Flask
  /uvicorn\.run/,           // FastAPI
];
```

---

### Phase 10 — Real-Time Collaboration (8–12 hours)

**Architecture**: Yjs CRDT + WebSocket server + y-codemirror.next binding

```bash
pnpm add yjs y-codemirror.next y-websocket
```

**Backend**: WebSocket server alongside Express; `setupWSConnection` from `y-websocket/bin/utils`

**Frontend**: `Y.Doc` per project + `WebsocketProvider` + `yCollab` extension in CodeMirror

**Features**:
- Presence cursors (see where others type)
- Username labels on each cursor
- Online users count in toolbar
- "Invite to collaborate" button generates live link

---

### Phase 11 — PWA + Offline (2–3 hours)

```bash
pnpm add -D vite-plugin-pwa
```

**Offline capabilities**:
- Editor opens without internet (app shell cached)
- CSS/Markdown/JSON/SVG previews work offline (all client-side)
- Files saved to IndexedDB as backup
- "Offline" banner when disconnected; runs queued when reconnected

---

### Phase 12 — Interview / Challenge Mode (3–4 hours)

**Route**: `/challenge/:id` — pre-configured IDE with problem statement, timer, test runner

**Data model**:
```typescript
interface Challenge {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;    // Markdown
  timeLimit: number;      // minutes
  starterCode: Record<string, string>;  // per language
  testCases: { input: string; expected: string; hidden?: boolean }[];
  hints: string[];
}
```

**Features**: Timer countdown, auto-run tests on submit, AI explanation of optimal solution

---

## 7. Architecture Deep Dive

### System Topology
```
Browser
  ├── /            → LandingPage.tsx
  ├── /ide         → IDE.tsx (main editor)
  ├── /auth        → AuthPage.tsx
  ├── /explore     → Explore.tsx
  └── /p/:shareId  → SharedProject.tsx

Vite dev server (port from $PORT, base path /ide/)
  └── Proxies /api → Express API server

Express API (port 8080, mounted at /api)
  ├── /auth/*          JWT authentication
  ├── /run/*           BullMQ code execution + SSE streaming
  ├── /projects/*      Project CRUD
  ├── /share/*         Public sharing + Explore feed
  ├── /build/*         APK build pipeline
  ├── /versions/*      Project version history
  ├── /usage           Run quota
  └── /admin/queues    Bull Board UI

BullMQ Workers (same Node.js process)
  ├── code-run worker   runJobProcessor → execution.ts handlers
  └── build worker      buildJobProcessor → flutter/android

Infrastructure
  ├── PostgreSQL    Projects, users, versions, share records
  ├── Redis         BullMQ queues + SSE chunk buffers (TTL 5min)
  └── /tmp          Temp execution dirs (cleaned after each run)
```

### Execution Flow (End-to-End)
```
1. User clicks Run (or Ctrl+Enter)
2. IDE.tsx: saveFile(activeFile, content) → getRunTarget(filename) → handleRun()
3. If CSS/MD/JSON/SVG: generate HTML client-side → setHtmlPreview() → no API call
4. If HTML: raw content → setHtmlPreview() → no API call
5. If backend language: runCode(target, content, filename)
6. useRun.ts: POST /api/run/stream { language, code, filename } → get { runId }
7. Open EventSource for SSE: GET /api/run/stream?runId={runId}
8. routes/run.ts: rate-limit check → dangerous code scan → BullMQ.add(runJob, { runId, language, code })
9. Worker picks up job → resolveHandler(language) → handler.execute() → AsyncGenerator<ExecEvent>
10. Each event: rpush to Redis run:chunks:{runId} → SSE server polls and forwards
11. ConsoleOutput.tsx: receives chunks, renders with type-based colors, auto-scrolls
12. On "done" event: show exit code, duration, update run quota
```

### File Persistence Strategy
```
Anonymous user:
  Write → localStorage["cloudide_files_v3"] (immediate, synchronous)
  Read  → localStorage on mount
  Risk  → Lost if storage cleared, private browsing, different browser

Authenticated user:
  Write → localStorage (immediate) + autosave debounce 3s → PUT /api/projects/:id
  Read  → localStorage on mount (fast) + optional reload from API
  Save  → POST /api/projects (creates new) or PUT /api/projects/:id (updates)
  Version → POST /api/projects/:id/versions (on each explicit save)
```

### State Management
No Redux/Zustand — plain React state in IDE.tsx (the single source of truth):
- `files: Record<string, string>` — all file contents (from useFileSystem)
- `openFiles: string[]` — tab order
- `activeFile: string | null` — current tab
- `rightPanelTab: PanelTab` — Preview/Console/Build
- `htmlPreview: string | null` — iframe srcDoc
- `currentProjectId: string | null` — for autosave
- `cursorPos: { line, col } | null` — from CodeMirror updateListener
- `fontSize: number`, `wordWrap: boolean` — editor prefs (localStorage)
- `stream: StreamState` — from useRun (chunks array + result)

---

## 8. Complete File Map

### Frontend (`artifacts/cloud-ide/src/`)
```
pages/
  IDE.tsx                  ← Main IDE — all state, all handlers, layout
  LandingPage.tsx          ← Marketing homepage
  Explore.tsx              ← Community project gallery
  SharedProject.tsx        ← Read-only view + Fork & Edit
  AuthPage.tsx             ← Login / Register

components/
  Editor.tsx               ← CodeMirror 6 wrapper (ref → getContent, getCursorPosition)
  TabBar.tsx               ← File tabs with close button
  FileTree.tsx             ← Left sidebar — file CRUD, folder collapse
  Toolbar.tsx              ← Top bar — Run, Build APK, nav, user
  PreviewPanel.tsx         ← Right panel — Preview/Console/Build tabs
  ConsoleOutput.tsx        ← Streaming output with timestamp toggle
  BuildLog.tsx             ← APK build log display
  StatusBar.tsx            ← Bottom bar — Home, filename, cursor, font, language, quota
  TemplateSelector.tsx     ← New project modal (Run Instantly / Mobile sections)
  ProjectsModal.tsx        ← Save/load/delete/version-restore
  ShareModal.tsx           ← Generate + copy share link
  SettingsPanel.tsx        ← Slide-out font/wrap settings
  KeyboardShortcutsModal   ← Shortcut reference (? key)

hooks/
  useFileSystem.ts         ← File CRUD + localStorage persistence
  useRun.ts                ← SSE streaming execution + quota
  useBuild.ts              ← APK build + status polling
  useProjects.ts           ← Project save/load API calls

lib/
  templates.ts             ← 21 runnable + 11 mobile templates
  preview-generators.ts    ← generateCSSPreview/Markdown/JSON/SVG

contexts/
  AuthContext.tsx           ← Global auth state + useAuth()
```

### Backend (`artifacts/api-server/src/`)
```
routes/
  auth.ts           ← register, login, google, logout, me
  run.ts            ← POST /run/stream, GET /run/stream SSE, rate-limit
  projects.ts       ← CRUD /projects
  share.ts          ← /share endpoints + /explore feed
  build.ts          ← APK build routes (Flutter + Android + RN)
  versions.ts       ← Project version history
  usage.ts          ← Run quota endpoint
  health.ts         ← GET /health, GET /versions
  metrics.ts        ← Prometheus counters (runs, builds, errors)

lib/
  execution.ts      ← Language handlers (JS/TS/Python/Bash/Perl/C/C++)
  queue.ts          ← BullMQ setup (code-run + build queues)
  redis.ts          ← Redis client + auto-start on connection failure
  flutter.ts        ← Flutter/Android SDK detection
  metrics.ts        ← In-memory metrics counters
  build-resilience.ts ← Build retry + circuit breaker

workers/
  runJob.ts         ← BullMQ processor: picks handler → executes → streams to Redis
  buildJob.ts       ← BullMQ processor: Flutter/Android/RN build steps
  androidJob.ts     ← Android-specific Gradle build steps

middlewares/
  require-auth.ts   ← requireAuth, optionalAuth, signToken, setAuthCookie
  rate-limit.ts     ← Express rate limiters (auth, run, build, share)
```

---

## 9. API Reference

### Authentication
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/auth/register` | `{ email, password }` | `201 { userId, email }` |
| POST | `/api/auth/login` | `{ email, password }` | `200 { userId, email }` |
| POST | `/api/auth/google` | `{ idToken }` | `200 { userId, email }` |
| POST | `/api/auth/logout` | — | `200 {}` |
| GET | `/api/auth/me` | — | `200 { userId, email }` or `401` |

### Code Execution
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/run/stream` | Body: `{ language, code, filename?, stdin? }` → `{ runId, jobId }` |
| GET | `/api/run/stream?runId=xxx` | SSE: `{ type: "stdout"\|"stderr"\|"done"\|"error", chunk, exitCode, duration }` |
| GET | `/api/run/status/:runId` | `{ status, exitCode, duration }` |
| GET | `/api/usage` | `{ runsToday, runsRemaining, limit }` |

### Projects
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/projects` | `{ projects: [...], total }` |
| POST | `/api/projects` | Body: `{ name, type, files }` → `201 { id }` |
| GET | `/api/projects/:id` | `{ id, name, type, files, createdAt }` |
| PUT | `/api/projects/:id` | Body: `{ name?, type?, files? }` → `200 { id }` |
| DELETE | `/api/projects/:id` | `204` |
| GET | `/api/projects/:id/versions` | `[{ id, createdAt, label }]` |
| POST | `/api/projects/:id/versions` | Body: `{ label? }` → `201 { id }` |
| POST | `/api/projects/:id/versions/:vId/restore` | `200 {}` |

### Sharing & Explore
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/share` | Body: `{ projectId }` → `201 { shareId, url }` |
| GET | `/api/share/:shareId` | `{ project, stats, shareId }` |
| POST | `/api/share/:shareId/event` | Body: `{ event: "fork"\|"run" }` → `200` |
| GET | `/api/explore` | Query: `?q=&lang=&offset=&limit=` → `{ projects, hasMore }` |

### Build
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/build` | Multipart: `project` ZIP → `202 { jobId }` |
| POST | `/api/build/project` | Body: `{ type, files, name }` → `202 { jobId, embedUrl? }` |
| GET | `/api/build/:jobId/status` | `{ status, progress }` |
| GET | `/api/build/:jobId/logs` | `{ logs }` |
| GET | `/api/download/:jobId` | APK file binary |

### System
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | `{ status: "ok", uptime, timestamp }` |
| GET | `/api/metrics` | Prometheus text format |
| GET | `/api/versions` | `{ node, platform, languages }` |
| GET | `/api/admin/queues` | Bull Board UI (no auth in dev) |

---

## 10. Environment Variables

| Variable | Required | Purpose | How to Set |
|----------|----------|---------|------------|
| `JWT_SECRET` | ✅ Yes | Sign/verify JWT tokens | Any 32+ char random string |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | Replit DB or external Postgres |
| `SESSION_SECRET` | ✅ Yes | Express session fallback | Any 32+ char random string |
| `REDIS_URL` | ❌ No | Redis (falls back to localhost:6379) | `redis://host:port` |
| `GOOGLE_CLIENT_ID` | ❌ No | Enables Google OAuth sign-in | From Google Cloud Console |
| `OPENAI_API_KEY` | ❌ No | AI assistant (Phase 3) | OpenAI dashboard |
| `ANTHROPIC_API_KEY` | ❌ No | AI assistant alternative | Anthropic console |
| `STRIPE_SECRET_KEY` | ❌ No | Pro billing (Phase 7) | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | ❌ No | Stripe webhook verification | Stripe dashboard |
| `FLUTTER_SDK_PATH` | ❌ No | Flutter SDK for APK builds | Path to flutter/bin |
| `PORT` | Auto | Express server port | Set by Replit automatically |

---

## 11. Database Schema

### users
```sql
id            TEXT PRIMARY KEY        -- uuid
email         TEXT UNIQUE NOT NULL
passwordHash  TEXT                    -- bcrypt hash (null for OAuth users)
oauthProvider TEXT                    -- "google" | null
plan          TEXT DEFAULT "free"     -- "free" | "pro" (future)
createdAt     TIMESTAMPTZ DEFAULT NOW()
```

### projects
```sql
id          TEXT PRIMARY KEY          -- uuid
userId      TEXT REFERENCES users(id) ON DELETE CASCADE
name        TEXT NOT NULL
projectType TEXT NOT NULL             -- "javascript" | "flutter" | etc.
files       JSONB NOT NULL            -- { "main.js": "...", ... }
createdAt   TIMESTAMPTZ DEFAULT NOW()
updatedAt   TIMESTAMPTZ DEFAULT NOW()
```

### project_versions
```sql
id        TEXT PRIMARY KEY
projectId TEXT REFERENCES projects(id) ON DELETE CASCADE
label     TEXT                         -- "Saved" | custom label
snapshot  JSONB NOT NULL               -- files snapshot
createdAt TIMESTAMPTZ DEFAULT NOW()
```

### shares
```sql
id          TEXT PRIMARY KEY           -- shareId (nanoid)
projectId   TEXT REFERENCES projects(id) ON DELETE CASCADE
totalViews  INTEGER DEFAULT 0
uniqueViews INTEGER DEFAULT 0
forksCount  INTEGER DEFAULT 0
runsCount   INTEGER DEFAULT 0
score       INTEGER DEFAULT 0          -- for Explore feed ranking
createdAt   TIMESTAMPTZ DEFAULT NOW()
```

---

## 12. Security Model

### Execution Sandbox
Each code run gets an isolated temp directory (`/tmp/ide_exec_{execId}/`):
- **JS/TS**: Blocked modules: `fs`, `net`, `http`, `https`, `child_process`, `cluster`, `crypto` (partial), `dgram`, `dns`, `readline`, `repl`, `tty`, `vm`. Allowlisted: `path`, `url`, `util`, `events`, `stream`, `buffer`, `assert`, `querystring`, `string_decoder`
- **Python**: `resource.setrlimit(RLIMIT_CPU, 10)` to cap CPU time
- **All languages**: 10-second wall-clock timeout via SIGKILL, 100KB output cap
- **No network**: Sandbox processes have no network access (no outbound fetch/curl)
- **Temp cleanup**: `rm -rf /tmp/ide_exec_{execId}/` after each run (in worker finally block)

### Authentication
- **JWT**: `HS256` signed with `JWT_SECRET`; 7-day expiry; stored in `httpOnly; SameSite=Strict` cookie
- **Passwords**: `bcrypt` with cost factor 12
- **CORS**: `credentials: "include"` on all frontend API calls; cookie scoped to domain
- **Rate limiting**: Auth: 10 req/10min per IP; Run: 50/day per user; Build: 5/hour per user

### Input Validation
- All API bodies validated with Zod schemas before processing
- Project files JSON capped at reasonable size (no multi-MB uploads)
- Share IDs are nanoid (21 chars) — not guessable

---

## 13. Deployment

### What Gets Deployed
The Replit deployment runs both services:
- **API Server** (`artifacts/api-server`) — Express on `$PORT`
- **Cloud IDE** (`artifacts/cloud-ide`) — Vite preview build on `$PORT`

Both are behind the Replit reverse proxy which handles TLS and routing.

### Production Checklist
- [ ] `JWT_SECRET` and `SESSION_SECRET` set in production secrets
- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] Redis available (Replit provides managed Redis or use `REDIS_URL`)
- [ ] Run `pnpm --filter @workspace/db run migrate` before deploying schema changes
- [ ] Check `/api/health` returns `{ status: "ok" }` after deploy
- [ ] Check `/api/admin/queues` shows BullMQ queues running
- [ ] Verify execution works: POST to `/api/run/stream` with `{ language: "javascript", code: "console.log('hello')" }`

### Production vs Development Differences
- **Development**: Redis auto-starts if not found; detailed error stack traces; no HTTPS required
- **Production**: Redis must be pre-configured; generic error messages; HTTPS enforced by Replit proxy

---

## 14. Troubleshooting

### "Redis connection refused" / BullMQ not processing jobs
Redis isn't running. The `redis.ts` client auto-retries, but if it can't connect:
```bash
# In Nix shell or check if redis-server is in nix packages:
redis-server --daemonize yes
# Or set REDIS_URL to a managed Redis instance
```

### "PostgreSQL connection failed"
Check `DATABASE_URL` is set and the database is reachable:
```bash
psql "$DATABASE_URL" -c "SELECT 1"
```

### "Module not found: @workspace/db"
Run from the project root:
```bash
pnpm install
pnpm --filter @workspace/db run build
```

### Code runs but output never appears in Console
Check the SSE connection. The frontend opens `GET /api/run/stream?runId=xxx`.
Common causes:
1. Redis not running (chunks never pushed)
2. Rate limit hit (check `/api/usage`)
3. CORS issue (check `credentials: "include"` on fetch)

### "Flutter SDK not installed" on Build APK
Expected behavior — the APK build pipeline is built but Flutter SDK is not installed on this host.
To enable: install Flutter SDK, set `FLUTTER_SDK_PATH=/path/to/flutter`, restart API server.

### vite dev server shows blank page
Ensure the vite config has `server.allowedHosts: true` (needed for Replit proxy iframe).
Check `PORT` env var is set and vite config reads it: `server: { port: parseInt(process.env.PORT ?? "5173") }`.

### TypeScript build errors in @workspace/api-client-react
This is a pre-existing issue with the generated API client. The errors are type-only and don't
affect runtime. Run `pnpm --filter @workspace/api-client-react run codegen` to regenerate.

---

*This document is the build bible. Work top-to-bottom through the roadmap.
Fix bugs before adding features. Ship AI assistant before anything else in Phase 3.
The APK builder is the unique moat — get the Flutter SDK installed and ship it.*
