/**
 * POST /api/build/project — type-based project build & preview
 *
 * Routes:
 *  react-native → creates an anonymous Expo Snack → returns embed URL + QR
 *  flutter      → packages files as ZIP → enqueues Flutter APK build
 *  android      → packages files as ZIP → attempts Gradle build
 */
import { Router } from "express";
import { randomBytes } from "crypto";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import JSZip from "jszip";
import { logger } from "../lib/logger";
import { buildLimiter } from "../middlewares/rate-limit";
import { checkAndIncrementBuilds, resolveUsageKey } from "../lib/usage";

// Re-export job map from build route (we share the same in-memory store)
import { jobs, queue, processQueue } from "./build-shared";

const router = Router();

// ---------- helpers ----------

function makeJobId() {
  return `${Date.now()}-${randomBytes(4).toString("hex")}`;
}

// ---------- Expo Snack ----------

interface SnackFile {
  type: "CODE" | "ASSET";
  contents: string;
}

async function createExpoSnack(
  files: Record<string, string>,
  name: string
): Promise<{ snackId: string; snackUrl: string; embedUrl: string; qrUrl: string }> {
  const snackFiles: Record<string, SnackFile> = {};

  // Map project files → Snack format
  for (const [filePath, contents] of Object.entries(files)) {
    // Snack expects paths without leading slash
    const snackPath = filePath.replace(/^\//, "");
    snackFiles[snackPath] = { type: "CODE", contents };
  }

  // Ensure App.js exists (Snack entry point)
  if (!snackFiles["App.js"] && !snackFiles["App.tsx"] && !snackFiles["App.ts"]) {
    snackFiles["App.js"] = {
      type: "CODE",
      contents: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello from CloudIDE!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d' },
  text: { color: '#4ade80', fontSize: 24, fontWeight: 'bold' },
});`,
    };
  }

  const body = {
    manifest: {
      name: name || "CloudIDE Project",
      description: "Created with CloudIDE",
      sdkVersion: "51.0.0",
    },
    code: snackFiles,
    dependencies: {},
  };

  const response = await fetch("https://exp.host/--/api/v2/snack", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Expo-Platform": "web",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Expo Snack API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as { id?: string; hashId?: string };
  const snackId = data.id ?? data.hashId ?? "";

  if (!snackId) {
    throw new Error("Expo Snack API returned no snack ID");
  }

  return {
    snackId,
    snackUrl: `https://snack.expo.dev/${snackId}`,
    embedUrl: `https://snack.expo.dev/embedded?snack=${snackId}&platform=web&preview=true&theme=dark`,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`exp://exp.host/@snack/${snackId}`)}`,
  };
}

// ---------- Flutter / Android ZIP build ----------

async function startZipBuild(files: Record<string, string>, jobId: string): Promise<void> {
  const zip = new JSZip();

  for (const [filePath, content] of Object.entries(files)) {
    zip.file(filePath.replace(/^\//, ""), content);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const zipPath = path.join(os.tmpdir(), `${jobId}.zip`);
  await fsp.writeFile(zipPath, zipBuffer);
}

// ---------- Route ----------

router.post("/build/project", buildLimiter, async (req, res) => {
  const { type, files, name } = req.body as {
    type?: string;
    files?: Record<string, string>;
    name?: string;
  };

  if (!type || !["flutter", "react-native", "android", "ios"].includes(type)) {
    res.status(400).json({ error: 'type must be one of: flutter, react-native, android, ios' });
    return;
  }

  if (!files || typeof files !== "object" || Object.keys(files).length === 0) {
    res.status(400).json({ error: '"files" map is required and must not be empty' });
    return;
  }

  const usageKey = resolveUsageKey(req.user?.userId, req.headers["x-user-key"], req.ip);
  const buildUsage = await checkAndIncrementBuilds(usageKey);
  if (!buildUsage.allowed) {
    res.status(429).json({
      error: "Daily build limit reached (3/day). Resets at midnight UTC.",
      code: "DAILY_LIMIT_REACHED",
      remaining: 0,
    });
    return;
  }

  const jobId = makeJobId();
  logger.info({ jobId, type, fileCount: Object.keys(files).length, buildsRemaining: buildUsage.remaining }, "project build request");

  // ---- React Native → Expo Snack preview ----
  if (type === "react-native") {
    try {
      const snack = await createExpoSnack(files, name ?? "My App");

      // Store a lightweight job record so /status/:id works
      jobs.set(jobId, {
        jobId,
        status: "success",
        logs: `[Expo Snack] Preview ready!\nSnack URL: ${snack.snackUrl}\nEmbed URL: ${snack.embedUrl}\n`,
        apkPath: null,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        stage: null,
        previewUrl: snack.snackUrl,
        embedUrl: snack.embedUrl,
        qrUrl: snack.qrUrl,
      });

      res.json({
        jobId,
        status: "preview_ready",
        previewUrl: snack.snackUrl,
        embedUrl: snack.embedUrl,
        qrUrl: snack.qrUrl,
        message: "Expo Snack created — open on device via QR or view in browser",
      });
    } catch (err) {
      logger.error({ err, jobId }, "Expo Snack creation failed");
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: `Failed to create Expo Snack: ${msg}` });
    }
    return;
  }

  // ---- Flutter / Android → ZIP + existing build pipeline ----
  if (type === "flutter" || type === "android") {
    try {
      await startZipBuild(files, jobId);

      jobs.set(jobId, {
        jobId,
        status: "queued",
        logs: `[${new Date().toISOString()}] Queued ${type} build\n`,
        apkPath: null,
        startedAt: null,
        completedAt: null,
        stage: null,
      });
      queue.push(jobId);
      processQueue();

      res.json({
        jobId,
        status: "queued",
        message: `${type === "flutter" ? "Flutter" : "Android"} build queued. Poll /api/status/${jobId} for updates.`,
      });
    } catch (err) {
      logger.error({ err, jobId }, "ZIP packaging failed");
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: `Failed to package project: ${msg}` });
    }
    return;
  }

  // iOS — not supported server-side (needs macOS + Xcode)
  if (type === "ios") {
    res.status(400).json({
      error: "iOS builds require macOS and Xcode and cannot be performed on this server. Use Expo EAS (expo.dev/eas) for cloud iOS builds.",
    });
    return;
  }

  res.status(400).json({ error: `Unknown build type: ${type}` });
});

export default router;
