/**
 * Rate limiters — express-rate-limit v8.
 *
 * Phase 6 — Security:
 *   - globalLimiter: 100 req/hr per IP (all routes)
 *   - runLimiter:    30 req/min per user/key
 *   - buildLimiter:   5 req/min per user/key
 *   - projectLimiter: 60 req/min per user/key
 *   - shareLimiter:   20 req/min per IP
 *
 * Phase 7 — Observability:
 *   Every rate-limit rejection is logged at WARN level (with IP, path, limiter name)
 *   and recorded in the metrics singleton for the /api/metrics endpoint.
 */
import rateLimit, { type Options } from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import { logger }  from "../lib/logger";
import { metrics } from "../lib/metrics";

function keyGen(req: Request): string {
  if (req.user?.userId) return `user:${req.user.userId}`;
  const userKey = req.headers["x-user-key"];
  if (typeof userKey === "string" && userKey.length > 0) return userKey;
  return req.ip ?? "unknown";
}

function firstIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.ip ?? "unknown";
}

const baseOpts = { validate: { ip: false, keyGeneratorIpFallback: false } } as const;

/** Build a rate-limit handler that logs WARN and records metric */
function makeHandler(limiterName: string): Options["handler"] {
  return (req: Request, res: Response, _next: NextFunction, options: Options) => {
    const ip   = firstIp(req);
    const path = req.path;
    logger.warn({ limiter: limiterName, ip, path, method: req.method, userId: req.user?.userId },
      `rate limit exceeded: ${limiterName}`);
    metrics.recordRateLimitHit();
    res.status(options.statusCode ?? 429).json(options.message);
  };
}

// ─── Global: 100 requests / hour per IP ───────────────────────────────────────
export const globalLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    firstIp,
  message: { error: "Too many requests from this IP (limit: 100/hr). Try again later." },
  handler: makeHandler("global"),
  skip: () => process.env["NODE_ENV"] === "test",
});

/** 30 executions / minute per user */
export const runLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max:      30,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    keyGen,
  message: { error: "Too many execution requests. Limit: 30/min. Try again shortly." },
  handler: makeHandler("run"),
  skip: () => process.env["NODE_ENV"] === "test",
});

/** 5 builds / minute per user */
export const buildLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    keyGen,
  message: { error: "Too many build requests. Limit: 5/min. Try again shortly." },
  handler: makeHandler("build"),
  skip: () => process.env["NODE_ENV"] === "test",
});

/** 60 project reads/writes / minute per user */
export const projectLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    keyGen,
  message: { error: "Too many requests. Try again shortly." },
  handler: makeHandler("project"),
});

/** 20 share link generates or lookups / minute per IP */
export const shareLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    (req) => req.ip ?? "unknown",
  message: { error: "Too many share requests. Try again shortly." },
  handler: makeHandler("share"),
});
