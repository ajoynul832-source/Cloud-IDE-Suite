/**
 * Project CRUD API — authenticated, scoped by user_id from JWT.
 *
 * GET    /api/projects                  — list user's projects
 * POST   /api/projects                  — create project
 * GET    /api/projects/:id              — get single project (must own)
 * PUT    /api/projects/:id              — update project
 * POST   /api/projects/:id/duplicate   — duplicate project
 * DELETE /api/projects/:id              — delete project
 */
import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, projectsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { projectLimiter } from "../middlewares/rate-limit";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();

function validateId(id: unknown): string | null {
  if (typeof id !== "string" || !/^[a-f0-9-]{8,64}$/.test(id)) return null;
  return id;
}

// ─── GET /api/projects ────────────────────────────────────────────────────────

router.get("/projects", requireAuth, projectLimiter, async (req, res) => {
  try {
    const projects = await db
      .select({
        id:          projectsTable.id,
        name:        projectsTable.name,
        projectType: projectsTable.projectType,
        createdAt:   projectsTable.createdAt,
        updatedAt:   projectsTable.updatedAt,
      })
      .from(projectsTable)
      .where(eq(projectsTable.userId, req.user!.userId))
      .orderBy(desc(projectsTable.updatedAt));

    res.json({ projects });
  } catch (err) {
    logger.error({ err }, "list projects failed");
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// ─── POST /api/projects ───────────────────────────────────────────────────────

router.post("/projects", requireAuth, projectLimiter, async (req, res) => {
  const { name, projectType, files } = req.body as {
    name?: unknown;
    projectType?: unknown;
    files?: unknown;
  };

  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: '"name" is required and must be a non-empty string' });
    return;
  }
  if (typeof files !== "object" || files === null || Array.isArray(files)) {
    res.status(400).json({ error: '"files" must be an object map of filename → content' });
    return;
  }

  const safeType = typeof projectType === "string" ? projectType : "javascript";
  const userId   = req.user!.userId;

  try {
    const [project] = await db
      .insert(projectsTable)
      .values({
        userId,
        userKey: userId, // satisfy NOT NULL — mirrors userId for auth'd projects
        name: name.trim().slice(0, 120),
        projectType: safeType,
        files: files as Record<string, string>,
      })
      .returning();

    res.status(201).json({ project });
  } catch (err) {
    logger.error({ err }, "create project failed");
    res.status(500).json({ error: "Failed to create project" });
  }
});

// ─── GET /api/projects/:id ────────────────────────────────────────────────────

router.get("/projects/:id", requireAuth, projectLimiter, async (req, res) => {
  const id = validateId(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid project ID" }); return; }

  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.userId)))
      .limit(1);

    if (!project) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ project });
  } catch (err) {
    logger.error({ err, id }, "get project failed");
    res.status(500).json({ error: "Failed to load project" });
  }
});

// ─── PUT /api/projects/:id ────────────────────────────────────────────────────

router.put("/projects/:id", requireAuth, projectLimiter, async (req, res) => {
  const id = validateId(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid project ID" }); return; }

  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body["name"] === "string" && body["name"].trim().length > 0) {
    updates["name"] = body["name"].trim().slice(0, 120);
  }
  if (typeof body["projectType"] === "string") {
    updates["projectType"] = body["projectType"];
  }
  if (typeof body["files"] === "object" && body["files"] !== null && !Array.isArray(body["files"])) {
    updates["files"] = body["files"];
  }

  if (Object.keys(updates).length === 1) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  try {
    const [updated] = await db
      .update(projectsTable)
      .set(updates)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.userId)))
      .returning();

    if (!updated) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ project: updated });
  } catch (err) {
    logger.error({ err, id }, "update project failed");
    res.status(500).json({ error: "Failed to update project" });
  }
});

// ─── POST /api/projects/:id/duplicate ────────────────────────────────────────

router.post("/projects/:id/duplicate", requireAuth, projectLimiter, async (req, res) => {
  const id = validateId(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid project ID" }); return; }

  const userId = req.user!.userId;

  try {
    const [source] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
      .limit(1);

    if (!source) { res.status(404).json({ error: "Project not found" }); return; }

    const [copy] = await db
      .insert(projectsTable)
      .values({
        userId,
        userKey:     userId,
        name:        `Copy of ${source.name}`.slice(0, 120),
        projectType: source.projectType,
        files:       source.files,
      })
      .returning();

    res.status(201).json({ project: copy });
  } catch (err) {
    logger.error({ err, id }, "duplicate project failed");
    res.status(500).json({ error: "Failed to duplicate project" });
  }
});

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────

router.delete("/projects/:id", requireAuth, projectLimiter, async (req, res) => {
  const id = validateId(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid project ID" }); return; }

  try {
    const [deleted] = await db
      .delete(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.userId)))
      .returning({ id: projectsTable.id });

    if (!deleted) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ success: true, id: deleted.id });
  } catch (err) {
    logger.error({ err, id }, "delete project failed");
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
