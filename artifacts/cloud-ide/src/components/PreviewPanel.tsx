import React, { useState } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
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
  snackPlatform = "web", onPlatform, onSyncNow,
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
  const [frameKey, setFrameKey] = useState(0);

  if (htmlPreview) {
    const openInTab = () => {
      const blob = new Blob([htmlPreview], { type: "text/html" });
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      // Revoke after a short delay to let the tab load
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    };

    return (
      <div className="flex flex-col h-full">
        {/* Mini toolbar */}
        <div className="shrink-0 flex items-center gap-1 px-2 py-1 bg-[#161b22] border-b border-white/8">
          <span className="flex-1 text-[10px] font-mono text-white/25 truncate pl-1">
            Live Preview
          </span>
          <button
            onClick={() => setFrameKey((k) => k + 1)}
            title="Refresh preview"
            className="p-1 text-white/30 hover:text-white/70 transition-colors"
          >
            <RefreshCw size={11} />
          </button>
          <button
            onClick={openInTab}
            title="Open in new tab"
            className="p-1 text-white/30 hover:text-white/70 transition-colors"
          >
            <ExternalLink size={11} />
          </button>
        </div>
        <iframe
          key={frameKey}
          className="flex-1 border-0 bg-white w-full"
          sandbox="allow-scripts allow-same-origin allow-forms"
          srcDoc={htmlPreview}
          title="Live Preview"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-white/30 font-mono text-xs p-6 text-center overflow-y-auto">
      <div className="space-y-4 max-w-xs w-full">
        <p className="text-sm text-white/50">
          Open a file and click{" "}
          <span className="text-[#4ade80] font-bold">Run ▶</span>
          <span className="text-white/30 text-xs ml-1">(or Ctrl+Enter)</span>
        </p>

        <div className="text-left space-y-0.5">
          <p className="text-[9px] uppercase tracking-widest text-white/20 mb-1.5">Executed on server</p>
          {[
            ["🟡", "JS / TS",    "→ Console output"],
            ["🐍", "Python",     "→ Console output"],
            ["⚡", "Bash/Perl",  "→ Console output"],
            ["⚙",  "C / C++",    "→ Compile → Run"],
          ].map(([icon, lang, note]) => (
            <div key={lang} className="flex items-center gap-2 text-white/25">
              <span className="w-5 text-center">{icon}</span>
              <span className="w-20">{lang}</span>
              <span className="text-white/20">{note}</span>
            </div>
          ))}
        </div>

        <div className="text-left space-y-0.5">
          <p className="text-[9px] uppercase tracking-widest text-white/20 mb-1.5">Instant in-browser preview</p>
          {[
            ["🌐", "HTML",       "→ Live iframe"],
            ["🎨", "CSS",        "→ Styled demo"],
            ["📄", "Markdown",   "→ Rendered HTML"],
            ["📋", "JSON",       "→ Tree viewer"],
            ["🖼",  "SVG",        "→ Rendered image"],
          ].map(([icon, lang, note]) => (
            <div key={lang} className="flex items-center gap-2 text-white/25">
              <span className="w-5 text-center">{icon}</span>
              <span className="w-20">{lang}</span>
              <span className="text-white/20">{note}</span>
            </div>
          ))}
        </div>

        <div className="text-left space-y-0.5">
          <p className="text-[9px] uppercase tracking-widest text-white/20 mb-1.5">CDN templates (use New Project)</p>
          {[
            ["⚛️",  "React CDN",  "→ Live preview"],
            ["💚", "Vue 3 CDN",  "→ Live preview"],
            ["🔷", "Three.js",   "→ WebGL 3D"],
            ["🎨", "p5.js",      "→ Canvas art"],
            ["📊", "Chart.js",   "→ Dashboard"],
          ].map(([icon, lang, note]) => (
            <div key={lang} className="flex items-center gap-2 text-white/20">
              <span className="w-5 text-center">{icon}</span>
              <span className="w-20">{lang}</span>
              <span className="text-white/15">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
