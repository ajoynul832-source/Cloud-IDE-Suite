/**
 * Language execution engine — extracted from routes/run.ts so the BullMQ
 * worker can import it without a circular dependency through the router.
 *
 * Phase 6 — Security:
 *   checkForDangerousCode() lints JS/TS for blocked modules & APIs before execution.
 */
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import fsp from "fs/promises";
import path from "path";
import os from "os";

export const EXEC_TIMEOUT_MS  = 10_000;
export const MAX_CHUNK_BYTES  = 100_000;
const TEMP_ROOT = os.tmpdir();

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExecEventType = "stdout" | "stderr" | "done" | "error";

export interface ExecEvent {
  type: ExecEventType;
  chunk?: string;
  exitCode?: number;
  duration?: number;
  error?: string;
}

export interface ExecOpts {
  code: string;
  filename?: string;
  execId: string;
}

type HandlerFn = (opts: ExecOpts) => AsyncGenerator<ExecEvent>;

export interface LanguageHandler {
  id: string;
  name: string;
  extensions: string[];
  execute: HandlerFn;
}

// ─── Phase 6: Dangerous-code linter ──────────────────────────────────────────

/**
 * Modules that user code must never access.
 * Checked via CommonJS require(), ESM import, and dynamic import().
 */
const BLOCKED_MODULES = [
  "http", "https", "net", "tls", "dgram", "dns", "http2",
  "fs", "fs/promises",
  "child_process",
  "cluster",
  "worker_threads",
  "v8",
  "vm",
  "module",
  "perf_hooks",
];

/**
 * Scan JS/TS code for disallowed modules and APIs.
 * Returns an error message string if dangerous code is found, else null.
 * This is a lint-based (regex) approach — fast, zero overhead.
 */
export function checkForDangerousCode(code: string, language: string): string | null {
  const lang = language.toLowerCase();
  if (lang !== "javascript" && lang !== "js" && lang !== "typescript" && lang !== "ts" &&
      lang !== "jsx" && lang !== "tsx") {
    return null; // Python and HTML handled separately
  }

  for (const mod of BLOCKED_MODULES) {
    const escaped = mod.replace("/", "\\/");
    // CommonJS: require('http') require("http") require(`http`)
    const cjsPat = new RegExp(`require\\s*\\(\\s*['"\`]${escaped}['"\`]\\s*\\)`);
    if (cjsPat.test(code)) return `Module "${mod}" is not allowed in the sandbox`;

    // ESM static: import ... from 'http'
    const esmPat = new RegExp(`\\bimport\\b[^'"]*from\\s+['"\`]${escaped}['"\`]`);
    if (esmPat.test(code)) return `Module "${mod}" is not allowed in the sandbox`;

    // ESM side-effect: import 'http'
    const sideEffectPat = new RegExp(`\\bimport\\s+['"\`]${escaped}['"\`]`);
    if (sideEffectPat.test(code)) return `Module "${mod}" is not allowed in the sandbox`;

    // Dynamic: import('http')
    const dynPat = new RegExp(`\\bimport\\s*\\(\\s*['"\`]${escaped}['"\`]\\s*\\)`);
    if (dynPat.test(code)) return `Module "${mod}" is not allowed in the sandbox`;
  }

  // Block network APIs
  if (/\bfetch\s*\(/.test(code))        return "Network access (fetch) is not allowed in the sandbox";
  if (/\bXMLHttpRequest\b/.test(code))  return "Network access (XMLHttpRequest) is not allowed in the sandbox";
  if (/\bWebSocket\s*\(/.test(code))    return "Network access (WebSocket) is not allowed in the sandbox";

  // Block environment + process internals
  if (/\bprocess\.env\b/.test(code))    return "Access to process.env is not allowed in the sandbox";
  if (/\bprocess\.exit\s*\(/.test(code)) return "process.exit() is not allowed in the sandbox";
  if (/\b__dirname\b|\b__filename\b/.test(code))
    return "__dirname / __filename are not available in the sandbox";

  return null;
}

/**
 * Validate filename for path traversal attempts.
 * Returns an error string if invalid, else null.
 */
export function checkFilename(filename?: string): string | null {
  if (!filename) return null;
  if (filename.includes(".."))           return "Invalid filename: path traversal not allowed";
  if (filename.startsWith("/"))          return "Invalid filename: absolute paths not allowed";
  if (/[<>:"|?*\x00-\x1f]/.test(filename)) return "Invalid filename: contains disallowed characters";
  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minimal env — never expose server secrets to user code */
export function sandboxEnv(): NodeJS.ProcessEnv {
  return {
    PATH: process.env["PATH"],
    HOME: TEMP_ROOT,
    TMPDIR: TEMP_ROOT,
    TERM: "dumb",
    LANG: "en_US.UTF-8",
    PYTHONDONTWRITEBYTECODE: "1",
    PYTHONUNBUFFERED: "1",
    PYTHONPATH: "",
    NODE_PATH: "",
    NODE_ENV: "sandbox",
  };
}

/** Create isolated temp dir, run fn, clean up */
export async function withTempDir<T>(execId: string, fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = path.join(TEMP_ROOT, `ide_exec_${execId}`);
  await fsp.mkdir(dir, { recursive: true });
  try {
    return await fn(dir);
  } finally {
    fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function* withTempDirStream(
  execId: string,
  fn: (dir: string) => AsyncGenerator<ExecEvent>,
): AsyncGenerator<ExecEvent> {
  const dir = path.join(TEMP_ROOT, `ide_exec_${execId}`);
  await fsp.mkdir(dir, { recursive: true });
  try {
    yield* fn(dir);
  } finally {
    fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Spawn a process and yield SSE events from its stdio */
export async function* spawnStream(
  cmd: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): AsyncGenerator<ExecEvent> {
  const start = Date.now();
  let totalOut = 0;
  let killed = false;

  type QueueItem = ExecEvent | null;
  const queue: QueueItem[] = [];
  let resolve: (() => void) | null = null;

  const push = (item: QueueItem) => {
    queue.push(item);
    resolve?.();
    resolve = null;
  };

  const proc = spawn(cmd, args, { cwd, env });

  const timer = setTimeout(() => {
    killed = true;
    proc.kill("SIGKILL");
    push({ type: "error", error: "timeout", chunk: `\nProcess killed — exceeded ${EXEC_TIMEOUT_MS / 1000}s timeout\n` });
  }, EXEC_TIMEOUT_MS);

  proc.stdout.on("data", (buf: Buffer) => {
    const chunk = buf.toString();
    totalOut += chunk.length;
    if (totalOut > MAX_CHUNK_BYTES) {
      if (!killed) {
        killed = true;
        proc.kill("SIGKILL");
        push({ type: "stdout", chunk: "\n[Output truncated — exceeded 100 KB limit]\n" });
      }
      return;
    }
    push({ type: "stdout", chunk });
  });

  proc.stderr.on("data", (buf: Buffer) => {
    push({ type: "stderr", chunk: buf.toString() });
  });

  proc.on("close", (code) => {
    clearTimeout(timer);
    push({ type: "done", exitCode: code ?? (killed ? -1 : 0), duration: Date.now() - start });
    push(null);
  });

  proc.on("error", (err) => {
    clearTimeout(timer);
    push({ type: "error", error: err.message, chunk: err.message });
    push({ type: "done", exitCode: -1, duration: Date.now() - start });
    push(null);
  });

  while (true) {
    if (queue.length === 0) {
      await new Promise<void>((r) => { resolve = r; });
    }
    const item = queue.shift()!;
    if (item === null) break;
    yield item;
  }
}

// ─── Language Handlers ────────────────────────────────────────────────────────

const javascriptHandler: LanguageHandler = {
  id: "javascript",
  name: "JavaScript",
  extensions: ["js", "jsx", "mjs", "cjs"],
  async *execute({ code, execId }) {
    yield* withTempDirStream(execId, async function* (dir) {
      const file = path.join(dir, "main.mjs");
      // Wrap in async IIFE; --no-warnings, --no-deprecation suppress stack leaks
      const wrapped = `(async () => {\n${code}\n})().catch(e => { process.stderr.write(String(e) + '\\n'); process.exit(1); });`;
      await fsp.writeFile(file, wrapped, "utf8");
      yield* spawnStream(
        "node",
        ["--max-old-space-size=128", "--no-warnings", "--no-deprecation", file],
        dir,
        sandboxEnv(),
      );
    });
  },
};

const typescriptHandler: LanguageHandler = {
  id: "typescript",
  name: "TypeScript",
  extensions: ["ts", "tsx"],
  async *execute({ code, execId }) {
    yield* withTempDirStream(execId, async function* (dir) {
      const file = path.join(dir, "main.ts");
      const wrapped = `(async () => {\n${code}\n})().catch((e: unknown) => { process.stderr.write(String(e) + '\\n'); process.exit(1); });`;
      await fsp.writeFile(file, wrapped, "utf8");
      const tsxBin = path.resolve("node_modules/.bin/tsx");
      yield* spawnStream(
        tsxBin,
        ["--max-old-space-size=128", "--no-warnings", file],
        dir,
        sandboxEnv(),
      );
    });
  },
};

const pythonHandler: LanguageHandler = {
  id: "python",
  name: "Python",
  extensions: ["py"],
  async *execute({ code, execId }) {
    yield* withTempDirStream(execId, async function* (dir) {
      const file = path.join(dir, "main.py");
      // Prepend CPU/memory resource limits
      const limitedCode = `import resource as _r, sys as _sys
try:
    _r.setrlimit(_r.RLIMIT_CPU, (10, 10))
except Exception:
    pass
del _r
${code}`;
      await fsp.writeFile(file, limitedCode, "utf8");
      yield* spawnStream("python3", ["-u", file], dir, sandboxEnv());
    });
  },
};

const htmlHandler: LanguageHandler = {
  id: "html",
  name: "HTML",
  extensions: ["html", "htm"],
  async *execute({ code }) {
    yield { type: "stdout", chunk: "__HTML_PREVIEW__" } satisfies ExecEvent;
    yield { type: "done", exitCode: 0, duration: 0, chunk: code } satisfies ExecEvent;
  },
};

export const languageHandlers: Record<string, LanguageHandler> = {
  javascript: javascriptHandler,
  js: javascriptHandler,
  jsx: javascriptHandler,
  typescript: typescriptHandler,
  ts: typescriptHandler,
  tsx: typescriptHandler,
  python: pythonHandler,
  py: pythonHandler,
  python3: pythonHandler,
  html: htmlHandler,
  htm: htmlHandler,
};

export function resolveHandler(language: string, filename?: string): LanguageHandler | null {
  const key = language.toLowerCase().trim();
  if (languageHandlers[key]) return languageHandlers[key];
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (languageHandlers[ext]) return languageHandlers[ext];
  }
  return null;
}

export function newExecId(): string {
  return randomBytes(6).toString("hex");
}
