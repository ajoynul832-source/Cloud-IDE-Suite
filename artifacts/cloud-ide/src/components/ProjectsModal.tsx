import { useEffect, useState, useCallback } from "react";
import {
  FolderOpen, Save, Trash2, X, Loader2, Plus,
  Copy, Pencil, Check, History, RotateCcw, Search,
} from "lucide-react";
import { Button } from "./ui/button";
import { useProjects, ProjectSummary, VersionSummary } from "@/hooks/useProjects";

type Tab = "load" | "save" | "versions";

interface ProjectsModalProps {
  currentFiles:       Record<string, string>;
  currentProjectType: string;
  currentProjectId:   string | null;
  onLoad:    (files: Record<string, string>, name: string, id: string) => void;
  onSaved:   (id: string, name: string) => void;
  onClose:   () => void;
}

export function ProjectsModal({
  currentFiles,
  currentProjectType,
  currentProjectId,
  onLoad,
  onSaved,
  onClose,
}: ProjectsModalProps) {
  const {
    projects, isLoading, error,
    listProjects, saveProject, loadProject, deleteProject,
    renameProject, duplicateProject,
    listVersions, createVersion, restoreVersion,
  } = useProjects();

  const [saveName,    setSaveName]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [loadingId,   setLoadingId]   = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [tab,         setTab]         = useState<Tab>("load");
  const [search,      setSearch]      = useState("");

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId,      setDeletingId]      = useState<string | null>(null);

  // Inline rename
  const [renamingId,    setRenamingId]    = useState<string | null>(null);
  const [renameValue,   setRenameValue]   = useState("");
  const [renameSaving,  setRenameSaving]  = useState(false);

  // Versions tab
  const [versions,        setVersions]        = useState<VersionSummary[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringId,     setRestoringId]     = useState<string | null>(null);
  const [creatingVersion, setCreatingVersion] = useState(false);

  useEffect(() => { listProjects(); }, [listProjects]);

  // Load versions when switching to that tab
  useEffect(() => {
    if (tab === "versions" && currentProjectId) {
      setVersionsLoading(true);
      listVersions(currentProjectId).then((v) => {
        setVersions(v);
        setVersionsLoading(false);
      });
    }
  }, [tab, currentProjectId, listVersions]);

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    const name = saveName.trim();
    if (!name && !currentProjectId) { setSaveError("Name is required"); return; }
    setSaving(true);
    setSaveError(null);
    const effectiveName = name || projects.find((p) => p.id === currentProjectId)?.name ?? "Untitled";
    const saved = await saveProject(effectiveName, currentProjectType, currentFiles, currentProjectId ?? undefined);
    setSaving(false);
    if (saved) { onSaved(saved.id, saved.name); onClose(); }
    else setSaveError("Failed to save project");
  }

  async function handleLoad(id: string) {
    setLoadingId(id);
    const project = await loadProject(id);
    setLoadingId(null);
    if (project?.files) { onLoad(project.files, project.name, project.id); onClose(); }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    setConfirmDeleteId(null);
    await deleteProject(confirmDeleteId);
    setDeletingId(null);
  }

  async function handleDuplicate(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDuplicatingId(id);
    await duplicateProject(id);
    setDuplicatingId(null);
  }

  function startRename(project: ProjectSummary, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingId(project.id);
    setRenameValue(project.name);
  }

  async function commitRename(id: string) {
    const name = renameValue.trim();
    if (!name) { setRenamingId(null); return; }
    setRenameSaving(true);
    await renameProject(id, name);
    setRenameSaving(false);
    setRenamingId(null);
  }

  async function handleCreateVersion() {
    if (!currentProjectId) return;
    setCreatingVersion(true);
    const v = await createVersion(currentProjectId, "Manual snapshot");
    setCreatingVersion(false);
    if (v) setVersions((prev) => [v, ...prev]);
  }

  async function handleRestoreVersion(versionId: string) {
    if (!currentProjectId) return;
    setRestoringId(versionId);
    const restored = await restoreVersion(currentProjectId, versionId);
    setRestoringId(null);
    if (restored?.files) {
      onLoad(restored.files, restored.name, restored.id);
      onClose();
    }
  }

  // ─── Filtering ────────────────────────────────────────────────────────────────

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const typeLabel: Record<string, string> = {
    javascript: "JS", typescript: "TS", python: "Py", flutter: "Flutter",
    "react-native": "RN", android: "Android", ios: "iOS", html: "HTML",
  };

  const availableTabs: Tab[] = currentProjectId
    ? ["load", "save", "versions"]
    : ["load", "save"];

  return (
    <>
      {/* Delete confirmation overlay */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-card border border-border rounded-lg shadow-2xl w-80 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-sm text-foreground font-semibold">Delete project?</p>
            <p className="font-mono text-xs text-muted-foreground">
              This will permanently delete the project and its share links. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 font-mono text-xs"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 font-mono text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteConfirmed}
              >
                <Trash2 size={11} className="mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
        <div
          className="bg-card border border-border rounded-lg shadow-2xl w-[500px] max-h-[82vh] flex flex-col"
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
            {availableTabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  "px-4 py-2 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5",
                  tab === t
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t === "load" && <FolderOpen size={11} />}
                {t === "save" && <Save size={11} />}
                {t === "versions" && <History size={11} />}
                {t === "load" ? "My Projects" : t === "save" ? "Save" : "History"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── My Projects ─────────────────────────────────────────────── */}
            {tab === "load" && (
              <div className="flex flex-col h-full">
                {/* Search bar */}
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center gap-2 bg-background border border-border rounded px-2.5 py-1.5">
                    <Search size={12} className="text-muted-foreground shrink-0" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter projects…"
                      className="flex-1 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="font-mono text-xs">Loading projects…</span>
                    </div>
                  ) : error ? (
                    <div className="p-4 text-destructive font-mono text-xs">{error}</div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground font-mono text-xs gap-2">
                      <FolderOpen size={28} className="opacity-30" />
                      {search ? (
                        <p>No projects match "{search}"</p>
                      ) : (
                        <>
                          <p>No saved projects yet</p>
                          <button
                            onClick={() => setTab("save")}
                            className="flex items-center gap-1 text-primary hover:underline mt-1"
                          >
                            <Plus size={11} />Save current project
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredProjects.map((project) => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        typeLabel={typeLabel}
                        isLoading={loadingId === project.id}
                        isDeleting={deletingId === project.id}
                        isDuplicating={duplicatingId === project.id}
                        isCurrent={project.id === currentProjectId}
                        isRenaming={renamingId === project.id}
                        renameValue={renameValue}
                        renameSaving={renameSaving}
                        onLoad={() => handleLoad(project.id)}
                        onDelete={(e) => { e.stopPropagation(); setConfirmDeleteId(project.id); }}
                        onDuplicate={(e) => handleDuplicate(project.id, e)}
                        onStartRename={(e) => startRename(project, e)}
                        onRenameChange={setRenameValue}
                        onRenameCommit={() => commitRename(project.id)}
                        onRenameCancel={() => setRenamingId(null)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Save ────────────────────────────────────────────────────── */}
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
                    placeholder={
                      currentProjectId
                        ? projects.find((p) => p.id === currentProjectId)?.name ?? "Current project"
                        : "My Awesome App"
                    }
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

            {/* ── Version History ──────────────────────────────────────────── */}
            {tab === "versions" && currentProjectId && (
              <div className="flex flex-col h-full">
                <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground">
                    Up to 10 snapshots are kept. Restoring auto-saves current state first.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={creatingVersion}
                    onClick={handleCreateVersion}
                    className="font-mono text-[10px] h-6 px-2 shrink-0 ml-2"
                  >
                    {creatingVersion
                      ? <Loader2 size={10} className="animate-spin" />
                      : <><History size={10} className="mr-1" />Snapshot</>
                    }
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-2">
                  {versionsLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="font-mono text-xs">Loading history…</span>
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground font-mono text-xs gap-2">
                      <History size={28} className="opacity-30" />
                      <p>No snapshots yet</p>
                      <p className="text-[10px] text-muted-foreground/60">
                        Snapshots are created on explicit save or manually.
                      </p>
                    </div>
                  ) : (
                    versions.map((v) => (
                      <VersionRow
                        key={v.id}
                        version={v}
                        isRestoring={restoringId === v.id}
                        onRestore={() => handleRestoreVersion(v.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Project Row ──────────────────────────────────────────────────────────────

function ProjectRow({
  project, typeLabel,
  isLoading, isDeleting, isDuplicating, isCurrent,
  isRenaming, renameValue, renameSaving,
  onLoad, onDelete, onDuplicate, onStartRename,
  onRenameChange, onRenameCommit, onRenameCancel,
}: {
  project:       ProjectSummary;
  typeLabel:     Record<string, string>;
  isLoading:     boolean;
  isDeleting:    boolean;
  isDuplicating: boolean;
  isCurrent:     boolean;
  isRenaming:    boolean;
  renameValue:   string;
  renameSaving:  boolean;
  onLoad:        () => void;
  onDelete:      (e: React.MouseEvent) => void;
  onDuplicate:   (e: React.MouseEvent) => void;
  onStartRename: (e: React.MouseEvent) => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
}) {
  const label = typeLabel[project.projectType] ?? project.projectType;
  const date  = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <button
      onClick={isRenaming ? undefined : onLoad}
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
        {isRenaming ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameCommit();
                if (e.key === "Escape") onRenameCancel();
              }}
              className="flex-1 bg-background border border-primary rounded px-2 py-0.5 font-mono text-xs text-foreground focus:outline-none"
            />
            <button
              onClick={onRenameCommit}
              disabled={renameSaving}
              className="text-primary hover:text-primary/80 p-0.5"
            >
              {renameSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            </button>
            <button onClick={onRenameCancel} className="text-muted-foreground hover:text-foreground p-0.5">
              <X size={11} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-foreground truncate">{project.name}</span>
            {isCurrent && (
              <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                current
              </span>
            )}
          </div>
        )}
        <span className="font-mono text-[10px] text-muted-foreground">{date}</span>
      </div>

      {!isRenaming && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Rename */}
          <button
            onClick={onStartRename}
            title="Rename"
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          >
            <Pencil size={12} />
          </button>

          {/* Duplicate */}
          <button
            onClick={onDuplicate}
            disabled={isDuplicating}
            title="Duplicate"
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          >
            {isDuplicating ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            title="Delete"
            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      )}

      {isLoading && (
        <Loader2 size={13} className="shrink-0 animate-spin text-primary ml-1" />
      )}
    </button>
  );
}

// ─── Version Row ──────────────────────────────────────────────────────────────

function VersionRow({
  version, isRestoring, onRestore,
}: {
  version:     VersionSummary;
  isRestoring: boolean;
  onRestore:   () => void;
}) {
  const date = new Date(version.createdAt).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-muted/30 transition-colors group">
      <History size={14} className="shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-foreground truncate">
          {version.label || "Snapshot"}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">{date}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={isRestoring}
        onClick={onRestore}
        className="font-mono text-[10px] h-6 px-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isRestoring
          ? <Loader2 size={10} className="animate-spin" />
          : <><RotateCcw size={10} className="mr-1" />Restore</>
        }
      </Button>
    </div>
  );
}
