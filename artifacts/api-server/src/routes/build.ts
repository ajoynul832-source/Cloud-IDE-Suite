import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { exec } from "child_process";
import unzipper from "unzipper";
import os from "os";

const router = Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BUILD_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_DELAY_MS = 30 * 60 * 1000; // 30 minutes

type BuildStatus = "queued" | "building" | "success" | "failed";
type BuildStage = "extracting" | "validating" | "getting deps" | "building apk";

interface Job {
  jobId: string;
  status: BuildStatus;
  logs: string;
  apkPath: string | null;
  startedAt: string | null;
  completedAt: string | null;
  stage: BuildStage | null;
}

const jobs = new Map<string, Job>();
const queue: string[] = [];
let isBuilding = false;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, _file, cb) => {
    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    cb(null, `${jobId}.zip`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/zip" && !file.originalname.endsWith(".zip")) {
      cb(new Error("Only ZIP files are allowed"));
      return;
    }
    cb(null, true);
  },
});

function appendLog(job: Job, text: string) {
  job.logs += text + "\n";
}

function scheduleCleanup(jobId: string, zipPath: string, projectDir: string) {
  setTimeout(async () => {
    try {
      await fsp.rm(zipPath, { force: true });
      await fsp.rm(projectDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
    jobs.delete(jobId);
  }, CLEANUP_DELAY_MS);
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
    appendLog(job, `[${new Date().toISOString()}] Validating Flutter project structure...`);

    // Check if files are nested inside a subdirectory (common when zipping a folder)
    let buildRoot = projectDir;
    const entries = await fsp.readdir(projectDir);
    if (entries.length === 1) {
      const maybeSubdir = path.join(projectDir, entries[0]);
      const stat = await fsp.stat(maybeSubdir);
      if (stat.isDirectory()) {
        buildRoot = maybeSubdir;
      }
    }

    const pubspecPath = path.join(buildRoot, "pubspec.yaml");
    const mainDartPath = path.join(buildRoot, "lib", "main.dart");

    if (!fs.existsSync(pubspecPath)) {
      throw new Error("Invalid Flutter project: pubspec.yaml not found");
    }
    if (!fs.existsSync(mainDartPath)) {
      throw new Error("Invalid Flutter project: lib/main.dart not found");
    }
    appendLog(job, `[${new Date().toISOString()}] Flutter project structure is valid`);

    // Run flutter pub get
    job.stage = "getting deps";
    appendLog(job, `[${new Date().toISOString()}] Running flutter pub get...`);
    await runCommand("flutter pub get", buildRoot, job);
    appendLog(job, `[${new Date().toISOString()}] Dependencies fetched successfully`);

    // Run flutter build apk
    job.stage = "building apk";
    appendLog(job, `[${new Date().toISOString()}] Running flutter build apk --debug...`);
    await runCommand("flutter build apk --debug", buildRoot, job);

    const apkPath = path.join(buildRoot, "build", "app", "outputs", "flutter-apk", "app-debug.apk");
    if (!fs.existsSync(apkPath)) {
      throw new Error("Build succeeded but APK file not found at expected path");
    }

    job.status = "success";
    job.apkPath = apkPath;
    job.stage = null;
    job.completedAt = new Date().toISOString();
    appendLog(job, `[${new Date().toISOString()}] Build SUCCESS - APK ready for download`);

    // Cleanup zip after success (keep APK for download)
    await fsp.rm(zipPath, { force: true }).catch(() => {});
    scheduleCleanup(jobId, zipPath, projectDir);
  } catch (err) {
    job.status = "failed";
    job.stage = null;
    job.completedAt = new Date().toISOString();
    appendLog(job, `[${new Date().toISOString()}] Build FAILED: ${err instanceof Error ? err.message : String(err)}`);
    scheduleCleanup(jobId, zipPath, projectDir);
  }
}

function runCommand(cmd: string, cwd: string, job: Job): Promise<void> {
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

async function processQueue() {
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

// POST /api/build
router.post("/build", (req, res, next) => {
  upload.single("project")(req, res, (err) => {
    if (err) {
      if (err.message === "Only ZIP files are allowed") {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large. Maximum size is 10MB." });
        return;
      }
      next(err);
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No project file uploaded. Include a ZIP file in the 'project' field." });
      return;
    }

    // Extract jobId from uploaded filename
    const uploadedName = req.file.filename; // e.g., "1234567890-abc123.zip"
    const jobId = uploadedName.replace(".zip", "");

    const job: Job = {
      jobId,
      status: "queued",
      logs: "",
      apkPath: null,
      startedAt: null,
      completedAt: null,
      stage: null,
    };
    jobs.set(jobId, job);
    queue.push(jobId);

    const queuePosition = queue.length - 1;

    // Start processing
    processQueue();

    res.json({ jobId, status: "queued", queuePosition });
  });
});

// GET /api/status/:jobId
router.get("/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: `Job ${jobId} not found` });
    return;
  }

  const queuePosition = queue.indexOf(jobId);

  res.json({
    jobId: job.jobId,
    status: job.status,
    logs: job.logs || null,
    download: job.status === "success" ? `/api/download/${jobId}` : null,
    queuePosition: queuePosition >= 0 ? queuePosition : null,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    stage: job.stage,
  });
});

// GET /api/download/:jobId
router.get("/download/:jobId", (req, res) => {
  const { jobId } = req.params;
  // Sanitize jobId to prevent path traversal
  if (!/^[\w-]+$/.test(jobId)) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: `Job ${jobId} not found` });
    return;
  }

  if (job.status !== "success" || !job.apkPath) {
    res.status(404).json({ error: `Build not successful or APK not available. Status: ${job.status}` });
    return;
  }

  if (!fs.existsSync(job.apkPath)) {
    res.status(404).json({ error: "APK file no longer available (may have been cleaned up)" });
    return;
  }

  res.download(job.apkPath, `flutter-${jobId}.apk`);
});

// GET /api/logs/:jobId
router.get("/logs/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: `Job ${jobId} not found` });
    return;
  }

  res.json({
    jobId: job.jobId,
    logs: job.logs,
    stage: job.stage,
  });
});

export default router;
