import { useState, useEffect } from "react";
import JSZip from "jszip";
import {
  useGetBuildStatus,
  useGetBuildLogs,
  getGetBuildStatusQueryKey,
  getGetBuildLogsQueryKey,
} from "@workspace/api-client-react";

export function useBuild() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const startBuild = async (files: Record<string, string>) => {
    setIsBuilding(true);
    setError(null);
    setJobId(null);

    try {
      const zip = new JSZip();
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path, content);
      });

      const blob = await zip.generateAsync({ type: "blob" });

      const formData = new FormData();
      formData.append("project", blob, "project.zip");

      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/build`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || "Failed to start build");
      }

      const data = await res.json();
      setJobId(data.jobId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error occurred";
      setError(msg);
      setIsBuilding(false);
    }
  };

  return {
    isBuilding,
    jobId,
    error,
    startBuild,
    status: buildStatus.data,
    logs: buildLogs.data?.logs,
  };
}
