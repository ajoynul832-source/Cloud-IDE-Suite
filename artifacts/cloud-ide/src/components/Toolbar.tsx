import { Play, Box, Download, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface ToolbarProps {
  isBuilding: boolean;
  onRun: () => void;
  onBuild: () => void;
  buildStatus?: string | null;
  jobId?: string | null;
}

export function Toolbar({ isBuilding, onRun, onBuild, buildStatus, jobId }: ToolbarProps) {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Box className="text-primary" size={20} />
        <span className="font-mono font-bold text-foreground text-sm tracking-widest uppercase">
          CloudIDE
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          data-testid="button-run"
          variant="outline"
          size="sm"
          onClick={onRun}
          className="font-mono text-xs hover:text-primary hover:border-primary"
        >
          <Play size={14} className="mr-2" />
          Run
        </Button>
        <Button
          data-testid="button-build-apk"
          variant="default"
          size="sm"
          onClick={onBuild}
          disabled={isBuilding}
          className="font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isBuilding ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Building...
            </>
          ) : (
            <>
              <Box size={14} className="mr-2" />
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
            className="font-mono text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <a
              href={`${baseUrl}/api/download/${jobId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download size={14} className="mr-2" />
              Download APK
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
