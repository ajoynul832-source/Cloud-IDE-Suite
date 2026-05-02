/**
 * BullMQ job processor for Android APK builds (Gradle/Kotlin/Java).
 *
 * Stages:
 *   extracting → configuring → assembling → packaging
 *
 * Phase 5 — Resilience:
 *   - attempts: 2 (configured on queue)
 *   - Retriable errors (timeout, network, gradle transient) → throw → BullMQ retries
 *   - Permanent errors (missing SDK, bad project) → throw UnrecoverableError → no retry
 */
import type { Job } from "bullmq";
import { UnrecoverableError } from "bullmq";
import fsp  from "fs/promises";
import fs   from "fs";
import path from "path";
import os   from "os";
import { exec } from "child_process";
import unzipper from "unzipper";
import { db, buildsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { storeApk }       from "../lib/apk-storage";
import { gradleBin, androidSdkRoot } from "../lib/android";
import { logger }         from "../lib/logger";
import { classifyError, logBuildError } from "../lib/build-resilience";

export interface AndroidJobData {
  buildId:  string;
  zipPath?: string;
  files?:   Record<string, string>;
  language: string;
  userId?:  string | null;
}

const BUILD_TIMEOUT_MS = 10 * 60 * 1000;
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
    const proc = exec(cmd, { cwd, timeout: BUILD_TIMEOUT_MS, env: { ...process.env, ...env } });
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

async function findApk(projectRoot: string): Promise<string | null> {
  const candidates = [
    path.join(projectRoot, "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    path.join(projectRoot, "app", "build", "outputs", "apk", "app-debug.apk"),
    path.join(projectRoot, "build",         "outputs", "apk", "debug", "app-debug.apk"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  async function search(dir: string, depth: number): Promise<string | null> {
    if (depth > 5) return null;
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.endsWith(".apk") && e.isFile()) return path.join(dir, e.name);
        if (e.isDirectory()) {
          const found = await search(path.join(dir, e.name), depth + 1);
          if (found) return found;
        }
      }
    } catch { /* skip */ }
    return null;
  }

  return search(path.join(projectRoot, "app", "build"), 0);
}

// ─── Main processor ───────────────────────────────────────────────────────────

export async function androidJobProcessor(job: Job<AndroidJobData>): Promise<void> {
  const { buildId, language, userId } = job.data;
  let zipPath  = job.data.zipPath;
  const tmpDir = os.tmpdir();

  const attemptNumber = job.attemptsMade;
  const isRetry = attemptNumber > 1;

  logger.info({ jobId: job.id, buildId, language, attempt: attemptNumber }, "android build worker: starting");

  if (isRetry) {
    await appendLog(buildId, `\n[${ts()}] ── Retry attempt ${attemptNumber} of ${MAX_ATTEMPTS} ──`);
    await db.update(buildsTable)
      .set({ status: "building", retryCount: attemptNumber - 1 })
      .where(eq(buildsTable.id, buildId));
  } else {
    await appendLog(buildId, `[${ts()}] Android build started — language: ${language}`);
  }

  const sdkDir = androidSdkRoot();
  if (!sdkDir) {
    await markFailed(buildId, "Android SDK not configured (ANDROID_HOME not set)", "permanent", attemptNumber - 1);
    throw new UnrecoverableError("Android SDK not configured — cannot retry");
  }

  const buildEnv = {
    ANDROID_HOME:     sdkDir,
    ANDROID_SDK_ROOT: sdkDir,
    JAVA_HOME: process.env["JAVA_HOME"] ?? "",
  };

  if (!zipPath && job.data.files) {
    const generatedZip = path.join(tmpDir, `android_build_${buildId}.zip`);
    await appendLog(buildId, `[${ts()}] Packaging project files...`);
    await writeProjectZip(job.data.files, generatedZip);
    zipPath = generatedZip;
  }

  if (!zipPath || !fs.existsSync(zipPath)) {
    await markFailed(buildId, "ZIP file missing or could not be created", "permanent", attemptNumber - 1);
    throw new UnrecoverableError("ZIP file missing — cannot retry");
  }

  const projectDir = path.join(tmpDir, `android_project_${buildId}`);

  try {
    // ── extracting ───────────────────────────────────────────────────────────
    await setStage(buildId, "extracting");
    await appendLog(buildId, `[${ts()}] Extracting project archive...`);
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(zipPath!)
        .pipe(unzipper.Extract({ path: projectDir }))
        .on("close", resolve)
        .on("error", reject);
    });
    await appendLog(buildId, `[${ts()}] Extraction complete`);

    let buildRoot = projectDir;
    const entries = await fsp.readdir(projectDir);
    if (entries.length === 1) {
      const sub = path.join(projectDir, entries[0]!);
      if ((await fsp.stat(sub)).isDirectory()) buildRoot = sub;
    }

    // Validate Android project structure
    const hasRootGradle     = fs.existsSync(path.join(buildRoot, "build.gradle")) || fs.existsSync(path.join(buildRoot, "build.gradle.kts"));
    const hasSettingsGradle = fs.existsSync(path.join(buildRoot, "settings.gradle")) || fs.existsSync(path.join(buildRoot, "settings.gradle.kts"));
    const hasAppDir         = fs.existsSync(path.join(buildRoot, "app"));

    if (!hasRootGradle)     throw new Error("Invalid Android project: root build.gradle not found");
    if (!hasSettingsGradle) throw new Error("Invalid Android project: settings.gradle not found");
    if (!hasAppDir)         throw new Error("Invalid Android project: app/ directory not found");
    await appendLog(buildId, `[${ts()}] Project structure valid`);

    // ── configuring ──────────────────────────────────────────────────────────
    await setStage(buildId, "configuring");
    await appendLog(buildId, `[${ts()}] Writing local.properties...`);
    await fsp.writeFile(path.join(buildRoot, "local.properties"), `sdk.dir=${sdkDir}\n`);

    const gradlewPath = path.join(buildRoot, "gradlew");
    const hasGradlew  = fs.existsSync(gradlewPath);
    let gradleCmd: string;

    if (hasGradlew) {
      await fsp.chmod(gradlewPath, 0o755);
      await appendLog(buildId, `[${ts()}] Using project Gradle wrapper`);
      gradleCmd = "./gradlew";
    } else if (gradleBin()) {
      await appendLog(buildId, `[${ts()}] Using system Gradle: ${gradleBin()}`);
      gradleCmd = gradleBin()!;
    } else {
      throw new Error(
        "Gradle not found: project has no gradlew and system gradle is not installed. " +
        "Add a Gradle wrapper (gradlew + gradle/wrapper/gradle-wrapper.properties) to your project.",
      );
    }
    await appendLog(buildId, `[${ts()}] Configuration complete`);

    // ── assembling ───────────────────────────────────────────────────────────
    await setStage(buildId, "assembling");
    await appendLog(buildId, `[${ts()}] Running ${gradleCmd} assembleDebug --no-daemon...`);
    await appendLog(buildId, `[${ts()}] (This may take several minutes — Gradle downloads dependencies on first run)`);
    await runCommand(`${gradleCmd} assembleDebug --no-daemon --stacktrace`, buildRoot, buildId, buildEnv);

    // ── packaging ────────────────────────────────────────────────────────────
    await setStage(buildId, "packaging");
    await appendLog(buildId, `[${ts()}] Locating APK...`);
    const apkSrc = await findApk(buildRoot);
    if (!apkSrc) throw new Error("Build succeeded but APK not found. Check Gradle output for build path.");

    await appendLog(buildId, `[${ts()}] Found APK: ${path.relative(buildRoot, apkSrc)}`);
    const { storedPath, sizeBytes } = await storeApk(apkSrc, buildId);
    await markComplete(buildId, storedPath, sizeBytes);
    await appendLog(buildId, `[${ts()}] Build SUCCESS — APK ready (${Math.round(sizeBytes / 1024)} KB)`);

    logger.info({ buildId, storedPath, sizeBytes }, "android build worker: complete");

  } catch (err) {
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
      throw new UnrecoverableError(userMessage);
    }

    if (!isLastAttempt) {
      await appendLog(buildId, `[${ts()}] Build failed — retrying (attempt ${attemptNumber + 1} of ${MAX_ATTEMPTS}): ${userMessage}`);
      await markWillRetry(buildId, `${userMessage} — retrying...`, errorType, attemptNumber);
      throw err instanceof Error ? err : new Error(userMessage);
    }

    await appendLog(buildId, `[${ts()}] Build FAILED after ${MAX_ATTEMPTS} attempts: ${userMessage}`);
    await markFailed(buildId, userMessage, errorType, attemptNumber - 1);
    throw err instanceof Error ? err : new Error(userMessage);

  } finally {
    fsp.rm(zipPath ?? "", { force: true }).catch(() => {});
    fsp.rm(projectDir, { recursive: true, force: true }).catch(() => {});
  }
}
