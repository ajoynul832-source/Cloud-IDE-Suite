import { useState, useEffect, useCallback } from "react";
import JSZip from "jszip";
import {
  useGetBuildStatus,
  useGetBuildLogs,
  getGetBuildStatusQueryKey,
  getGetBuildLogsQueryKey,
} from "@workspace/api-client-react";

/** Detect project type from file map */
function detectProjectType(files: Record<string, string>): string {
  const paths = Object.keys(files).map((p) => p.toLowerCase());
  if (paths.some((p) => p.endsWith("pubspec.yaml"))) return "flutter";
  if (
    paths.some((p) => p.endsWith("package.json")) &&
    Object.values(files).some(
      (c) => c.includes("react-native") || c.includes("expo")
    )
  )
    return "react-native";
  if (
    paths.some((p) => p.endsWith("build.gradle") || p.endsWith("gradlew"))
  )
    return "android";
  return "flutter"; // default
}

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
  const [projectType, setProjectType] = useState<string>("flutter");
  const [previewData, setPreviewData] = useState<{
    embedUrl: string;
    qrUrl: string;
    snackUrl: string;
  } | null>(null);

  const buildStatus = useGetBuildStatus(jobId || "", {
    query: {
      enabled: !!jobId && isBuilding,
      refetchInterval: (query) => {
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

  const startBuild = useCallback(async (files: Record<string, string>) => {
    setIsBuilding(true);
    setError(null);
    setJobId(null);
    setPreviewData(null);

    const type = detectProjectType(files);
    setProjectType(type);

    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

    try {
      // React Native → JSON body to /build/project (creates Expo Snack)
      if (type === "react-native") {
        const res = await fetch(`${baseUrl}/api/build/project`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, files, name: "CloudIDE App" }),
        });

        const data = (await res.json()) as BuildResult;
        if (!res.ok) {
          throw new Error((data as unknown as { error: string }).error ?? "Build failed");
        }

        setJobId(data.jobId);
        if (data.embedUrl && data.qrUrl && data.previewUrl) {
          setPreviewData({
            embedUrl: data.embedUrl,
            qrUrl: data.qrUrl,
            snackUrl: data.previewUrl,
          });
        }
        setIsBuilding(false);
        return;
      }

      // Flutter / Android → ZIP upload
      const zip = new JSZip();
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path, content);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const formData = new FormData();
      formData.append("project", blob, "project.zip");

      const res = await fetch(`${baseUrl}/api/build`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error((body as { error: string }).error || "Failed to start build");
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
