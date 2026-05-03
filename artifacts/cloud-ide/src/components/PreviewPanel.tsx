import { BuildLog } from "./BuildLog";
import { ConsoleOutput } from "./ConsoleOutput";
import { StreamState } from "@/hooks/useRun";
import { ExternalLink, QrCode } from "lucide-react";

export type PanelTab = "preview" | "console" | "build";

interface SnackPreview {
  embedUrl: string;
  qrUrl:    string;
  snackUrl: string;
}

interface PreviewPanelProps {
  logs?:          string | null;
  buildStatus?:   string | null;
  buildError?:    string | null;
  isBuilding:     boolean;
  isRunning?:     boolean;
  activeTab:      PanelTab;
  onTabChange:    (tab: PanelTab) => void;
  stream?:        StreamState;
  snackPreview?:  SnackPreview | null;
  htmlPreview?:   string | null;
  projectType?:   string;
  runsRemaining?: number | null;
}

const RUNNABLE_LANGS = [
  "JavaScript", "TypeScript", "Python", "HTML",
  "CSS", "Markdown", "JSON", "SVG",
  "Bash", "Shell", "Perl", "C", "C++",
];

export function PreviewPanel({
  logs,
  buildStatus,
  buildError,
  isBuilding,
  isRunning,
  activeTab,
  onTabChange,
  stream,
  snackPreview,
  htmlPreview,
  projectType,
  runsRemaining,
}: PreviewPanelProps) {
  const tabs: { id: PanelTab; label: string }[] = [
    { id: "preview", label: "Preview"   },
    { id: "console", label: "Console"   },
    { id: "build",   label: "Build Log" },
  ];

  const defaultStream: StreamState = { chunks: [], result: null };

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
          <PreviewContent
            snackPreview={snackPreview}
            htmlPreview={htmlPreview}
            projectType={projectType}
          />
        )}
        {activeTab === "console" && (
          <ConsoleOutput
            stream={stream ?? defaultStream}
            isRunning={isRunning ?? false}
            runsRemaining={runsRemaining}
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

function PreviewContent({
  snackPreview,
  htmlPreview,
  projectType,
}: {
  snackPreview?: SnackPreview | null;
  htmlPreview?:  string | null;
  projectType?:  string;
}) {
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

  if (snackPreview) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-white/8 bg-[#161b22] text-xs font-mono">
          <span className="text-primary font-semibold">Expo Snack</span>
          <span className="text-white/40 flex-1 truncate">{snackPreview.snackUrl}</span>
          <a
            href={snackPreview.snackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink size={11} />Open
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
        <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-t border-white/8 bg-[#161b22]">
          <QrCode size={13} className="text-white/40" />
          <span className="text-xs font-mono text-white/40">Scan to open on device</span>
          <img src={snackPreview.qrUrl} alt="QR Code" className="w-14 h-14 ml-auto rounded" />
        </div>
      </div>
    );
  }

  // Empty state — vary message by project type
  return (
    <div className="w-full h-full flex items-center justify-center text-white/30 font-mono text-xs p-8 text-center">
      <div className="space-y-3 max-w-xs">
        {projectType === "react-native" ? (
          <>
            <p className="text-sm text-white/50">React Native preview</p>
            <p>Click <span className="text-primary font-bold">Build APK</span> to create an Expo Snack preview.</p>
          </>
        ) : projectType === "flutter" ? (
          <>
            <p className="text-sm text-white/50">Flutter project</p>
            <p>Flutter cannot run directly in the browser.</p>
            <p>Click <span className="text-primary font-bold">Build APK</span> to compile.</p>
          </>
        ) : projectType === "android" ? (
          <>
            <p className="text-sm text-white/50">Android project</p>
            <p>Click <span className="text-primary font-bold">Build APK</span> to compile.</p>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
