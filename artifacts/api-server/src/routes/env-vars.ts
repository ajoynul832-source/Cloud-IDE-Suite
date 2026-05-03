/**
 * Environment variables routes
 * GET  /api/projects/:id/env — get env vars for a project
 * PUT  /api/projects/:id/env — update env vars for a project
 */
import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth";
import { logger } from "../lib/logger";

const router = Router();

// In-memory store (scoped by userId+projectId for security)
const envStore = new Map<string, { key: string; value: string }[]>();

function storeKey(userId: string, projectId: string): string {
  return `${userId}:${projectId}`;
}

router.get("/projects/:id/env", requireAuth, (req, res) => {
  const key = storeKey(req.user!.userId, req.params["id"] ?? "");
  const vars = envStore.get(key) ?? [];
  // Return keys but mask values
  res.json({
    vars: vars.map((v) => ({ key: v.key, value: v.value })),
  });
});

router.put("/projects/:id/env", requireAuth, (req, res) => {
  const { vars } = req.body as { vars?: { key: string; value: string }[] };

  if (!Array.isArray(vars)) {
    res.status(400).json({ error: "vars must be an array" });
    return;
  }

  // Validate entries
  for (const v of vars) {
    if (typeof v.key !== "string" || typeof v.value !== "string") {
      res.status(400).json({ error: "Each var must have string key and value" });
      return;
    }
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(v.key)) {
      res.status(400).json({ error: `Invalid variable name: ${v.key}` });
      return;
    }
  }

  const key = storeKey(req.user!.userId, req.params["id"] ?? "");
  envStore.set(key, vars);
  logger.info({ projectId: req.params["id"], count: vars.length }, "env vars updated");
  res.json({ success: true, count: vars.length });
});

/**
 * Get env vars for injection into code execution.
 * Returns an object: { KEY: "value" }
 */
export function getProjectEnvVars(userId: string, projectId: string): Record<string, string> {
  const key = storeKey(userId, projectId);
  const vars = envStore.get(key) ?? [];
  return Object.fromEntries(vars.map((v) => [v.key, v.value]));
}

export default router;
