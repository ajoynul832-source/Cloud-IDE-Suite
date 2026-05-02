import { Play, Box, Download, Loader2, FolderOpen, ChevronDown, Database, Share2, Compass } from "lucide-react";
import { Link } from "wouter";
import { Button } from "./ui/button";

interface ToolbarProps {
  isBuilding: boolean;
  isRunning?: boolean;
  onRun: () => void;
  onBuild: () => void;
  onNewProject: () => void;
  onOpenProjects: () => void;
  onShare?: () => void;
  buildStatus?: string | null;
  jobId?: string | null;
  currentLanguage?: string;
  canRun?: boolean;
  canShare?: boolean;
  projectName?: string;
}

export function Toolbar({
  isBuilding,
  isRunning,
  onRun,
  onBuild,
  onNewProject,
  onOpenProjects,
  onShare,
  buildStatus,
  jobId,
  currentLanguage,
  canRun,
  canShare,
  projectName,
}: ToolbarProps) {
  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 gap-2">
      {/* Left: brand + project nav */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <Box className="text-primary" size={18} />
          <span className="font-mono font-bold text-foreground text-sm tracking-widest uppercase hidden sm:block">
            CloudIDE
          </span>
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* New Project */}
        <button
          data-testid="button-new-project"
          onClick={onNewProject}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10 shrink-0"
        >
          <FolderOpen size={13} />
          <span className="hidden sm:block">New</span>
          <ChevronDown size={11} />
        </button>

        {/* Projects (save/load) */}
        <button
          data-testid="button-projects"
          onClick={onOpenProjects}
          title="Save & load projects"
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10 shrink-0"
        >
          <Database size={13} />
          <span className="hidden md:block">Projects</span>
        </button>

        {/* Explore */}
        <Link
          href="/explore"
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10 shrink-0"
        >
          <Compass size={13} />
          <span className="hidden md:block">Explore</span>
        </Link>

        {/* Share — only shown when a project is saved */}
        {canShare && onShare && (
          <button
            data-testid="button-share"
            onClick={onShare}
            title="Share this project"
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10 shrink-0"
          >
            <Share2 size={13} />
            <span className="hidden md:block">Share</span>
          </button>
        )}

        {/* Current project name */}
        {projectName && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <span
              className="text-xs font-mono text-muted-foreground truncate max-w-[140px]"
              title={projectName}
            >
              {projectName}
            </span>
          </>
        )}

        {/* Language badge */}
        {currentLanguage && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 shrink-0">
            {currentLanguage}
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Run */}
        <Button
          data-testid="button-run"
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={isRunning || !canRun}
          title={
            canRun
              ? "Run current file (JS, TS, Python, HTML)"
              : "Open a JS, TS, Python, or HTML file to run"
          }
          className={[
            "font-mono text-xs h-7 px-3",
            canRun
              ? "hover:text-primary hover:border-primary"
              : "opacity-40 cursor-not-allowed",
          ].join(" ")}
        >
          {isRunning ? (
            <><Loader2 size={12} className="mr-1.5 animate-spin" />Running…</>
          ) : (
            <><Play size={12} className="mr-1.5" />Run</>
          )}
        </Button>

        {/* Build APK */}
        <Button
          data-testid="button-build-apk"
          variant="default"
          size="sm"
          onClick={onBuild}
          disabled={isBuilding}
          className="font-mono text-xs h-7 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isBuilding ? (
            <><Loader2 size={12} className="mr-1.5 animate-spin" />Building…</>
          ) : (
            <><Box size={12} className="mr-1.5" />Build APK</>
          )}
        </Button>

        {/* Download APK */}
        {buildStatus === "success" && jobId && (
          <Button
            data-testid="button-download-apk"
            variant="outline"
            size="sm"
            asChild
            className="font-mono text-xs h-7 px-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <a
              href={`/api/download/${jobId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download size={12} className="mr-1.5" />
              Download APK
            </a>
          </Button>
        )}

        {buildStatus === "failed" && (
          <span className="text-xs font-mono text-destructive">Build failed</span>
        )}
      </div>
    </div>
  );
}
