/**
 * Project sharing API
 *
 * POST /api/projects/:id/share          — generate/reuse share link (auth required)
 * GET  /api/explore                     — public ranked list
 * GET  /api/share/:shareId              — public: load project + count view
 * GET  /api/share/:shareId/stats        — public: read counters only
 * POST /api/share/:shareId/event        — public: record fork or run
 */
import { Router } from "express";
import { eq, sql, desc, and } from "drizzle-orm";
import crypto from "crypto";
import { db, projectsTable, sharesTable, shareViewersTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { shareLimiter, projectLimiter } from "../middlewares/rate-limit";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();

function validateId(id: unknown): string | null {
  if (typeof id !== "string" || !/^[a-f0-9-]{8,64}$/.test(id)) return null;
  return id;
}

function validateShareId(id: string): boolean {
  return /^[a-f0-9]{8}$/.test(id);
}

function newShareId(): string {
  return crypto.randomBytes(4).toString("hex");
}

function viewerKey(req: import("express").Request): string {
  const ip = String(req.ip ?? req.socket.remoteAddress ?? "unknown");
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

interface ShareStats {
  totalViews:  number;
  uniqueViews: number;
  forksCount:  number;
  runsCount:   number;
}

function toStats(share: typeof sharesTable.$inferSelect): ShareStats {
  return {
    totalViews:  share.totalViews,
    uniqueViews: share.uniqueViews,
    forksCount:  share.forksCount,
    runsCount:   share.runsCount,
  };
}

async function countView(shareId: string, key: string): Promise<void> {
  await db
    .update(sharesTable)
    .set({ totalViews: sql`${sharesTable.totalViews} + 1` })
    .where(eq(sharesTable.shareId, shareId));

  const result = await db
    .insert(shareViewersTable)
    .values({ shareId, viewerKey: key })
    .onConflictDoNothing();

  if ((result.rowCount ?? 0) > 0) {
    await db
      .update(sharesTable)
      .set({ uniqueViews: sql`${sharesTable.uniqueViews} + 1` })
      .where(eq(sharesTable.shareId, shareId));
  }
}

// ─── GET /api/explore ─────────────────────────────────────────────────────────

router.get("/explore", shareLimiter, async (req, res) => {
  const MAX_LIMIT = 20;
  const rawLimit  = parseInt(String(req.query["limit"] ?? "20"), 10);
  const rawOffset = parseInt(String(req.query["offset"] ?? "0"), 10);
  const limit     = Math.min(isNaN(rawLimit) ? MAX_LIMIT : Math.max(1, rawLimit), MAX_LIMIT);
  const offset    = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

  try {
    const scoreExpr = sql<number>`(${sharesTable.forksCount} * 5) + (${sharesTable.runsCount} * 2) + ${sharesTable.uniqueViews}`;

    const rows = await db
      .select({
        shareId:     sharesTable.shareId,
        title:       projectsTable.name,
        projectType: projectsTable.projectType,
        totalViews:  sharesTable.totalViews,
        uniqueViews: sharesTable.uniqueViews,
        forksCount:  sharesTable.forksCount,
        runsCount:   sharesTable.runsCount,
        score:       scoreExpr,
        createdAt:   sharesTable.createdAt,
      })
      .from(sharesTable)
      .innerJoin(projectsTable, eq(sharesTable.projectId, projectsTable.id))
      .orderBy(desc(scoreExpr), desc(sharesTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ projects: rows, hasMore: rows.length === limit });
  } catch (err) {
    logger.error({ err }, "explore fetch failed");
    res.status(500).json({ error: "Failed to load explore feed" });
  }
});

// ─── POST /api/projects/:id/share ─────────────────────────────────────────────

router.post("/projects/:id/share", requireAuth, projectLimiter, async (req, res) => {
  const projectId = validateId(req.params["id"]);
  if (!projectId) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  try {
    // Must own the project
    const [project] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, req.user!.userId)))
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
        shareId:  existing.shareId,
        stats:    toStats(existing),
      });
      return;
    }

    // Create new share record (retry on collision)
    let shareId  = newShareId();
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
});

// ─── GET /api/share/:shareId/stats ────────────────────────────────────────────

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
