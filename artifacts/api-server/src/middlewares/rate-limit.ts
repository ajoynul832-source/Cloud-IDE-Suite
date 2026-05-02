import rateLimit from "express-rate-limit";
import type { Request } from "express";

function keyGen(req: Request): string {
  // Prefer authenticated userId → X-User-Key header → IP
  if (req.user?.userId) return `user:${req.user.userId}`;
  const userKey = req.headers["x-user-key"];
  if (typeof userKey === "string" && userKey.length > 0) return userKey;
  return req.ip ?? "unknown";
}

/** Trust only the FIRST IP in X-Forwarded-For to defeat spoofing */
function firstIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.ip ?? "unknown";
}

const baseOpts = { validate: { ip: false, keyGeneratorIpFallback: false } } as const;

// ─── Global: 100 requests / hour per IP (even anonymous) ──────────────────────
export const globalLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders:  false,
  keyGenerator:   firstIp,
  message: { error: "Too many requests from this IP (limit: 100/hr). Try again later." },
  skip: () => process.env["NODE_ENV"] === "test",
});

/** 30 executions / minute per user */
export const runLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders:  false,
  keyGenerator:   keyGen,
  message: { error: "Too many execution requests. Limit: 30/min. Try again shortly." },
  skip: () => process.env["NODE_ENV"] === "test",
});

/** 5 builds / minute per user */
export const buildLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders:  false,
  keyGenerator:   keyGen,
  message: { error: "Too many build requests. Limit: 5/min. Try again shortly." },
  skip: () => process.env["NODE_ENV"] === "test",
});

/** 60 project reads/writes / minute per user */
export const projectLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders:  false,
  keyGenerator:   keyGen,
  message: { error: "Too many requests. Try again shortly." },
});

/** 20 share link generates or lookups / minute per IP */
export const shareLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders:  false,
  keyGenerator:   (req) => req.ip ?? "unknown",
  message: { error: "Too many share requests. Try again shortly." },
});
