/**
 * POST /api/build/project — type-based project build & preview
 *
 * Routes:
 *  react-native → Expo Snack API → DB record + embed URL + QR (fast, no queue)
 *  flutter      → ZIP + BullMQ buildJobs queue → APK
 *  android      → ZIP + BullMQ buildJobs queue → APK (same pipeline as flutter)
 *  ios          → 400 (needs macOS/Xcode)
 */
import { Router }   from "express";
import { randomUUID } from "crypto";
import fsp           from "fs/promises";
import path          from "path";
import os            from "os";
import JSZip         from "jszip";
import { db, buildsTable } from "@workspace/db";
import { eq, inArray, and, count } from "drizzle-orm";
import { logger }    from "../lib/logger";
import { buildLimiter } from "../middlewares/rate-limit";
import { optionalAuth } from "../middlewares/require-auth";
import { checkAndIncrementBuilds, resolveUsageKey } from "../lib/usage";
import { isFlutterAvailable } from "../lib/flutter";
import { isAndroidAvailable } from "../lib/android";
import { getBuildQueue }      from "../lib/build-queue";

const router = Router();

// ─── Expo Snack helper ────────────────────────────────────────────────────────

interface SnackFile { type: "CODE" | "ASSET"; contents: string; }

async function createExpoSnack(files: Record<string, string>, name: string) {
  const snackFiles: Record<string, SnackFile> = {};
  for (const [p, contents] of Object.entries(files)) {
    snackFiles[p.replace(/^\//, "")] = { type: "CODE", contents };
  }
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

  const response = await fetch("https://exp.host/--/api/v2/snack", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Expo-Platform": "web" },
    body: JSON.stringify({
      manifest: { name: name || "CloudIDE Project", description: "Created with CloudIDE", sdkVersion: "51.0.0" },
      code: snackFiles,
      dependencies: {},
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Expo Snack API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as { id?: string; hashId?: string };
  const snackId = data.id ?? data.hashId ?? "";
  if (!snackId) throw new Error("Expo Snack API returned no snack ID");

  return {
    snackId,
    snackUrl: `https://snack.expo.dev/${snackId}`,
    embedUrl: `https://snack.expo.dev/embedded?snack=${snackId}&platform=web&preview=true&theme=dark`,
    qrUrl:    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`exp://exp.host/@snack/${snackId}`)}`,
  };
}

// ─── Flutter/Android ZIP helper ───────────────────────────────────────────────

async function writeZip(files: Record<string, string>, zipPath: string): Promise<void> {
  const zip = new JSZip();
  for (const [p, content] of Object.entries(files)) {
    zip.file(p.replace(/^\//, ""), content);
  }
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  await fsp.writeFile(zipPath, buf);
}

// ─── Active build count check ─────────────────────────────────────────────────

async function countActiveBuildsForUser(userId: string): Promise<number> {
  const rows = await db.select({ c: count() })
    .from(buildsTable)
    .where(and(
      eq(buildsTable.userId, userId as unknown as string),
      inArray(buildsTable.status, ["queued", "building"]),
    ));
  return Number(rows[0]?.c ?? 0);
}

// ─── Route ────────────────────────────────────────────────────────────────────

router.post("/build/project", optionalAuth, buildLimiter, async (req, res) => {
  const { type, files, name, projectId } = req.body as {
    type?:      string;
    files?:     Record<string, string>;
    name?:      string;
    projectId?: string;
  };

  if (!type || !["flutter", "react-native", "android", "ios"].includes(type)) {
    res.status(400).json({ error: "type must be one of: flutter, react-native, android, ios" });
    return;
  }
  if (!files || typeof files !== "object" || Object.keys(files).length === 0) {
    res.status(400).json({ error: '"files" map is required and must not be empty' });
    return;
  }

  const usageKey = resolveUsageKey(req.user?.userId, req.headers["x-user-key"], req.ip);
  const usage    = await checkAndIncrementBuilds(usageKey);
  if (!usage.allowed) {
    res.status(429).json({
      error: "Daily build limit reached (3/day). Resets at midnight UTC.",
      code: "DAILY_LIMIT_REACHED", remaining: 0,
    });
    return;
  }

  const buildId = randomUUID();
  logger.info({ buildId, type, fileCount: Object.keys(files).length }, "project build request");

  // ── React Native → Expo Snack (fast, no queue) ──────────────────────────
  if (type === "react-native") {
    try {
      const snack = await createExpoSnack(files, name ?? "My App");

      await db.insert(buildsTable).values({
        id:        buildId,
        userId:    req.user?.userId ?? null,
        projectId: projectId ?? null,
        language:  "react-native",
        status:    "complete",
        logText:   `[${new Date().toISOString()}] Expo Snack created\nSnack URL: ${snack.snackUrl}\n`,
        previewUrl: snack.snackUrl,
        embedUrl:   snack.embedUrl,
        qrUrl:      snack.qrUrl,
        completedAt: new Date(),
      });

      res.json({
        jobId:      buildId,
        status:     "preview_ready",
        previewUrl: snack.snackUrl,
        embedUrl:   snack.embedUrl,
        qrUrl:      snack.qrUrl,
        message:    "Expo Snack created — open on device via QR or view in browser",
      });
    } catch (err) {
      logger.error({ err, buildId }, "Expo Snack creation failed");
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: `Failed to create Expo Snack: ${msg}` });
    }
    return;
  }

  // ── Flutter → BullMQ queue ───────────────────────────────────────────────
  if (type === "flutter") {
    if (!isFlutterAvailable()) {
      res.status(503).json({
        error: "Flutter SDK is not installed on this server. APK builds are unavailable.",
        code: "FLUTTER_DISABLED",
      });
      return;
    }

    if (req.user?.userId) {
      const active = await countActiveBuildsForUser(req.user.userId);
      if (active >= 10) {
        res.status(429).json({ error: "Too many builds in queue. Wait for some to complete.", code: "QUEUE_FULL" });
        return;
      }
    }

    try {
      const zipPath = path.join(os.tmpdir(), `build_${buildId}.zip`);
      await writeZip(files, zipPath);

      await db.insert(buildsTable).values({
        id: buildId, userId: req.user?.userId ?? null, projectId: projectId ?? null,
        language: "flutter", status: "queued",
        logText: `[${new Date().toISOString()}] Queued flutter build\n`,
      });

      const queue = getBuildQueue();
      const waiting = await queue.getWaitingCount();
      await queue.add("flutter-build", { buildId, zipPath, language: "flutter" });

      res.json({
        jobId: buildId, status: "queued", queuePosition: waiting,
        message: `Flutter build queued. Poll /api/status/${buildId} for updates.`,
      });
    } catch (err) {
      logger.error({ err, buildId }, "flutter build queue failed");
      res.status(500).json({ error: `Failed to queue build: ${err instanceof Error ? err.message : "Unknown error"}` });
    }
    return;
  }

  // ── Android (Kotlin/Java) → BullMQ queue ────────────────────────────────
  if (type === "android") {
    if (!isAndroidAvailable()) {
      res.status(503).json({
        error: "Android SDK / Gradle is not configured on this server. Android APK builds are unavailable.",
        code: "ANDROID_DISABLED",
      });
      return;
    }

    if (req.user?.userId) {
      const active = await countActiveBuildsForUser(req.user.userId);
      if (active >= 10) {
        res.status(429).json({ error: "Too many builds in queue. Wait for some to complete.", code: "QUEUE_FULL" });
        return;
      }
    }

    try {
      const zipPath = path.join(os.tmpdir(), `android_build_${buildId}.zip`);
      await writeZip(files, zipPath);

      await db.insert(buildsTable).values({
        id: buildId, userId: req.user?.userId ?? null, projectId: projectId ?? null,
        language: "android", status: "queued",
        logText: `[${new Date().toISOString()}] Queued android build\n`,
      });

      const queue = getBuildQueue();
      const waiting = await queue.getWaitingCount();
      await queue.add("android-build", { buildId, zipPath, language: "android" });

      res.json({
        jobId: buildId, status: "queued", queuePosition: waiting,
        message: `Android build queued. Poll /api/status/${buildId} for updates.`,
      });
    } catch (err) {
      logger.error({ err, buildId }, "android build queue failed");
      res.status(500).json({ error: `Failed to queue build: ${err instanceof Error ? err.message : "Unknown error"}` });
    }
    return;
  }

  // ── iOS ──────────────────────────────────────────────────────────────────
  if (type === "ios") {
    res.status(400).json({
      error: "iOS builds require macOS and Xcode and cannot run on this server. Use Expo EAS (expo.dev/eas) for cloud iOS builds.",
    });
    return;
  }

  res.status(400).json({ error: `Unknown build type: ${type}` });
});

export default router;
