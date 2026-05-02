/**
 * BullMQ job processor for code execution.
 *
 * For each job:
 *  1. Resolve the language handler
 *  2. Execute code via the handler generator
 *  3. Push every SSE event to a Redis list (run:chunks:{runId}) for real-time streaming
 *  4. Return the accumulated result as the job's return value
 *
 * The Redis list is polled by the /api/run/stream SSE endpoint.
 * TTL on the list: 5 minutes after job completion.
 *
 * Phase 7 — Observability:
 *   Records run metrics (language, duration, success/error) via metrics singleton.
 *   WARN-logs executions that time out or exceed memory limits.
 */
import type { Job } from "bullmq";
import { getSharedRedis } from "../lib/redis";
import { resolveHandler, newExecId } from "../lib/execution";
import { logger }  from "../lib/logger";
import { metrics } from "../lib/metrics";

export interface RunJobData {
  runId:     string;
  userId:    string;
  language:  string;
  code:      string;
  filename?: string;
}

export interface RunJobResult {
  stdout:    string;
  stderr:    string;
  exitCode:  number;
  duration:  number;
  error?:    string;
  html?:     string;
  timestamp: string;
}

const CHUNK_TTL_SECONDS = 5 * 60;

export function chunksKey(runId: string): string {
  return `run:chunks:${runId}`;
}

export async function runJobProcessor(job: Job<RunJobData>): Promise<RunJobResult> {
  const { runId, language, code, filename, userId } = job.data;
  const redis  = getSharedRedis();
  const key    = chunksKey(runId);
  const execId = newExecId();
  const start  = Date.now();

  logger.debug({ jobId: job.id, runId, language, userId }, "worker: starting execution");

  // Warn on large code submissions (> 50 KB)
  if (code.length > 50_000) {
    logger.warn({ jobId: job.id, runId, language, userId, sizeBytes: code.length },
      "worker: large code submission");
  }

  const handler = resolveHandler(language, filename);
  if (!handler) {
    const errMsg = `Language "${language}" is not supported.`;
    const errEvent  = JSON.stringify({ type: "error", error: "unsupported_language", chunk: errMsg });
    const doneEvent = JSON.stringify({ type: "done", exitCode: -1, duration: 0 });
    await redis.rpush(key, errEvent, doneEvent);
    await redis.expire(key, CHUNK_TTL_SECONDS);
    logger.error({ jobId: job.id, runId, language, userId }, "worker: unsupported language");
    metrics.recordRun({ language, durationMs: 0, success: false });
    return { stdout: "", stderr: errMsg, exitCode: -1, duration: 0, timestamp: new Date().toISOString() };
  }

  let stdout    = "";
  let stderr    = "";
  let exitCode  = 0;
  let duration  = 0;
  let html: string | undefined;
  let error: string | undefined;
  let isHtmlPreview = false;

  try {
    for await (const event of handler.execute({ code, filename, execId })) {
      redis.rpush(key, JSON.stringify(event)).catch((err) =>
        logger.warn({ err, runId }, "worker: redis rpush failed"),
      );

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
        if (isHtmlPreview) html = event.chunk;
      } else if (event.type === "error") {
        error = event.error;
        if (event.chunk && event.chunk !== "__HTML_PREVIEW__") stderr += event.chunk;
      }
    }
  } catch (err) {
    const durationMs = Date.now() - start;
    logger.error({ err, runId, execId, language, userId, durationMs }, "worker: execution error");
    const errEvent  = JSON.stringify({ type: "error", error: "internal_error", chunk: "Internal execution error." });
    const doneEvent = JSON.stringify({ type: "done", exitCode: -1, duration: durationMs });
    redis.rpush(key, errEvent, doneEvent).catch(() => {});
    await redis.expire(key, CHUNK_TTL_SECONDS);
    metrics.recordRun({ language, durationMs, success: false });
    return { stdout, stderr: stderr + "Internal execution error.", exitCode: -1, duration: durationMs, timestamp: new Date().toISOString() };
  }

  await redis.expire(key, CHUNK_TTL_SECONDS);

  const success = exitCode === 0 && !error;

  // Warn on timeout / kill
  if (error === "timeout" || exitCode === -1) {
    logger.warn({ runId, language, userId, durationMs: duration, exitCode }, "worker: execution timed out or killed");
  }

  metrics.recordRun({ language, durationMs: duration, success });

  if (success) {
    logger.info({ jobId: job.id, runId, language, userId, durationMs: duration }, "worker: execution complete");
  } else {
    logger.info({ jobId: job.id, runId, language, userId, durationMs: duration, exitCode, error }, "worker: execution finished with error");
  }

  return { stdout, stderr, exitCode, duration, error, html, timestamp: new Date().toISOString() };
}
