import { Router } from "express";
import { spawn } from "child_process";
import { logger } from "../lib/logger";

const router = Router();

const MAX_OUTPUT_BYTES = 100_000; // 100KB
const EXEC_TIMEOUT_MS = 10_000;  // 10s hard limit

type ExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  error?: string;
};

function detectLanguage(language: string, filename?: string): string {
  const raw = language.toLowerCase().trim();
  if (["javascript", "js", "node", "jsx"].includes(raw)) return "javascript";
  if (["typescript", "ts", "tsx"].includes(raw)) return "typescript";
  if (["python", "py", "python3"].includes(raw)) return "python";
  if (["html", "htm"].includes(raw)) return "html";

  // fall back to filename extension
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (["js", "jsx", "mjs", "cjs"].includes(ext)) return "javascript";
    if (["ts", "tsx"].includes(ext)) return "typescript";
    if (["py"].includes(ext)) return "python";
    if (["html", "htm"].includes(ext)) return "html";
  }

  return raw; // return as-is; will hit unsupported branch
}

function spawnExec(cmd: string, args: string[], input?: string): Promise<ExecResult> {
  const start = Date.now();

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let killed = false;

    const env: NodeJS.ProcessEnv = {
      PATH: process.env["PATH"],
      HOME: process.env["HOME"],
      TMPDIR: process.env["TMPDIR"] ?? "/tmp",
      TERM: "dumb",
      PYTHONDONTWRITEBYTECODE: "1",
      PYTHONUNBUFFERED: "1",
      NODE_PATH: process.env["NODE_PATH"],
    };

    const proc = spawn(cmd, args, { env });

    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
    }, EXEC_TIMEOUT_MS);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      if (stdout.length > MAX_OUTPUT_BYTES) {
        killed = true;
        proc.kill("SIGKILL");
        stdout = stdout.slice(0, MAX_OUTPUT_BYTES) + "\n\n[Output truncated — exceeded 100 KB limit]";
      }
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > MAX_OUTPUT_BYTES) {
        stderr = stderr.slice(0, MAX_OUTPUT_BYTES) + "\n[stderr truncated]";
      }
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      const duration = Date.now() - start;
      if (killed) {
        resolve({
          stdout,
          stderr: stderr || `Process killed after ${EXEC_TIMEOUT_MS / 1000}s (timeout)`,
          exitCode: code ?? -1,
          duration,
          error: "timeout",
        });
      } else {
        resolve({ stdout, stderr, exitCode: code ?? 0, duration });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: err.message,
        exitCode: -1,
        duration: Date.now() - start,
        error: err.message,
      });
    });
  });
}

async function executeJavaScript(code: string): Promise<ExecResult> {
  // Wrap in async IIFE so top-level await works
  const wrapped = `(async () => {\n${code}\n})().catch(e => { process.stderr.write(String(e) + '\\n'); process.exit(1); });`;
  return spawnExec("node", ["--input-type=module", "-e", wrapped]);
}

async function executeTypeScript(code: string): Promise<ExecResult> {
  // Use esbuild to transpile TS to JS inline, then run with node
  // Fallback: strip type annotations and run as JS
  const stripTypes = code
    .replace(/:\s*[\w<>\[\]|&{}()\s,'"]+(?=\s*[=,);\n{])/g, "") // crude type strip
    .replace(/as\s+\w+/g, "")
    .replace(/<[\w\s,|&]+>/g, "");

  return executeJavaScript(stripTypes);
}

async function executePython(code: string): Promise<ExecResult> {
  return spawnExec("python3", ["-u", "-c", code]);
}

// POST /api/run
router.post("/run", async (req, res) => {
  const { language, code, filename } = req.body as {
    language?: string;
    code?: string;
    filename?: string;
  };

  if (!language || typeof language !== "string") {
    res.status(400).json({ error: '"language" is required' });
    return;
  }
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: '"code" is required' });
    return;
  }
  if (code.length > 500_000) {
    res.status(400).json({ error: "Code too large (max 500KB)" });
    return;
  }

  const lang = detectLanguage(language, filename);
  logger.info({ lang, filename }, "code execution request");

  let result: ExecResult;

  try {
    switch (lang) {
      case "javascript":
        result = await executeJavaScript(code);
        break;
      case "typescript":
        result = await executeTypeScript(code);
        break;
      case "python":
        result = await executePython(code);
        break;
      case "html":
        // HTML can't be "executed" server-side — return the source for the browser to render
        result = {
          stdout: "",
          stderr: "",
          exitCode: 0,
          duration: 0,
          error: "html_preview",
        };
        res.json({ ...result, html: code });
        return;
      default:
        result = {
          stdout: "",
          stderr: `Language "${language}" is not supported for server-side execution.\nSupported: JavaScript, TypeScript, Python, HTML`,
          exitCode: 1,
          duration: 0,
          error: "unsupported",
        };
    }
  } catch (err) {
    logger.error({ err }, "code execution internal error");
    res.status(500).json({ error: "Internal execution error" });
    return;
  }

  res.json(result);
});

export default router;
