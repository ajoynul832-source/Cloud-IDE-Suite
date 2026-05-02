/**
 * Project CRUD API — stored in PostgreSQL, scoped by X-User-Key header.
 *
 * GET    /api/projects          — list user's projects
 * POST   /api/projects          — create project
 * GET    /api/projects/:id      — get single project (must own it)
 * PUT    /api/projects/:id      — update project files / name
 * DELETE /api/projects/:id      — delete project
 */
import { Router, type Request, type Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, projectsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { projectLimiter } from "../middlewares/rate-limit";

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

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

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/projects
router.get("/projects", projectLimiter, async (req, res) => {
  const userKey = validateUserKey(req, res);
  if (!userKey) return;

  try {
    const projects = await db
      .select({
        id: projectsTable.id,
        name: projectsTable.name,
        projectType: projectsTable.projectType,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
      })
      .from(projectsTable)
      .where(eq(projectsTable.userKey, userKey))
      .orderBy(desc(projectsTable.updatedAt));

    res.json({ projects });
  } catch (err) {
    logger.error({ err }, "list projects failed");
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// POST /api/projects
router.post("/projects", projectLimiter, async (req, res) => {
  const userKey = validateUserKey(req, res);
  if (!userKey) return;

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

  try {
    const [project] = await db
      .insert(projectsTable)
      .values({
        userKey,
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

// GET /api/projects/:id
router.get("/projects/:id", projectLimiter, async (req, res) => {
  const userKey = validateUserKey(req, res);
  if (!userKey) return;

  const id = validateId(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid project ID" }); return; }

  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userKey, userKey)))
      .limit(1);

    if (!project) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ project });
  } catch (err) {
    logger.error({ err, id }, "get project failed");
    res.status(500).json({ error: "Failed to load project" });
  }
});

// PUT /api/projects/:id
router.put("/projects/:id", projectLimiter, async (req, res) => {
  const userKey = validateUserKey(req, res);
  if (!userKey) return;

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
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userKey, userKey)))
      .returning();

    if (!updated) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ project: updated });
  } catch (err) {
    logger.error({ err, id }, "update project failed");
    res.status(500).json({ error: "Failed to update project" });
  }
});

// DELETE /api/projects/:id
router.delete("/projects/:id", projectLimiter, async (req, res) => {
  const userKey = validateUserKey(req, res);
  if (!userKey) return;

  const id = validateId(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid project ID" }); return; }

  try {
    const [deleted] = await db
      .delete(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userKey, userKey)))
      .returning({ id: projectsTable.id });

    if (!deleted) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ success: true, id: deleted.id });
  } catch (err) {
    logger.error({ err, id }, "delete project failed");
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
