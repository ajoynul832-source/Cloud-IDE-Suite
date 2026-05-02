/**
 * Project sharing API
 *
 * POST /api/projects/:id/share          — generate/reuse a share link (idempotent)
 * GET  /api/share/:shareId              — public: load project + increment view counters
 * GET  /api/share/:shareId/stats        — public: read view counts without incrementing
 * POST /api/share/:shareId/event        — record a fork or run event
 */
import { Router, type Request, type Response } from "express";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { db, projectsTable, sharesTable, shareViewersTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { shareLimiter, projectLimiter } from "../middlewares/rate-limit";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateUserKey(req: Request, res: Response): string | null {
  const raw = req.headers["x-user-key"];
  const key = Array.isArray(raw) ? raw[0] : raw;
  if (!key || key.trim().length < 8 || !/^[a-f0-9-]{8,64}$/i.test(key.trim())) {
    res.status(401).json({ error: "Missing or invalid X-User-Key header." });
    return null;
  }
  return key.trim();
}

function validateId(id: unknown): string | null {
  if (typeof id !== "string" || !/^[a-f0-9-]{8,64}$/.test(id)) return null;
  return id;
}

function validateShareId(id: string): boolean {
  return /^[a-f0-9]{8}$/.test(id);
}

/** Generate a collision-resistant 8-char hex share ID */
function newShareId(): string {
  return crypto.randomBytes(4).toString("hex");
}

/** Derive a stable, privacy-preserving viewer key from the request IP */
function viewerKey(req: Request): string {
  const ip = String(req.ip ?? req.socket.remoteAddress ?? "unknown");
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

interface ShareStats {
  totalViews: number;
  uniqueViews: number;
  forksCount: number;
  runsCount: number;
}

function toStats(share: typeof sharesTable.$inferSelect): ShareStats {
  return {
    totalViews:  share.totalViews,
    uniqueViews: share.uniqueViews,
    forksCount:  share.forksCount,
    runsCount:   share.runsCount,
  };
}

/**
 * Fire-and-forget: increment totalViews; increment uniqueViews only for new viewers.
 * Wrapped in try/catch so it never bubbles up to the caller.
 */
async function countView(shareId: string, key: string): Promise<void> {
  // Always increment total
  await db
    .update(sharesTable)
    .set({ totalViews: sql`${sharesTable.totalViews} + 1` })
    .where(eq(sharesTable.shareId, shareId));

  // Insert viewer key (composite PK prevents duplicates)
  const result = await db
    .insert(shareViewersTable)
    .values({ shareId, viewerKey: key })
    .onConflictDoNothing();

  // If a new row was inserted → this is a unique viewer
  if ((result.rowCount ?? 0) > 0) {
    await db
      .update(sharesTable)
      .set({ uniqueViews: sql`${sharesTable.uniqueViews} + 1` })
      .where(eq(sharesTable.shareId, shareId));
  }
}

// ─── POST /api/projects/:id/share ─────────────────────────────────────────────

router.post(
  "/projects/:id/share",
  projectLimiter,
  async (req, res) => {
    const userKey = validateUserKey(req, res);
    if (!userKey) return;

    const projectId = validateId(req.params["id"]);
    if (!projectId) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }

    try {
      const [project] = await db
        .select({ id: projectsTable.id })
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId))
        .limit(1);

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      // Idempotent: reuse existing share
      const [existing] = await db
        .select()
        .from(sharesTable)
        .where(eq(sharesTable.projectId, projectId))
        .limit(1);

      if (existing) {
        res.json({
          shareUrl: `/ide/p/${existing.shareId}`,
          shareId: existing.shareId,
          stats: toStats(existing),
        });
        return;
      }

      // Create a new share record (retry on PK collision)
      let shareId = newShareId();
      let attempts = 0;
      while (attempts < 5) {
        try {
          await db.insert(sharesTable).values({ shareId, projectId });
          break;
        } catch {
          shareId = newShareId();
          attempts++;
        }
      }

      res.json({
        shareUrl: `/ide/p/${shareId}`,
        shareId,
        stats: { totalViews: 0, uniqueViews: 0, forksCount: 0, runsCount: 0 },
      });
    } catch (err) {
      logger.error({ err, projectId }, "share project failed");
      res.status(500).json({ error: "Failed to generate share link" });
    }
  },
);

// ─── GET /api/share/:shareId/stats ────────────────────────────────────────────
// Must be declared BEFORE /api/share/:shareId to avoid "stats" matching as shareId

router.get("/share/:shareId/stats", shareLimiter, async (req, res) => {
  const shareId = String(req.params["shareId"] ?? "");
  if (!validateShareId(shareId)) {
    res.status(400).json({ error: "Invalid share ID" });
    return;
  }

  try {
    const [share] = await db
      .select({
        totalViews:  sharesTable.totalViews,
        uniqueViews: sharesTable.uniqueViews,
        forksCount:  sharesTable.forksCount,
        runsCount:   sharesTable.runsCount,
      })
      .from(sharesTable)
      .where(eq(sharesTable.shareId, shareId))
      .limit(1);

    if (!share) {
      res.status(404).json({ error: "Share link not found" });
      return;
    }

    res.json(share);
  } catch (err) {
    logger.error({ err, shareId }, "load share stats failed");
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// ─── GET /api/share/:shareId ──────────────────────────────────────────────────

router.get("/share/:shareId", shareLimiter, async (req, res) => {
  const shareId = String(req.params["shareId"] ?? "");
  if (!validateShareId(shareId)) {
    res.status(400).json({ error: "Invalid share ID" });
    return;
  }

  try {
    const [share] = await db
      .select()
      .from(sharesTable)
      .where(eq(sharesTable.shareId, shareId))
      .limit(1);

    if (!share) {
      res.status(404).json({ error: "Share link not found or has been removed" });
      return;
    }

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, share.projectId))
      .limit(1);

    if (!project) {
      res.status(404).json({ error: "Project no longer exists" });
      return;
    }

    // Return current stats (before this view is counted — intentional)
    const stats = toStats(share);

    res.json({
      project: {
        id:          project.id,
        name:        project.name,
        projectType: project.projectType,
        files:       project.files,
        createdAt:   project.createdAt,
        updatedAt:   project.updatedAt,
      },
      shareId,
      stats,
    });

    // Non-blocking: count the view after the response is already sent
    const key = viewerKey(req);
    countView(shareId, key).catch((err) =>
      logger.warn({ err, shareId }, "view count failed (non-blocking)"),
    );
  } catch (err) {
    logger.error({ err, shareId }, "load shared project failed");
    res.status(500).json({ error: "Failed to load shared project" });
  }
});

// ─── POST /api/share/:shareId/event ───────────────────────────────────────────

router.post("/share/:shareId/event", shareLimiter, async (req, res) => {
  const shareId = String(req.params["shareId"] ?? "");
  if (!validateShareId(shareId)) {
    res.status(400).json({ error: "Invalid share ID" });
    return;
  }

  const event = String((req.body as { event?: unknown }).event ?? "");
  if (event !== "fork" && event !== "run") {
    res.status(400).json({ error: "event must be 'fork' or 'run'" });
    return;
  }

  // Respond immediately; count in background
  res.json({ ok: true });

  try {
    const col = event === "fork" ? sharesTable.forksCount : sharesTable.runsCount;
    await db
      .update(sharesTable)
      .set({ [event === "fork" ? "forksCount" : "runsCount"]: sql`${col} + 1` })
      .where(eq(sharesTable.shareId, shareId));
  } catch (err) {
    logger.warn({ err, shareId, event }, "event count failed (non-blocking)");
  }
});

export default router;
