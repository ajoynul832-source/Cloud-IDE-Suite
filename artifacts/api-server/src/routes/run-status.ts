/**
 * GET /api/run/job/:jobId — look up a BullMQ code-run job by its queue job ID.
 *
 * Returns:
 *  { jobId, runId, status, result, failedReason, timestamp }
 */
import { Router } from "express";
import { getQueue } from "../lib/queue";
import { optionalAuth } from "../middlewares/require-auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/run/job/:jobId", optionalAuth, async (req, res) => {
  const jobId = String(req.params["jobId"] ?? "");
  if (!jobId || !/^[\w-]+$/.test(jobId)) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  try {
    const queue = getQueue();
    const job   = await queue.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const state = await job.getState();

    res.json({
      jobId:        job.id,
      runId:        job.data.runId,
      status:       state,
      result:       job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
      timestamp:    job.processedOn ? new Date(job.processedOn).toISOString() : null,
    });
  } catch (err) {
    logger.error({ err, jobId }, "run/job status failed");
    res.status(500).json({ error: "Failed to fetch job status" });
  }
});

export default router;
