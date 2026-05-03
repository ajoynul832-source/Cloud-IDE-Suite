import { BuildLog }       from "./BuildLog";
import { ConsoleOutput }  from "./ConsoleOutput";
import { MobilePreview }  from "./MobilePreview";
import { StreamState }    from "@/hooks/useRun";
import type { SnackPlatform, SnackSyncData } from "@/hooks/useSnackSync";

export type PanelTab = "preview" | "console" | "build";

interface PreviewPanelProps {
  logs?:          string | null;
  buildStatus?:   string | null;
  buildError?:    string | null;
  isBuilding:     boolean;
  isRunning?:     boolean;
  activeTab:      PanelTab;
  onTabChange:    (tab: PanelTab) => void;
  stream?:        StreamState;
  htmlPreview?:   string | null;
  runsRemaining?: number | null;
  livePreview?:   boolean;
  stdinInput?:    string;
  onStdinChange?: (v: string) => void;

  // Mobile preview
  isRNProject?:   boolean;
  snackData?:     SnackSyncData | null;
  embedUrl?:      string | null;
  isSyncing?:     boolean;
  syncError?:     string | null;
  snackPlatform?: SnackPlatform;
  onPlatform?:    (p: SnackPlatform) => void;
  onSyncNow?:     () => void;
  files?:         Record<string, string>;
}

export function PreviewPanel({
  logs, buildStatus, buildError, isBuilding,
  isRunning, activeTab, onTabChange,
  stream, htmlPreview, runsRemaining, livePreview,
  stdinInput, onStdinChange,
  isRNProject, snackData, embedUrl, isSyncing, syncError,
  snackPlatform = "android", onPlatform, onSyncNow,
  files,
}: PreviewPanelProps) {
  const defaultStream: StreamState = { chunks: [], result: null };

  const tabs: { id: PanelTab; label: string }[] = [
    { id: "preview", label: isRNProject ? "Phone Preview" : "Preview" },
    { id: "console", label: "Console"   },
    { id: "build",   label: "Build Log" },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Tab bar */}
      <div className="h-9 flex border-b border-white/8 bg-[#161b22] shrink-0">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            data-testid={`button-tab-${id}`}
            onClick={() => onTabChange(id)}
            className={[
              "px-4 text-[10px] font-mono uppercase tracking-widest relative transition-colors",
              activeTab === id
                ? "text-[#4ade80] border-b-2 border-[#4ade80]"
                : "text-white/40 hover:text-white/70",
            ].join(" ")}
          >
            {label}
            {id === "preview" && livePreview && !isRNProject && (
              <span
                title="Live preview — updates as you type"
                className="ml-1.5 inline-block w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse align-middle"
              />
            )}
            {id === "preview" && isRNProject && (
              <span
                title="React Native Web live preview"
                className="ml-1.5 inline-block w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse align-middle"
              />
            )}
            {id === "build" && isBuilding && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-primary rounded-full animate-pulse align-middle" />
            )}
            {id === "console" && isRunning && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "preview" && (
          isRNProject ? (
            <MobilePreview
              snackData={snackData ?? null}
              embedUrl={embedUrl ?? null}
              isSyncing={isSyncing ?? false}
              syncError={syncError ?? null}
              platform={snackPlatform}
              setPlatform={onPlatform ?? (() => {})}
              syncNow={onSyncNow ?? (() => {})}
              files={files}
            />
          ) : (
            <WebPreviewContent htmlPreview={htmlPreview} />
          )
        )}
        {activeTab === "console" && (
          <ConsoleOutput
            stream={stream ?? defaultStream}
            isRunning={isRunning ?? false}
            runsRemaining={runsRemaining}
            stdinInput={stdinInput}
            onStdinChange={onStdinChange}
          />
        )}
        {activeTab === "build" && (
          <BuildLog
            logs={logs}
            status={buildStatus}
            error={buildError}
          />
        )}
      </div>
    </div>
  );
}

function WebPreviewContent({ htmlPreview }: { htmlPreview?: string | null }) {
  if (htmlPreview) {
    return (
      <iframe
        className="w-full h-full border-0 bg-white"
        sandbox="allow-scripts"
        srcDoc={htmlPreview}
        title="Live Preview"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-white/30 font-mono text-xs p-8 text-center">
      <div className="space-y-3 max-w-xs">
        <p className="text-base text-white/50">
          Open a file and click{" "}
          <span className="text-[#4ade80] font-bold">Run ▶</span>
        </p>
        <div className="space-y-1 text-left text-white/25">
          {[
            ["🟡", "JS / TS",       "→ Console output"],
            ["🐍", "Python",        "→ Console output"],
            ["🌐", "HTML",          "→ Live preview here"],
            ["🎨", "CSS",           "→ Live preview here"],
            ["📄", "Markdown",      "→ Rendered preview here"],
            ["📋", "JSON",          "→ Formatted viewer here"],
            ["🖼",  "SVG",           "→ Rendered preview here"],
            ["⚡", "Bash / Perl",   "→ Console output"],
            ["⚙",  "C / C++",       "→ Compile → Console"],
          ].map(([icon, lang, note]) => (
            <div key={lang} className="flex items-center gap-2">
              <span>{icon}</span>
              <span className="text-white/40 w-24">{lang}</span>
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
