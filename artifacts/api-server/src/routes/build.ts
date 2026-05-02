/**
 * Build API routes — DB-backed, BullMQ-queued.
 *
 * POST /api/build             — multipart ZIP upload → enqueue build
 * GET  /api/status/:jobId     — build status (reads DB)
 * GET  /api/download/:jobId   — stream APK file
 * GET  /api/logs/:jobId       — SSE real-time log stream from DB
 * GET  /api/projects/:id/builds — last 10 builds for a project
 */
import { Router }   from "express";
import multer        from "multer";
import fs            from "fs";
import fsp           from "fs/promises";
import os            from "os";
import { db, buildsTable } from "@workspace/db";
import { eq, desc, and, or, inArray, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { isFlutterAvailable } from "../lib/flutter";
import { apkExists }           from "../lib/apk-storage";
import { getBuildQueue }       from "../lib/build-queue";
import { buildLimiter }        from "../middlewares/rate-limit";
import { optionalAuth }        from "../middlewares/require-auth";
import { checkAndIncrementBuilds, resolveUsageKey } from "../lib/usage";
import { logger }              from "../lib/logger";

const router = Router();

// ─── Multer (ZIP upload) ──────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename:    (_req, _file, cb) => cb(null, `upload_${randomUUID()}.zip`),
  }),
  limits:     { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/zip" && !file.originalname.endsWith(".zip")) {
      cb(new Error("Only ZIP files are allowed"));
      return;
    }
    cb(null, true);
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FLUTTER_503 = { error: "Flutter SDK is not installed on this server. APK builds are unavailable.", code: "FLUTTER_DISABLED" };

async function countActiveBuildsForUser(userId: string): Promise<number> {
  const rows = await db.select({ c: count() })
    .from(buildsTable)
    .where(and(
      eq(buildsTable.userId, userId as unknown as string),
      inArray(buildsTable.status, ["queued", "building"]),
    ));
  return Number(rows[0]?.c ?? 0);
}

// ─── POST /api/build — multipart ZIP upload ───────────────────────────────────

router.post("/build", optionalAuth, buildLimiter, (req, res, next) => {
  if (!isFlutterAvailable()) { res.status(503).json(FLUTTER_503); return; }

  upload.single("project")(req, res, async (err) => {
    if (err) {
      const msg = err.message === "Only ZIP files are allowed"   ? err.message
                : (err as NodeJS.ErrnoException).code === "LIMIT_FILE_SIZE" ? "File too large (max 10 MB)"
                : "Upload failed";
      res.status(400).json({ error: msg });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No project file uploaded — include a ZIP in the 'project' field" });
      return;
    }

    const usageKey = resolveUsageKey(req.user?.userId, req.headers["x-user-key"], req.ip);
    const usage    = await checkAndIncrementBuilds(usageKey);
    if (!usage.allowed) {
      res.status(429).json({ error: "Daily build limit reached (3/day). Resets at midnight UTC.", code: "DAILY_LIMIT_REACHED", remaining: 0 });
      return;
    }

    // Enforce 10-build queue limit per authenticated user
    if (req.user?.userId) {
      const active = await countActiveBuildsForUser(req.user.userId);
      if (active >= 10) {
        res.status(429).json({ error: "Too many builds in queue. Wait for some to complete.", code: "QUEUE_FULL" });
        return;
      }
    }

    try {
      const buildId = randomUUID();
      const zipPath = req.file.path; // already saved by multer to tmpdir

      // Persist build record
      await db.insert(buildsTable).values({
        id: buildId,
        userId: req.user?.userId ?? null,
        language: "flutter",
        status: "queued",
        logText: `[${new Date().toISOString()}] Queued flutter build\n`,
      });

      // Enqueue
      const queue = getBuildQueue();
      const waiting = await queue.getWaitingCount();
      await queue.add("flutter-build", { buildId, zipPath, language: "flutter" });

      logger.info({ buildId, zipPath }, "build queued (upload)");
      res.json({ jobId: buildId, status: "queued", queuePosition: waiting });
    } catch (e) {
      next(e);
    }
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidBuildId(id: string): boolean {
  return UUID_RE.test(id);
}

// ─── GET /api/status/:jobId ───────────────────────────────────────────────────

router.get("/status/:jobId", async (req, res) => {
  const jobId = String(req.params["jobId"] ?? "");
  if (!jobId || !isValidBuildId(jobId)) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const rows = await db.select().from(buildsTable).where(eq(buildsTable.id, jobId)).limit(1);
  const build = rows[0];

  if (!build) {
    res.status(404).json({ error: `Job ${jobId} not found` });
    return;
  }

  // Map "complete" → "success" for backward compat with existing frontend
  const statusOut = build.status === "complete" ? "success" : build.status;

  res.json({
    jobId:        build.id,
    status:       statusOut,
    stage:        build.stage ?? null,
    logs:         build.logText || null,
    queuePosition: build.queuePosition,
    startedAt:    null,
    completedAt:  build.completedAt?.toISOString() ?? null,
    download:     build.status === "complete" && build.apkPath ? `/api/download/${jobId}` : null,
    apkSize:      build.apkSize ?? null,
    errorMessage: build.errorMessage ?? null,
    previewUrl:   build.previewUrl ?? null,
    embedUrl:     build.embedUrl   ?? null,
    qrUrl:        build.qrUrl      ?? null,
  });
});

// ─── GET /api/download/:jobId ─────────────────────────────────────────────────

router.get("/download/:jobId", async (req, res) => {
  const jobId = String(req.params["jobId"] ?? "");
  if (!jobId || !isValidBuildId(jobId)) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const rows = await db.select().from(buildsTable).where(eq(buildsTable.id, jobId)).limit(1);
  const build = rows[0];

  if (!build) {
    res.status(404).json({ error: `Job ${jobId} not found` });
    return;
  }
  if (build.status !== "complete" || !build.apkPath) {
    res.status(404).json({ error: `Build not complete or APK not available. Status: ${build.status}` });
    return;
  }
  if (!apkExists(build.apkPath)) {
    res.status(404).json({ error: "APK file no longer available on disk" });
    return;
  }

  res.download(build.apkPath, `flutter-${jobId}.apk`);
});

// ─── GET /api/logs/:jobId — SSE real-time log stream ─────────────────────────

router.get("/logs/:jobId", async (req, res) => {
  const jobId = String(req.params["jobId"] ?? "");
  if (!jobId || !isValidBuildId(jobId)) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const rows = await db.select().from(buildsTable).where(eq(buildsTable.id, jobId)).limit(1);
  if (!rows[0]) {
    res.status(404).json({ error: `Job ${jobId} not found` });
    return;
  }

  // If not an SSE request — return JSON snapshot
  const accept = String(req.headers["accept"] ?? "");
  if (!accept.includes("text/event-stream")) {
    const build = rows[0];
    res.json({ jobId: build.id, logs: build.logText, stage: build.stage, status: build.status });
    return;
  }

  // SSE mode — poll DB every 1 second and emit new log text
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let lastLength = 0;
  let aborted    = false;
  req.on("close", () => { aborted = true; });

  const poll = async () => {
    if (aborted) return;

    try {
      const fresh = await db.select().from(buildsTable).where(eq(buildsTable.id, jobId)).limit(1);
      const build = fresh[0];
      if (!build) { res.end(); return; }

      const newText = build.logText.slice(lastLength);
      if (newText) {
        lastLength += newText.length;
        const event = { type: "log", text: newText, stage: build.stage, status: build.status };
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      const terminal = build.status === "complete" || build.status === "failed";
      if (terminal) {
        const doneEvent = { type: "done", status: build.status, stage: build.stage,
          apkSize: build.apkSize, errorMessage: build.errorMessage };
        res.write(`data: ${JSON.stringify(doneEvent)}\n\n`);
        res.end();
        return;
      }
    } catch (err) {
      logger.warn({ err, jobId }, "log SSE poll error");
    }

    if (!aborted) setTimeout(poll, 1_000);
  };

  poll();
});

// ─── GET /api/projects/:projectId/builds — build history ─────────────────────

router.get("/projects/:projectId/builds", optionalAuth, async (req, res) => {
  const projectId = String(req.params["projectId"] ?? "");
  if (!projectId || !isValidBuildId(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const builds = await db.select({
    jobId:        buildsTable.id,
    language:     buildsTable.language,
    status:       buildsTable.status,
    stage:        buildsTable.stage,
    createdAt:    buildsTable.createdAt,
    completedAt:  buildsTable.completedAt,
    apkSize:      buildsTable.apkSize,
    errorMessage: buildsTable.errorMessage,
  })
    .from(buildsTable)
    .where(eq(buildsTable.projectId, projectId))
    .orderBy(desc(buildsTable.createdAt))
    .limit(10);

  res.json(builds.map((b) => ({
    ...b,
    status: b.status === "complete" ? "success" : b.status,
  })));
});

export default router;
