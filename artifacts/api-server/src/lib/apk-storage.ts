/**
 * APK file storage management.
 *
 * - Storage root: APK_STORAGE_PATH env var, or /tmp/apk_builds
 * - File naming: {buildId}-{timestamp}.apk
 * - Max 50 APKs on disk; oldest pruned automatically when limit is exceeded.
 */
import fsp from "fs/promises";
import fs  from "fs";
import path from "path";
import { logger } from "./logger";

const STORAGE_ROOT = process.env["APK_STORAGE_PATH"] ?? "/tmp/apk_builds";
const MAX_APKS     = 50;

/** Ensure storage directory exists (called once on startup) */
export async function ensureApkStorage(): Promise<void> {
  await fsp.mkdir(STORAGE_ROOT, { recursive: true });
  logger.info({ root: STORAGE_ROOT }, "apk storage ready");
}

/** Destination path for a new APK (does NOT copy the file) */
export function apkDestPath(buildId: string): string {
  return path.join(STORAGE_ROOT, `${buildId}-${Date.now()}.apk`);
}

/**
 * Copy the compiled APK to permanent storage and enforce the 50-file cap.
 * Returns the stored path and file size in bytes.
 */
export async function storeApk(srcPath: string, buildId: string): Promise<{ storedPath: string; sizeBytes: number }> {
  const dest = apkDestPath(buildId);
  await fsp.copyFile(srcPath, dest);

  const stat = await fsp.stat(dest);
  await pruneOldApks();

  return { storedPath: dest, sizeBytes: stat.size };
}

/** Delete oldest APKs when we're over the limit */
async function pruneOldApks(): Promise<void> {
  try {
    const files = await fsp.readdir(STORAGE_ROOT);
    const apks  = files.filter((f) => f.endsWith(".apk"));
    if (apks.length <= MAX_APKS) return;

    // Sort by mtime asc — oldest first
    const withMtimes = await Promise.all(
      apks.map(async (f) => {
        const st = await fsp.stat(path.join(STORAGE_ROOT, f)).catch(() => null);
        return { name: f, mtime: st?.mtimeMs ?? 0 };
      }),
    );
    withMtimes.sort((a, b) => a.mtime - b.mtime);

    const toDelete = withMtimes.slice(0, withMtimes.length - MAX_APKS);
    await Promise.all(
      toDelete.map((f) => fsp.rm(path.join(STORAGE_ROOT, f.name), { force: true }).catch(() => {})),
    );
    logger.info({ deleted: toDelete.length }, "apk storage pruned");
  } catch (err) {
    logger.warn({ err }, "apk prune failed");
  }
}

/** True if the APK file exists on disk */
export function apkExists(storedPath: string): boolean {
  return fs.existsSync(storedPath);
}

/**
 * Delete APK files older than `maxAgeDays` days.
 * Run on a schedule (every 6 hours) to prevent unbounded disk growth.
 * Returns the number of files deleted.
 */
export async function pruneStaleApks(maxAgeDays = 30): Promise<number> {
  const cutoffMs = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let deleted = 0;
  try {
    const files = await fsp.readdir(STORAGE_ROOT);
    const apks  = files.filter((f) => f.endsWith(".apk"));
    await Promise.all(
      apks.map(async (f) => {
        const fullPath = path.join(STORAGE_ROOT, f);
        const st = await fsp.stat(fullPath).catch(() => null);
        if (st && st.mtimeMs < cutoffMs) {
          await fsp.rm(fullPath, { force: true }).catch(() => {});
          deleted++;
        }
      }),
    );
    if (deleted > 0) logger.info({ deleted, maxAgeDays }, "apk stale-cleanup: removed old APKs");
  } catch (err) {
    logger.warn({ err }, "apk stale-cleanup failed");
  }
  return deleted;
}
