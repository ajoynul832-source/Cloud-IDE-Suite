/**
 * GET /api/metrics — internal observability endpoint.
 *
 * Phase 7 — Monitoring & Observability.
 * Admin-gated: requires ADMIN_TOKEN (or SESSION_SECRET fallback) as
 * Bearer token or Basic Auth password.
 *
 * Returns a JSON snapshot of all in-memory metrics, live queue depths,
 * active user counts, and server uptime.
 *
 * Example response:
 * {
 *   "generatedAt": "2026-05-02T20:00:00.000Z",
 *   "period": "2026-05-02",
 *   "uptimeSeconds": 3600,
 *   "runs": {
 *     "total": 142, "errors": 4, "errorRate": "2.8%",
 *     "byLanguage": { "javascript": { "count": 100, "durationSum": 5000 } },
 *     "avgDurationMs": { "javascript": 50 }
 *   },
 *   "builds": {
 *     "total": 8, "errors": 1, "errorRate": "12.5%",
 *     "retries": 2, "durationSum": 240000, "durationCount": 8,
 *     "avgDurationMs": 30000
 *   },
 *   "rateLimitHits": 17,
 *   "queues": { "runs": { "waiting": 0, "active": 2 }, "builds": { "waiting": 1, "active": 1 } },
 *   "activeUsers24h": 23,
 *   "logFiles": { "app": "logs/app.log", "errors": "logs/errors.log" }
 * }
 */
import { Router } from "express";
import path from "path";
import fsp from "fs/promises";
import { metrics } from "../lib/metrics";
import { logger }  from "../lib/logger";

const router = Router();

// ─── Admin auth (same pattern as /api/admin/build-errors) ────────────────────

function isAdminAuthorized(authHeader: string): boolean {
  const secret = process.env["ADMIN_TOKEN"] ?? process.env["SESSION_SECRET"] ?? "";
  if (!secret) return false;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() === secret;
  }
  if (authHeader.startsWith("Basic ")) {
    const decoded  = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const password = decoded.includes(":") ? decoded.split(":").slice(1).join(":") : decoded;
    return password === secret;
  }
  return false;
}

// ─── Log file size helper ─────────────────────────────────────────────────────

async function logFileStat(filename: string): Promise<{ path: string; sizeBytes: number } | null> {
  const fullPath = path.resolve(process.cwd(), "logs", filename);
  try {
    const stat = await fsp.stat(fullPath);
    return { path: `logs/${filename}`, sizeBytes: stat.size };
  } catch {
    return null;
  }
}

// ─── GET /api/metrics ─────────────────────────────────────────────────────────

router.get("/metrics", async (req, res) => {
  const authHeader = String(req.headers["authorization"] ?? "");
  if (!isAdminAuthorized(authHeader)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin"');
    res.status(401).json({ error: "Unauthorized — provide ADMIN_TOKEN as Bearer or Basic Auth password" });
    return;
  }

  try {
    // Force a live queue-depth + active-user refresh before responding
    await metrics.refreshLiveStats();

    const snapshot = metrics.getSnapshot();

    // Append log file info
    const [appLog, errLog] = await Promise.all([
      logFileStat("app.log"),
      logFileStat("errors.log"),
    ]);

    logger.debug({ caller: req.ip }, "metrics endpoint polled");

    res.json({
      ...snapshot,
      logFiles: {
        app:    appLog    ?? null,
        errors: errLog    ?? null,
      },
    });
  } catch (err) {
    logger.error({ err }, "metrics endpoint: snapshot failed");
    res.status(500).json({ error: "Failed to generate metrics snapshot" });
  }
});

export default router;
