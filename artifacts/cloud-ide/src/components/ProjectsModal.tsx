import { useEffect, useState } from "react";
import { FolderOpen, Save, Trash2, X, Loader2, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useProjects, ProjectSummary } from "@/hooks/useProjects";

interface ProjectsModalProps {
  currentFiles: Record<string, string>;
  currentProjectType: string;
  currentProjectId: string | null;
  onLoad: (files: Record<string, string>, name: string, id: string) => void;
  onSaved: (id: string, name: string) => void;
  onClose: () => void;
}

export function ProjectsModal({
  currentFiles,
  currentProjectType,
  currentProjectId,
  onLoad,
  onSaved,
  onClose,
}: ProjectsModalProps) {
  const { projects, isLoading, error, listProjects, saveProject, loadProject, deleteProject } =
    useProjects();

  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tab, setTab] = useState<"load" | "save">("load");

  useEffect(() => {
    listProjects();
  }, [listProjects]);

  async function handleSave() {
    const name = saveName.trim();
    if (!name) { setSaveError("Name is required"); return; }
    setSaving(true);
    setSaveError(null);
    const saved = await saveProject(name, currentProjectType, currentFiles, currentProjectId ?? undefined);
    setSaving(false);
    if (saved) {
      onSaved(saved.id, saved.name);
      onClose();
    } else {
      setSaveError("Failed to save project");
    }
  }

  async function handleLoad(id: string) {
    setLoadingId(id);
    const project = await loadProject(id);
    setLoadingId(null);
    if (project?.files) {
      onLoad(project.files, project.name, project.id);
      onClose();
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    await deleteProject(id);
    setDeletingId(null);
  }

  const typeLabel: Record<string, string> = {
    javascript: "JS", typescript: "TS", python: "Py", flutter: "Flutter",
    "react-native": "RN", android: "Android", ios: "iOS",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-lg shadow-2xl w-[480px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-mono text-sm font-semibold text-foreground">Projects</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["load", "save"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "px-4 py-2 text-xs font-mono uppercase tracking-wider",
                tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t === "load" ? "My Projects" : "Save Current"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "load" && (
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="font-mono text-xs">Loading projects…</span>
                </div>
              ) : error ? (
                <div className="p-4 text-destructive font-mono text-xs">{error}</div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground font-mono text-xs gap-2">
                  <FolderOpen size={28} className="opacity-30" />
                  <p>No saved projects yet</p>
                  <button
                    onClick={() => setTab("save")}
                    className="flex items-center gap-1 text-primary hover:underline mt-1"
                  >
                    <Plus size={11} />
                    Save current project
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    typeLabel={typeLabel}
                    isLoading={loadingId === project.id}
                    isDeleting={deletingId === project.id}
                    isCurrent={project.id === currentProjectId}
                    onLoad={() => handleLoad(project.id)}
                    onDelete={(e) => handleDelete(project.id, e)}
                  />
                ))
              )}
            </div>
          )}

          {tab === "save" && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  placeholder={currentProjectId ? "Leave blank to update existing" : "My Awesome App"}
                  className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="text-xs font-mono text-muted-foreground">
                <span className="text-foreground">{Object.keys(currentFiles).length}</span> files ·{" "}
                <span className="text-foreground capitalize">{currentProjectType}</span> project
                {currentProjectId && (
                  <span className="ml-2 text-primary">(updating existing)</span>
                )}
              </div>

              {saveError && (
                <p className="text-xs font-mono text-destructive">{saveError}</p>
              )}

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full font-mono text-xs h-8 bg-primary text-primary-foreground"
              >
                {saving ? (
                  <><Loader2 size={12} className="mr-1.5 animate-spin" />Saving…</>
                ) : (
                  <><Save size={12} className="mr-1.5" />{currentProjectId ? "Update Project" : "Save Project"}</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectRow({
  project,
  typeLabel,
  isLoading,
  isDeleting,
  isCurrent,
  onLoad,
  onDelete,
}: {
  project: ProjectSummary;
  typeLabel: Record<string, string>;
  isLoading: boolean;
  isDeleting: boolean;
  isCurrent: boolean;
  onLoad: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const label = typeLabel[project.projectType] ?? project.projectType;
  const date = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <button
      onClick={onLoad}
      disabled={isLoading || isDeleting}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-muted/40 transition-colors text-left group",
        isCurrent ? "bg-primary/5 border border-primary/20" : "",
      ].join(" ")}
    >
      <div className="shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-mono text-[10px] text-primary font-bold">
        {label.slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-foreground truncate">{project.name}</span>
          {isCurrent && (
            <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              current
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{date}</span>
      </div>

      {isLoading ? (
        <Loader2 size={13} className="shrink-0 animate-spin text-primary" />
      ) : (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
        >
          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      )}
    </button>
  );
}
