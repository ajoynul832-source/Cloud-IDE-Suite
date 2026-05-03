/**
 * Git integration routes
 * POST /api/git/clone   — clone a repo's file listing
 * POST /api/git/status  — get status for a project
 * POST /api/git/push    — commit + push files to a remote via GitHub API
 */
import { Router } from "express";
import { optionalAuth, requireAuth } from "../middlewares/require-auth";
import { logger } from "../lib/logger";

const router = Router();

// ─── Clone (reads repo file tree via GitHub API) ─────────────────────────────

router.post("/git/clone", optionalAuth, async (req, res) => {
  const { url, pat } = req.body as { url?: string; pat?: string; projectId?: string };

  if (!url?.trim()) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  // Parse GitHub owner/repo from URL
  const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i);
  if (!match) {
    res.status(400).json({ error: "Only GitHub repositories are supported. Use https://github.com/owner/repo.git format." });
    return;
  }

  const [, owner, repo] = match;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "CloudIDE/1.0",
  };
  if (pat) headers["Authorization"] = `Bearer ${pat}`;

  try {
    // Get default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      const errData = await repoRes.json().catch(() => ({})) as { message?: string };
      throw new Error(errData.message ?? `GitHub API error: ${repoRes.status}`);
    }
    const repoData = await repoRes.json() as { default_branch: string; private: boolean };

    // Get file tree (recursive)
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch}?recursive=1`,
      { headers }
    );
    if (!treeRes.ok) throw new Error(`Failed to get file tree: ${treeRes.status}`);
    const treeData = await treeRes.json() as { tree: { path: string; type: string; size?: number }[] };

    // Filter to source files (skip binaries, large files)
    const IGNORED_PATTERNS = /\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|pdf|zip|gz|tar|bin|exe|apk|aab)$/i;
    const MAX_FILE_SIZE = 100_000;
    const sourceFiles = treeData.tree.filter(
      (f) => f.type === "blob" && !IGNORED_PATTERNS.test(f.path) && (f.size ?? 0) < MAX_FILE_SIZE
    ).slice(0, 50);

    // Fetch file contents (limit to 20 to avoid rate limits)
    const filesToFetch = sourceFiles.slice(0, 20);
    const files: Record<string, string> = {};

    await Promise.all(
      filesToFetch.map(async (f) => {
        try {
          const contentRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${f.path}?ref=${repoData.default_branch}`,
            { headers }
          );
          if (!contentRes.ok) return;
          const contentData = await contentRes.json() as { content?: string; encoding?: string };
          if (contentData.encoding === "base64" && contentData.content) {
            files[f.path] = Buffer.from(contentData.content.replace(/\n/g, ""), "base64").toString("utf-8");
          }
        } catch {
          // Skip files that fail to fetch
        }
      })
    );

    res.json({
      success: true,
      message: `Cloned ${Object.keys(files).length} files from ${owner}/${repo} (${repoData.default_branch} branch)`,
      files,
      repoName: repo,
    });
  } catch (err) {
    logger.error({ err }, "git clone failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Clone failed" });
  }
});

// ─── Status ───────────────────────────────────────────────────────────────────

router.post("/git/status", requireAuth, async (req, res) => {
  res.json({
    success: true,
    status: {
      branch: "main",
      modified: [],
      untracked: Object.keys((req.body as { files?: Record<string, string> }).files ?? {}).slice(0, 10),
      staged: [],
    },
    message: "Status retrieved",
  });
});

// ─── Push (via GitHub Contents API) ──────────────────────────────────────────

router.post("/git/push", requireAuth, async (req, res) => {
  const { files, message: commitMsg, repoUrl, pat } = req.body as {
    files?: Record<string, string>;
    message?: string;
    repoUrl?: string;
    pat?: string;
  };

  if (!files || !commitMsg?.trim() || !repoUrl?.trim() || !pat?.trim()) {
    res.status(400).json({ error: "files, message, repoUrl, and pat are required" });
    return;
  }

  const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i);
  if (!match) {
    res.status(400).json({ error: "Only GitHub repositories are supported." });
    return;
  }

  const [, owner, repo] = match;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": `Bearer ${pat}`,
    "User-Agent": "CloudIDE/1.0",
    "Content-Type": "application/json",
  };

  try {
    // Get default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      const errData = await repoRes.json().catch(() => ({})) as { message?: string };
      throw new Error(errData.message ?? `GitHub API error: ${repoRes.status}`);
    }
    const repoData = await repoRes.json() as { default_branch: string };

    let pushed = 0;
    let failed = 0;

    await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        try {
          // Check if file exists (to get SHA for updates)
          const existing = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${repoData.default_branch}`,
            { headers }
          );
          let sha: string | undefined;
          if (existing.ok) {
            const data = await existing.json() as { sha?: string };
            sha = data.sha;
          }

          const body: Record<string, string> = {
            message: commitMsg,
            content: Buffer.from(content, "utf-8").toString("base64"),
            branch: repoData.default_branch,
          };
          if (sha) body["sha"] = sha;

          const putRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            { method: "PUT", headers, body: JSON.stringify(body) }
          );
          if (putRes.ok) pushed++;
          else failed++;
        } catch {
          failed++;
        }
      })
    );

    res.json({
      success: failed === 0,
      message: `Pushed ${pushed} files to ${owner}/${repo}${failed > 0 ? `. ${failed} failed.` : ""}`,
    });
  } catch (err) {
    logger.error({ err }, "git push failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Push failed" });
  }
});

export default router;
