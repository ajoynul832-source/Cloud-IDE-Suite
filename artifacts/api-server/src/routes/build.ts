import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { jobs, queue, processQueue, Job } from "./build-shared";
import { buildLimiter } from "../middlewares/rate-limit";

const router = Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

// POST /api/build — multipart ZIP upload (Flutter / legacy)
router.post("/build", buildLimiter, (req, res, next) => {
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

    const uploadedName = req.file.filename;
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
    download: job.status === "success" && job.apkPath ? `/api/download/${jobId}` : null,
    queuePosition: queuePosition >= 0 ? queuePosition : null,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    stage: job.stage,
    // Pass through project-build extras if present
    previewUrl: job.previewUrl ?? null,
    embedUrl: job.embedUrl ?? null,
    qrUrl: job.qrUrl ?? null,
  });
});

// GET /api/download/:jobId
router.get("/download/:jobId", (req, res) => {
  const { jobId } = req.params;
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
    res.status(404).json({ error: "APK file no longer available" });
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

  res.json({ jobId: job.jobId, logs: job.logs, stage: job.stage });
});

export default router;
