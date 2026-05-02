import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Editor } from "@/components/Editor";
import { TabBar } from "@/components/TabBar";
import { PreviewPanel, PanelTab } from "@/components/PreviewPanel";
import { useRun } from "@/hooks/useRun";
import { useProjects } from "@/hooks/useProjects";
import {
  Box, Copy, GitFork, Loader2, AlertCircle, Play, ExternalLink, Eye,
  File, FileCode, FileJson, FileText, FileType, Globe, Braces,
  ChevronRight, ChevronDown, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getExecLanguage(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ({ js: "javascript", jsx: "javascript", mjs: "javascript",
            ts: "typescript", tsx: "typescript",
            py: "python", html: "html", htm: "html" } as Record<string,string>)[ext] ?? null;
}

function getDisplayLanguage(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ({
    dart: "Dart", kt: "Kotlin", java: "Java", swift: "Swift",
    py: "Python", rs: "Rust", go: "Go", cs: "C#", cpp: "C++", c: "C",
    ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
    html: "HTML", css: "CSS", json: "JSON", xml: "XML", md: "Markdown",
  } as Record<string,string>)[ext];
}

function FileIcon({ path }: { path: string }) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "html": case "htm":                         return <Globe    size={12} className="text-orange-400 shrink-0" />;
    case "css": case "scss":                         return <FileType size={12} className="text-blue-400  shrink-0" />;
    case "js": case "jsx":                           return <Braces   size={12} className="text-yellow-400 shrink-0" />;
    case "ts": case "tsx":                           return <Braces   size={12} className="text-blue-400  shrink-0" />;
    case "json": case "yaml": case "yml": case "toml": return <FileJson size={12} className="text-yellow-300 shrink-0" />;
    case "md": case "txt":                           return <FileText size={12} className="text-gray-400  shrink-0" />;
    case "py":                                       return <FileCode size={12} className="text-green-400 shrink-0" />;
    case "dart":                                     return <FileCode size={12} className="text-sky-400   shrink-0" />;
    case "kt": case "kts":                           return <FileCode size={12} className="text-purple-400 shrink-0" />;
    case "java":                                     return <FileCode size={12} className="text-orange-400 shrink-0" />;
    case "rs":                                       return <FileCode size={12} className="text-orange-500 shrink-0" />;
    default:                                         return <File     size={12} className="text-gray-500  shrink-0" />;
  }
}

interface ShareStats {
  totalViews: number; uniqueViews: number; forksCount: number; runsCount: number;
}
interface SharedData {
  project: { id: string; name: string; projectType: string; files: Record<string, string>; createdAt: string; };
  shareId: string;
  stats:   ShareStats;
}

function recordEvent(shareId: string, event: "fork" | "run"): void {
  fetch(`/api/share/${shareId}/event`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  }).catch(() => {});
}

function fmtCount(n: number): string {
  return n >= 10_000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();
}

// ── Read-only file tree with collapsible folders ──────────────────────────────
function ReadOnlyFileTree({
  files, activeFile, onSelect,
}: { files: Record<string, string>; activeFile: string | null; onSelect: (p: string) => void }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const paths = Object.keys(files).sort();
  const folderMap: Record<string, string[]> = {};
  const rootFiles: string[] = [];
  paths.forEach((p) => {
    const parts = p.split("/");
    if (parts.length > 1) {
      const folder = parts.slice(0, -1).join("/");
      if (!folderMap[folder]) folderMap[folder] = [];
      folderMap[folder].push(p);
    } else { rootFiles.push(p); }
  });

  const toggle = (folder: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(folder) ? next.delete(folder) : next.add(folder);
      return next;
    });
  };

  const renderFile = (path: string, indent: boolean) => (
    <button
      key={path}
      onClick={() => onSelect(path)}
      className={[
        "w-full flex items-center gap-2 pr-3 py-[3px] text-xs font-mono transition-colors text-left truncate",
        indent ? "pl-7" : "pl-4",
        activeFile === path ? "bg-primary/10 text-primary" : "text-white/60 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      <FileIcon path={path} />
      <span className="truncate">{path.split("/").pop()}</span>
    </button>
  );

  return (
    <div className="h-full bg-[#161b22] border-r border-white/8 flex flex-col overflow-hidden">
      <div className="h-9 flex items-center justify-between px-3 border-b border-white/8 shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Explorer</span>
        <span className="flex items-center gap-1 text-[9px] font-mono text-white/20">
          <Lock size={9} />read-only
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {Object.entries(folderMap).sort(([a],[b]) => a.localeCompare(b)).map(([folder, fps]) => {
          const isCollapsed = collapsed.has(folder);
          return (
            <div key={folder}>
              <button
                className="w-full flex items-center px-2 py-[4px] text-[10px] font-mono font-semibold tracking-wider uppercase text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors"
                onClick={() => toggle(folder)}
              >
                {isCollapsed ? <ChevronRight size={11} className="mr-1 shrink-0" /> : <ChevronDown size={11} className="mr-1 shrink-0" />}
                {folder.split("/").pop() || folder}
              </button>
              {!isCollapsed && fps.sort().map((p) => renderFile(p, true))}
            </div>
          );
        })}
        {rootFiles.map((p) => renderFile(p, false))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SharedProject() {
  const params  = useParams<{ shareId: string }>();
  const shareId = params.shareId ?? "";
  const [, navigate] = useLocation();

  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);

  const [openFiles,     setOpenFiles]     = useState<string[]>([]);
  const [activeFile,    setActiveFile]    = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<PanelTab>("preview");
  const [htmlPreview,   setHtmlPreview]   = useState<string | null>(null);

  const [isCopied,  setIsCopied]  = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

  const { isRunning, stream, runCode } = useRun();
  const { saveProject } = useProjects();

  useEffect(() => {
    async function load() {
      setIsLoading(true); setLoadError(null);
      try {
        const res  = await fetch(`/api/share/${shareId}`);
        const data = (await res.json()) as SharedData & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Not found");
        setSharedData(data);
        const first = Object.keys(data.project.files).sort()[0];
        if (first) { setOpenFiles([first]); setActiveFile(first); }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load shared project");
      } finally { setIsLoading(false); }
    }
    if (shareId) load();
  }, [shareId]);

  const files           = sharedData?.project.files ?? {};
  const canRun          = !!activeFile && !!getExecLanguage(activeFile);
  const currentLanguage = getDisplayLanguage(activeFile ?? Object.keys(files)[0] ?? "");
  const shareUrl        = `${window.location.origin}/ide/p/${shareId}`;
  const stats           = sharedData?.stats;

  const handleSelectFile = (path: string) => {
    if (!openFiles.includes(path)) setOpenFiles((prev) => [...prev, path]);
    setActiveFile(path);
  };
  const handleCloseFile = (path: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((p) => p !== path);
      if (activeFile === path) setActiveFile(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  };

  const handleRun = useCallback(async () => {
    if (!activeFile || !sharedData) return;
    const content = files[activeFile] ?? "";
    const lang    = getExecLanguage(activeFile);
    if (!lang) return;
    if (lang === "html") { setHtmlPreview(content); setRightPanelTab("preview"); }
    else { setRightPanelTab("console"); await runCode(lang, content, activeFile); }
    recordEvent(shareId, "run");
  }, [activeFile, sharedData, files, runCode, shareId]);

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); }
    catch {
      const input = document.createElement("input");
      input.value = shareUrl; document.body.appendChild(input); input.select();
      document.execCommand("copy"); document.body.removeChild(input);
    }
    setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFork = async () => {
    if (!sharedData) return;
    setIsForking(true); setForkError(null);
    try {
      const saved = await saveProject(
        `Fork of ${sharedData.project.name}`,
        sharedData.project.projectType,
        sharedData.project.files,
      );
      if (saved) { recordEvent(shareId, "fork"); navigate("/ide"); }
      else setForkError("Failed to fork project — are you signed in?");
    } catch { setForkError("Failed to fork project"); }
    finally { setIsForking(false); }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4 text-white/40 font-mono">
          <Loader2 size={28} className="animate-spin text-[#4ade80]" />
          <span className="text-sm">Loading shared project…</span>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (loadError || !sharedData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center font-mono px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-white">Project Not Found</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            {loadError ?? "This share link is invalid or the project has been deleted."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/ide")}
            className="mt-2 font-mono text-xs border-white/20 text-white/60 hover:border-white/40 hover:text-white"
          >
            Open IDE
          </Button>
        </div>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d1117]">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="h-11 bg-[#161b22] border-b border-white/8 flex items-center justify-between px-3 shrink-0 gap-3">
        {/* Left: brand + project info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Box className="text-[#4ade80]" size={15} />
            <span className="font-mono font-bold text-white text-xs tracking-widest uppercase hidden sm:block">
              CloudIDE
            </span>
          </div>
          <div className="w-px h-4 bg-white/10 shrink-0" />

          <span
            className="font-mono text-sm font-semibold text-white truncate max-w-[150px]"
            title={sharedData.project.name}
          >
            {sharedData.project.name}
          </span>

          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 shrink-0 flex items-center gap-1">
            <Lock size={8} />read-only
          </span>

          {currentLanguage && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 shrink-0 hidden sm:block">
              {currentLanguage}
            </span>
          )}

          {stats && stats.totalViews > 0 && (
            <div className="hidden md:flex items-center gap-1 text-[10px] font-mono text-white/30 shrink-0">
              <Eye size={10} />
              {fmtCount(stats.totalViews)} views
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopyLink}
            title="Copy share link"
            className="flex items-center gap-1.5 text-[11px] font-mono text-white/40 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/8"
          >
            <Copy size={12} />
            <span className="hidden sm:block">{isCopied ? "Copied ✓" : "Copy Link"}</span>
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="text-white/30 hover:text-white transition-colors p-1 rounded hover:bg-white/8"
          >
            <ExternalLink size={12} />
          </a>

          <div className="w-px h-4 bg-white/10" />

          {/* Run */}
          <button
            onClick={handleRun}
            disabled={isRunning || !canRun}
            title={canRun ? "Run this file (Ctrl+Enter)" : "Open a JS/TS/Python/HTML file to run"}
            className={[
              "flex items-center gap-1.5 px-3 h-7 rounded font-mono text-xs font-bold transition-all",
              isRunning || !canRun
                ? "bg-white/8 text-white/30 cursor-not-allowed"
                : "bg-white/10 border border-white/20 text-white/70 hover:border-white/40 hover:text-white",
            ].join(" ")}
          >
            {isRunning ? <><Loader2 size={11} className="animate-spin" />Running…</> : <><Play size={11} fill="currentColor" />Run</>}
          </button>

          {/* Fork CTA */}
          <button
            onClick={handleFork}
            disabled={isForking}
            className={[
              "flex items-center gap-1.5 px-3 h-7 rounded font-mono text-xs font-bold transition-all",
              isForking
                ? "bg-white/8 text-white/30 cursor-not-allowed"
                : "bg-[#4ade80] text-black hover:bg-[#4ade80]/90 shadow-[0_0_12px_rgba(74,222,128,0.3)]",
            ].join(" ")}
          >
            {isForking
              ? <><Loader2 size={11} className="animate-spin" />Forking…</>
              : <><GitFork size={11} />Fork &amp; Edit</>
            }
          </button>
        </div>
      </div>

      {/* Fork error */}
      {forkError && (
        <div className="shrink-0 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={12} />
          {forkError}
        </div>
      )}

      {/* ── Editor layout ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={12} maxSize={35}>
            <ReadOnlyFileTree files={files} activeFile={activeFile} onSelect={handleSelectFile} />
          </ResizablePanel>

          <ResizableHandle className="bg-white/8 w-[1px] hover:bg-[#4ade80]/60 transition-colors" />

          <ResizablePanel defaultSize={50} minSize={25}>
            <div className="h-full flex flex-col bg-[#0d1117]">
              <TabBar
                openFiles={openFiles}
                activeFile={activeFile}
                onSelect={setActiveFile}
                onClose={handleCloseFile}
              />
              <div className="flex-1 overflow-hidden relative">
                {activeFile && files[activeFile] !== undefined ? (
                  <>
                    <Editor
                      key={activeFile}
                      initialContent={files[activeFile]}
                      filename={activeFile}
                      onChange={() => {}}
                      readOnly
                    />
                    <div className="absolute bottom-2 right-3 text-[10px] font-mono text-white/20 pointer-events-none select-none flex items-center gap-1">
                      <Lock size={9} />
                      read-only · fork to edit
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 font-mono text-sm">
                    Select a file to view
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="bg-white/8 w-[1px] hover:bg-[#4ade80]/60 transition-colors" />

          <ResizablePanel defaultSize={30} minSize={18}>
            <PreviewPanel
              isBuilding={false}
              isRunning={isRunning}
              activeTab={rightPanelTab}
              onTabChange={setRightPanelTab}
              stream={stream}
              htmlPreview={htmlPreview}
              projectType={sharedData.project.projectType}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ── Status bar ────────────────────────────────────────────────────── */}
      <div className="h-6 bg-[#1c2128] border-t border-white/8 flex items-center justify-between px-3 shrink-0 select-none text-[10px] font-mono text-white/30">
        <span>
          Shared by{" "}
          <span className="text-white/50">{sharedData.project.name}</span>
        </span>
        <div className="flex items-center gap-3">
          {stats && (
            <span className="flex items-center gap-1">
              <GitFork size={9} />
              {fmtCount(stats.forksCount)} forks
            </span>
          )}
          {currentLanguage && <span className="text-white/50">{currentLanguage}</span>}
          <span className="flex items-center gap-1 text-yellow-400/60">
            <Lock size={9} />read-only
          </span>
        </div>
      </div>
    </div>
  );
}
