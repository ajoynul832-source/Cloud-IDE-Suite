/**
 * GET /api/docs  — Swagger UI (interactive API documentation)
 * GET /api/docs/spec.json — Raw OpenAPI spec as JSON
 *
 * Phase 8 — Documentation & Deployment.
 * Reads the canonical OpenAPI spec from lib/api-spec/openapi.yaml at startup
 * and serves it via swagger-ui-express.
 */
import { Router, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { load as yamlLoad } from "js-yaml";
import fsp from "fs/promises";
import path from "path";
import { logger } from "../lib/logger";

const router = Router();

// ─── Load spec from lib/api-spec/openapi.yaml ─────────────────────────────────

let _spec: Record<string, unknown> | null = null;

async function loadSpec(): Promise<Record<string, unknown>> {
  if (_spec) return _spec;

  // process.cwd() = artifacts/api-server  (pnpm changes to package dir)
  // Two levels up from the package reaches the workspace root
  const candidates = [
    path.resolve(process.cwd(), "..", "..", "lib", "api-spec", "openapi.yaml"),
    path.resolve(process.cwd(), "lib", "api-spec", "openapi.yaml"),
    path.resolve(process.cwd(), "openapi.yaml"),
  ];

  for (const p of candidates) {
    try {
      const raw  = await fsp.readFile(p, "utf8");
      _spec = yamlLoad(raw) as Record<string, unknown>;
      logger.info({ path: p }, "docs: loaded OpenAPI spec");
      return _spec;
    } catch { /* try next */ }
  }

  logger.warn("docs: openapi.yaml not found at any candidate path — using minimal fallback");
  _spec = {
    openapi: "3.1.0",
    info: { title: "Cloud IDE API", version: "1.0.0" },
    paths: {},
  };
  return _spec;
}

// ─── Raw JSON spec endpoint ───────────────────────────────────────────────────

router.get("/docs/spec.json", async (_req: Request, res: Response) => {
  try {
    const spec = await loadSpec();
    res.json(spec);
  } catch (err) {
    logger.error({ err }, "docs: failed to serve spec.json");
    res.status(500).json({ error: "Failed to load OpenAPI spec" });
  }
});

// ─── Swagger UI ───────────────────────────────────────────────────────────────

// Lazy-initialise the swagger-ui middleware once the spec is loaded
let _uiMiddleware: ReturnType<typeof swaggerUi.setup> | null = null;

// Serve Swagger static assets (CSS, JS bundles) for any sub-path under /docs/
router.use("/docs", swaggerUi.serve);

// Build the setup middleware lazily (spec is read from disk on first request)
async function getUiMiddleware(): Promise<ReturnType<typeof swaggerUi.setup>> {
  if (!_uiMiddleware) {
    const spec   = await loadSpec();
    _uiMiddleware = swaggerUi.setup(spec, {
      customSiteTitle: "Cloud IDE API Docs",
      customCss: `
        .swagger-ui .topbar { background: #0d0d0d; }
        .swagger-ui .topbar-wrapper .link { display: none; }
      `,
      swaggerOptions: {
        url:                     "/api/docs/spec.json",
        persistAuthorization:    true,
        filter:                  true,
        deepLinking:             true,
        displayRequestDuration:  true,
      },
    });
  }
  return _uiMiddleware;
}

// Serve the UI at both /docs and /docs/ to avoid the 301 redirect
async function serveUi(req: Request, res: Response): Promise<void> {
  try {
    const mw = await getUiMiddleware();
    mw(req, res, () => { res.status(404).send("Not found"); });
  } catch (err) {
    logger.error({ err }, "docs: Swagger UI failed");
    res.status(500).send("Failed to load API documentation");
  }
}

router.get("/docs",  serveUi);
router.get("/docs/", serveUi);

export default router;
