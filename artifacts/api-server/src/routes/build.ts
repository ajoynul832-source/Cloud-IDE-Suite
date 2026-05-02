/**
 * Build API routes — DB-backed, BullMQ-queued.
 *
 * POST /api/build                       — multipart ZIP upload → enqueue build
 * GET  /api/status/:jobId               — build status (reads DB)
 * GET  /api/download/:jobId             — stream APK file
 * GET  /api/logs/:jobId                 — SSE real-time log stream from DB
 * GET  /api/projects/:id/builds         — last 10 builds for a project
 * GET  /api/admin/build-errors          — recent build errors (admin only)
 *
 * Phase 5 — Resilience:
 *   Status includes retryCount, errorType, willRetry, and "failed-will-retry" status.
 * Phase 6 — Security:
 *   Admin endpoints protected by ADMIN_TOKEN / SESSION_SECRET.
 */
import { Router }   from "express";
import multer        from "multer";
import fs            from "fs";
import fsp           from "fs/promises";
import os            from "os";
import unzipper      from "unzipper";
import { db, buildsTable } from "@workspace/db";
import { eq, desc, and, or, inArray, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { isFlutterAvailable } from "../lib/flutter";
import { isAndroidAvailable } from "../lib/android";
import { apkExists }           from "../lib/apk-storage";
import { getBuildQueue }       from "../lib/build-queue";
import { buildLimiter }        from "../middlewares/rate-limit";
import { optionalAuth }        from "../middlewares/require-auth";
import { checkAndIncrementBuilds, resolveUsageKey } from "../lib/usage";
import { logger }              from "../lib/logger";
import { readBuildErrors }     from "../lib/build-resilience";

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
const ANDROID_503 = { error: "Android SDK / Gradle is not configured on this server. Android APK builds are unavailable.", code: "ANDROID_DISABLED" };

/**
 * Peek inside a ZIP (without extracting) to determine whether it is a
 * Flutter project (contains pubspec.yaml) or an Android project (contains
 * root-level build.gradle / build.gradle.kts).
 */
async function detectZipProjectType(zipPath: string): Promise<"flutter" | "android" | "unknown"> {
  return new Promise((resolve) => {
    const entries: string[] = [];
    fs.createReadStream(zipPath)
      .pipe(unzipper.Parse({ forceStream: true }))
      .on("entry", (entry: unzipper.Entry) => {
        entries.push(entry.path);
        entry.autodrain();
      })
      .on("close", () => {
        const norm = entries.map((e) => {
          const parts = e.replace(/\\/g, "/").split("/");
          return parts.length > 2 ? parts.slice(1).join("/") : e;
        });
        if (norm.some((e) => e === "pubspec.yaml")) return resolve("flutter");
        if (norm.some((e) => e === "build.gradle" || e === "build.gradle.kts")) return resolve("android");
        resolve("unknown");
      })
      .on("error", () => resolve("unknown"));
  });
}

async function countActiveBuildsForUser(userId: string): Promise<number> {
  const rows = await db.select({ c: count() })
    .from(buildsTable)
    .where(and(
      eq(buildsTable.userId, userId),
      or(inArray(buildsTable.status, ["queued", "building", "failed-will-retry"])),
    ));
  return Number(rows[0]?.c ?? 0);
}

// ─── Admin auth check ──────────────────────────────────────────────────────────

function isAdminAuthorized(authHeader: string): boolean {
  const secret = process.env["ADMIN_TOKEN"] ?? process.env["SESSION_SECRET"] ?? "";
  if (!secret) return false;

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() === secret;
  }
  if (authHeader.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const password = decoded.includes(":") ? decoded.split(":").slice(1).join(":") : decoded;
    return password === secret;
  }
  return false;
}

// ─── POST /api/build — multipart ZIP upload ───────────────────────────────────

router.post("/build", optionalAuth, buildLimiter, (req, res, next) => {
  if (!isFlutterAvailable() && !isAndroidAvailable()) {
    res.status(503).json({
      error: "No build backends configured on this server (Flutter SDK and Android SDK are both missing).",
      code: "BUILD_BACKENDS_DISABLED",
    });
    return;
  }

  upload.single("project")(req, res, async (err) => {
    if (err) {
      const msg = err.message === "Only ZIP files are allowed"
                ? err.message
                : (err as NodeJS.ErrnoException).code === "LIMIT_FILE_SIZE"
                ? "File too large (max 10 MB)"
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

    if (req.user?.userId) {
      const active = await countActiveBuildsForUser(req.user.userId);
      if (active >= 10) {
        res.status(429).json({ error: "Too many builds in queue. Wait for some to complete.", code: "QUEUE_FULL" });
        return;
      }
    }

    try {
      const buildId = randomUUID();
      const zipPath = req.file.path;
      const projectType = await detectZipProjectType(zipPath);

      if (projectType === "android") {
        if (!isAndroidAvailable()) { res.status(503).json(ANDROID_503); return; }

        await db.insert(buildsTable).values({
          id: buildId, userId: req.user?.userId ?? null, language: "android",
          status: "queued", logText: `[${new Date().toISOString()}] Queued android build\n`,
        });
        const queue = getBuildQueue();
        const waiting = await queue.getWaitingCount();
        await queue.add("android-build", { buildId, zipPath, language: "android", userId: req.user?.userId });
        logger.info({ buildId, zipPath, projectType }, "android build queued (upload)");
        res.json({ jobId: buildId, status: "queued", queuePosition: waiting, language: "android" });
        return;
      }

      // Default: Flutter (also for "unknown" — Flutter validator will catch bad ZIPs)
      if (!isFlutterAvailable()) { res.status(503).json(FLUTTER_503); return; }

      await db.insert(buildsTable).values({
        id: buildId, userId: req.user?.userId ?? null, language: "flutter",
        status: "queued", logText: `[${new Date().toISOString()}] Queued flutter build\n`,
      });
      const queue = getBuildQueue();
      const waiting = await queue.getWaitingCount();
      await queue.add("flutter-build", { buildId, zipPath, language: "flutter", userId: req.user?.userId });
      logger.info({ buildId, zipPath, projectType }, "flutter build queued (upload)");
      res.json({ jobId: buildId, status: "queued", queuePosition: waiting, language: "flutter" });
    } catch (e) {
      next(e);
    }
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidBuildId(id: string): boolean { return UUID_RE.test(id); }

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

  // Friendly status mapping
  let statusOut: string = build.status;
  if (build.status === "complete") statusOut = "success";

  // Determine if the build will be retried
  const willRetry = build.status === "failed-will-retry";

  res.json({
    jobId:        build.id,
    status:       statusOut,
    stage:        build.stage ?? null,
    logs:         build.logText || null,
    queuePosition: build.queuePosition,
    completedAt:  build.completedAt?.toISOString() ?? null,
    download:     build.status === "complete" && build.apkPath ? `/api/download/${jobId}` : null,
    apkSize:      build.apkSize ?? null,
    // Phase 5 resilience fields
    errorMessage: build.errorMessage ?? null,
    errorType:    build.errorType ?? null,
    retryCount:   build.retryCount ?? 0,
    willRetry,
    lastErrorAt:  build.lastErrorAt?.toISOString() ?? null,
    // Snack extras
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
  if (!build) { res.status(404).json({ error: `Job ${jobId} not found` }); return; }
  if (build.status !== "complete" || !build.apkPath) {
    res.status(404).json({ error: `Build not complete or APK not available. Status: ${build.status}` }); return;
  }
  if (!apkExists(build.apkPath)) {
    res.status(404).json({ error: "APK file no longer available on disk" }); return;
  }

  const filename = `${build.language ?? "flutter"}-${jobId}.apk`;
  res.download(build.apkPath, filename);
});

// ─── GET /api/logs/:jobId — SSE real-time log stream ─────────────────────────

router.get("/logs/:jobId", async (req, res) => {
  const jobId = String(req.params["jobId"] ?? "");
  if (!jobId || !isValidBuildId(jobId)) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const rows = await db.select().from(buildsTable).where(eq(buildsTable.id, jobId)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: `Job ${jobId} not found` }); return; }

  const accept = String(req.headers["accept"] ?? "");
  if (!accept.includes("text/event-stream")) {
    const build = rows[0];
    res.json({ jobId: build.id, logs: build.logText, stage: build.stage, status: build.status });
    return;
  }

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
        const doneEvent = {
          type: "done", status: build.status, stage: build.stage,
          apkSize: build.apkSize, errorMessage: build.errorMessage,
          errorType: build.errorType, retryCount: build.retryCount,
        };
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
    // Phase 5 fields
    errorMessage: buildsTable.errorMessage,
    errorType:    buildsTable.errorType,
    retryCount:   buildsTable.retryCount,
    lastErrorAt:  buildsTable.lastErrorAt,
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

// ─── GET /api/admin/build-errors ──────────────────────────────────────────────

router.get("/admin/build-errors", async (req, res) => {
  const authHeader = String(req.headers["authorization"] ?? "");
  if (!isAdminAuthorized(authHeader)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin"');
    res.status(401).json({ error: "Unauthorized — provide ADMIN_TOKEN as Bearer or Basic Auth password" });
    return;
  }

  try {
    const errors = await readBuildErrors(200);
    res.json({ count: errors.length, errors });
  } catch (err) {
    logger.error({ err }, "admin/build-errors: read failed");
    res.status(500).json({ error: "Failed to read build errors" });
  }
});

export default router;
