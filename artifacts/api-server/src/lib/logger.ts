/**
 * Structured logger — pino with multiple destinations.
 *
 * Phase 7 — Monitoring & Observability:
 *   Log destinations:
 *     - Console  : all levels (pino-pretty in dev, raw JSON in prod)
 *     - logs/app.log    : INFO and above (raw JSON, async)
 *     - logs/errors.log : ERROR and above (raw JSON, async)
 *
 *   Every log entry carries: { timestamp, level, service, env, ...fields }
 *
 *   Log levels used throughout the codebase:
 *     ERROR — build failed, execution error, DB error
 *     WARN  — rate limit hit, build retry, large upload, degraded behaviour
 *     INFO  — build complete, project saved, user login, server start
 *     DEBUG — detailed execution trace (dev only)
 */
import pino from "pino";
import { mkdirSync } from "fs";
import path from "path";

const isProduction = process.env["NODE_ENV"] === "production";
const logLevel     = process.env["LOG_LEVEL"] ?? (isProduction ? "info" : "debug");

// ─── Ensure logs/ directory exists ────────────────────────────────────────────
const LOG_DIR = path.resolve(process.cwd(), "logs");
try { mkdirSync(LOG_DIR, { recursive: true }); } catch { /* ignore */ }

// ─── Shared base options ───────────────────────────────────────────────────────
const baseOptions: pino.LoggerOptions = {
  level: logLevel,
  base: {
    service: "api-server",
    env:     process.env["NODE_ENV"] ?? "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    "*.password",
    "*.token",
  ],
};

// ─── Build multistream ────────────────────────────────────────────────────────
function buildStreams(): pino.MultiStreamRes {
  const streams: pino.StreamEntry[] = [];

  // Console output
  if (isProduction) {
    // Prod: structured JSON to stdout
    streams.push({ level: "info" as pino.Level, stream: process.stdout });
  } else {
    // Dev: colourised pretty output via worker thread
    streams.push({
      level: "debug" as pino.Level,
      stream: pino.transport({
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname,service,env" },
      }),
    });
  }

  // File: app.log — INFO and above
  streams.push({
    level: "info" as pino.Level,
    stream: pino.destination({
      dest:  path.join(LOG_DIR, "app.log"),
      sync:  false,
      mkdir: true,
    }),
  });

  // File: errors.log — ERROR and above
  streams.push({
    level: "error" as pino.Level,
    stream: pino.destination({
      dest:  path.join(LOG_DIR, "errors.log"),
      sync:  false,
      mkdir: true,
    }),
  });

  return pino.multistream(streams);
}

export const logger = pino(baseOptions, buildStreams());
