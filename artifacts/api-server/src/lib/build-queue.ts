/**
 * BullMQ queue for Flutter/Android APK builds.
 *
 * Separate from the code-execution "codeRuns" queue.
 * Concurrency: 2 (builds are resource-intensive; one active + one extracting)
 */
import { Queue, Worker, QueueEvents, type Processor } from "bullmq";
import { logger } from "./logger";
import { redisConnectionOpts } from "./redis";
import type { BuildJobData } from "../workers/buildJob";

export const BUILD_QUEUE_NAME    = "buildJobs";
export const BUILD_CONCURRENCY   = 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _buildQueue: Queue<any, any> | null = null;
let _buildQueueEvents: QueueEvents | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _buildWorker: Worker<any, any> | null = null;

export function getBuildQueue(): Queue<BuildJobData, void> {
  if (!_buildQueue) {
    _buildQueue = new Queue(BUILD_QUEUE_NAME, {
      connection: redisConnectionOpts(),
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 100 },
        removeOnFail:     { count: 50  },
      },
    });
    _buildQueue.on("error", (err: Error) => logger.warn({ err }, "build queue error"));
  }
  return _buildQueue as Queue<BuildJobData, void>;
}

export function getBuildQueueEvents(): QueueEvents {
  if (!_buildQueueEvents) {
    _buildQueueEvents = new QueueEvents(BUILD_QUEUE_NAME, { connection: redisConnectionOpts() });
    _buildQueueEvents.on("error", (err: Error) => logger.warn({ err }, "build queue-events error"));
  }
  return _buildQueueEvents;
}

export async function startBuildWorker(): Promise<void> {
  if (_buildWorker) return;

  const { buildJobProcessor } = await import("../workers/buildJob");

  _buildWorker = new Worker(
    BUILD_QUEUE_NAME,
    buildJobProcessor as Processor,
    {
      connection:  redisConnectionOpts(),
      concurrency: BUILD_CONCURRENCY,
    },
  );

  _buildWorker.on("completed", (job) =>
    logger.info({ jobId: job.id, buildId: (job.data as BuildJobData).buildId }, "build job completed"),
  );
  _buildWorker.on("failed", (job, err: Error) =>
    logger.error({ jobId: job?.id, err }, "build job failed"),
  );
  _buildWorker.on("error", (err: Error) => logger.error({ err }, "build worker error"));

  logger.info({ concurrency: BUILD_CONCURRENCY }, "build worker started");
}

export async function shutdownBuildQueue(): Promise<void> {
  await _buildWorker?.close();
  await _buildQueue?.close();
  await _buildQueueEvents?.close();
}

/** Count active (queued + building) jobs for a given user from the queue */
export async function countActiveBuildsForUser(userId: string): Promise<number> {
  const queue = getBuildQueue();
  const [waiting, active] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
  ]);
  // BullMQ doesn't filter by userId in queue — we use the DB for this
  // This is used as a quick upper-bound check; DB query is authoritative
  return waiting + active;
}
