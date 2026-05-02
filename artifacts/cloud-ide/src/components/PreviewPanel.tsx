import { BuildLog } from "./BuildLog";
import { ConsoleOutput } from "./ConsoleOutput";
import { StreamState } from "@/hooks/useRun";
import { ExternalLink, QrCode } from "lucide-react";

export type PanelTab = "preview" | "console" | "build";

interface SnackPreview {
  embedUrl: string;
  qrUrl: string;
  snackUrl: string;
}

interface PreviewPanelProps {
  logs?: string | null;
  isBuilding: boolean;
  isRunning?: boolean;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  stream?: StreamState;
  snackPreview?: SnackPreview | null;
  htmlPreview?: string | null;
  projectType?: string;
}

export function PreviewPanel({
  logs,
  isBuilding,
  isRunning,
  activeTab,
  onTabChange,
  stream,
  snackPreview,
  htmlPreview,
  projectType,
}: PreviewPanelProps) {
  const tabs: { id: PanelTab; label: string }[] = [
    { id: "preview", label: "Preview" },
    { id: "console", label: "Console" },
    { id: "build", label: "Build Log" },
  ];

  const defaultStream: StreamState = { chunks: [], result: null };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tab bar */}
      <div className="h-9 flex border-b border-border bg-card shrink-0">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            data-testid={`button-tab-${id}`}
            onClick={() => onTabChange(id)}
            className={[
              "px-4 text-xs font-mono uppercase tracking-wider relative",
              activeTab === id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {label}
            {id === "build" && isBuilding && (
              <span className="ml-2 inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
            {id === "console" && isRunning && (
              <span className="ml-2 inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "preview" && (
          <PreviewContent
            snackPreview={snackPreview}
            htmlPreview={htmlPreview}
            projectType={projectType}
          />
        )}
        {activeTab === "console" && (
          <ConsoleOutput stream={stream ?? defaultStream} isRunning={isRunning ?? false} />
        )}
        {activeTab === "build" && <BuildLog logs={logs} />}
      </div>
    </div>
  );
}

function PreviewContent({
  snackPreview,
  htmlPreview,
  projectType,
}: {
  snackPreview?: SnackPreview | null;
  htmlPreview?: string | null;
  projectType?: string;
}) {
  if (htmlPreview) {
    return (
      <iframe
        className="w-full h-full border-0 bg-white"
        sandbox="allow-scripts"
        srcDoc={htmlPreview}
        title="HTML Preview"
      />
    );
  }

  if (snackPreview) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-border bg-card text-xs font-mono">
          <span className="text-primary font-semibold">Expo Snack</span>
          <span className="text-muted-foreground flex-1 truncate">{snackPreview.snackUrl}</span>
          <a
            href={snackPreview.snackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink size={11} />
            Open
          </a>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <iframe
            src={snackPreview.embedUrl}
            className="w-full h-full border-0"
            allow="geolocation; camera; microphone"
            title="Expo Snack Preview"
          />
        </div>
        <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-t border-border bg-card">
          <QrCode size={13} className="text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">Scan to open on device</span>
          <img src={snackPreview.qrUrl} alt="QR Code" className="w-14 h-14 ml-auto rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-sm p-8 text-center">
      <div className="space-y-3">
        {projectType === "react-native" ? (
          <>
            <p>React Native preview not generated yet.</p>
            <p className="text-primary text-xs">
              Click <span className="font-bold">Build APK</span> to create an Expo Snack preview.
            </p>
          </>
        ) : projectType === "flutter" ? (
          <>
            <p>Flutter apps cannot run directly in browser preview.</p>
            <p className="mt-2 text-primary">
              Click <span className="font-bold">Build APK</span> to compile.
            </p>
          </>
        ) : (
          <>
            <p>No browser preview for this project type.</p>
            <p className="mt-2 text-primary text-xs">
              Use <span className="font-bold">Run</span> to execute code or{" "}
              <span className="font-bold">Build APK</span> to compile.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
