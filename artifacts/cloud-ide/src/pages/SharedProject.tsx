import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree } from "@/components/FileTree";
import { Editor } from "@/components/Editor";
import { TabBar } from "@/components/TabBar";
import { PreviewPanel, PanelTab } from "@/components/PreviewPanel";
import { useRun } from "@/hooks/useRun";
import { useProjects } from "@/hooks/useProjects";
import { getUserKey } from "@/lib/user-key";
import {
  Box,
  Copy,
  GitFork,
  Loader2,
  AlertCircle,
  Play,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getExecLanguage(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", mjs: "javascript",
    ts: "typescript", tsx: "typescript",
    py: "python",
    html: "html", htm: "html",
  };
  return map[ext] ?? null;
}

function getDisplayLanguage(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const extMap: Record<string, string> = {
    dart: "Dart", kt: "Kotlin", java: "Java", swift: "Swift",
    py: "Python", rs: "Rust", go: "Go", cs: "C#", cpp: "C++", c: "C",
    ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
    html: "HTML", css: "CSS", json: "JSON", xml: "XML", md: "Markdown",
  };
  return extMap[ext];
}

interface ShareStats {
  totalViews:  number;
  uniqueViews: number;
  forksCount:  number;
  runsCount:   number;
}

interface SharedData {
  project: {
    id: string;
    name: string;
    projectType: string;
    files: Record<string, string>;
    createdAt: string;
    updatedAt: string;
  };
  shareId: string;
  stats:   ShareStats;
}

/** Fire-and-forget: record a fork or run event on the share */
function recordEvent(shareId: string, event: "fork" | "run"): void {
  fetch(`/api/share/${shareId}/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  }).catch(() => { /* non-critical */ });
}

/** Format a raw count nicely (1 234 → "1.2k" above 9999) */
function fmtCount(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function SharedProject() {
  const params = useParams<{ shareId: string }>();
  const shareId = params.shareId ?? "";
  const [, navigate] = useLocation();

  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [openFiles, setOpenFiles]       = useState<string[]>([]);
  const [activeFile, setActiveFile]     = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<PanelTab>("preview");
  const [htmlPreview, setHtmlPreview]   = useState<string | null>(null);

  const [isCopied, setIsCopied]   = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

  const { isRunning, stream, runCode } = useRun();
  const { saveProject } = useProjects();

  // Load shared project on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res  = await fetch(`/api/share/${shareId}`);
        const data = (await res.json()) as SharedData & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Not found");
        setSharedData(data);

        const first = Object.keys(data.project.files).sort()[0];
        if (first) {
          setOpenFiles([first]);
          setActiveFile(first);
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load shared project");
      } finally {
        setIsLoading(false);
      }
    }
    if (shareId) load();
  }, [shareId]);

  const files          = sharedData?.project.files ?? {};
  const canRun         = !!activeFile && !!getExecLanguage(activeFile);
  const currentLanguage = getDisplayLanguage(activeFile ?? Object.keys(files)[0] ?? "");
  const shareUrl       = `${window.location.origin}/ide/p/${shareId}`;
  const stats          = sharedData?.stats;

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
    if (lang === "html") {
      setHtmlPreview(content);
      setRightPanelTab("preview");
    } else {
      setRightPanelTab("console");
      await runCode(lang, content, activeFile);
    }
    // Track run (fire-and-forget, non-blocking)
    recordEvent(shareId, "run");
  }, [activeFile, sharedData, files, runCode, shareId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleFork = async () => {
    if (!sharedData) return;
    setIsForking(true);
    setForkError(null);
    try {
      const saved = await saveProject(
        `Fork of ${sharedData.project.name}`,
        sharedData.project.projectType,
        sharedData.project.files,
      );
      if (saved) {
        recordEvent(shareId, "fork");
        navigate("/");
      } else {
        setForkError("Failed to fork project.");
      }
    } catch {
      setForkError("Failed to fork project");
    } finally {
      setIsForking(false);
    }
  };

  // ─── Loading / Error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground font-mono">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="text-sm">Loading shared project…</span>
        </div>
      </div>
    );
  }

  if (loadError || !sharedData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center font-mono">
          <AlertCircle size={36} className="text-destructive" />
          <h1 className="text-lg font-bold text-foreground">Project Not Found</h1>
          <p className="text-sm text-muted-foreground">
            {loadError ?? "This share link is invalid or the project has been deleted."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="mt-2 font-mono text-xs"
          >
            Go to IDE
          </Button>
        </div>
      </div>
    );
  }

  // ─── Main view ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Shared project banner */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 gap-3">
        {/* Left: brand + project info + stats */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <Box className="text-primary" size={16} />
            <span className="font-mono font-bold text-foreground text-sm tracking-widest uppercase hidden sm:block">
              CloudIDE
            </span>
          </div>
          <div className="w-px h-5 bg-border shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="font-mono text-sm text-foreground truncate max-w-[160px]"
              title={sharedData.project.name}
            >
              {sharedData.project.name}
            </span>
            {currentLanguage && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 shrink-0">
                {currentLanguage}
              </span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-500 border border-yellow-500/25 shrink-0">
              read-only
            </span>
          </div>

          {/* View counter — shown once stats load */}
          {stats && (
            <>
              <div className="w-px h-4 bg-border shrink-0 hidden md:block" />
              <div className="items-center gap-1 text-[10px] font-mono text-muted-foreground hidden md:flex shrink-0">
                <Eye size={10} className="shrink-0" />
                <span>
                  {fmtCount(stats.totalViews)} views · {fmtCount(stats.uniqueViews)} unique
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyLink}
            title="Copy share link"
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition-colors"
          >
            <Copy size={12} />
            <span className="hidden sm:block">{isCopied ? "Copied!" : "Copy Link"}</span>
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={12} />
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRun}
            disabled={isRunning || !canRun}
            className={[
              "font-mono text-xs h-7 px-3",
              canRun ? "hover:text-primary hover:border-primary" : "opacity-40",
            ].join(" ")}
          >
            {isRunning ? (
              <><Loader2 size={12} className="mr-1.5 animate-spin" />Running…</>
            ) : (
              <><Play size={12} className="mr-1.5" />Run</>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleFork}
            disabled={isForking}
            className="font-mono text-xs h-7 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isForking ? (
              <><Loader2 size={12} className="mr-1.5 animate-spin" />Forking…</>
            ) : (
              <><GitFork size={12} className="mr-1.5" />Fork Project</>
            )}
          </Button>
        </div>
      </div>

      {/* Fork error */}
      {forkError && (
        <div className="shrink-0 px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs font-mono flex items-center gap-2">
          <AlertCircle size={12} />
          {forkError}
        </div>
      )}

      {/* Editor layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={12} maxSize={35}>
            <ReadOnlyFileTree
              files={files}
              activeFile={activeFile}
              onSelect={handleSelectFile}
            />
          </ResizablePanel>

          <ResizableHandle className="bg-border w-[1px] hover:bg-primary transition-colors" />

          <ResizablePanel defaultSize={50} minSize={25}>
            <div className="h-full flex flex-col bg-background">
              <TabBar
                openFiles={openFiles}
                activeFile={activeFile}
                onSelect={setActiveFile}
                onClose={handleCloseFile}
              />
              <div className="flex-1 overflow-hidden relative">
                {activeFile && files[activeFile] !== undefined ? (
                  <div className="h-full relative">
                    <Editor
                      key={activeFile}
                      initialContent={files[activeFile]}
                      filename={activeFile}
                      onChange={() => {}}
                      readOnly
                    />
                    <div className="absolute bottom-2 right-3 text-[10px] font-mono text-muted-foreground/50 pointer-events-none select-none">
                      read-only · fork to edit
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-sm">
                    Select a file to view
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="bg-border w-[1px] hover:bg-primary transition-colors" />

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
    </div>
  );
}

// ─── Read-only file tree ──────────────────────────────────────────────────────

function ReadOnlyFileTree({
  files,
  activeFile,
  onSelect,
}: {
  files: Record<string, string>;
  activeFile: string | null;
  onSelect: (path: string) => void;
}) {
  const fileList = Object.keys(files).sort();

  const groups: Record<string, string[]> = {};
  for (const f of fileList) {
    const parts  = f.split("/");
    const folder = parts.length > 1 ? parts[0] : "__root__";
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(f);
  }

  const extIcon: Record<string, string> = {
    dart: "🎯", kt: "🟣", java: "☕", swift: "🍎",
    py: "🐍", rs: "🦀", go: "🐹", cs: "🔷", cpp: "⚙️", c: "⚙️",
    ts: "📘", tsx: "📘", js: "📒", jsx: "📒",
    html: "🌐", css: "🎨", json: "📋", xml: "📋", md: "📄",
  };

  return (
    <div className="h-full bg-card border-r border-border flex flex-col overflow-hidden">
      <div className="h-9 flex items-center justify-between px-3 border-b border-border shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Explorer
        </span>
        <span className="text-[9px] font-mono text-muted-foreground/50">read-only</span>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {Object.entries(groups).map(([folder, paths]) => (
          <div key={folder}>
            {folder !== "__root__" && (
              <div className="flex items-center gap-1 px-3 py-1 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <span>▸</span>
                <span>{folder}</span>
              </div>
            )}
            {paths.map((path) => {
              const name   = path.split("/").pop() ?? path;
              const ext    = name.split(".").pop()?.toLowerCase() ?? "";
              const icon   = extIcon[ext] ?? "📄";
              const indent = folder !== "__root__" ? "pl-6" : "pl-3";
              return (
                <button
                  key={path}
                  onClick={() => onSelect(path)}
                  className={[
                    "w-full flex items-center gap-2 pr-3 py-1 text-xs font-mono hover:bg-muted/40 transition-colors text-left",
                    indent,
                    activeFile === path ? "bg-primary/10 text-primary" : "text-foreground",
                  ].join(" ")}
                >
                  <span>{icon}</span>
                  <span className="truncate">{name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
