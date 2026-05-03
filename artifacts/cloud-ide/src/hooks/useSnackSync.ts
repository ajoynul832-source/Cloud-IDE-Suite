import { useState, useEffect, useCallback, useRef } from "react";

export type SnackPlatform = "android" | "ios" | "web";

export interface SnackSyncData {
  snackId:  string;
  snackUrl: string;
  qrUrl:    string;
  embedUrl: string | null;
}

function isReactNativeProject(files: Record<string, string>): boolean {
  const names = Object.keys(files).map((k) => k.toLowerCase());
  if (names.some((n) => n === "app.js" || n === "app.tsx" || n === "app.ts")) {
    const content = Object.entries(files).find(([k]) =>
      k.toLowerCase() === "app.js" || k.toLowerCase() === "app.tsx" || k.toLowerCase() === "app.ts"
    )?.[1] ?? "";
    if (
      content.includes("react-native") ||
      content.includes("expo") ||
      content.includes("StyleSheet") ||
      content.includes("View") ||
      content.includes("Text")
    ) return true;
  }
  const allContent = Object.values(files).join("\n");
  return (
    allContent.includes("from 'react-native'") ||
    allContent.includes('from "react-native"') ||
    allContent.includes("from 'expo'") ||
    allContent.includes('from "expo"') ||
    names.some((n) => n === "app.json" && allContent.includes("expo"))
  );
}

function hashFiles(files: Record<string, string>): string {
  return Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v.length}`)
    .join("|");
}

const SYNC_DEBOUNCE_MS = 3_000;

export function useSnackSync(files: Record<string, string>) {
  const [snackData,  setSnackData]  = useState<SnackSyncData | null>(null);
  const [isSyncing,  setIsSyncing]  = useState(false);
  const [syncError,  setSyncError]  = useState<string | null>(null);
  const [platform,   setPlatform]   = useState<SnackPlatform>("android");

  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedHash  = useRef<string>("");
  const filesRef        = useRef(files);
  filesRef.current      = files;

  const isRNProject = isReactNativeProject(files);

  const syncToSnack = useCallback(async (currentFiles: Record<string, string>, force = false) => {
    const hash = hashFiles(currentFiles);
    if (!force && hash === lastSyncedHash.current) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch("/api/snack", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ files: currentFiles, name: "CloudIDE App" }),
      });

      const data = (await res.json()) as {
        snackId?:  string;
        snackUrl?: string;
        qrUrl?:    string;
        embedUrl?: string;
        codeUrl?:  string;
        error?:    string;
        message?:  string;
      };

      if (!res.ok || data.error) {
        throw new Error(data.message ?? data.error ?? "Sync failed");
      }

      // Server may return either a saved snackId OR a direct embed URL (fallback)
      if (data.snackId && data.snackUrl) {
        setSnackData({
          snackId:  data.snackId,
          snackUrl: data.snackUrl,
          qrUrl:    data.qrUrl ?? "",
          embedUrl: data.embedUrl ?? null,
        });
      } else if (data.embedUrl) {
        setSnackData({
          snackId:  "",
          snackUrl: data.snackUrl ?? "",
          qrUrl:    "",
          embedUrl: data.embedUrl,
        });
      }
      lastSyncedHash.current = hash;
    } catch (e: unknown) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!isRNProject) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      syncToSnack(filesRef.current);
    }, SYNC_DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isRNProject]);

  const syncNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    syncToSnack(filesRef.current, true);
  }, [syncToSnack]);

  // Build embed URL: prefer server-provided, fall back to constructing from snackId
  const embedUrl = snackData
    ? snackData.embedUrl
      ?? (snackData.snackId
          ? `https://snack.expo.dev/embedded?snack=${snackData.snackId}&platform=${platform}&preview=true&theme=dark&sdkVersion=51.0.0`
          : null)
    : null;

  return { isRNProject, snackData, embedUrl, isSyncing, syncError, platform, setPlatform, syncNow };
}
