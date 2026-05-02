import { Play, Box, Download, Loader2, FolderOpen, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";

interface ToolbarProps {
  isBuilding: boolean;
  isRunning?: boolean;
  onRun: () => void;
  onBuild: () => void;
  onNewProject: () => void;
  buildStatus?: string | null;
  jobId?: string | null;
  currentLanguage?: string;
  canRun?: boolean;
}

export function Toolbar({
  isBuilding,
  isRunning,
  onRun,
  onBuild,
  onNewProject,
  buildStatus,
  jobId,
  currentLanguage,
  canRun,
}: ToolbarProps) {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left: brand + new project */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Box className="text-primary" size={18} />
          <span className="font-mono font-bold text-foreground text-sm tracking-widest uppercase">
            CloudIDE
          </span>
        </div>

        <div className="w-px h-5 bg-border" />

        <button
          data-testid="button-new-project"
          onClick={onNewProject}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10"
        >
          <FolderOpen size={13} />
          New Project
          <ChevronDown size={11} />
        </button>

        {currentLanguage && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
            {currentLanguage}
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button
          data-testid="button-run"
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={isRunning}
          title={canRun ? "Run current file" : "Open a JS, TS, Python, or HTML file to run"}
          className={[
            "font-mono text-xs h-7 px-3",
            canRun
              ? "hover:text-primary hover:border-primary"
              : "opacity-50 cursor-not-allowed",
          ].join(" ")}
        >
          {isRunning ? (
            <>
              <Loader2 size={12} className="mr-1.5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play size={12} className="mr-1.5" />
              Run
            </>
          )}
        </Button>

        <Button
          data-testid="button-build-apk"
          variant="default"
          size="sm"
          onClick={onBuild}
          disabled={isBuilding}
          className="font-mono text-xs h-7 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isBuilding ? (
            <>
              <Loader2 size={12} className="mr-1.5 animate-spin" />
              Building...
            </>
          ) : (
            <>
              <Box size={12} className="mr-1.5" />
              Build APK
            </>
          )}
        </Button>

        {buildStatus === "success" && jobId && (
          <Button
            data-testid="button-download-apk"
            variant="outline"
            size="sm"
            asChild
            className="font-mono text-xs h-7 px-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <a
              href={`${baseUrl}/api/download/${jobId}`}
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
