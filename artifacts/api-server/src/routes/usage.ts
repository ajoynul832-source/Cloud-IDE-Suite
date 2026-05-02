import { Router } from "express";
import { getUsage, resolveUsageKey, DAILY_RUN_LIMIT, DAILY_BUILD_LIMIT } from "../lib/usage";
import { optionalAuth } from "../middlewares/require-auth";

const router = Router();

router.get("/usage", optionalAuth, async (req, res) => {
  const userKey = resolveUsageKey(req.user?.userId, req.headers["x-user-key"], req.ip);
  const usage = await getUsage(userKey);
  res.json({
    ...usage,
    limits: { runsPerDay: DAILY_RUN_LIMIT, buildsPerDay: DAILY_BUILD_LIMIT },
  });
});

export default router;
