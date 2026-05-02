/**
 * Flutter SDK pre-flight check.
 *
 * Called once on server startup. Sets FLUTTER_DISABLED=1 in process.env if
 * the `flutter` binary is not found. All build routes check isFlutterAvailable()
 * before proceeding and return 503 if the SDK is missing.
 */
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "./logger";

const execAsync = promisify(exec);

let _flutterPath: string | null = null;

export async function checkFlutter(): Promise<void> {
  try {
    const { stdout: whichOut } = await execAsync("which flutter");
    _flutterPath = whichOut.trim();

    const { stdout: versionOut } = await execAsync("flutter --version --no-version-check");
    const firstLine = versionOut.split("\n")[0] ?? "";
    logger.info({ path: _flutterPath, version: firstLine }, "flutter available");
    process.env["FLUTTER_DISABLED"] = "0";
  } catch {
    logger.error(
      "CRITICAL: flutter binary not found on PATH — all APK build endpoints will return 503. " +
      "Install Flutter SDK and ensure it is on PATH to enable APK builds.",
    );
    process.env["FLUTTER_DISABLED"] = "1";
    _flutterPath = null;
  }
}

export function isFlutterAvailable(): boolean {
  return process.env["FLUTTER_DISABLED"] !== "1";
}

export function flutterBin(): string {
  return _flutterPath ?? "flutter";
}
