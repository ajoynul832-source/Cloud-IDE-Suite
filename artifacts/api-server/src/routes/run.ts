/**
 * /api/run        — JSON response (backward-compatible, buffered)
 * /api/run/stream — SSE response (real-time, polled from Redis chunk list)
 *
 * Jobs are queued in BullMQ ("codeRuns" queue, max 8 concurrent).
 * The worker (workers/runJob.ts) pushes ExecEvent objects to a Redis list
 * keyed by runId.  The SSE endpoint polls that list at 50 ms intervals and
 * forwards events to the client with zero format changes.
 */
import { Router } from "express";
import { randomBytes } from "crypto";
import { logger } from "../lib/logger";
import { runLimiter } from "../middlewares/rate-limit";
import { checkAndIncrementRuns, resolveUsageKey } from "../lib/usage";
import { optionalAuth } from "../middlewares/require-auth";
import { resolveHandler, withTempDir, type ExecEvent } from "../lib/execution";
import { getQueue, getQueueEvents } from "../lib/queue";
import { getSharedRedis } from "../lib/redis";
import { chunksKey } from "../workers/runJob";

const router = Router();

const SSE_POLL_INTERVAL_MS = 50;
const SSE_MAX_WAIT_MS      = 60_000; // 60 s total max

// ─── SSE streaming endpoint ───────────────────────────────────────────────────
// POST /api/run/stream
// BullMQ queues the job; this handler polls run:chunks:{runId} until "done".
router.post("/run/stream", optionalAuth, runLimiter, async (req, res) => {
  const { language, code, filename } = req.body as {
    language?: string; code?: string; filename?: string;
  };

  if (!language || !code) {
    res.status(400).json({ error: '"language" and "code" are required' });
    return;
  }
  if (code.length > 500_000) {
    res.status(400).json({ error: "Code too large (max 500 KB)" });
    return;
  }
  if (!resolveHandler(language, filename)) {
    res.status(400).json({
      error: `Language "${language}" is not supported. Supported: JavaScript, TypeScript, Python, HTML`,
    });
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

  // Enqueue the job
  const queue = getQueue();
  const job   = await queue.add("run", {
    runId,
    userId:   req.user?.userId ?? usageKey,
    language, code, filename,
  });

  logger.info({ jobId: job.id, runId, language }, "stream: job queued");

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Poll Redis chunk list until "done" or client disconnects
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
    // Timeout — let the client know
    sendEvent({ type: "error", error: "timeout", chunk: "\n[Stream timeout — no response from worker]\n" });
    sendEvent({ type: "done", exitCode: -1, duration: SSE_MAX_WAIT_MS });
  }

  res.end();
});

// ─── Buffered JSON endpoint (backward-compat) ─────────────────────────────────
// POST /api/run — same format as before; waits for job completion
router.post("/run", optionalAuth, runLimiter, async (req, res) => {
  const { language, code, filename } = req.body as {
    language?: string; code?: string; filename?: string;
  };

  if (!language || !code) {
    res.status(400).json({ error: '"language" and "code" are required' });
    return;
  }
  if (code.length > 500_000) {
    res.status(400).json({ error: "Code too large (max 500 KB)" });
    return;
  }
  if (!resolveHandler(language, filename)) {
    res.status(400).json({
      error: `Language "${language}" is not supported. Supported: JavaScript, TypeScript, Python, HTML`,
    });
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
    language, code, filename,
  });

  logger.info({ jobId: job.id, runId, language }, "buffered: job queued");

  try {
    const queueEvents = getQueueEvents();
    const result      = await job.waitUntilFinished(queueEvents, 30_000);

    // Return identical shape to the old synchronous endpoint
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

// Re-export withTempDir for backward-compat with any existing callers
export { withTempDir };

export default router;
