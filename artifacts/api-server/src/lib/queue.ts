/**
 * BullMQ queue and worker setup for code execution jobs.
 *
 * Queue name:  "codeRuns"
 * Concurrency: 8 (mirrors the old semaphore limit)
 * Retention:   last 100 completed, 50 failed
 */
import { Queue, Worker, QueueEvents, type Processor } from "bullmq";
import { logger } from "./logger";
import { redisConnectionOpts } from "./redis";
import type { RunJobData, RunJobResult } from "../workers/runJob";

export const QUEUE_NAME     = "codeRuns";
export const MAX_CONCURRENCY = 8;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _queue: Queue<any, any, string> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _queueEvents: QueueEvents | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _worker: Worker<any, any, string> | null = null;

export function getQueue(): Queue<RunJobData, RunJobResult> {
  if (!_queue) {
    _queue = new Queue(QUEUE_NAME, {
      connection: redisConnectionOpts(),
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 100 },
        removeOnFail:     { count: 50  },
      },
    });
    _queue.on("error", (err: Error) => logger.warn({ err }, "queue error"));
  }
  return _queue as Queue<RunJobData, RunJobResult>;
}

export function getQueueEvents(): QueueEvents {
  if (!_queueEvents) {
    _queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnectionOpts() });
    _queueEvents.on("error", (err: Error) => logger.warn({ err }, "queue-events error"));
  }
  return _queueEvents;
}

export async function startWorker(): Promise<Worker<RunJobData, RunJobResult>> {
  if (_worker) return _worker as Worker<RunJobData, RunJobResult>;

  // Dynamic import avoids a circular dep at module load time
  const { runJobProcessor } = await import("../workers/runJob");

  _worker = new Worker(
    QUEUE_NAME,
    runJobProcessor as Processor,
    {
      connection:  redisConnectionOpts(),
      concurrency: MAX_CONCURRENCY,
    },
  );

  _worker.on("completed", (job) =>
    logger.info({ jobId: job.id, runId: (job.data as RunJobData).runId }, "job completed"),
  );

  _worker.on("failed", (job, err: Error) =>
    logger.error({ jobId: job?.id, err }, "job failed"),
  );

  _worker.on("error", (err: Error) => logger.error({ err }, "worker error"));

  logger.info({ concurrency: MAX_CONCURRENCY }, "code-run worker started");
  return _worker as Worker<RunJobData, RunJobResult>;
}

export async function shutdownQueue(): Promise<void> {
  await (_worker as Worker | null)?.close();
  await (_queue  as Queue  | null)?.close();
  await _queueEvents?.close();
}
