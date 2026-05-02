import { BuildLog } from "./BuildLog";

interface PreviewPanelProps {
  logs?: string | null;
  isBuilding: boolean;
  activeTab: "preview" | "build";
  onTabChange: (tab: "preview" | "build") => void;
}

export function PreviewPanel({ logs, isBuilding, activeTab, onTabChange }: PreviewPanelProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-9 flex border-b border-border bg-card">
        <button
          data-testid="button-tab-preview"
          onClick={() => onTabChange("preview")}
          className={[
            "px-4 text-xs font-mono uppercase tracking-wider",
            activeTab === "preview"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Preview
        </button>
        <button
          data-testid="button-tab-buildlog"
          onClick={() => onTabChange("build")}
          className={[
            "px-4 text-xs font-mono uppercase tracking-wider",
            activeTab === "build"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Build Log
          {isBuilding && (
            <span className="ml-2 inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "preview" ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-sm p-8 text-center">
            <div>
              <p>Flutter apps cannot run directly in browser preview.</p>
              <p className="mt-2 text-primary">Click 'Build APK' to compile.</p>
            </div>
          </div>
        ) : (
          <BuildLog logs={logs} />
        )}
      </div>
    </div>
  );
}
