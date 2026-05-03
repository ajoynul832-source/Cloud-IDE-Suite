import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ExternalLink } from "lucide-react";
import { BuildLog }       from "./BuildLog";
import { ConsoleOutput }  from "./ConsoleOutput";
import { MobilePreview }  from "./MobilePreview";
import { TerminalTab }    from "./TerminalTab";
import { StreamState }    from "@/hooks/useRun";
import type { SnackPlatform, SnackSyncData } from "@/hooks/useSnackSync";

export type PanelTab = "preview" | "console" | "build" | "terminal";

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
    { id: "preview",  label: isRNProject ? "Phone Preview" : "Preview" },
    { id: "console",  label: "Console"   },
    { id: "terminal", label: "Terminal"  },
    { id: "build",    label: "Build Log" },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Tab bar */}
      <div className="h-9 flex border-b border-white/8 bg-[#161b22] shrink-0 relative">
        <div className="flex flex-1">
          {tabs.map(({ id, label }) => (
            <motion.button
              key={id}
              data-testid={`button-tab-${id}`}
              onClick={() => onTabChange(id)}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              className={[
                "px-4 text-[10px] font-mono uppercase tracking-widest relative transition-colors shrink-0",
                activeTab === id
                  ? "text-[#4ade80]"
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
                  title="Mobile preview syncing"
                  className="ml-1.5 inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse align-middle"
                />
              )}
              {id === "console" && isRunning && (
                <span
                  title="Running…"
                  className="ml-1.5 inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse align-middle"
                />
              )}
              {id === "build" && isBuilding && (
                <span
                  title="Building…"
                  className="ml-1.5 inline-block w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse align-middle"
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Active indicator */}
        {activeTab && (
          <motion.div
            layoutId="active-tab-indicator"
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-[#4ade80]/40 to-[#4ade80]/10"
            initial={false}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            style={{
              left: tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length) + "%",
              width: (100 / tabs.length) + "%",
            }}
          />
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full absolute"
          >
            {isRNProject && (
              <MobilePreview
                snackData={snackData}
                embedUrl={embedUrl}
                isSyncing={isSyncing}
                syncError={syncError}
                snackPlatform={snackPlatform}
                onPlatform={onPlatform}
                onSyncNow={onSyncNow}
                files={files}
              />
            )}
            {!isRNProject && (
              htmlPreview ? (
                <iframe
                  title="HTML Preview"
                  srcDoc={htmlPreview}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-white/30 text-sm font-mono">
                  No preview available — click Run to generate
                </div>
              )
            )}
          </motion.div>
        )}

        {activeTab === "console" && (
          <motion.div
            key="console"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full absolute"
          >
            <ConsoleOutput
              stream={stream ?? defaultStream}
              isRunning={isRunning ?? false}
              runsRemaining={runsRemaining}
              stdinInput={stdinInput}
              onStdinChange={onStdinChange}
            />
          </motion.div>
        )}

        {activeTab === "terminal" && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full absolute"
          >
            <TerminalTab
              logs={logs}
              isRunning={isRunning ?? false}
              stdinInput={stdinInput}
              onStdinChange={onStdinChange}
            />
          </motion.div>
        )}

        {activeTab === "build" && (
          <motion.div
            key="build"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full absolute"
          >
            <BuildLog
              logs={logs}
              status={buildStatus}
              error={buildError}
              projectType={undefined}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
