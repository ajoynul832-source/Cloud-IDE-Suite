import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Download, Upload, RefreshCw, X, AlertCircle, Check, Loader2, GitCommit, ExternalLink } from "lucide-react";

interface GitStatus {
  branch: string;
  modified: string[];
  untracked: string[];
  staged: string[];
}

interface GitPanelProps {
  projectId?: string | null;
  files: Record<string, string>;
  onClose: () => void;
}

type GitTab = "status" | "clone" | "commit";

export function GitPanel({ projectId, files, onClose }: GitPanelProps) {
  const [tab,         setTab]         = useState<GitTab>("status");
  const [loading,     setLoading]     = useState(false);
  const [message,     setMessage]     = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [status,      setStatus]      = useState<GitStatus | null>(null);
  const [cloneUrl,    setCloneUrl]    = useState("");
  const [pat,         setPat]         = useState("");
  const [commitMsg,   setCommitMsg]   = useState("");
  const [repoUrl,     setRepoUrl]     = useState("");

  const apiCall = useCallback(async (endpoint: string, body: object) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/git/${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { success?: boolean; error?: string; status?: GitStatus; message?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMessage({ type: "success", text: data.message ?? "Done!" });
      if (data.status) setStatus(data.status);
      return data;
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unknown error" });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClone = useCallback(() => {
    if (!cloneUrl.trim()) return;
    apiCall("clone", { url: cloneUrl.trim(), pat: pat.trim() || undefined, projectId });
  }, [cloneUrl, pat, projectId, apiCall]);

  const handleStatus = useCallback(() => {
    apiCall("status", { projectId });
  }, [projectId, apiCall]);

  const handleCommitPush = useCallback(() => {
    if (!commitMsg.trim() || !repoUrl.trim() || !pat.trim()) return;
    apiCall("push", {
      projectId,
      files,
      message: commitMsg.trim(),
      repoUrl: repoUrl.trim(),
      pat: pat.trim(),
    });
  }, [commitMsg, repoUrl, pat, projectId, files, apiCall]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-[#0d1117] text-white/70 text-xs font-mono"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch size={12} className="text-[#4ade80]" />
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">Git</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/70">
          <X size={12} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/8 bg-[#161b22] shrink-0">
        {(["status", "clone", "commit"] as GitTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-[10px] font-mono capitalize transition-colors ${
              tab === t
                ? "text-[#4ade80] border-b border-[#4ade80]"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Status messages */}
        {message && (
          <div className={`flex items-start gap-1.5 p-2 rounded text-[10px] ${
            message.type === "success"
              ? "bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80]/80"
              : "bg-red-500/10 border border-red-500/20 text-red-400/80"
          }`}>
            {message.type === "success" ? <Check size={10} className="mt-0.5 shrink-0" /> : <AlertCircle size={10} className="mt-0.5 shrink-0" />}
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}

        {tab === "status" && (
          <div className="space-y-3">
            <button
              onClick={handleStatus}
              disabled={loading || !projectId}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-white/15 text-white/50 hover:border-white/30 hover:text-white/70 disabled:opacity-30 transition-colors text-[11px]"
            >
              {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Refresh Status
            </button>

            {!projectId && (
              <div className="text-center py-4 text-white/25 text-[10px]">
                Save your project first to use Git features
              </div>
            )}

            {status && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <GitBranch size={10} className="text-[#4ade80]" />
                  <span className="text-[#4ade80]/80 text-[10px]">{status.branch}</span>
                </div>
                {status.modified.length > 0 && (
                  <div>
                    <p className="text-[9px] text-white/30 uppercase mb-1">Modified</p>
                    {status.modified.map((f) => (
                      <div key={f} className="flex items-center gap-1 py-0.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-400/60 shrink-0" />
                        <span className="text-[10px] text-white/60">{f}</span>
                      </div>
                    ))}
                  </div>
                )}
                {status.untracked.length > 0 && (
                  <div>
                    <p className="text-[9px] text-white/30 uppercase mb-1">Untracked</p>
                    {status.untracked.map((f) => (
                      <div key={f} className="flex items-center gap-1 py-0.5">
                        <span className="w-2 h-2 rounded-full bg-green-400/60 shrink-0" />
                        <span className="text-[10px] text-white/60">{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "clone" && (
          <div className="space-y-3">
            <div>
              <label className="text-[9px] text-white/30 uppercase block mb-1">Repository URL</label>
              <input
                value={cloneUrl}
                onChange={(e) => setCloneUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git"
                className="w-full bg-[#1c2128] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4ade80]/40"
              />
            </div>
            <div>
              <label className="text-[9px] text-white/30 uppercase block mb-1">GitHub PAT (for private repos)</label>
              <input
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                type="password"
                placeholder="ghp_xxxx…"
                className="w-full bg-[#1c2128] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4ade80]/40"
              />
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-1 text-[9px] text-white/25 hover:text-white/50"
              >
                <ExternalLink size={8} /> Get a GitHub PAT
              </a>
            </div>
            <button
              onClick={handleClone}
              disabled={loading || !cloneUrl.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80]/80 hover:bg-[#4ade80]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[11px] font-semibold"
            >
              {loading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
              Clone Repository
            </button>
          </div>
        )}

        {tab === "commit" && (
          <div className="space-y-3">
            <div>
              <label className="text-[9px] text-white/30 uppercase block mb-1">Remote Repository URL</label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git"
                className="w-full bg-[#1c2128] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4ade80]/40"
              />
            </div>
            <div>
              <label className="text-[9px] text-white/30 uppercase block mb-1">GitHub PAT</label>
              <input
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                type="password"
                placeholder="ghp_xxxx…"
                className="w-full bg-[#1c2128] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4ade80]/40"
              />
            </div>
            <div>
              <label className="text-[9px] text-white/30 uppercase block mb-1">Commit Message</label>
              <input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="feat: update code"
                className="w-full bg-[#1c2128] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4ade80]/40"
              />
            </div>
            <div className="bg-white/3 border border-white/8 rounded p-2">
              <p className="text-[9px] text-white/30 mb-1">Files to push ({Object.keys(files).length})</p>
              {Object.keys(files).slice(0, 5).map((f) => (
                <div key={f} className="flex items-center gap-1 py-0.5">
                  <GitCommit size={8} className="text-white/20 shrink-0" />
                  <span className="text-[9px] text-white/50">{f}</span>
                </div>
              ))}
              {Object.keys(files).length > 5 && (
                <p className="text-[9px] text-white/25 mt-1">+{Object.keys(files).length - 5} more files</p>
              )}
            </div>
            <button
              onClick={handleCommitPush}
              disabled={loading || !commitMsg.trim() || !repoUrl.trim() || !pat.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80]/80 hover:bg-[#4ade80]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[11px] font-semibold"
            >
              {loading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              Commit &amp; Push
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
