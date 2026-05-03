/**
 * BullMQ job processor — Capacitor APK build (HTML/JS/TS → Android APK).
 *
 * Capacitor wraps a web app into a native Android shell.
 * The workflow:
 *   1. extracting    — unzip project files
 *   2. scaffolding   — create Capacitor Android project from template
 *   3. copying-web   — inject user's web files into www/
 *   4. cap-sync      — run `npx cap sync android` to copy web → native
 *   5. assembling    — run Gradle assembleDebug
 *   6. packaging     — move APK to persistent storage
 *
 * Requires on the build server:
 *   - Node.js + @capacitor/cli
 *   - Android SDK (ANDROID_HOME) + Java 17+
 *   - Gradle (or gradlew from the Capacitor template)
 *
 * Performance note:
 *   Pre-seeding /opt/capacitor-template with a ready-built Capacitor Android project
 *   avoids ~5 min of `npm install`. The worker copies the template and replaces www/.
 */
import type { Job }     from "bullmq";
import { UnrecoverableError } from "bullmq";
import fsp              from "fs/promises";
import fs               from "fs";
import path             from "path";
import os               from "os";
import { exec }         from "child_process";
import unzipper         from "unzipper";
import { db, buildsTable }         from "@workspace/db";
import { eq, sql }                 from "drizzle-orm";
import { storeApk }                from "../lib/apk-storage";
import { capacitorBin, capacitorTemplateDir } from "../lib/capacitor";
import { logger }                  from "../lib/logger";
import { metrics }                 from "../lib/metrics";
import { classifyError, logBuildError } from "../lib/build-resilience";

export interface CapacitorJobData {
  buildId:  string;
  zipPath?: string;
  files?:   Record<string, string>;
  language: string;
  userId?:  string | null;
  appName?: string;
  appId?:   string;
}

const BUILD_TIMEOUT_MS = 12 * 60 * 1000;
const MAX_ATTEMPTS     = 2;

// ─── DB helpers ───────────────────────────────────────────────────────────────

function ts(): string { return new Date().toISOString(); }

async function setStage(buildId: string, stage: string) {
  await db.update(buildsTable)
    .set({ stage, status: "building" })
    .where(eq(buildsTable.id, buildId));
}

async function appendLog(buildId: string, text: string) {
  const line = text.endsWith("\n") ? text : text + "\n";
  await db.update(buildsTable)
    .set({ logText: sql`${buildsTable.logText} || ${line}` })
    .where(eq(buildsTable.id, buildId));
}

async function markComplete(buildId: string, apkPath: string, apkSize: number) {
  await db.update(buildsTable)
    .set({ status: "complete", stage: null, apkPath, apkSize, completedAt: new Date() })
    .where(eq(buildsTable.id, buildId));
}

async function markFailed(buildId: string, errorMessage: string, errorType: string, retryCount: number) {
  await db.update(buildsTable)
    .set({ status: "failed", stage: null, errorMessage, errorType, retryCount, lastErrorAt: new Date(), completedAt: new Date() })
    .where(eq(buildsTable.id, buildId));
}

async function markWillRetry(buildId: string, errorMessage: string, errorType: string, attempt: number) {
  await db.update(buildsTable)
    .set({ status: "failed-will-retry", stage: null, errorMessage, errorType, retryCount: attempt - 1, lastErrorAt: new Date() })
    .where(eq(buildsTable.id, buildId));
}

// ─── Command runner ───────────────────────────────────────────────────────────

function runCommand(cmd: string, cwd: string, buildId: string, env?: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, {
      cwd,
      timeout: BUILD_TIMEOUT_MS,
      env: { ...process.env, ...env },
    });
    proc.stdout?.on("data", (d: string) => appendLog(buildId, d.trimEnd()).catch(() => {}));
    proc.stderr?.on("data", (d: string) => appendLog(buildId, d.trimEnd()).catch(() => {}));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command "${cmd.split(" ")[0]}" exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

// ─── ZIP packaging ────────────────────────────────────────────────────────────

async function writeProjectZip(files: Record<string, string>, zipPath: string): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const [filePath, content] of Object.entries(files)) {
    zip.file(filePath.replace(/^\//, ""), content);
  }
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  await fsp.writeFile(zipPath, buf);
}

// ─── APK finder ───────────────────────────────────────────────────────────────

async function findApk(root: string): Promise<string | null> {
  const candidates = [
    path.join(root, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    path.join(root, "android", "app", "build", "outputs", "apk", "app-debug.apk"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  async function search(dir: string, depth: number): Promise<string | null> {
    if (depth > 6) return null;
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.endsWith(".apk") && e.isFile()) return path.join(dir, e.name);
        if (e.isDirectory() && !e.name.startsWith(".")) {
          const found = await search(path.join(dir, e.name), depth + 1);
          if (found) return found;
        }
      }
    } catch { /* skip */ }
    return null;
  }
  return search(root, 0);
}

// ─── Capacitor config ─────────────────────────────────────────────────────────

function makeCapacitorConfig(appName: string, appId: string): string {
  return JSON.stringify({
    appId,
    appName,
    webDir: "www",
    server: { androidScheme: "https" },
    android: { minWebViewVersion: 60 },
  }, null, 2);
}

function makePackageJson(appName: string, appId: string): string {
  return JSON.stringify({
    name: appId,
    version: "1.0.0",
    description: `${appName} — built with CloudIDE`,
    scripts: { build: "echo 'static web app'" },
    dependencies: {
      "@capacitor/android": "^6.0.0",
      "@capacitor/core": "^6.0.0",
    },
    devDependencies: {
      "@capacitor/cli": "^6.0.0",
    },
  }, null, 2);
}

// ─── Main processor ───────────────────────────────────────────────────────────

export async function capacitorJobProcessor(job: Job<CapacitorJobData>): Promise<void> {
  const { buildId, language, userId } = job.data;
  const appName = job.data.appName ?? "CloudIDE App";
  const appId   = job.data.appId   ?? "com.cloudide.app";
  let zipPath   = job.data.zipPath;
  const tmpDir  = os.tmpdir();

  const attemptNumber = job.attemptsMade;
  const isRetry       = attemptNumber > 1;
  const buildStart    = Date.now();

  logger.info({ jobId: job.id, buildId, language, userId, attempt: attemptNumber },
    isRetry ? "capacitor build worker: retry attempt" : "capacitor build worker: starting");

  if (isRetry) {
    metrics.recordBuildRetry();
    await appendLog(buildId, `\n[${ts()}] ── Retry attempt ${attemptNumber} of ${MAX_ATTEMPTS} ──`);
    await db.update(buildsTable)
      .set({ status: "building", retryCount: attemptNumber - 1 })
      .where(eq(buildsTable.id, buildId));
  } else {
    await appendLog(buildId, `[${ts()}] Capacitor build started — ${language} → Android APK`);
  }

  // Validate Android SDK
  const androidHome = process.env["ANDROID_HOME"] ?? process.env["ANDROID_SDK_ROOT"];
  if (!androidHome) {
    await markFailed(buildId, "Android SDK not configured (ANDROID_HOME not set)", "permanent", attemptNumber - 1);
    throw new UnrecoverableError("Android SDK not configured");
  }

  const buildEnv = {
    ANDROID_HOME:     androidHome,
    ANDROID_SDK_ROOT: androidHome,
    JAVA_HOME: process.env["JAVA_HOME"] ?? "",
  };

  if (!zipPath && job.data.files) {
    const generatedZip = path.join(tmpDir, `cap_build_${buildId}.zip`);
    await appendLog(buildId, `[${ts()}] Packaging ${Object.keys(job.data.files).length} project files...`);
    await writeProjectZip(job.data.files, generatedZip);
    zipPath = generatedZip;
  }

  if (!zipPath || !fs.existsSync(zipPath)) {
    await markFailed(buildId, "ZIP file missing or could not be created", "permanent", attemptNumber - 1);
    throw new UnrecoverableError("ZIP file missing — cannot retry");
  }

  const projectDir = path.join(tmpDir, `cap_project_${buildId}`);
  await fsp.mkdir(projectDir, { recursive: true });

  try {
    // ── extracting ───────────────────────────────────────────────────────────
    await setStage(buildId, "extracting");
    await appendLog(buildId, `[${ts()}] Extracting web project files...`);

    const webSourceDir = path.join(projectDir, "_web_src");
    await fsp.mkdir(webSourceDir, { recursive: true });
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(zipPath!)
        .pipe(unzipper.Extract({ path: webSourceDir }))
        .on("close", resolve)
        .on("error", reject);
    });

    // Flatten single-directory zip extractions
    const srcEntries = await fsp.readdir(webSourceDir);
    let webRoot = webSourceDir;
    if (srcEntries.length === 1) {
      const sub = path.join(webSourceDir, srcEntries[0]!);
      if ((await fsp.stat(sub)).isDirectory()) webRoot = sub;
    }
    await appendLog(buildId, `[${ts()}] Web files extracted (${srcEntries.length > 1 ? srcEntries.length : "~"} entries)`);

    // ── scaffolding ──────────────────────────────────────────────────────────
    await setStage(buildId, "scaffolding");
    await appendLog(buildId, `[${ts()}] Setting up Capacitor Android project...`);

    const templateDir = capacitorTemplateDir();
    const hasTemplate = fs.existsSync(templateDir) && fs.existsSync(path.join(templateDir, "android"));

    const capRoot = path.join(projectDir, "cap_app");
    await fsp.mkdir(capRoot, { recursive: true });

    if (hasTemplate) {
      // Fast path: copy pre-built template (avoid npm install + cap add android)
      await appendLog(buildId, `[${ts()}] Copying pre-built Capacitor template (fast path)...`);
      await runCommand(`cp -r ${templateDir}/. ${capRoot}/`, os.tmpdir(), buildId);
    } else {
      // Slow path: scaffold from scratch using npm + Capacitor CLI
      await appendLog(buildId, `[${ts()}] Template not found — scaffolding from scratch (~3-5 min)...`);

      // Write package.json
      await fsp.writeFile(path.join(capRoot, "package.json"), makePackageJson(appName, appId));
      await fsp.mkdir(path.join(capRoot, "www"), { recursive: true });
      await fsp.writeFile(path.join(capRoot, "www", "index.html"), "<html><body>Loading...</body></html>");
      await fsp.writeFile(path.join(capRoot, "capacitor.config.json"), makeCapacitorConfig(appName, appId));

      // Install Capacitor packages
      await appendLog(buildId, `[${ts()}] Installing Capacitor packages (this takes ~3-5 min)...`);
      await runCommand("npm install --prefer-offline", capRoot, buildId, buildEnv);

      // Add Android platform
      await appendLog(buildId, `[${ts()}] Adding Android platform...`);
      await runCommand(`${capacitorBin()} add android`, capRoot, buildId, buildEnv);
    }

    // ── copying-web ───────────────────────────────────────────────────────────
    await setStage(buildId, "copying-web");
    await appendLog(buildId, `[${ts()}] Copying web files into Capacitor www/...`);

    const wwwDir = path.join(capRoot, "www");
    await fsp.rm(wwwDir, { recursive: true, force: true });
    await fsp.mkdir(wwwDir, { recursive: true });

    // Copy user's web files
    async function copyDir(src: string, dest: string): Promise<number> {
      const entries = await fsp.readdir(src, { withFileTypes: true });
      let count = 0;
      for (const entry of entries) {
        const srcPath  = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          await fsp.mkdir(destPath, { recursive: true });
          count += await copyDir(srcPath, destPath);
        } else {
          await fsp.copyFile(srcPath, destPath);
          count++;
        }
      }
      return count;
    }

    const copiedCount = await copyDir(webRoot, wwwDir);
    await appendLog(buildId, `[${ts()}] Copied ${copiedCount} web file(s) to www/`);

    // Ensure there's an index.html
    if (!fs.existsSync(path.join(wwwDir, "index.html"))) {
      // Try to find the main HTML file
      const htmlFiles = (await fsp.readdir(wwwDir)).filter(f => f.endsWith(".html"));
      if (htmlFiles.length > 0) {
        await fsp.copyFile(path.join(wwwDir, htmlFiles[0]!), path.join(wwwDir, "index.html"));
        await appendLog(buildId, `[${ts()}] Using ${htmlFiles[0]} as index.html`);
      } else {
        throw new Error("No index.html found in your project. HTML/JS/TS projects need an index.html entry point.");
      }
    }

    // Update capacitor.config.json with app name
    await fsp.writeFile(path.join(capRoot, "capacitor.config.json"), makeCapacitorConfig(appName, appId));

    // ── cap-sync ─────────────────────────────────────────────────────────────
    await setStage(buildId, "cap-sync");
    await appendLog(buildId, `[${ts()}] Running capacitor sync android (injecting web files into native shell)...`);
    await runCommand(`${capacitorBin()} sync android`, capRoot, buildId, buildEnv);

    // ── assembling ───────────────────────────────────────────────────────────
    await setStage(buildId, "assembling");
    await appendLog(buildId, `[${ts()}] Running Gradle assembleDebug...`);

    const androidDir  = path.join(capRoot, "android");
    const gradlewPath = path.join(androidDir, "gradlew");
    if (fs.existsSync(gradlewPath)) {
      await fsp.chmod(gradlewPath, 0o755);
    }
    const gradleCmd = fs.existsSync(gradlewPath) ? "./gradlew" : "gradle";
    await appendLog(buildId, `[${ts()}] Using: ${gradleCmd} (may take 3-8 min for first build)`);
    await runCommand(`${gradleCmd} assembleDebug --no-daemon`, androidDir, buildId, buildEnv);

    // ── packaging ────────────────────────────────────────────────────────────
    await setStage(buildId, "packaging");
    await appendLog(buildId, `[${ts()}] Locating APK...`);

    const apkSrc = await findApk(capRoot);
    if (!apkSrc) throw new Error("Build succeeded but APK not found. Check Gradle output above.");

    const { storedPath, sizeBytes } = await storeApk(apkSrc, buildId);
    await markComplete(buildId, storedPath, sizeBytes);
    const durationMs = Date.now() - buildStart;
    await appendLog(buildId, `[${ts()}] ✓ Build SUCCESS — APK ready (${Math.round(sizeBytes / 1024)} KB, ${Math.round(durationMs / 1000)}s)`);
    await appendLog(buildId, `[${ts()}] Your web app is now a native Android APK!`);

    metrics.recordBuild({ language, durationMs, success: true });
    logger.info({ buildId, language, userId, durationMs, sizeBytes }, "capacitor build worker: complete");

  } catch (err) {
    const durationMs  = Date.now() - buildStart;
    const { errorType, userMessage } = classifyError(err);
    const isLastAttempt = attemptNumber >= MAX_ATTEMPTS;

    await logBuildError({
      ts: new Date().toISOString(),
      buildId, userId: userId ?? null, language,
      errorType, errorMessage: userMessage,
      attempt: attemptNumber, maxAttempts: MAX_ATTEMPTS,
    });

    if (errorType === "permanent" || errorType === "system") {
      await appendLog(buildId, `[${ts()}] Build FAILED (${errorType}): ${userMessage}`);
      await markFailed(buildId, userMessage, errorType, attemptNumber - 1);
      metrics.recordBuild({ language, durationMs, success: false });
      throw new UnrecoverableError(userMessage);
    }

    if (!isLastAttempt) {
      await appendLog(buildId, `[${ts()}] Build failed — retrying (attempt ${attemptNumber + 1} of ${MAX_ATTEMPTS}): ${userMessage}`);
      await markWillRetry(buildId, `${userMessage} — retrying...`, errorType, attemptNumber);
      throw err instanceof Error ? err : new Error(userMessage);
    }

    await appendLog(buildId, `[${ts()}] Build FAILED after ${MAX_ATTEMPTS} attempts: ${userMessage}`);
    await markFailed(buildId, userMessage, errorType, attemptNumber - 1);
    metrics.recordBuild({ language, durationMs, success: false });
    throw err instanceof Error ? err : new Error(userMessage);

  } finally {
    fsp.rm(zipPath ?? "", { force: true }).catch(() => {});
    fsp.rm(projectDir, { recursive: true, force: true }).catch(() => {});
  }
}
