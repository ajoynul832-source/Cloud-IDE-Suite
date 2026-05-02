/**
 * Phase 5: Build Resilience — error classification + structured build logging.
 *
 * classifyError():  maps raw errors to retriable / permanent / system
 * logBuildError():  appends a structured JSON line to logs/builds.log
 */
import fsp  from "fs/promises";
import path from "path";
import { logger } from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorType = "retriable" | "permanent" | "system";

export interface ClassifiedError {
  errorType:   ErrorType;
  userMessage: string;
}

export interface BuildErrorRecord {
  ts:           string;
  buildId:      string;
  userId?:      string | null;
  language:     string;
  errorType:    ErrorType;
  errorMessage: string;
  attempt:      number;
  maxAttempts:  number;
}

// ─── Error pattern tables ─────────────────────────────────────────────────────

const SYSTEM_PATTERNS: RegExp[] = [
  /no space left/i,
  /ENOSPC/i,
  /out of memory/i,
  /cannot allocate memory/i,
  /killed.*out of memory/i,
];

const PERMANENT_PATTERNS: RegExp[] = [
  /Invalid Flutter project/i,
  /Invalid Android project/i,
  /pubspec\.yaml.*not found/i,
  /lib\/main\.dart.*not found/i,
  /root build\.gradle.*not found/i,
  /settings\.gradle.*not found/i,
  /app\/.*not found/i,
  /flutter.*not found/i,
  /android sdk.*not/i,
  /ANDROID_HOME.*not set/i,
  /gradle.*not found.*system/i,
  /ZIP file missing/i,
  /Build succeeded but APK.*not found/i,
];

const RETRIABLE_PATTERNS: RegExp[] = [
  /timeout/i,
  /timed out/i,
  /ETIMEDOUT/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /pub get.*fail/i,
  /unable to resolve/i,
  /network.*error/i,
  /resource temporarily unavailable/i,
  /connection reset/i,
  /socket hang up/i,
];

// ─── Classifier ───────────────────────────────────────────────────────────────

export function classifyError(err: unknown): ClassifiedError {
  const raw = err instanceof Error ? err.message : String(err);

  if (SYSTEM_PATTERNS.some((p) => p.test(raw))) {
    return { errorType: "system", userMessage: "Server ran out of resources. Please try again later or contact support." };
  }

  if (PERMANENT_PATTERNS.some((p) => p.test(raw))) {
    return { errorType: "permanent", userMessage: toUserMessage(raw) };
  }

  if (RETRIABLE_PATTERNS.some((p) => p.test(raw))) {
    return { errorType: "retriable", userMessage: toUserMessage(raw) };
  }

  // Gradle/command failures that are usually transient environment issues
  if (/exited with code [1-9]/.test(raw)) {
    return { errorType: "retriable", userMessage: toUserMessage(raw) };
  }

  // Unknown → permanent so we don't spin forever
  return { errorType: "permanent", userMessage: toUserMessage(raw) };
}

function toUserMessage(raw: string): string {
  if (/pubspec\.yaml.*not found/i.test(raw))    return "Invalid project: pubspec.yaml not found. Make sure your ZIP contains a Flutter project.";
  if (/lib\/main\.dart.*not found/i.test(raw))  return "Invalid project: lib/main.dart not found. Make sure your ZIP contains a Flutter project.";
  if (/Invalid Flutter project/i.test(raw))     return raw.slice(0, 120);
  if (/Invalid Android project/i.test(raw))     return raw.slice(0, 120);
  if (/timeout|timed out/i.test(raw))           return "Build timed out — the server may be under load. Retrying...";
  if (/network|ECONNRESET|ETIMEDOUT/i.test(raw)) return "Network error during dependency fetch — retrying...";
  if (/pub get.*fail/i.test(raw))               return "flutter pub get failed — retrying...";
  if (/no space left|ENOSPC/i.test(raw))        return "Server disk full. Please contact support.";
  if (/out of memory/i.test(raw))               return "Server out of memory. Please contact support.";
  if (/ZIP file missing/i.test(raw))            return "Project archive was lost. Please re-upload.";
  // Strip internal paths, truncate
  return raw.replace(/\/tmp\/[^\s]*/g, "[build-dir]").slice(0, 200);
}

// ─── File logger (logs/builds.log) ───────────────────────────────────────────

const LOG_DIR  = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "builds.log");

let _logDirReady = false;

async function ensureLogDir(): Promise<void> {
  if (_logDirReady) return;
  await fsp.mkdir(LOG_DIR, { recursive: true }).catch(() => {});
  _logDirReady = true;
}

export async function logBuildError(record: BuildErrorRecord): Promise<void> {
  try {
    await ensureLogDir();
    const line = JSON.stringify(record) + "\n";
    await fsp.appendFile(LOG_FILE, line, "utf8");
  } catch (err) {
    logger.warn({ err }, "build-resilience: could not write to builds.log");
  }
  logger.error(
    { buildId: record.buildId, errorType: record.errorType, attempt: record.attempt },
    `build error [${record.errorType}]: ${record.errorMessage}`,
  );
}

/** Read recent build error log lines (for admin endpoint) */
export async function readBuildErrors(limit = 200): Promise<BuildErrorRecord[]> {
  try {
    await ensureLogDir();
    const text = await fsp.readFile(LOG_FILE, "utf8").catch(() => "");
    const lines = text.trim().split("\n").filter(Boolean);
    const recent = lines.slice(-limit);
    return recent.map((l) => {
      try { return JSON.parse(l) as BuildErrorRecord; }
      catch { return null; }
    }).filter((x): x is BuildErrorRecord => x !== null).reverse();
  } catch {
    return [];
  }
}
