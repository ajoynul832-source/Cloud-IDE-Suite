import { Router } from "express";
import rateLimit from "express-rate-limit";

const router = Router();

const snackLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    if ((req as { user?: { userId?: string } }).user?.userId) {
      return `user:${(req as { user?: { userId?: string } }).user!.userId}`;
    }
    return req.ip ?? "anon";
  },
  message: { error: "TOO_MANY_REQUESTS", message: "Snack sync limit is 20/min — slow down a bit" },
  skip: () => process.env["NODE_ENV"] === "test",
});

interface SnackFile { type: "CODE"; contents: string; }

const FALLBACK_APP = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function App() {
  return (
    <View style={s.c}>
      <Text style={s.t}>Hello from CloudIDE!</Text>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117' },
  t: { color: '#4ade80', fontSize: 20, fontWeight: '700' },
});`;

// POST /snack — create or update an Expo Snack and return embed URL
// (mounted at /api via app.use("/api", router) — full path is /api/snack)
router.post("/snack", snackLimiter, async (req, res) => {
  const { files, name } = req.body as {
    files?: Record<string, string>;
    name?: string;
  };

  if (!files || typeof files !== "object") {
    res.status(400).json({ error: "MISSING_FILES", message: "files is required" });
    return;
  }

  const snackFiles: Record<string, SnackFile> = {};
  for (const [p, contents] of Object.entries(files)) {
    if (typeof contents === "string" && contents.length < 100_000) {
      snackFiles[p.replace(/^\//, "")] = { type: "CODE", contents };
    }
  }

  if (!snackFiles["App.js"] && !snackFiles["App.tsx"] && !snackFiles["App.ts"]) {
    snackFiles["App.js"] = { type: "CODE", contents: FALLBACK_APP };
  }

  try {
    // Try the current Expo Snack save API
    let snackId = "";
    let apiOk   = false;

    for (const url of [
      "https://snack.expo.dev/api/v2/snack",
      "https://exp.host/--/api/v2/snack/save",
    ]) {
      const resp = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Expo-Platform": "web" },
        body: JSON.stringify({
          manifest: {
            name:        name || "CloudIDE Preview",
            description: "Live preview from CloudIDE",
            sdkVersion:  "51.0.0",
          },
          code:         snackFiles,
          dependencies: {},
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { id?: string; hashId?: string };
        snackId = data.id ?? data.hashId ?? "";
        if (snackId) { apiOk = true; break; }
      }
    }

    // Fallback: use Expo's direct embed with code in URL (single-file only, no save needed)
    if (!apiOk) {
      const mainFile = snackFiles["App.js"] ?? snackFiles["App.tsx"] ?? snackFiles["App.ts"];
      const code     = mainFile?.contents ?? FALLBACK_APP;
      const encoded  = encodeURIComponent(code);
      // No snackId — client should use codeUrl directly
      res.json({
        snackId:  "",
        snackUrl: `https://snack.expo.dev/?code=${encoded}`,
        qrUrl:    "",
        codeUrl:  `https://snack.expo.dev/?code=${encoded}`,
        embedUrl: `https://snack.expo.dev/embedded?platform=web&preview=true&theme=dark&code=${encoded}`,
      });
      return;
    }

    res.json({
      snackId,
      snackUrl: `https://snack.expo.dev/${snackId}`,
      qrUrl:    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`exp://exp.host/@snack/${snackId}`)}`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    res.status(502).json({ error: "SNACK_FAILED", message: msg });
  }
});

export default router;
