/**
 * Package manager route
 * POST /api/packages/install — validate and record package installation
 */
import { Router } from "express";
import { optionalAuth } from "../middlewares/require-auth";
import { logger } from "../lib/logger";

const router = Router();

// In-memory registry: projectId → Set of packages
const projectPackages = new Map<string, Map<string, string>>();

router.post("/packages/install", optionalAuth, async (req, res) => {
  const { name, version, projectId } = req.body as {
    name?: string;
    version?: string;
    projectId?: string;
  };

  if (!name?.trim()) {
    res.status(400).json({ error: "Package name is required" });
    return;
  }

  // Validate package name (basic npm name rules)
  if (!/^(?:@[\w-]+\/)?[\w.-]+$/.test(name)) {
    res.status(400).json({ error: "Invalid package name" });
    return;
  }

  // Verify package exists on npm
  try {
    const npmRes = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/${version ?? "latest"}`, {
      headers: { "Accept": "application/json" },
    });

    if (!npmRes.ok) {
      res.status(404).json({ error: `Package "${name}" not found on npm` });
      return;
    }

    const pkgData = await npmRes.json() as { name: string; version: string; description?: string };

    // Track in memory
    if (projectId) {
      if (!projectPackages.has(projectId)) {
        projectPackages.set(projectId, new Map());
      }
      projectPackages.get(projectId)!.set(pkgData.name, pkgData.version);
    }

    logger.info({ package: pkgData.name, version: pkgData.version }, "package installed");

    res.json({
      success: true,
      package: {
        name: pkgData.name,
        version: pkgData.version,
        description: pkgData.description ?? "",
        cdnUrl: `https://cdn.jsdelivr.net/npm/${pkgData.name}@${pkgData.version}`,
      },
      message: `${pkgData.name}@${pkgData.version} is available via CDN`,
    });
  } catch (err) {
    logger.error({ err, package: name }, "package install failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Installation failed" });
  }
});

// GET /api/packages/:projectId — list installed packages for a project
router.get("/packages/:projectId", optionalAuth, (req, res) => {
  const packages = projectPackages.get(req.params["projectId"] ?? "");
  if (!packages) {
    res.json({ packages: [] });
    return;
  }
  res.json({
    packages: Array.from(packages.entries()).map(([name, version]) => ({ name, version })),
  });
});

export default router;
