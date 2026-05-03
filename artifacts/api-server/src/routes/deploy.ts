/**
 * Deploy / Preview URL
 * POST /api/deploy — create a temporary hosted preview for an HTML/JS project
 * GET  /api/deploy/:id — serve the deployed preview
 */
import { Router } from "express";
import { randomBytes } from "crypto";
import { optionalAuth } from "../middlewares/require-auth";
import { logger } from "../lib/logger";

const router = Router();

interface Deploy {
  id: string;
  files: Record<string, string>;
  projectName: string;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory store (survives restarts via Map; use DB for production)
const deployStore = new Map<string, Deploy>();

// ─── POST /api/deploy ─────────────────────────────────────────────────────────

router.post("/deploy", optionalAuth, (req, res) => {
  const { files, projectName = "preview" } = req.body as {
    files?: Record<string, string>;
    projectName?: string;
  };

  if (!files || typeof files !== "object" || Object.keys(files).length === 0) {
    res.status(400).json({ error: "files object is required and must not be empty" });
    return;
  }

  const id = randomBytes(8).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  deployStore.set(id, {
    id,
    files,
    projectName,
    createdAt: now,
    expiresAt,
  });

  // Build the preview URL
  const host = req.get("host") ?? "localhost";
  const protocol = req.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const url = `${protocol}://${host}/api/deploy/${id}`;

  logger.info({ deployId: id, fileCount: Object.keys(files).length }, "deploy created");

  res.json({
    deploy: {
      url,
      deployId: id,
      expiresAt: expiresAt.toISOString(),
    },
  });
});

// ─── GET /api/deploy/:id ──────────────────────────────────────────────────────

router.get("/deploy/:id", (req, res) => {
  const deploy = deployStore.get(req.params["id"] ?? "");
  if (!deploy) {
    res.status(404).send("<h1>Preview not found or expired</h1>");
    return;
  }

  if (new Date() > deploy.expiresAt) {
    deployStore.delete(deploy.id);
    res.status(410).send("<h1>Preview has expired</h1>");
    return;
  }

  // Serve the requested file (or index.html by default)
  const requestedFile = req.query["file"] as string | undefined;
  const filename = requestedFile ?? Object.keys(deploy.files).find(
    (f) => f === "index.html" || f.endsWith("/index.html") || f.endsWith(".html")
  ) ?? Object.keys(deploy.files)[0];

  const content = deploy.files[filename];
  if (!content) {
    res.status(404).send(`<h1>File not found: ${filename}</h1>`);
    return;
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentTypeMap: Record<string, string> = {
    html: "text/html; charset=utf-8",
    htm:  "text/html; charset=utf-8",
    css:  "text/css; charset=utf-8",
    js:   "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    svg:  "image/svg+xml",
    txt:  "text/plain; charset=utf-8",
    md:   "text/markdown; charset=utf-8",
  };

  res.setHeader("Content-Type", contentTypeMap[ext] ?? "text/plain; charset=utf-8");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.send(content);
});

export default router;
