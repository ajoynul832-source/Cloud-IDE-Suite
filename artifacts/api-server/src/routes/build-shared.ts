/**
 * Shared in-memory job store used by both build.ts and project-build.ts.
 * Exported so both route files can read/write the same state.
 */
import path from "path";
import fsp from "fs/promises";
import { exec } from "child_process";
import os from "os";
import { logger } from "../lib/logger";

export type BuildStatus = "queued" | "building" | "success" | "failed";
export type BuildStage = "extracting" | "validating" | "getting deps" | "building apk";

export interface Job {
  jobId: string;
  status: BuildStatus;
  logs: string;
  apkPath: string | null;
  startedAt: string | null;
  completedAt: string | null;
  stage: BuildStage | null;
  // Optional extras for project builds
  previewUrl?: string;
  embedUrl?: string;
  qrUrl?: string;
}

export const jobs = new Map<string, Job>();
export const queue: string[] = [];
let isBuilding = false;

const BUILD_TIMEOUT_MS = 5 * 60 * 1000;
const CLEANUP_DELAY_MS = 30 * 60 * 1000;

export function appendLog(job: Job, text: string) {
  job.logs += text + "\n";
}

export function scheduleCleanup(jobId: string, zipPath: string, projectDir: string) {
  setTimeout(async () => {
    try {
      await fsp.rm(zipPath, { force: true });
      await fsp.rm(projectDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    jobs.delete(jobId);
  }, CLEANUP_DELAY_MS);
}

export function runCommand(cmd: string, cwd: string, job: Job): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, { cwd, timeout: BUILD_TIMEOUT_MS }, (error, _stdout, stderr) => {
      if (error) {
        if (stderr) appendLog(job, stderr);
        reject(new Error(`Command failed: ${cmd}\n${error.message}`));
      } else {
        resolve();
      }
    });

    proc.stdout?.on("data", (data: string) => appendLog(job, data.trimEnd()));
    proc.stderr?.on("data", (data: string) => appendLog(job, data.trimEnd()));
  });
}

async function processJob(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  const tmpDir = os.tmpdir();
  const zipPath = path.join(tmpDir, `${jobId}.zip`);
  const projectDir = path.join(tmpDir, `project_${jobId}`);

  job.status = "building";
  job.startedAt = new Date().toISOString();
  job.stage = "extracting";
  appendLog(job, `[${new Date().toISOString()}] Starting build for job ${jobId}`);

  try {
    // Dynamic import to avoid circular issues
    const { default: fs } = await import("fs");
    const { default: unzipper } = await import("unzipper");

    // Extract ZIP
    appendLog(job, `[${new Date().toISOString()}] Extracting project...`);
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: projectDir }))
        .on("close", resolve)
        .on("error", reject);
    });
    appendLog(job, `[${new Date().toISOString()}] Extraction complete`);

    // Validate Flutter structure
    job.stage = "validating";
    appendLog(job, `[${new Date().toISOString()}] Validating project structure...`);

    let buildRoot = projectDir;
    const entries = await fsp.readdir(projectDir);
    if (entries.length === 1) {
      const maybeSubdir = path.join(projectDir, entries[0]);
      const stat = await fsp.stat(maybeSubdir);
      if (stat.isDirectory()) buildRoot = maybeSubdir;
    }

    const pubspecPath = path.join(buildRoot, "pubspec.yaml");
    const mainDartPath = path.join(buildRoot, "lib", "main.dart");

    if (!fs.existsSync(pubspecPath)) throw new Error("Invalid Flutter project: pubspec.yaml not found");
    if (!fs.existsSync(mainDartPath)) throw new Error("Invalid Flutter project: lib/main.dart not found");
    appendLog(job, `[${new Date().toISOString()}] Project structure valid`);

    // flutter pub get
    job.stage = "getting deps";
    appendLog(job, `[${new Date().toISOString()}] Running flutter pub get...`);
    await runCommand("flutter pub get", buildRoot, job);

    // flutter build apk
    job.stage = "building apk";
    appendLog(job, `[${new Date().toISOString()}] Running flutter build apk --debug...`);
    await runCommand("flutter build apk --debug", buildRoot, job);

    const apkPath = path.join(buildRoot, "build", "app", "outputs", "flutter-apk", "app-debug.apk");
    if (!fs.existsSync(apkPath)) throw new Error("Build succeeded but APK not found");

    job.status = "success";
    job.apkPath = apkPath;
    job.stage = null;
    job.completedAt = new Date().toISOString();
    appendLog(job, `[${new Date().toISOString()}] Build SUCCESS — APK ready for download`);

    await fsp.rm(zipPath, { force: true }).catch(() => {});
    scheduleCleanup(jobId, zipPath, projectDir);
  } catch (err) {
    job.status = "failed";
    job.stage = null;
    job.completedAt = new Date().toISOString();
    appendLog(job, `[${new Date().toISOString()}] Build FAILED: ${err instanceof Error ? err.message : String(err)}`);
    logger.error({ err, jobId }, "build failed");
    scheduleCleanup(jobId, zipPath, projectDir);
  }
}

export async function processQueue() {
  if (isBuilding || queue.length === 0) return;
  isBuilding = true;
  const jobId = queue.shift()!;
  try {
    await processJob(jobId);
  } finally {
    isBuilding = false;
    processQueue();
  }
}
