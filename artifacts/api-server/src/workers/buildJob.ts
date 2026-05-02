/**
 * BullMQ job processor for Flutter APK builds.
 *
 * Stages (written to DB in real time so SSE log endpoint can stream them):
 *   extracting → running-pub-get → building-apk → packaging
 *
 * Phase 5 — Resilience:
 *   - attempts: 2 (configured on queue)
 *   - Retriable errors (timeout, network) → throw → BullMQ retries with 5 s back-off
 *   - Permanent errors (bad project, missing SDK) → throw UnrecoverableError → no retry
 *   - DB status tracks "failed-will-retry" during the window between attempts
 *
 * Phase 7 — Observability:
 *   Records build metrics (duration, success, retries) via metrics singleton.
 *   WARN-logs retries; ERROR-logs final failures.
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
import { flutterBin }     from "../lib/flutter";
import { logger }         from "../lib/logger";
import { metrics }        from "../lib/metrics";
import { classifyError, logBuildError } from "../lib/build-resilience";

export interface BuildJobData {
  buildId:  string;
  zipPath?: string;
  files?:   Record<string, string>;
  language: string;
  userId?:  string | null;
}

const BUILD_TIMEOUT_MS = 8 * 60 * 1000;
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

function runCommand(cmd: string, cwd: string, buildId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, { cwd, timeout: BUILD_TIMEOUT_MS });
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

// ─── Main processor ───────────────────────────────────────────────────────────

export async function buildJobProcessor(job: Job<BuildJobData>): Promise<void> {
  const { buildId, language, userId } = job.data;
  let zipPath  = job.data.zipPath;
  const tmpDir = os.tmpdir();

  const attemptNumber = job.attemptsMade;
  const isRetry       = attemptNumber > 1;
  const buildStart    = Date.now();

  logger.info({ jobId: job.id, buildId, language, userId, attempt: attemptNumber },
    isRetry ? "flutter build worker: retry attempt" : "flutter build worker: starting");

  if (isRetry) {
    metrics.recordBuildRetry();
    logger.warn({ jobId: job.id, buildId, language, userId, attempt: attemptNumber },
      "flutter build: retrying after previous failure");
    await appendLog(buildId, `\n[${ts()}] ── Retry attempt ${attemptNumber} of ${MAX_ATTEMPTS} ──`);
    await db.update(buildsTable)
      .set({ status: "building", retryCount: attemptNumber - 1 })
      .where(eq(buildsTable.id, buildId));
  } else {
    await appendLog(buildId, `[${ts()}] Build started — language: ${language}`);
  }

  if (!zipPath && job.data.files) {
    const generatedZip = path.join(tmpDir, `build_${buildId}.zip`);
    await appendLog(buildId, `[${ts()}] Packaging project files...`);
    await writeProjectZip(job.data.files, generatedZip);
    zipPath = generatedZip;
  }

  if (!zipPath || !fs.existsSync(zipPath)) {
    await markFailed(buildId, "ZIP file missing or could not be created", "permanent", attemptNumber - 1);
    logger.error({ buildId, language, userId }, "flutter build: ZIP file missing");
    metrics.recordBuild({ language, durationMs: Date.now() - buildStart, success: false });
    throw new UnrecoverableError("ZIP file missing — cannot retry");
  }

  const projectDir = path.join(tmpDir, `build_project_${buildId}`);

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

    if (!fs.existsSync(path.join(buildRoot, "pubspec.yaml")))
      throw new Error("Invalid Flutter project: pubspec.yaml not found");
    if (!fs.existsSync(path.join(buildRoot, "lib", "main.dart")))
      throw new Error("Invalid Flutter project: lib/main.dart not found");
    await appendLog(buildId, `[${ts()}] Project structure valid`);

    // ── running-pub-get ──────────────────────────────────────────────────────
    await setStage(buildId, "running-pub-get");
    await appendLog(buildId, `[${ts()}] Running flutter pub get...`);
    await runCommand(`${flutterBin()} pub get`, buildRoot, buildId);

    // ── building-apk ─────────────────────────────────────────────────────────
    await setStage(buildId, "building-apk");
    await appendLog(buildId, `[${ts()}] Running flutter build apk --debug...`);
    await runCommand(`${flutterBin()} build apk --debug`, buildRoot, buildId);

    // ── packaging ────────────────────────────────────────────────────────────
    await setStage(buildId, "packaging");
    await appendLog(buildId, `[${ts()}] Packaging APK for download...`);

    const apkSrc = path.join(buildRoot, "build", "app", "outputs", "flutter-apk", "app-debug.apk");
    if (!fs.existsSync(apkSrc)) throw new Error("Build succeeded but APK file not found at expected path");

    const { storedPath, sizeBytes } = await storeApk(apkSrc, buildId);
    await markComplete(buildId, storedPath, sizeBytes);
    const durationMs = Date.now() - buildStart;
    await appendLog(buildId, `[${ts()}] Build SUCCESS — APK ready (${Math.round(sizeBytes / 1024)} KB)`);

    metrics.recordBuild({ language, durationMs, success: true });
    logger.info({ buildId, language, userId, durationMs, sizeBytes }, "flutter build worker: complete");

  } catch (err) {
    const durationMs = Date.now() - buildStart;
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
      logger.error({ buildId, language, userId, errorType, durationMs, attempt: attemptNumber },
        `flutter build: permanent/system failure — ${userMessage}`);
      metrics.recordBuild({ language, durationMs, success: false });
      throw new UnrecoverableError(userMessage);
    }

    if (!isLastAttempt) {
      await appendLog(buildId, `[${ts()}] Build failed — retrying (attempt ${attemptNumber + 1} of ${MAX_ATTEMPTS}): ${userMessage}`);
      await markWillRetry(buildId, `${userMessage} — retrying...`, errorType, attemptNumber);
      logger.warn({ buildId, language, userId, errorType, durationMs, attempt: attemptNumber, maxAttempts: MAX_ATTEMPTS },
        `flutter build: retriable failure, will retry — ${userMessage}`);
      throw err instanceof Error ? err : new Error(userMessage);
    }

    await appendLog(buildId, `[${ts()}] Build FAILED after ${MAX_ATTEMPTS} attempts: ${userMessage}`);
    await markFailed(buildId, userMessage, errorType, attemptNumber - 1);
    logger.error({ buildId, language, userId, errorType, durationMs, attempts: MAX_ATTEMPTS },
      `flutter build: failed after all retries — ${userMessage}`);
    metrics.recordBuild({ language, durationMs, success: false });
    throw err instanceof Error ? err : new Error(userMessage);

  } finally {
    fsp.rm(zipPath ?? "", { force: true }).catch(() => {});
    fsp.rm(projectDir, { recursive: true, force: true }).catch(() => {});
  }
}
