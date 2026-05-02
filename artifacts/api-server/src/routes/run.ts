/**
 * /api/run        — JSON response (buffered)
 * /api/run/stream — SSE response (real-time line-by-line)
 *
 * Language handlers are registered in a plugin map — add new languages
 * without touching the routing logic.
 */
import { Router } from "express";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { logger } from "../lib/logger";
import { runLimiter } from "../middlewares/rate-limit";
import { checkAndIncrementRuns, resolveUsageKey } from "../lib/usage";
import { optionalAuth } from "../middlewares/require-auth";

const router = Router();

// ─── Constants ────────────────────────────────────────────────────────────────
const EXEC_TIMEOUT_MS    = 10_000;
const MAX_CHUNK_BYTES    = 100_000; // 100 KB per stream
const MAX_CONCURRENT_OPS = 8;       // global cap across all users
const TEMP_ROOT = os.tmpdir();

// ─── Concurrency semaphore ────────────────────────────────────────────────────
let activeExecutions = 0;

function acquireSlot(): boolean {
  if (activeExecutions >= MAX_CONCURRENT_OPS) return false;
  activeExecutions++;
  return true;
}

function releaseSlot(): void {
  activeExecutions = Math.max(0, activeExecutions - 1);
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type ExecEventType = "stdout" | "stderr" | "done" | "error";

export interface ExecEvent {
  type: ExecEventType;
  chunk?: string;
  exitCode?: number;
  duration?: number;
  error?: string;
}

interface ExecOpts {
  code: string;
  filename?: string;
  execId: string;
}

type HandlerFn = (opts: ExecOpts) => AsyncGenerator<ExecEvent>;

interface LanguageHandler {
  id: string;
  name: string;
  extensions: string[];
  execute: HandlerFn;
}

// ─── Sandbox helpers ──────────────────────────────────────────────────────────
/** Minimal env — never expose server secrets to user code */
function sandboxEnv(): NodeJS.ProcessEnv {
  return {
    PATH: process.env["PATH"],
    HOME: TEMP_ROOT,
    TMPDIR: TEMP_ROOT,
    TERM: "dumb",
    LANG: "en_US.UTF-8",
    // Python
    PYTHONDONTWRITEBYTECODE: "1",
    PYTHONUNBUFFERED: "1",
    PYTHONPATH: "",
    // Node
    NODE_PATH: "",
    NODE_ENV: "sandbox",
  };
}

/** Create isolated temp dir, run fn, clean up */
async function withTempDir<T>(execId: string, fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = path.join(TEMP_ROOT, `ide_exec_${execId}`);
  await fsp.mkdir(dir, { recursive: true });
  try {
    return await fn(dir);
  } finally {
    fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Spawn a process and yield SSE events from its stdio */
async function* spawnStream(
  cmd: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): AsyncGenerator<ExecEvent> {
  const start = Date.now();
  let totalOut = 0;
  let killed = false;

  // We use a callback-to-async-generator bridge via a shared queue
  type QueueItem = ExecEvent | null; // null = done
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
    push({
      type: "done",
      exitCode: code ?? (killed ? -1 : 0),
      duration: Date.now() - start,
    });
    push(null); // sentinel
  });

  proc.on("error", (err) => {
    clearTimeout(timer);
    push({ type: "error", error: err.message, chunk: err.message });
    push({ type: "done", exitCode: -1, duration: Date.now() - start });
    push(null);
  });

  // Drain the queue as events arrive
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
      // .mjs extension makes Node.js treat the file as ESM automatically
      // (no --input-type flag needed — that flag is for STDIN only)
      const file = path.join(dir, "main.mjs");
      const wrapped = `(async () => {\n${code}\n})().catch(e => { process.stderr.write(String(e) + '\\n'); process.exit(1); });`;
      await fsp.writeFile(file, wrapped, "utf8");
      yield* spawnStream(
        "node",
        ["--max-old-space-size=128", file],
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
      // Use tsx for proper TypeScript execution (handles generics, decorators, etc.)
      const file = path.join(dir, "main.ts");
      const wrapped = `(async () => {\n${code}\n})().catch((e: unknown) => { process.stderr.write(String(e) + '\\n'); process.exit(1); });`;
      await fsp.writeFile(file, wrapped, "utf8");
      const tsxBin = path.resolve("node_modules/.bin/tsx");
      yield* spawnStream(
        tsxBin,
        ["--max-old-space-size=128", file],
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
      // Prepend resource limits (CPU 10s, AS already limited by container)
      const limitedCode = `import resource as _r, sys as _sys
try:
    _r.setrlimit(_r.RLIMIT_CPU, (10, 10))
except Exception:
    pass
del _r
${code}`;
      await fsp.writeFile(file, limitedCode, "utf8");
      yield* spawnStream(
        "python3",
        ["-u", file],
        dir,
        sandboxEnv(),
      );
    });
  },
};

/** HTML: not executed server-side — signal the client to render it locally */
const htmlHandler: LanguageHandler = {
  id: "html",
  name: "HTML",
  extensions: ["html", "htm"],
  async *execute({ code }) {
    yield { type: "stdout", chunk: "__HTML_PREVIEW__" } satisfies ExecEvent;
    yield { type: "done", exitCode: 0, duration: 0, chunk: code } satisfies ExecEvent;
  },
};

// Handler registry — add new languages here only
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Version of withTempDir that works inside async generators */
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


function resolveHandler(language: string, filename?: string): LanguageHandler | null {
  const key = language.toLowerCase().trim();
  if (languageHandlers[key]) return languageHandlers[key];

  // Fallback: derive from filename extension
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (languageHandlers[ext]) return languageHandlers[ext];
  }
  return null;
}

// ─── SSE streaming endpoint ───────────────────────────────────────────────────
// POST /api/run/stream — real-time line-by-line output via Server-Sent Events
router.post("/run/stream", optionalAuth, runLimiter, async (req, res) => {
  const { language, code, filename } = req.body as {
    language?: string;
    code?: string;
    filename?: string;
  };

  if (!language || !code) {
    res.status(400).json({ error: '"language" and "code" are required' });
    return;
  }
  if (code.length > 500_000) {
    res.status(400).json({ error: "Code too large (max 500 KB)" });
    return;
  }

  const handler = resolveHandler(language, filename);
  if (!handler) {
    res.status(400).json({
      error: `Language "${language}" is not supported. Supported: JavaScript, TypeScript, Python, HTML`,
    });
    return;
  }

  if (!acquireSlot()) {
    res.status(503).json({ error: "Server is busy — too many concurrent executions. Please try again in a moment.", code: "SERVER_BUSY" });
    return;
  }

  const usageKey = resolveUsageKey(req.user?.userId, req.headers["x-user-key"], req.ip);
  const usage = await checkAndIncrementRuns(usageKey);
  if (!usage.allowed) {
    releaseSlot();
    res.status(429).json({ error: "Daily run limit reached (50/day). Resets at midnight UTC.", code: "DAILY_LIMIT_REACHED", remaining: 0 });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  const execId = randomBytes(6).toString("hex");
  logger.info({ execId, language: handler.id, filename, activeExecutions }, "stream execution start");

  const sendEvent = (event: ExecEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    for await (const event of handler.execute({ code, filename, execId })) {
      sendEvent(event);
      if (event.type === "done") {
        // Send remaining usage count so the frontend can update its display
        res.write(`data: ${JSON.stringify({ type: "usage", remaining: usage.remaining })}\n\n`);
        break;
      }
      if (event.type === "error" && !event.chunk) break;
    }
  } catch (err) {
    logger.error({ err, execId }, "stream execution error");
    sendEvent({ type: "error", error: "Internal execution error" });
    sendEvent({ type: "done", exitCode: -1, duration: 0 });
  } finally {
    releaseSlot();
  }

  res.end();
});

// ─── Buffered JSON endpoint (backward-compat) ─────────────────────────────────
// POST /api/run — collects all SSE events, returns single JSON response
router.post("/run", optionalAuth, runLimiter, async (req, res) => {
  const { language, code, filename } = req.body as {
    language?: string;
    code?: string;
    filename?: string;
  };

  if (!language || !code) {
    res.status(400).json({ error: '"language" and "code" are required' });
    return;
  }
  if (code.length > 500_000) {
    res.status(400).json({ error: "Code too large (max 500 KB)" });
    return;
  }

  const handler = resolveHandler(language, filename);
  if (!handler) {
    res.status(400).json({
      error: `Language "${language}" is not supported. Supported: JavaScript, TypeScript, Python, HTML`,
    });
    return;
  }

  if (!acquireSlot()) {
    res.status(503).json({ error: "Server is busy — too many concurrent executions. Please try again in a moment.", code: "SERVER_BUSY" });
    return;
  }

  const usageKey = resolveUsageKey(req.user?.userId, req.headers["x-user-key"], req.ip);
  const usage = await checkAndIncrementRuns(usageKey);
  if (!usage.allowed) {
    releaseSlot();
    res.status(429).json({ error: "Daily run limit reached (50/day). Resets at midnight UTC.", code: "DAILY_LIMIT_REACHED", remaining: 0 });
    return;
  }

  const execId = randomBytes(6).toString("hex");
  logger.info({ execId, language: handler.id, activeExecutions, runsRemaining: usage.remaining }, "buffered execution start");

  let stdout = "";
  let stderr = "";
  let exitCode = 0;
  let duration = 0;
  let htmlContent: string | undefined;
  let execError: string | undefined;
  let isHtmlPreview = false;

  try {
    for await (const event of handler.execute({ code, filename, execId })) {
      if (event.type === "stdout") {
        if (event.chunk === "__HTML_PREVIEW__") {
          isHtmlPreview = true;
        } else {
          stdout += event.chunk ?? "";
        }
      } else if (event.type === "stderr") {
        stderr += event.chunk ?? "";
      } else if (event.type === "done") {
        exitCode = event.exitCode ?? 0;
        duration = event.duration ?? 0;
        if (isHtmlPreview) htmlContent = event.chunk;
      } else if (event.type === "error") {
        execError = event.error;
        if (event.chunk && event.chunk !== "__HTML_PREVIEW__") stderr += event.chunk;
      }
    }
  } catch (err) {
    logger.error({ err, execId }, "buffered execution error");
    releaseSlot();
    res.status(500).json({ error: "Internal execution error" });
    return;
  }

  releaseSlot();
  res.json({ stdout, stderr, exitCode, duration, error: execError, html: htmlContent, remaining: usage.remaining });
});

// Prevent circular reference — re-export for withTempDir usage
export { withTempDir };

export default router;
