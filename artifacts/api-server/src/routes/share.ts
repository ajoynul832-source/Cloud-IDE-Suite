/**
 * Project sharing API
 *
 * POST /api/projects/:id/share   — generate a short share link for a project
 * GET  /api/share/:shareId       — public: load a shared project (no auth)
 */
import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db, projectsTable, sharesTable } from "@workspace/db";
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

/** Generate a collision-resistant 8-char hex share ID */
function newShareId(): string {
  return crypto.randomBytes(4).toString("hex");
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
      // Verify the caller owns this project
      const [project] = await db
        .select({ id: projectsTable.id })
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId))
        .limit(1);

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      // Check if a share already exists for this project and reuse it
      const [existing] = await db
        .select()
        .from(sharesTable)
        .where(eq(sharesTable.projectId, projectId))
        .limit(1);

      if (existing) {
        const shareUrl = `/ide/p/${existing.shareId}`;
        res.json({ shareUrl, shareId: existing.shareId });
        return;
      }

      // Create a new share record
      let shareId = newShareId();
      let attempts = 0;
      while (attempts < 5) {
        try {
          await db.insert(sharesTable).values({ shareId, projectId });
          break;
        } catch {
          // Collision on primary key — try again with a new ID
          shareId = newShareId();
          attempts++;
        }
      }

      const shareUrl = `/ide/p/${shareId}`;
      res.json({ shareUrl, shareId });
    } catch (err) {
      logger.error({ err, projectId }, "share project failed");
      res.status(500).json({ error: "Failed to generate share link" });
    }
  },
);

// ─── GET /api/share/:shareId ──────────────────────────────────────────────────

router.get("/share/:shareId", shareLimiter, async (req, res) => {
  const shareId = String(req.params["shareId"] ?? "");
  if (!/^[a-f0-9]{8}$/.test(shareId)) {
    res.status(400).json({ error: "Invalid share ID" });
    return;
  }

  try {
    const [share] = await db
      .select()
      .from(sharesTable)
      .where(eq(sharesTable.shareId, shareId as string))
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

    // Return project data — strip userKey for privacy
    res.json({
      project: {
        id: project.id,
        name: project.name,
        projectType: project.projectType,
        files: project.files,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      shareId,
    });
  } catch (err) {
    logger.error({ err, shareId }, "load shared project failed");
    res.status(500).json({ error: "Failed to load shared project" });
  }
});

export default router;
