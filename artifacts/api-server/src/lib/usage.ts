/**
 * Daily usage accounting — persisted in Postgres.
 * Key priority: authenticated userId > X-User-Key header > IP fallback
 */
import { and, eq, sql } from "drizzle-orm";
import { db, usageTable } from "@workspace/db";
import { logger } from "./logger";

export const DAILY_RUN_LIMIT   = 50;
export const DAILY_BUILD_LIMIT = 3;

/** YYYY-MM-DD in UTC */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Derive a stable usage key.
 * Priority: authenticated userId → X-User-Key header → IP.
 */
export function resolveUsageKey(
  userId:    string | undefined,
  rawHeader: string | string[] | undefined,
  ip:        string | undefined,
): string {
  if (userId) return `user:${userId}`;
  const key = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader ?? "";
  if (key.length >= 8 && /^[a-f0-9-]{8,64}$/i.test(key)) return key.toLowerCase();
  return `ip:${(ip ?? "unknown").slice(0, 45)}`;
}

async function ensureRow(userKey: string, date: string): Promise<{ runsCount: number; buildsCount: number }> {
  await db
    .insert(usageTable)
    .values({ userKey, date, runsCount: 0, buildsCount: 0 })
    .onConflictDoNothing();

  const [row] = await db
    .select({ runsCount: usageTable.runsCount, buildsCount: usageTable.buildsCount })
    .from(usageTable)
    .where(and(eq(usageTable.userKey, userKey), eq(usageTable.date, date)));

  return row ?? { runsCount: 0, buildsCount: 0 };
}

export interface UsageResult {
  allowed:   boolean;
  remaining: number;
}

export async function checkAndIncrementRuns(userKey: string): Promise<UsageResult> {
  const date = todayUTC();
  try {
    const row = await ensureRow(userKey, date);
    if (row.runsCount >= DAILY_RUN_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
    await db
      .update(usageTable)
      .set({ runsCount: sql`${usageTable.runsCount} + 1` })
      .where(and(eq(usageTable.userKey, userKey), eq(usageTable.date, date)));
    return { allowed: true, remaining: DAILY_RUN_LIMIT - row.runsCount - 1 };
  } catch (err) {
    logger.error({ err, userKey }, "usage increment (runs) failed — allowing request");
    return { allowed: true, remaining: -1 };
  }
}

export async function checkAndIncrementBuilds(userKey: string): Promise<UsageResult> {
  const date = todayUTC();
  try {
    const row = await ensureRow(userKey, date);
    if (row.buildsCount >= DAILY_BUILD_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
    await db
      .update(usageTable)
      .set({ buildsCount: sql`${usageTable.buildsCount} + 1` })
      .where(and(eq(usageTable.userKey, userKey), eq(usageTable.date, date)));
    return { allowed: true, remaining: DAILY_BUILD_LIMIT - row.buildsCount - 1 };
  } catch (err) {
    logger.error({ err, userKey }, "usage increment (builds) failed — allowing request");
    return { allowed: true, remaining: -1 };
  }
}

export async function getUsage(userKey: string): Promise<{
  runsToday:       number;
  buildsToday:     number;
  runsRemaining:   number;
  buildsRemaining: number;
}> {
  const date = todayUTC();
  try {
    const [row] = await db
      .select({ runsCount: usageTable.runsCount, buildsCount: usageTable.buildsCount })
      .from(usageTable)
      .where(and(eq(usageTable.userKey, userKey), eq(usageTable.date, date)));

    const runsToday   = row?.runsCount   ?? 0;
    const buildsToday = row?.buildsCount ?? 0;
    return {
      runsToday,
      buildsToday,
      runsRemaining:   Math.max(0, DAILY_RUN_LIMIT   - runsToday),
      buildsRemaining: Math.max(0, DAILY_BUILD_LIMIT - buildsToday),
    };
  } catch {
    return { runsToday: 0, buildsToday: 0, runsRemaining: DAILY_RUN_LIMIT, buildsRemaining: DAILY_BUILD_LIMIT };
  }
}
