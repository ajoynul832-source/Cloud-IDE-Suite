/**
 * Capacitor SDK pre-flight check.
 *
 * Capacitor wraps HTML/JS/TS web apps into native Android APKs.
 * Requires: Node.js, @capacitor/cli, Android SDK, Java 17
 *
 * Called once at startup. Sets CAPACITOR_DISABLED env var.
 */
import { exec }    from "child_process";
import { promisify } from "util";
import fs           from "fs";
import { logger }  from "./logger";

const execAsync = promisify(exec);

let _capacitorPath: string | null = null;
let _capacitorVersion: string | null = null;

const CAPACITOR_TEMPLATE_DIR = process.env["CAPACITOR_TEMPLATE_DIR"] ?? "/opt/capacitor-template";

export async function checkCapacitor(): Promise<void> {
  const reasons: string[] = [];

  // Check Node + npx
  try {
    await execAsync("node --version");
    await execAsync("npx --version");
  } catch {
    reasons.push("node/npx not found on PATH");
  }

  // Check @capacitor/cli
  try {
    const { stdout } = await execAsync("npx cap --version");
    _capacitorVersion = stdout.trim();
    _capacitorPath = "npx";
    logger.info({ version: _capacitorVersion }, "capacitor: CLI found");
  } catch {
    // Try global cap
    try {
      const { stdout: v } = await execAsync("cap --version");
      _capacitorVersion = v.trim();
      _capacitorPath = "cap";
      logger.info({ version: _capacitorVersion }, "capacitor: global CLI found");
    } catch {
      reasons.push("@capacitor/cli not found (install: npm i -g @capacitor/cli)");
    }
  }

  // Check Android SDK
  const androidHome = process.env["ANDROID_HOME"] ?? process.env["ANDROID_SDK_ROOT"];
  if (!androidHome || !fs.existsSync(androidHome)) {
    reasons.push("ANDROID_HOME / ANDROID_SDK_ROOT not set or SDK not installed");
  }

  // Check Java 17+
  try {
    const { stdout } = await execAsync("java -version 2>&1 || java --version");
    const ver = stdout.match(/version "?(\d+)/)?.[1] ?? "0";
    if (parseInt(ver, 10) < 17) {
      reasons.push(`Java ${ver} found — Java 17+ required`);
    }
  } catch {
    reasons.push("java not found on PATH");
  }

  if (reasons.length > 0) {
    logger.info({ reasons }, "Capacitor builds disabled (optional feature)");
    process.env["CAPACITOR_DISABLED"] = "1";
  } else {
    process.env["CAPACITOR_DISABLED"] = "0";
    logger.info({ version: _capacitorVersion, template: CAPACITOR_TEMPLATE_DIR }, "capacitor available — HTML/JS/TS → APK enabled");
  }
}

export function isCapacitorAvailable(): boolean {
  return process.env["CAPACITOR_DISABLED"] !== "1";
}

export function capacitorBin(): string {
  return _capacitorPath ?? "npx cap";
}

export function capacitorTemplateDir(): string {
  return CAPACITOR_TEMPLATE_DIR;
}
