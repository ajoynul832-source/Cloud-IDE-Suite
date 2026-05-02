/**
 * Android SDK / Gradle pre-flight check.
 *
 * Called once on server startup. Sets ANDROID_DISABLED=1 in process.env if
 * Java, the Android SDK, or build-tools are not found.
 *
 * Android builds are OPTIONAL — unlike Flutter, missing Android SDK is logged
 * at INFO level, not ERROR. The system continues running normally.
 */
import { exec }    from "child_process";
import { promisify } from "util";
import fsp          from "fs/promises";
import path         from "path";
import { logger }   from "./logger";

const execAsync = promisify(exec);

let _sdkRoot: string | null = null;
let _javaBin: string | null = null;
let _gradleBin: string | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findJava(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("which java");
    const bin = stdout.trim();
    // Verify it actually runs
    await execAsync("java -version 2>&1 || true");
    return bin || "java";
  } catch {
    return null;
  }
}

async function findAndroidSdk(): Promise<string | null> {
  const candidates = [
    process.env["ANDROID_HOME"],
    process.env["ANDROID_SDK_ROOT"],
    "/opt/android-sdk",
    "/usr/local/android-sdk",
    `${process.env["HOME"] ?? ""}/Android/Sdk`,
    `${process.env["HOME"] ?? ""}/.android/sdk`,
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    try {
      await fsp.access(path.join(dir, "build-tools"));
      return dir;
    } catch { /* next */ }
  }
  return null;
}

async function findGradle(sdkRoot: string | null): Promise<string | null> {
  // Prefer system gradle
  try {
    const { stdout } = await execAsync("which gradle");
    const bin = stdout.trim();
    if (bin) return bin;
  } catch { /* not found */ }

  // Check common install paths
  const fallbacks = [
    "/usr/bin/gradle",
    "/usr/local/bin/gradle",
    "/opt/gradle/bin/gradle",
    sdkRoot ? path.join(sdkRoot, "tools/bin/sdkmanager") : null,
  ].filter(Boolean) as string[];

  for (const p of fallbacks) {
    try {
      await fsp.access(p);
      return p;
    } catch { /* next */ }
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function checkAndroid(): Promise<void> {
  const reasons: string[] = [];

  _javaBin    = await findJava();
  _sdkRoot    = await findAndroidSdk();
  _gradleBin  = await findGradle(_sdkRoot);

  if (!_javaBin)   reasons.push("java not found on PATH");
  if (!_sdkRoot)   reasons.push("ANDROID_HOME / ANDROID_SDK_ROOT not set or SDK not installed");

  if (reasons.length > 0) {
    logger.info({ reasons }, "Android SDK not available — android builds disabled (optional feature)");
    process.env["ANDROID_DISABLED"] = "1";
  } else {
    process.env["ANDROID_DISABLED"] = "0";
    // Set ANDROID_HOME so subprocesses (Gradle) can find the SDK
    process.env["ANDROID_HOME"]     = _sdkRoot!;
    process.env["ANDROID_SDK_ROOT"] = _sdkRoot!;
    logger.info(
      { sdkRoot: _sdkRoot, java: _javaBin, gradle: _gradleBin ?? "(use project gradlew)" },
      "Android SDK available — android builds enabled",
    );
  }
}

export function isAndroidAvailable(): boolean {
  return process.env["ANDROID_DISABLED"] !== "1";
}

/** Path to system gradle binary (may be null if only gradlew wrapper is available). */
export function gradleBin(): string | null {
  return _gradleBin;
}

/** Path to Android SDK root (set after checkAndroid()). */
export function androidSdkRoot(): string | null {
  return _sdkRoot ?? process.env["ANDROID_HOME"] ?? process.env["ANDROID_SDK_ROOT"] ?? null;
}
