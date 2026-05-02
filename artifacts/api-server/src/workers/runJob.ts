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
 */
import type { Job } from "bullmq";
import { getSharedRedis } from "../lib/redis";
import { resolveHandler, newExecId } from "../lib/execution";
import { logger } from "../lib/logger";

export interface RunJobData {
  runId:     string; // unique run identifier (used as Redis key suffix)
  userId:    string; // usage-tracking key
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

const CHUNK_TTL_SECONDS = 5 * 60; // 5 minutes

export function chunksKey(runId: string): string {
  return `run:chunks:${runId}`;
}

export async function runJobProcessor(job: Job<RunJobData>): Promise<RunJobResult> {
  const { runId, language, code, filename } = job.data;
  const redis = getSharedRedis();
  const key   = chunksKey(runId);
  const execId = newExecId();

  logger.info({ jobId: job.id, runId, language }, "worker: starting execution");

  const handler = resolveHandler(language, filename);
  if (!handler) {
    const errEvent = JSON.stringify({ type: "error", error: "unsupported_language",
      chunk: `Language "${language}" is not supported.` });
    const doneEvent = JSON.stringify({ type: "done", exitCode: -1, duration: 0 });
    await redis.rpush(key, errEvent, doneEvent);
    await redis.expire(key, CHUNK_TTL_SECONDS);
    return {
      stdout: "", stderr: `Language "${language}" is not supported.`,
      exitCode: -1, duration: 0, timestamp: new Date().toISOString(),
    };
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
      // Push to Redis list for SSE polling — fire and don't wait to avoid slowing execution
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
    logger.error({ err, runId, execId }, "worker: execution error");
    const errEvent = JSON.stringify({ type: "error", error: "internal_error", chunk: "Internal execution error." });
    const doneEvent = JSON.stringify({ type: "done", exitCode: -1, duration: 0 });
    redis.rpush(key, errEvent, doneEvent).catch(() => {});
    await redis.expire(key, CHUNK_TTL_SECONDS);
    return { stdout, stderr: stderr + "Internal execution error.", exitCode: -1, duration, timestamp: new Date().toISOString() };
  }

  await redis.expire(key, CHUNK_TTL_SECONDS);

  return { stdout, stderr, exitCode, duration, error, html, timestamp: new Date().toISOString() };
}
