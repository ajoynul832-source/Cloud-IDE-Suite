/**
 * BullMQ job processor for Android APK builds (Gradle/Kotlin/Java).
 *
 * Stages:
 *   extracting → configuring → assembling → packaging
 *
 * Requires:
 *  - ANDROID_HOME set to a valid Android SDK
 *  - java on PATH
 *  - Either ./gradlew (in project) or system gradle binary
 *
 * The processor is only registered when isAndroidAvailable() returns true.
 * All log output is appended to builds.log_text via DB UPDATE (same as Flutter).
 */
import type { Job } from "bullmq";
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
import { logger } from "../lib/logger";

export interface AndroidJobData {
  buildId:  string;
  zipPath?: string;
  files?:   Record<string, string>;
  language: string;
}

const BUILD_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// ─── DB helpers (identical to buildJob.ts) ────────────────────────────────────

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

async function markFailed(buildId: string, errorMessage: string) {
  await db.update(buildsTable)
    .set({ status: "failed", stage: null, errorMessage, completedAt: new Date() })
    .where(eq(buildsTable.id, buildId));
}

// ─── Command runner ───────────────────────────────────────────────────────────

function runCommand(
  cmd: string,
  cwd: string,
  buildId: string,
  env?: NodeJS.ProcessEnv,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, {
      cwd,
      timeout: BUILD_TIMEOUT_MS,
      env: { ...process.env, ...env },
    });

    proc.stdout?.on("data", (data: string) => {
      appendLog(buildId, data.trimEnd()).catch(() => {});
    });
    proc.stderr?.on("data", (data: string) => {
      appendLog(buildId, data.trimEnd()).catch(() => {});
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command "${cmd.split(" ")[0]}" exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

// ─── ZIP packaging (project-based builds) ────────────────────────────────────

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

  // Recursive search up to 5 levels deep as last resort
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
  const { buildId, language } = job.data;
  let zipPath  = job.data.zipPath;
  const tmpDir = os.tmpdir();

  logger.info({ jobId: job.id, buildId, language }, "android build worker: starting");
  await appendLog(buildId, `[${new Date().toISOString()}] Android build started — language: ${language}`);

  const sdkDir = androidSdkRoot();
  if (!sdkDir) {
    await markFailed(buildId, "Android SDK not configured (ANDROID_HOME not set)");
    return;
  }

  const buildEnv = {
    ANDROID_HOME:     sdkDir,
    ANDROID_SDK_ROOT: sdkDir,
    JAVA_HOME: process.env["JAVA_HOME"] ?? "",
  };

  // Create ZIP from project files if needed
  if (!zipPath && job.data.files) {
    const generatedZip = path.join(tmpDir, `android_build_${buildId}.zip`);
    await appendLog(buildId, `[${new Date().toISOString()}] Packaging project files...`);
    await writeProjectZip(job.data.files, generatedZip);
    zipPath = generatedZip;
  }

  if (!zipPath || !fs.existsSync(zipPath)) {
    await markFailed(buildId, "ZIP file missing or could not be created");
    return;
  }

  const projectDir = path.join(tmpDir, `android_project_${buildId}`);

  try {
    // ── stage: extracting ──────────────────────────────────────────────────
    await setStage(buildId, "extracting");
    await appendLog(buildId, `[${new Date().toISOString()}] Extracting project archive...`);

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(zipPath!)
        .pipe(unzipper.Extract({ path: projectDir }))
        .on("close", resolve)
        .on("error", reject);
    });
    await appendLog(buildId, `[${new Date().toISOString()}] Extraction complete`);

    // Detect project root (handle nested zip with single top-level dir)
    let buildRoot = projectDir;
    const entries = await fsp.readdir(projectDir);
    if (entries.length === 1) {
      const sub = path.join(projectDir, entries[0]!);
      if ((await fsp.stat(sub)).isDirectory()) buildRoot = sub;
    }

    // Validate Android project structure
    const hasRootGradle    = fs.existsSync(path.join(buildRoot, "build.gradle")) ||
                             fs.existsSync(path.join(buildRoot, "build.gradle.kts"));
    const hasSettingsGradle = fs.existsSync(path.join(buildRoot, "settings.gradle")) ||
                              fs.existsSync(path.join(buildRoot, "settings.gradle.kts"));
    const hasAppDir        = fs.existsSync(path.join(buildRoot, "app"));

    if (!hasRootGradle) throw new Error("Invalid Android project: root build.gradle not found");
    if (!hasSettingsGradle) throw new Error("Invalid Android project: settings.gradle not found");
    if (!hasAppDir) throw new Error("Invalid Android project: app/ directory not found");
    await appendLog(buildId, `[${new Date().toISOString()}] Project structure valid`);

    // ── stage: configuring ─────────────────────────────────────────────────
    await setStage(buildId, "configuring");
    await appendLog(buildId, `[${new Date().toISOString()}] Writing local.properties...`);

    await fsp.writeFile(
      path.join(buildRoot, "local.properties"),
      `sdk.dir=${sdkDir}\n`,
    );

    // Determine gradle executable
    const gradlewPath = path.join(buildRoot, "gradlew");
    const hasGradlew  = fs.existsSync(gradlewPath);
    let gradleCmd: string;

    if (hasGradlew) {
      await fsp.chmod(gradlewPath, 0o755);
      await appendLog(buildId, `[${new Date().toISOString()}] Using project Gradle wrapper`);
      gradleCmd = "./gradlew";
    } else if (gradleBin()) {
      await appendLog(buildId, `[${new Date().toISOString()}] Using system Gradle: ${gradleBin()}`);
      gradleCmd = gradleBin()!;
    } else {
      throw new Error(
        "Gradle not found: project has no gradlew and system gradle is not installed. " +
        "Add a Gradle wrapper (gradlew + gradle/wrapper/gradle-wrapper.properties) to your project.",
      );
    }
    await appendLog(buildId, `[${new Date().toISOString()}] Configuration complete`);

    // ── stage: assembling ──────────────────────────────────────────────────
    await setStage(buildId, "assembling");
    await appendLog(buildId, `[${new Date().toISOString()}] Running ${gradleCmd} assembleDebug --no-daemon...`);
    await appendLog(buildId, `[${new Date().toISOString()}] (This may take several minutes on first run — Gradle downloads dependencies)`);

    await runCommand(
      `${gradleCmd} assembleDebug --no-daemon --stacktrace`,
      buildRoot,
      buildId,
      buildEnv,
    );

    // ── stage: packaging ───────────────────────────────────────────────────
    await setStage(buildId, "packaging");
    await appendLog(buildId, `[${new Date().toISOString()}] Locating APK...`);

    const apkSrc = await findApk(buildRoot);
    if (!apkSrc) throw new Error("Build succeeded but APK not found. Check Gradle output for build path.");

    await appendLog(buildId, `[${new Date().toISOString()}] Found APK: ${path.relative(buildRoot, apkSrc)}`);
    const { storedPath, sizeBytes } = await storeApk(apkSrc, buildId);
    await markComplete(buildId, storedPath, sizeBytes);
    await appendLog(buildId, `[${new Date().toISOString()}] Build SUCCESS — APK ready (${Math.round(sizeBytes / 1024)} KB)`);

    logger.info({ buildId, storedPath, sizeBytes }, "android build worker: complete");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, buildId }, "android build worker: failed");
    await appendLog(buildId, `[${new Date().toISOString()}] Build FAILED: ${msg}`);
    await markFailed(buildId, msg);
  } finally {
    fsp.rm(zipPath, { force: true }).catch(() => {});
    fsp.rm(projectDir, { recursive: true, force: true }).catch(() => {});
  }
}
