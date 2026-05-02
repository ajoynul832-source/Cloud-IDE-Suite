/**
 * GET /api/usage — return today's usage + limits for the calling user.
 */
import { Router } from "express";
import { getUsage, resolveUsageKey, DAILY_RUN_LIMIT, DAILY_BUILD_LIMIT } from "../lib/usage";

const router = Router();

router.get("/usage", async (req, res) => {
  const userKey = resolveUsageKey(req.headers["x-user-key"], req.ip);
  const usage = await getUsage(userKey);
  res.json({
    ...usage,
    limits: { runsPerDay: DAILY_RUN_LIMIT, buildsPerDay: DAILY_BUILD_LIMIT },
  });
});

export default router;
