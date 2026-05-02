/**
 * Redis connection management.
 *
 * - Parses REDIS_URL (default: redis://localhost:6379)
 * - Auto-starts redis-server as a background subprocess when no external URL is
 *   configured and redis-server is available (installed via Nix)
 * - Exports redisConnectionOpts for BullMQ (requires maxRetriesPerRequest: null)
 * - Exports createRedisClient() for one-off operations (chunk lists, etc.)
 */
import Redis from "ioredis";
import { spawn } from "child_process";
import { logger } from "./logger";

const REDIS_URL   = process.env["REDIS_URL"] ?? "redis://localhost:6379";
const parsedUrl   = new URL(REDIS_URL);
const REDIS_HOST  = parsedUrl.hostname || "127.0.0.1";
const REDIS_PORT  = parseInt(parsedUrl.port || "6379", 10);
const REDIS_PASS  = parsedUrl.password || undefined;

/** Connection options compatible with both ioredis and BullMQ */
export function redisConnectionOpts() {
  return {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASS,
    maxRetriesPerRequest: null as null, // required by BullMQ — do not remove
    enableReadyCheck: false,
    lazyConnect: false,
  };
}

/** Create a new Redis client (caller is responsible for lifecycle) */
export function createRedisClient(): Redis {
  return new Redis(redisConnectionOpts());
}

async function isRedisReachable(): Promise<boolean> {
  const client = new Redis({ host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASS,
    maxRetriesPerRequest: 1, connectTimeout: 1_500, lazyConnect: true });
  try {
    await client.connect();
    await client.ping();
    return true;
  } catch {
    return false;
  } finally {
    client.disconnect();
  }
}

async function waitForRedis(maxMs = 8_000): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (await isRedisReachable()) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Redis not reachable at ${REDIS_HOST}:${REDIS_PORT} after ${maxMs}ms`);
}

let _ensured = false;

/**
 * Ensure Redis is running before the server starts serving requests.
 * Call this once from index.ts before app.listen().
 */
export async function ensureRedis(): Promise<void> {
  if (_ensured) return;

  if (await isRedisReachable()) {
    logger.info({ host: REDIS_HOST, port: REDIS_PORT }, "redis: already running");
    _ensured = true;
    await configureRedis();
    return;
  }

  // Try to start local redis-server (installed via Nix)
  logger.info("redis: not running — starting redis-server");
  const proc = spawn("redis-server", ["--daemonize", "yes", "--loglevel", "warning",
    "--port", String(REDIS_PORT)], { stdio: "ignore", detached: true });
  proc.unref();

  try {
    await waitForRedis(10_000);
    logger.info({ port: REDIS_PORT }, "redis: started successfully");
  } catch (err) {
    logger.error({ err }, "redis: failed to start — execution queue unavailable");
    throw err;
  }

  _ensured = true;
  await configureRedis();
}

/**
 * Apply safe production defaults for the embedded Redis instance.
 * - maxmemory 512mb  — prevents OOM from unbounded key growth
 * - allkeys-lru      — evict least-recently-used keys when at limit
 * These are no-ops if REDIS_URL points to a managed provider (they may
 * reject CONFIG SET — the error is caught and logged as a warning).
 */
async function configureRedis(): Promise<void> {
  const client = createRedisClient();
  try {
    const maxMem = process.env["REDIS_MAX_MEMORY"] ?? "512mb";
    await client.config("SET", "maxmemory", maxMem);
    await client.config("SET", "maxmemory-policy", "allkeys-lru");
    logger.info({ maxMem, policy: "allkeys-lru" }, "redis: memory config applied");
  } catch (err) {
    logger.warn({ err }, "redis: CONFIG SET failed (managed Redis may not allow it — safe to ignore)");
  } finally {
    client.disconnect();
  }
}

// ─── Shared client for chunk-list operations ──────────────────────────────────

let _sharedClient: Redis | null = null;

export function getSharedRedis(): Redis {
  if (!_sharedClient) {
    _sharedClient = createRedisClient();
    _sharedClient.on("error", (err) => logger.warn({ err }, "redis shared client error"));
  }
  return _sharedClient;
}

/** Flush all run:chunks:* keys on graceful shutdown */
export async function shutdownRedis(): Promise<void> {
  if (_sharedClient) {
    await _sharedClient.quit().catch(() => {});
    _sharedClient = null;
  }
}
