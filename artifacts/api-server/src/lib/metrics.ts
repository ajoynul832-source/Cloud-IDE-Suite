/**
 * Phase 7 — Monitoring & Observability: Metrics Singleton
 *
 * Collects and exposes runtime metrics. All counters are kept in memory for
 * instant reads and written through to a Redis hash for crash-recovery / restart
 * continuity. The Redis key is date-scoped (YYYY-MM-DD UTC) with a 48-hour TTL.
 *
 * Tracked metrics:
 *   runs.total              — code executions dispatched today
 *   runs.errors             — executions that returned a non-zero exit code
 *   runs.byLanguage         — per-language { count, durationSum } for avg latency
 *   builds.total            — APK build jobs queued today
 *   builds.errors           — builds that ended in "failed" status
 *   builds.retries          — builds that were retried (Phase 5 resilience events)
 *   builds.durationSum/Count — for average build duration
 *   rateLimitHits           — requests rejected by any rate limiter today
 *
 * API:
 *   metrics.recordRun({ language, durationMs, success })
 *   metrics.recordBuild({ language, durationMs, success })
 *   metrics.recordBuildRetry()
 *   metrics.recordRateLimitHit()
 *   metrics.getSnapshot()   → MetricsSnapshot (synchronous)
 *
 * Usage: import { metrics } from "../lib/metrics";
 */
import { todayUTC } from "./usage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LanguageStat {
  count:       number;
  durationSum: number;
}

export interface RunMetrics {
  total:      number;
  errors:     number;
  byLanguage: Record<string, LanguageStat>;
}

export interface BuildMetrics {
  total:         number;
  errors:        number;
  retries:       number;
  durationSum:   number;
  durationCount: number;
}

export interface MetricsSnapshot {
  generatedAt:     string;
  period:          string;
  uptimeSeconds:   number;
  runs:            RunMetrics & { errorRate: string; avgDurationMs: Record<string, number> };
  builds:          BuildMetrics & { errorRate: string; avgDurationMs: number };
  rateLimitHits:   number;
  queues:          { runs: QueueStat; builds: QueueStat };
  activeUsers24h:  number;
}

export interface QueueStat { waiting: number; active: number; }

// ─── Internal store ───────────────────────────────────────────────────────────

interface State {
  date:     string;
  runs:     RunMetrics;
  builds:   BuildMetrics;
  rlHits:   number;
}

function emptyState(date: string): State {
  return {
    date,
    runs:   { total: 0, errors: 0, byLanguage: {} },
    builds: { total: 0, errors: 0, retries: 0, durationSum: 0, durationCount: 0 },
    rlHits: 0,
  };
}

// ─── Redis persistence helpers ────────────────────────────────────────────────

let _redisReady = false;

function redisKey(date: string): string { return `metrics:${date}`; }

async function hincrby(field: string, value: number, date: string): Promise<void> {
  if (value === 0) return;
  try {
    const { getSharedRedis } = await import("./redis");
    const redis = getSharedRedis();
    const key   = redisKey(date);
    await redis.hincrby(key, field, value);
    // 48-hour TTL — set lazily; EXPIREGT avoids shortening existing TTL
    redis.expire(key, 48 * 3600, "GT").catch(() => {});
    if (!_redisReady) _redisReady = true;
  } catch {
    // Redis unavailable — silently continue with in-memory only
  }
}

async function loadFromRedis(date: string): Promise<Partial<State>> {
  try {
    const { getSharedRedis } = await import("./redis");
    const redis   = getSharedRedis();
    const raw     = await redis.hgetall(redisKey(date));
    if (!raw || Object.keys(raw).length === 0) return {};

    const n  = (k: string) => parseInt(raw[k] ?? "0", 10) || 0;
    const runs: RunMetrics = {
      total:      n("runs:total"),
      errors:     n("runs:errors"),
      byLanguage: {},
    };

    // Reconstruct per-language stats
    const langKeys = Object.keys(raw).filter((k) => k.startsWith("runs:lang:") && k.endsWith(":count"));
    for (const key of langKeys) {
      const lang = key.slice("runs:lang:".length, -":count".length);
      runs.byLanguage[lang] = {
        count:       n(`runs:lang:${lang}:count`),
        durationSum: n(`runs:lang:${lang}:durSum`),
      };
    }

    const builds: BuildMetrics = {
      total:         n("builds:total"),
      errors:        n("builds:errors"),
      retries:       n("builds:retries"),
      durationSum:   n("builds:durSum"),
      durationCount: n("builds:durCount"),
    };

    return { runs, builds, rlHits: n("rl:hits") };
  } catch {
    return {};
  }
}

// ─── Metrics class ────────────────────────────────────────────────────────────

class Metrics {
  private state: State;
  private readonly startedAt = Date.now();
  private _queueSnapshot: { runs: QueueStat; builds: QueueStat } = {
    runs:   { waiting: 0, active: 0 },
    builds: { waiting: 0, active: 0 },
  };
  private _activeUsers24h = 0;
  private _refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.state = emptyState(todayUTC());
    // Attempt to load persisted values from Redis on startup (async, best-effort)
    this.initFromRedis();
    // Refresh live stats (queue depths, active users) every 30 s
    this._refreshTimer = setInterval(() => { this.refreshLiveStats().catch(() => {}); }, 30_000);
    if (this._refreshTimer.unref) this._refreshTimer.unref();
  }

  private async initFromRedis(): Promise<void> {
    const date = todayUTC();
    const saved = await loadFromRedis(date);
    if (saved.runs)   this.state.runs   = saved.runs;
    if (saved.builds) this.state.builds = saved.builds;
    if (saved.rlHits !== undefined) this.state.rlHits = saved.rlHits;
  }

  /** Roll over to a new day if UTC date has changed */
  private checkDate(): void {
    const today = todayUTC();
    if (this.state.date !== today) {
      this.state = emptyState(today);
      // Re-init from Redis for the new day (no data expected)
      this.initFromRedis().catch(() => {});
    }
  }

  // ─── Recording ─────────────────────────────────────────────────────────────

  recordRun(opts: { language: string; durationMs: number; success: boolean }): void {
    this.checkDate();
    const lang = opts.language.toLowerCase();
    this.state.runs.total++;
    if (!opts.success) this.state.runs.errors++;
    if (!this.state.runs.byLanguage[lang]) {
      this.state.runs.byLanguage[lang] = { count: 0, durationSum: 0 };
    }
    this.state.runs.byLanguage[lang]!.count++;
    this.state.runs.byLanguage[lang]!.durationSum += opts.durationMs;

    const d = this.state.date;
    hincrby("runs:total",               1,              d);
    if (!opts.success) hincrby("runs:errors", 1, d);
    hincrby(`runs:lang:${lang}:count`,  1,              d);
    hincrby(`runs:lang:${lang}:durSum`, opts.durationMs, d);
  }

  recordBuild(opts: { language: string; durationMs: number; success: boolean }): void {
    this.checkDate();
    this.state.builds.total++;
    if (!opts.success) this.state.builds.errors++;
    this.state.builds.durationSum   += opts.durationMs;
    this.state.builds.durationCount++;

    const d = this.state.date;
    hincrby("builds:total",    1,              d);
    if (!opts.success) hincrby("builds:errors", 1, d);
    hincrby("builds:durSum",   opts.durationMs, d);
    hincrby("builds:durCount", 1,              d);
  }

  recordBuildRetry(): void {
    this.checkDate();
    this.state.builds.retries++;
    hincrby("builds:retries", 1, this.state.date);
  }

  recordRateLimitHit(): void {
    this.checkDate();
    this.state.rlHits++;
    hincrby("rl:hits", 1, this.state.date);
  }

  // ─── Live stats refresh ─────────────────────────────────────────────────────

  async refreshLiveStats(): Promise<void> {
    await Promise.all([this.refreshQueues(), this.refreshActiveUsers()]);
  }

  private async refreshQueues(): Promise<void> {
    try {
      const { getQueue }        = await import("./queue");
      const { getBuildQueue }   = await import("./build-queue");
      const [runQ, buildQ]      = await Promise.all([
        getQueue().getJobCounts("waiting", "active"),
        getBuildQueue().getJobCounts("waiting", "active"),
      ]);
      this._queueSnapshot = {
        runs:   { waiting: runQ.waiting ?? 0,   active: runQ.active ?? 0   },
        builds: { waiting: buildQ.waiting ?? 0, active: buildQ.active ?? 0 },
      };
    } catch { /* Redis not ready yet */ }
  }

  private async refreshActiveUsers(): Promise<void> {
    try {
      const { db, usageTable } = await import("@workspace/db");
      const { countDistinct }  = await import("drizzle-orm");
      const { gte }            = await import("drizzle-orm");
      const yesterday = new Date();
      yesterday.setUTCHours(yesterday.getUTCHours() - 24);
      const yStr = yesterday.toISOString().slice(0, 10);
      const [row] = await db
        .select({ count: countDistinct(usageTable.userKey) })
        .from(usageTable)
        .where(gte(usageTable.date, yStr));
      this._activeUsers24h = Number(row?.count ?? 0);
    } catch { /* DB unavailable */ }
  }

  // ─── Snapshot ──────────────────────────────────────────────────────────────

  getSnapshot(): MetricsSnapshot {
    this.checkDate();
    const r = this.state.runs;
    const b = this.state.builds;

    const avgDurationMs: Record<string, number> = {};
    for (const [lang, stat] of Object.entries(r.byLanguage)) {
      avgDurationMs[lang] = stat.count > 0 ? Math.round(stat.durationSum / stat.count) : 0;
    }

    return {
      generatedAt:   new Date().toISOString(),
      period:        this.state.date,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      runs: {
        ...r,
        errorRate:    r.total > 0 ? ((r.errors / r.total) * 100).toFixed(1) + "%" : "0%",
        avgDurationMs,
      },
      builds: {
        ...b,
        errorRate:    b.total > 0 ? ((b.errors / b.total) * 100).toFixed(1) + "%" : "0%",
        avgDurationMs: b.durationCount > 0 ? Math.round(b.durationSum / b.durationCount) : 0,
      },
      rateLimitHits:  this.state.rlHits,
      queues:         this._queueSnapshot,
      activeUsers24h: this._activeUsers24h,
    };
  }

  /** Call on server shutdown to flush pino file streams (no-op here, for symmetry) */
  shutdown(): void {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
  }
}

export const metrics = new Metrics();
