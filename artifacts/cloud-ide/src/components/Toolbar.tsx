import {
  Play, Box, Download, Loader2, FolderOpen, ChevronDown,
  Database, Share2, Compass, CheckCircle2, Gauge,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "./ui/button";

export type AutosaveStatus = "idle" | "saving" | "saved";

interface ToolbarProps {
  isBuilding:       boolean;
  isRunning?:       boolean;
  onRun:            () => void;
  onBuild:          () => void;
  onNewProject:     () => void;
  onOpenProjects:   () => void;
  onShare?:         () => void;
  buildStatus?:     string | null;
  jobId?:           string | null;
  currentLanguage?: string;
  canRun?:          boolean;
  canShare?:        boolean;
  projectName?:     string;
  autosaveStatus?:  AutosaveStatus;
  runsRemaining?:   number | null;
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
  autosaveStatus = "idle",
  runsRemaining,
}: ToolbarProps) {
  const runsLow = runsRemaining !== null && runsRemaining !== undefined && runsRemaining < 5;

  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 gap-2">

      {/* ── Left: brand + nav ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <Box className="text-primary" size={18} />
          <span className="font-mono font-bold text-foreground text-sm tracking-widest uppercase hidden sm:block">
            CloudIDE
          </span>
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        <button
          data-testid="button-new-project"
          onClick={onNewProject}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10 shrink-0"
        >
          <FolderOpen size={13} />
          <span className="hidden sm:block">New</span>
          <ChevronDown size={11} />
        </button>

        <button
          data-testid="button-projects"
          onClick={onOpenProjects}
          title="Save & load projects"
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10 shrink-0"
        >
          <Database size={13} />
          <span className="hidden md:block">Projects</span>
        </button>

        <Link
          href="/explore"
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10 shrink-0"
        >
          <Compass size={13} />
          <span className="hidden md:block">Explore</span>
        </Link>

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

        {/* Project name + autosave indicator */}
        {projectName && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <span className="text-xs font-mono text-muted-foreground truncate max-w-[130px]" title={projectName}>
              {projectName}
            </span>
            {autosaveStatus === "saving" && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60 shrink-0">
                <Loader2 size={9} className="animate-spin" />saving
              </span>
            )}
            {autosaveStatus === "saved" && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-primary/70 shrink-0">
                <CheckCircle2 size={9} />saved
              </span>
            )}
          </>
        )}

        {currentLanguage && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 shrink-0">
            {currentLanguage}
          </span>
        )}
      </div>

      {/* ── Right: usage + actions ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Daily runs remaining counter */}
        {runsRemaining !== null && runsRemaining !== undefined && (
          <div
            title={`${runsRemaining} runs remaining today (resets at midnight UTC)`}
            className={[
              "hidden sm:flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] border",
              runsLow
                ? "text-orange-400 border-orange-400/30 bg-orange-400/10"
                : "text-muted-foreground border-border bg-transparent",
            ].join(" ")}
          >
            <Gauge size={10} />
            <span>{runsLow && runsRemaining === 0 ? "No runs left" : `${runsRemaining} runs left`}</span>
          </div>
        )}

        {/* Run */}
        <Button
          data-testid="button-run"
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={isRunning || !canRun || runsRemaining === 0}
          title={
            runsRemaining === 0
              ? "Daily run limit reached (50/day). Resets at midnight UTC."
              : canRun
              ? "Run current file (JS, TS, Python, HTML)"
              : "Open a JS, TS, Python, or HTML file to run"
          }
          className={[
            "font-mono text-xs h-7 px-3",
            canRun && runsRemaining !== 0
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
            <a href={`/api/download/${jobId}`} target="_blank" rel="noopener noreferrer">
              <Download size={12} className="mr-1.5" />Download APK
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
