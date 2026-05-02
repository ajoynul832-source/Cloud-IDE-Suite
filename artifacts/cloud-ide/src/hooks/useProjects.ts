import { useState, useCallback } from "react";

const BASE = "/api";

/** All project API calls send the session cookie and no user-key header */
function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

export interface ProjectSummary {
  id:          string;
  name:        string;
  projectType: string;
  createdAt:   string;
  updatedAt:   string;
}

export interface FullProject extends ProjectSummary {
  files: Record<string, string>;
}

export interface VersionSummary {
  id:        string;
  projectId: string;
  label:     string;
  createdAt: string;
}

export interface FullVersion extends VersionSummary {
  files: Record<string, string>;
}

export function useProjects() {
  const [projects,  setProjects]  = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ─── Project CRUD ────────────────────────────────────────────────────────────

  const listProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res  = await authFetch(`${BASE}/projects`);
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
      const url    = existingId ? `${BASE}/projects/${existingId}` : `${BASE}/projects`;
      const method = existingId ? "PUT" : "POST";
      const res    = await authFetch(url, {
        method,
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
      const res  = await authFetch(`${BASE}/projects/${id}`);
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
      const res = await authFetch(`${BASE}/projects/${id}`, { method: "DELETE" });
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

  const renameProject = useCallback(async (id: string, name: string): Promise<ProjectSummary | null> => {
    setError(null);
    try {
      const res  = await authFetch(`${BASE}/projects/${id}`, {
        method: "PUT",
        body:   JSON.stringify({ name }),
      });
      const data = await res.json() as { project?: ProjectSummary; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to rename project");
      const updated = data.project!;
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    }
  }, []);

  const duplicateProject = useCallback(async (id: string): Promise<ProjectSummary | null> => {
    setError(null);
    try {
      const res  = await authFetch(`${BASE}/projects/${id}/duplicate`, { method: "POST" });
      const data = await res.json() as { project?: ProjectSummary; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to duplicate project");
      const copy = data.project!;
      setProjects((prev) => [copy, ...prev]);
      return copy;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    }
  }, []);

  // ─── Version history ─────────────────────────────────────────────────────────

  const listVersions = useCallback(async (projectId: string): Promise<VersionSummary[]> => {
    try {
      const res  = await authFetch(`${BASE}/projects/${projectId}/versions`);
      const data = await res.json() as { versions?: VersionSummary[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load versions");
      return data.versions ?? [];
    } catch {
      return [];
    }
  }, []);

  const createVersion = useCallback(async (projectId: string, label = ""): Promise<VersionSummary | null> => {
    try {
      const res  = await authFetch(`${BASE}/projects/${projectId}/versions`, {
        method: "POST",
        body:   JSON.stringify({ label }),
      });
      const data = await res.json() as { version?: VersionSummary; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create version");
      return data.version ?? null;
    } catch {
      return null;
    }
  }, []);

  const restoreVersion = useCallback(async (
    projectId: string,
    versionId: string,
  ): Promise<FullProject | null> => {
    try {
      const res  = await authFetch(`${BASE}/projects/${projectId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      const data = await res.json() as { project?: FullProject; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to restore version");
      return data.project ?? null;
    } catch {
      return null;
    }
  }, []);

  return {
    projects, isLoading, error,
    listProjects, saveProject, loadProject, deleteProject,
    renameProject, duplicateProject,
    listVersions, createVersion, restoreVersion,
  };
}
