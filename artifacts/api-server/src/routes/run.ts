/**
 * /api/run        — JSON response (backward-compatible, buffered)
 * /api/run/stream — SSE response (real-time, polled from Redis chunk list)
 *
 * Phase 6 — Security:
 *   - Filename traversal check via checkFilename()
 *   - Dangerous module/API linting via checkForDangerousCode()
 *     Blocks: require('http/https/fs/child_process'), fetch, process.env, etc.
 */
import { Router } from "express";
import { randomBytes } from "crypto";
import { logger } from "../lib/logger";
import { runLimiter } from "../middlewares/rate-limit";
import { checkAndIncrementRuns, resolveUsageKey } from "../lib/usage";
import { optionalAuth } from "../middlewares/require-auth";
import { resolveHandler, withTempDir, checkForDangerousCode, checkFilename, type ExecEvent } from "../lib/execution";
import { getQueue, getQueueEvents } from "../lib/queue";
import { getSharedRedis } from "../lib/redis";
import { chunksKey } from "../workers/runJob";

const router = Router();

const SSE_POLL_INTERVAL_MS = 50;
const SSE_MAX_WAIT_MS      = 60_000;

// ─── Shared input validation ──────────────────────────────────────────────────

function validateRunInput(
  language: string | undefined,
  code: string | undefined,
  filename: string | undefined,
): { error: string; status: number } | null {
  if (!language || !code) {
    return { error: '"language" and "code" are required', status: 400 };
  }
  if (code.length > 500_000) {
    return { error: "Code too large (max 500 KB)", status: 413 };
  }
  const filenameErr = checkFilename(filename);
  if (filenameErr) {
    return { error: filenameErr, status: 400 };
  }
  if (!resolveHandler(language, filename)) {
    return {
      error: `Language "${language}" is not supported. Supported: JavaScript, TypeScript, Python, HTML`,
      status: 400,
    };
  }
  // Phase 6: dangerous code lint (JS/TS only)
  const dangerErr = checkForDangerousCode(code, language);
  if (dangerErr) {
    return { error: dangerErr, status: 403 };
  }
  return null;
}

// ─── SSE streaming endpoint ───────────────────────────────────────────────────

router.post("/run/stream", optionalAuth, runLimiter, async (req, res) => {
  const { language, code, filename } = req.body as {
    language?: string; code?: string; filename?: string;
  };

  const validationErr = validateRunInput(language, code, filename);
  if (validationErr) {
    res.status(validationErr.status).json({ error: validationErr.error });
    return;
  }

  const usageKey = resolveUsageKey(req.user?.userId, req.headers["x-user-key"], req.ip);
  const usage    = await checkAndIncrementRuns(usageKey);
  if (!usage.allowed) {
    res.status(429).json({
      error: "Daily run limit reached (50/day). Resets at midnight UTC.",
      code: "DAILY_LIMIT_REACHED", remaining: 0,
    });
    return;
  }

  const runId = randomBytes(8).toString("hex");
  const queue = getQueue();
  const job   = await queue.add("run", {
    runId,
    userId:   req.user?.userId ?? usageKey,
    language: language!, code: code!, filename,
  });

  logger.info({ jobId: job.id, runId, language }, "stream: job queued");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const redis    = getSharedRedis();
  const key      = chunksKey(runId);
  let offset     = 0;
  let done       = false;
  let aborted    = false;
  const deadline = Date.now() + SSE_MAX_WAIT_MS;

  req.on("close", () => { aborted = true; });

  const sendEvent = (event: unknown) => {
    if (!aborted) res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  while (!done && !aborted && Date.now() < deadline) {
    let newChunks: string[] = [];
    try {
      newChunks = await redis.lrange(key, offset, -1);
    } catch (err) {
      logger.warn({ err, runId }, "stream: redis lrange failed");
    }

    for (const raw of newChunks) {
      try {
        const event = JSON.parse(raw) as ExecEvent;
        sendEvent(event);
        if (event.type === "done") {
          sendEvent({ type: "usage", remaining: usage.remaining });
          done = true;
          break;
        }
        if (event.type === "error" && !event.chunk) {
          done = true;
          break;
        }
      } catch {
        // malformed event — skip
      }
    }

    offset += newChunks.length;
    if (!done && !aborted) {
      await new Promise((r) => setTimeout(r, SSE_POLL_INTERVAL_MS));
    }
  }

  if (!done && !aborted) {
    sendEvent({ type: "error", error: "timeout", chunk: "\n[Stream timeout — no response from worker]\n" });
    sendEvent({ type: "done", exitCode: -1, duration: SSE_MAX_WAIT_MS });
  }

  res.end();
});

// ─── Buffered JSON endpoint ───────────────────────────────────────────────────

router.post("/run", optionalAuth, runLimiter, async (req, res) => {
  const { language, code, filename } = req.body as {
    language?: string; code?: string; filename?: string;
  };

  const validationErr = validateRunInput(language, code, filename);
  if (validationErr) {
    res.status(validationErr.status).json({ error: validationErr.error });
    return;
  }

  const usageKey = resolveUsageKey(req.user?.userId, req.headers["x-user-key"], req.ip);
  const usage    = await checkAndIncrementRuns(usageKey);
  if (!usage.allowed) {
    res.status(429).json({
      error: "Daily run limit reached (50/day). Resets at midnight UTC.",
      code: "DAILY_LIMIT_REACHED", remaining: 0,
    });
    return;
  }

  const runId = randomBytes(8).toString("hex");
  const queue  = getQueue();
  const job    = await queue.add("run", {
    runId,
    userId:   req.user?.userId ?? usageKey,
    language: language!, code: code!, filename,
  });

  logger.info({ jobId: job.id, runId, language }, "buffered: job queued");

  try {
    const queueEvents = getQueueEvents();
    const result      = await job.waitUntilFinished(queueEvents, 30_000);
    res.json({
      stdout:    result.stdout,
      stderr:    result.stderr,
      exitCode:  result.exitCode,
      duration:  result.duration,
      error:     result.error,
      html:      result.html,
      remaining: usage.remaining,
    });
  } catch (err) {
    logger.error({ err, jobId: job.id, runId }, "buffered: job wait failed");
    res.status(500).json({ error: "Execution failed or timed out" });
  }
});

export { withTempDir };
export default router;
