import { useState, useEffect, useCallback } from "react";
import JSZip from "jszip";
import {
  useGetBuildStatus,
  useGetBuildLogs,
  getGetBuildStatusQueryKey,
  getGetBuildLogsQueryKey,
} from "@workspace/api-client-react";

// ─── Project type detection ───────────────────────────────────────────────────

export type ProjectBuildType =
  | "flutter"
  | "react-native"
  | "android"
  | "capacitor"   // HTML/JS/TS → Android APK via Capacitor
  | "web";        // Plain web — run in browser, no APK

/** Detect what kind of project this is from the file map */
export function detectProjectType(files: Record<string, string>): ProjectBuildType {
  const paths   = Object.keys(files).map((p) => p.toLowerCase());
  const content = Object.values(files).join("\n");

  // Flutter: has pubspec.yaml
  if (paths.some((p) => p.endsWith("pubspec.yaml"))) return "flutter";

  // Android native: has build.gradle (Kotlin/Java)
  if (paths.some((p) => p.endsWith("build.gradle") || p.endsWith("gradlew"))) return "android";

  // React Native / Expo: package.json mentions react-native or expo
  if (
    paths.some((p) => p.endsWith("package.json")) &&
    (content.includes("react-native") || content.includes('"expo"') || content.includes("'expo'"))
  ) return "react-native";

  // Capacitor-compatible: HTML/JS/TS project with an index.html
  if (paths.some((p) => p.endsWith("index.html"))) return "capacitor";

  // JS/TS-only without HTML: can use Capacitor if user wants, otherwise web
  if (paths.some((p) => p.endsWith(".html") || p.endsWith(".htm"))) return "capacitor";

  return "web";
}

/** Human-readable label + description per project type */
export const BUILD_TYPE_META: Record<ProjectBuildType, {
  label: string;
  icon: string;
  apkSupported: boolean;
  previewSupported: boolean;
  description: string;
}> = {
  flutter: {
    label: "Flutter",
    icon: "💙",
    apkSupported: true,
    previewSupported: false,
    description: "Compile to native Android APK with Flutter SDK",
  },
  "react-native": {
    label: "React Native",
    icon: "⚛️",
    apkSupported: true,
    previewSupported: true,
    description: "Live phone preview via Expo Snack, or build APK with Gradle",
  },
  android: {
    label: "Android",
    icon: "🤖",
    apkSupported: true,
    previewSupported: false,
    description: "Compile Kotlin/Java Android project to APK with Gradle",
  },
  capacitor: {
    label: "HTML/JS/TS → APK",
    icon: "🌐",
    apkSupported: true,
    previewSupported: true,
    description: "Wrap your web app in a native Android shell using Capacitor",
  },
  web: {
    label: "Web",
    icon: "🌍",
    apkSupported: false,
    previewSupported: true,
    description: "Runs in the browser — live preview, no APK needed",
  },
};

export interface BuildResult {
  jobId: string;
  status: string;
  previewUrl?: string | null;
  embedUrl?: string | null;
  qrUrl?: string | null;
  message?: string | null;
}

export function useBuild() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<ProjectBuildType>("web");
  const [previewData, setPreviewData] = useState<{
    embedUrl: string;
    qrUrl: string;
    snackUrl: string;
  } | null>(null);

  const buildStatus = useGetBuildStatus(jobId || "", {
    query: {
      enabled: !!jobId && isBuilding,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      refetchInterval: (query: any) => {
        const state = query.state.data;
        if (state?.status === "success" || state?.status === "failed") return false;
        return 2000;
      },
      queryKey: getGetBuildStatusQueryKey(jobId || ""),
    },
  });

  const buildLogs = useGetBuildLogs(jobId || "", {
    query: {
      enabled: !!jobId,
      refetchInterval: () => {
        const status = buildStatus.data?.status;
        if (status === "success" || status === "failed") return false;
        return 2000;
      },
      queryKey: getGetBuildLogsQueryKey(jobId || ""),
    },
  });

  useEffect(() => {
    if (
      buildStatus.data?.status === "success" ||
      buildStatus.data?.status === "failed"
    ) {
      setIsBuilding(false);
    }
  }, [buildStatus.data?.status]);

  const startBuild = useCallback(async (
    files: Record<string, string>,
    forcedType?: ProjectBuildType,
  ) => {
    setIsBuilding(true);
    setError(null);
    setJobId(null);
    setPreviewData(null);

    const type = forcedType ?? detectProjectType(files);
    setProjectType(type);

    try {
      // ── React Native → Expo Snack (fast preview, no queue) ─────────────────
      if (type === "react-native") {
        const res = await fetch(`/api/build/project`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, files, name: "CloudIDE App" }),
        });

        const data = (await res.json()) as BuildResult & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Build failed");

        setJobId(data.jobId);
        if (data.embedUrl && data.qrUrl && data.previewUrl) {
          setPreviewData({
            embedUrl: data.embedUrl,
            qrUrl:    data.qrUrl,
            snackUrl: data.previewUrl,
          });
        }
        setIsBuilding(false);
        return;
      }

      // ── Capacitor (HTML/JS/TS → APK via JSON) ──────────────────────────────
      if (type === "capacitor") {
        const res = await fetch(`/api/build/project`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, files, name: "CloudIDE App" }),
        });

        const data = (await res.json()) as BuildResult & { error?: string; code?: string };
        if (!res.ok) {
          if (data.code === "CAPACITOR_DISABLED") {
            throw new Error(
              "Capacitor SDK not available on this server.\n" +
              "To enable HTML/JS/TS → APK builds, self-host CloudIDE with Dockerfile.sdk.\n" +
              "See DEPLOY.md for instructions."
            );
          }
          throw new Error(data.error ?? "Build failed");
        }

        setJobId(data.jobId);
        setIsBuilding(true); // stay in building state, polling will update
        return;
      }

      // ── Flutter / Android → ZIP upload ────────────────────────────────────
      const zip = new JSZip();
      Object.entries(files).forEach(([filePath, content]) => {
        zip.file(filePath.replace(/^\//, ""), content);
      });

      const blob     = await zip.generateAsync({ type: "blob" });
      const formData = new FormData();
      formData.append("project", blob, "project.zip");

      const res = await fetch(`/api/build`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" })) as { error: string };
        throw new Error(body.error || "Failed to start build");
      }

      const data = await res.json() as { jobId: string };
      setJobId(data.jobId);

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error occurred";
      setError(msg);
      setIsBuilding(false);
    }
  }, []);

  return {
    isBuilding,
    jobId,
    error,
    projectType,
    previewData,
    startBuild,
    status: buildStatus.data,
    logs: buildLogs.data?.logs,
  };
}
