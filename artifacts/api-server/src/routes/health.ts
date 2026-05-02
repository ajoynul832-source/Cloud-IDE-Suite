/**
 * GET /api/healthz — deep health check
 *
 * Returns 200 when all components are healthy, 503 when any component is degraded.
 * Checks database (SELECT 1) and Redis (PING) with per-component response times.
 *
 * Response shape:
 *   { status, version, uptime, checks: { database, redis } }
 */
import { Router, type IRouter } from "express";
import { pool }            from "@workspace/db";
import { getSharedRedis }  from "../lib/redis";
import { logger }          from "../lib/logger";

const VERSION = "1.0.0";
const router: IRouter = Router();

type CheckResult = { status: "ok" | "error"; responseMs: number; error?: string };

async function checkDatabase(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await pool.query("SELECT 1");
    return { status: "ok", responseMs: Date.now() - t0 };
  } catch (err) {
    logger.warn({ err }, "healthz: DB check failed");
    return { status: "error", responseMs: Date.now() - t0, error: "DB unavailable" };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const pong = await getSharedRedis().ping();
    if (pong !== "PONG") throw new Error(`unexpected PING response: ${pong}`);
    return { status: "ok", responseMs: Date.now() - t0 };
  } catch (err) {
    logger.warn({ err }, "healthz: Redis check failed");
    return { status: "error", responseMs: Date.now() - t0, error: "Redis unavailable" };
  }
}

router.get("/healthz", async (_req, res) => {
  const [db, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  const healthy = db.status === "ok" && redis.status === "ok";
  const status  = healthy ? "ok" : "degraded";

  res.status(healthy ? 200 : 503).json({
    status,
    version: VERSION,
    uptime:  Math.floor(process.uptime()),
    checks:  { database: db, redis },
  });
});

export default router;
