import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId,      setDeletingId]      = useState<string | null>(null);

  const [renamingId,    setRenamingId]    = useState<string | null>(null);
  const [renameValue,   setRenameValue]   = useState("");
  const [renameSaving,  setRenameSaving]  = useState(false);

  const [versions,        setVersions]        = useState<VersionSummary[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringId,     setRestoringId]     = useState<string | null>(null);
  const [creatingVersion, setCreatingVersion] = useState(false);

  useEffect(() => { listProjects(); }, [listProjects]);

  useEffect(() => {
    if (tab === "versions" && currentProjectId) {
      setVersionsLoading(true);
      listVersions(currentProjectId).then((v) => {
        setVersions(v);
        setVersionsLoading(false);
      });
    }
  }, [tab, currentProjectId, listVersions]);

  async function handleSave() {
    const name = saveName.trim();
    if (!name && !currentProjectId) { setSaveError("Name is required"); return; }
    setSaving(true);
    setSaveError(null);
    const effectiveName = name || (projects.find((p) => p.id === currentProjectId)?.name ?? "Untitled");
    const saved = await saveProject(effectiveName, currentProjectType, currentFiles, currentProjectId ?? undefined);
    setSaving(false);
    if (saved) {
      onSaved(saved.id, effectiveName);
      setSaveName("");
    } else {
      setSaveError("Failed to save project");
    }
  }

  async function handleLoad(proj: ProjectSummary) {
    setLoadingId(proj.id);
    const loaded = await loadProject(proj.id);
    setLoadingId(null);
    if (loaded) {
      onLoad(loaded.files, proj.name, proj.id);
    }
  }

  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-[#1c2128] to-[#161b22] border border-white/12 rounded-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0"
        >
          <div>
            <h2 className="text-white font-mono font-bold text-sm tracking-widest uppercase">Projects</h2>
            <p className="text-white/40 text-xs mt-0.5 font-mono">Save, load, and manage your projects</p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={18} />
          </motion.button>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-white/8 bg-white/[0.02] shrink-0">
          {(["load", "save", "versions"] as const).map((t) => (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              className={`flex-1 px-4 py-3 text-xs font-mono uppercase tracking-widest transition-colors ${
                tab === t ? "text-[#4ade80] border-b-2 border-[#4ade80]" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t === "load" && "Load"}
              {t === "save" && "Save"}
              {t === "versions" && "History"}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="wait">
            {tab === "load" && (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="relative mb-3">
                  <Search size={13} className="absolute left-3 top-3 text-white/25" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search projects…"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 pl-9 text-xs font-mono text-white placeholder:text-white/25 focus:outline-none focus:border-[#4ade80]/40"
                  />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-white/40">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-xs font-mono">Loading projects…</span>
                  </div>
                ) : error ? (
                  <p className="text-xs font-mono text-red-400/70">{error}</p>
                ) : filtered.length === 0 ? (
                  <p className="text-xs font-mono text-white/30 text-center py-8">
                    {search ? "No projects match your search" : "No saved projects yet"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((proj, idx) => (
                      <motion.div
                        key={proj.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-2 p-2.5 rounded border border-white/10 hover:border-[#4ade80]/30 hover:bg-white/[0.03] transition-all group"
                      >
                        <FolderOpen size={13} className="text-[#4ade80]/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                          {renamingId === proj.id ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === "Enter" && renameValue.trim()) {
                                  setRenameSaving(true);
                                  await renameProject(proj.id, renameValue.trim());
                                  setRenameSaving(false);
                                  setRenamingId(null);
                                }
                              }}
                              className="w-full bg-white/5 border border-[#4ade80]/40 rounded px-1 py-0.5 text-xs font-mono text-white focus:outline-none"
                            />
                          ) : (
                            <>
                              <p className="text-xs font-mono font-semibold text-white truncate">{proj.name}</p>
                              <p className="text-[10px] font-mono text-white/30">
                                {new Date(proj.createdAt).toLocaleDateString()} · {proj.fileCount} files
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setRenamingId(proj.id); setRenameValue(proj.name); }}
                            className="p-1.5 rounded text-white/40 hover:text-white/70 hover:bg-white/8"
                            disabled={renameSaving}
                          >
                            <Pencil size={10} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setDuplicatingId(proj.id); duplicateProject(proj.id).then(() => setDuplicatingId(null)); }}
                            className="p-1.5 rounded text-white/40 hover:text-white/70 hover:bg-white/8"
                            disabled={duplicatingId === proj.id}
                          >
                            {duplicatingId === proj.id ? <Loader2 size={10} className="animate-spin" /> : <Copy size={10} />}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleLoad(proj)}
                            className="p-1.5 rounded text-white/40 hover:text-[#4ade80] hover:bg-[#4ade80]/10"
                            disabled={loadingId === proj.id}
                          >
                            {loadingId === proj.id ? <Loader2 size={10} className="animate-spin" /> : <FolderOpen size={10} />}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setConfirmDeleteId(proj.id)}
                            className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 size={10} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "save" && (
              <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-white/50 uppercase tracking-widest block mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder={currentProjectId ? "Keep blank to update" : "My Project"}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-xs font-mono text-white placeholder:text-white/25 focus:outline-none focus:border-[#4ade80]/40"
                  />
                </div>
                {saveError && <p className="text-xs font-mono text-red-400/70">{saveError}</p>}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#4ade80] text-black px-4 py-2.5 rounded font-mono text-xs font-bold hover:bg-[#22c55e] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                  {saving ? "Saving…" : "Save Project"}
                </motion.button>
              </motion.div>
            )}

            {tab === "versions" && (
              <motion.div key="versions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {!currentProjectId ? (
                  <p className="text-xs font-mono text-white/30 text-center py-8">No project loaded</p>
                ) : versionsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-white/40">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-xs font-mono">Loading versions…</span>
                  </div>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setCreatingVersion(true); createVersion().then(() => { setCreatingVersion(false); listVersions(currentProjectId!).then(setVersions); }); }}
                      disabled={creatingVersion}
                      className="w-full bg-white/10 text-white px-3 py-2 rounded font-mono text-xs font-bold hover:bg-white/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mb-3"
                    >
                      {creatingVersion ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                      {creatingVersion ? "Creating…" : "Create Snapshot"}
                    </motion.button>
                    {versions.length === 0 ? (
                      <p className="text-xs font-mono text-white/30 text-center py-8">No versions yet</p>
                    ) : (
                      <div className="space-y-2">
                        {versions.map((v, idx) => (
                          <motion.div
                            key={v.id}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between p-2.5 rounded border border-white/10 hover:bg-white/[0.03] transition-all group"
                          >
                            <div className="flex-1">
                              <p className="text-xs font-mono font-semibold text-white">{new Date(v.createdAt).toLocaleString()}</p>
                              <p className="text-[10px] font-mono text-white/30">{v.fileCount} files</p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => { setRestoringId(v.id); restoreVersion(v.id).then(() => { setRestoringId(null); listVersions(currentProjectId!).then(setVersions); }); }}
                              disabled={restoringId === v.id}
                              className="p-1.5 rounded text-white/40 hover:text-[#4ade80] hover:bg-[#4ade80]/10"
                            >
                              {restoringId === v.id ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Delete confirmation */}
        <AnimatePresence>
          {confirmDeleteId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-[#1c2128] border border-red-400/30 rounded-lg p-4 max-w-sm mx-4 text-center space-y-3"
              >
                <p className="text-xs font-mono text-white">Delete this project? This cannot be undone.</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => setConfirmDeleteId(null)}
                    variant="outline"
                    size="sm"
                    className="text-xs font-mono"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setDeletingId(confirmDeleteId);
                      deleteProject(confirmDeleteId).then(() => {
                        setDeletingId(null);
                        setConfirmDeleteId(null);
                        listProjects();
                      });
                    }}
                    disabled={deletingId === confirmDeleteId}
                    className="text-xs font-mono bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    {deletingId === confirmDeleteId ? <Loader2 size={10} className="animate-spin" /> : "Delete"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
