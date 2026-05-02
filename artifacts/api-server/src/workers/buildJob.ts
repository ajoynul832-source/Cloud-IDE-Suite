/**
 * BullMQ job processor for Flutter/Android APK builds.
 *
 * Stages (written to DB in real time so SSE log endpoint can stream them):
 *   extracting → running-pub-get → building-apk → packaging
 *
 * All log output is appended to builds.log_text via DB UPDATE.
 * The APK is copied to permanent storage on success.
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
import { storeApk } from "../lib/apk-storage";
import { flutterBin } from "../lib/flutter";
import { logger } from "../lib/logger";

export interface BuildJobData {
  buildId:  string;                          // UUID from builds table
  zipPath?: string;                          // for upload-based builds
  files?:   Record<string, string>;          // for project-based builds
  language: string;
}

const BUILD_TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes

// ─── DB helpers ───────────────────────────────────────────────────────────────

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

function runCommand(cmd: string, cwd: string, buildId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, { cwd, timeout: BUILD_TIMEOUT_MS });

    proc.stdout?.on("data", (data: string) => {
      appendLog(buildId, data.trimEnd()).catch(() => {});
    });
    proc.stderr?.on("data", (data: string) => {
      appendLog(buildId, data.trimEnd()).catch(() => {});
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command "${cmd}" exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

// ─── ZIP packaging (for project-based builds) ─────────────────────────────────

async function writeProjectZip(files: Record<string, string>, zipPath: string): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const [filePath, content] of Object.entries(files)) {
    zip.file(filePath.replace(/^\//, ""), content);
  }
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  await fsp.writeFile(zipPath, buf);
}

// ─── Main processor ───────────────────────────────────────────────────────────

export async function buildJobProcessor(job: Job<BuildJobData>): Promise<void> {
  const { buildId, language } = job.data;
  let zipPath  = job.data.zipPath;
  const tmpDir = os.tmpdir();

  logger.info({ jobId: job.id, buildId, language }, "build worker: starting");

  await appendLog(buildId, `[${new Date().toISOString()}] Build started — language: ${language}`);

  // If build came from project files (not upload), create the ZIP now
  if (!zipPath && job.data.files) {
    const generatedZip = path.join(tmpDir, `build_${buildId}.zip`);
    await appendLog(buildId, `[${new Date().toISOString()}] Packaging project files...`);
    await writeProjectZip(job.data.files, generatedZip);
    zipPath = generatedZip;
  }

  if (!zipPath || !fs.existsSync(zipPath)) {
    await markFailed(buildId, "ZIP file missing or could not be created");
    return;
  }

  const projectDir = path.join(tmpDir, `build_project_${buildId}`);

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

    // Detect Flutter project root (handle nested zip)
    let buildRoot = projectDir;
    const entries = await fsp.readdir(projectDir);
    if (entries.length === 1) {
      const sub = path.join(projectDir, entries[0]!);
      if ((await fsp.stat(sub)).isDirectory()) buildRoot = sub;
    }

    // Validate structure
    const pubspec = path.join(buildRoot, "pubspec.yaml");
    const mainDart = path.join(buildRoot, "lib", "main.dart");
    if (!fs.existsSync(pubspec))  throw new Error("Invalid Flutter project: pubspec.yaml not found");
    if (!fs.existsSync(mainDart)) throw new Error("Invalid Flutter project: lib/main.dart not found");
    await appendLog(buildId, `[${new Date().toISOString()}] Project structure valid`);

    // ── stage: running-pub-get ────────────────────────────────────────────
    await setStage(buildId, "running-pub-get");
    await appendLog(buildId, `[${new Date().toISOString()}] Running flutter pub get...`);
    await runCommand(`${flutterBin()} pub get`, buildRoot, buildId);

    // ── stage: building-apk ───────────────────────────────────────────────
    await setStage(buildId, "building-apk");
    await appendLog(buildId, `[${new Date().toISOString()}] Running flutter build apk --debug...`);
    await runCommand(`${flutterBin()} build apk --debug`, buildRoot, buildId);

    // ── stage: packaging ──────────────────────────────────────────────────
    await setStage(buildId, "packaging");
    await appendLog(buildId, `[${new Date().toISOString()}] Packaging APK for download...`);

    const apkSrc = path.join(buildRoot, "build", "app", "outputs", "flutter-apk", "app-debug.apk");
    if (!fs.existsSync(apkSrc)) throw new Error("Build succeeded but APK file not found at expected path");

    const { storedPath, sizeBytes } = await storeApk(apkSrc, buildId);
    await markComplete(buildId, storedPath, sizeBytes);
    await appendLog(buildId, `[${new Date().toISOString()}] Build SUCCESS — APK ready (${Math.round(sizeBytes / 1024)} KB)`);

    logger.info({ buildId, storedPath, sizeBytes }, "build worker: complete");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, buildId }, "build worker: failed");
    await appendLog(buildId, `[${new Date().toISOString()}] Build FAILED: ${msg}`);
    await markFailed(buildId, msg);
  } finally {
    // Cleanup temp files
    fsp.rm(zipPath, { force: true }).catch(() => {});
    fsp.rm(projectDir, { recursive: true, force: true }).catch(() => {});
  }
}
