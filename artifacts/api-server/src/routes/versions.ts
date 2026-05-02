/**
 * Version history API — file snapshots per project (max 10 kept).
 *
 * GET  /api/projects/:id/versions                     — list snapshots (no files)
 * POST /api/projects/:id/versions                     — create snapshot
 * GET  /api/projects/:id/versions/:versionId          — get snapshot with files
 * POST /api/projects/:id/versions/:versionId/restore  — restore snapshot → update project
 */
import { Router, type Request, type Response } from "express";
import { eq, and, asc, desc } from "drizzle-orm";
import { db, projectsTable, versionsTable, MAX_VERSIONS_PER_PROJECT } from "@workspace/db";
import { logger } from "../lib/logger";
import { projectLimiter } from "../middlewares/rate-limit";

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

/** Verify ownership then return the project, or send 401/404 and return null */
async function requireOwnedProject(
  projectId: string,
  userKey: string,
  res: Response,
) {
  const [project] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userKey, userKey)))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return null;
  }
  return project;
}

// ─── GET /api/projects/:id/versions ───────────────────────────────────────────

router.get("/projects/:id/versions", projectLimiter, async (req, res) => {
  const userKey = validateUserKey(req, res);
  if (!userKey) return;

  const projectId = validateId(req.params["id"]);
  if (!projectId) { res.status(400).json({ error: "Invalid project ID" }); return; }

  const project = await requireOwnedProject(projectId, userKey, res);
  if (!project) return;

  try {
    const versions = await db
      .select({
        id:        versionsTable.id,
        projectId: versionsTable.projectId,
        label:     versionsTable.label,
        createdAt: versionsTable.createdAt,
      })
      .from(versionsTable)
      .where(eq(versionsTable.projectId, projectId))
      .orderBy(desc(versionsTable.createdAt))
      .limit(MAX_VERSIONS_PER_PROJECT);

    res.json({ versions });
  } catch (err) {
    logger.error({ err, projectId }, "list versions failed");
    res.status(500).json({ error: "Failed to list versions" });
  }
});

// ─── POST /api/projects/:id/versions ──────────────────────────────────────────

router.post("/projects/:id/versions", projectLimiter, async (req, res) => {
  const userKey = validateUserKey(req, res);
  if (!userKey) return;

  const projectId = validateId(req.params["id"]);
  if (!projectId) { res.status(400).json({ error: "Invalid project ID" }); return; }

  const project = await requireOwnedProject(projectId, userKey, res);
  if (!project) return;

  const label = typeof (req.body as Record<string, unknown>)["label"] === "string"
    ? String((req.body as Record<string, unknown>)["label"]).slice(0, 80)
    : "";

  try {
    // Load current files
    const [full] = await db
      .select({ files: projectsTable.files })
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .limit(1);

    if (!full) { res.status(404).json({ error: "Project not found" }); return; }

    // Insert snapshot
    const [version] = await db
      .insert(versionsTable)
      .values({ projectId, files: full.files, label })
      .returning({ id: versionsTable.id, label: versionsTable.label, createdAt: versionsTable.createdAt });

    // Prune oldest beyond cap — keep newest MAX_VERSIONS_PER_PROJECT
    const allVersions = await db
      .select({ id: versionsTable.id })
      .from(versionsTable)
      .where(eq(versionsTable.projectId, projectId))
      .orderBy(asc(versionsTable.createdAt));

    const toDelete = allVersions.slice(0, Math.max(0, allVersions.length - MAX_VERSIONS_PER_PROJECT));
    for (const v of toDelete) {
      await db.delete(versionsTable).where(eq(versionsTable.id, v.id));
    }

    res.status(201).json({ version });
  } catch (err) {
    logger.error({ err, projectId }, "create version failed");
    res.status(500).json({ error: "Failed to create version" });
  }
});

// ─── GET /api/projects/:id/versions/:versionId ────────────────────────────────

router.get("/projects/:id/versions/:versionId", projectLimiter, async (req, res) => {
  const userKey = validateUserKey(req, res);
  if (!userKey) return;

  const projectId   = validateId(req.params["id"]);
  const versionId   = validateId(req.params["versionId"]);
  if (!projectId || !versionId) { res.status(400).json({ error: "Invalid ID" }); return; }

  const project = await requireOwnedProject(projectId, userKey, res);
  if (!project) return;

  try {
    const [version] = await db
      .select()
      .from(versionsTable)
      .where(and(eq(versionsTable.id, versionId), eq(versionsTable.projectId, projectId)))
      .limit(1);

    if (!version) { res.status(404).json({ error: "Version not found" }); return; }
    res.json({ version });
  } catch (err) {
    logger.error({ err, projectId, versionId }, "get version failed");
    res.status(500).json({ error: "Failed to load version" });
  }
});

// ─── POST /api/projects/:id/versions/:versionId/restore ───────────────────────

router.post("/projects/:id/versions/:versionId/restore", projectLimiter, async (req, res) => {
  const userKey = validateUserKey(req, res);
  if (!userKey) return;

  const projectId   = validateId(req.params["id"]);
  const versionId   = validateId(req.params["versionId"]);
  if (!projectId || !versionId) { res.status(400).json({ error: "Invalid ID" }); return; }

  const project = await requireOwnedProject(projectId, userKey, res);
  if (!project) return;

  try {
    const [version] = await db
      .select()
      .from(versionsTable)
      .where(and(eq(versionsTable.id, versionId), eq(versionsTable.projectId, projectId)))
      .limit(1);

    if (!version) { res.status(404).json({ error: "Version not found" }); return; }

    // Snapshot current state before restoring (so user can undo the restore)
    await db.insert(versionsTable).values({
      projectId,
      files: (await db.select({ files: projectsTable.files }).from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1))[0]?.files ?? {},
      label: "Before restore",
    });

    // Apply the restored files
    const [updated] = await db
      .update(projectsTable)
      .set({ files: version.files, updatedAt: new Date() })
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userKey, userKey)))
      .returning();

    res.json({ project: updated, restoredFrom: versionId });
  } catch (err) {
    logger.error({ err, projectId, versionId }, "restore version failed");
    res.status(500).json({ error: "Failed to restore version" });
  }
});

export default router;
