import { useState, useCallback } from "react";
import { getUserKey } from "@/lib/user-key";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-User-Key": getUserKey(),
  };
}

export interface ProjectSummary {
  id: string;
  name: string;
  projectType: string;
  createdAt: string;
  updatedAt: string;
}

export interface FullProject extends ProjectSummary {
  files: Record<string, string>;
}

export function useProjects() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/projects`, { headers: headers() });
      const data = await res.json() as { projects?: ProjectSummary[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load projects");
      setProjects(data.projects ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProject = useCallback(async (
    name: string,
    projectType: string,
    files: Record<string, string>,
    existingId?: string,
  ): Promise<ProjectSummary | null> => {
    setError(null);
    try {
      const url = existingId ? `${BASE}/api/projects/${existingId}` : `${BASE}/api/projects`;
      const method = existingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify({ name, projectType, files }),
      });
      const data = await res.json() as { project?: FullProject; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save project");

      const saved = data.project!;
      if (existingId) {
        setProjects((prev) => prev.map((p) => (p.id === existingId ? saved : p)));
      } else {
        setProjects((prev) => [saved, ...prev]);
      }
      return saved;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    }
  }, []);

  const loadProject = useCallback(async (id: string): Promise<FullProject | null> => {
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/projects/${id}`, { headers: headers() });
      const data = await res.json() as { project?: FullProject; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load project");
      return data.project ?? null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    }
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/projects/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Failed to delete");
      }
      setProjects((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    }
  }, []);

  return { projects, isLoading, error, listProjects, saveProject, loadProject, deleteProject };
}
