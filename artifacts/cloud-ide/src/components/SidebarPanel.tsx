import React from "react";
import { Search, KeyRound, GitBranch, Package, Sparkles } from "lucide-react";
import { SearchPanel } from "./SearchPanel";
import { EnvPanel, EnvVar } from "./EnvPanel";
import { GitPanel } from "./GitPanel";
import { PackagePanel } from "./PackagePanel";
import { AIChat } from "./AIChat";

export type SidebarTab = "search" | "env" | "git" | "packages" | "ai" | null;

interface SidebarPanelProps {
  activeTab:        SidebarTab;
  onTabChange:      (tab: SidebarTab) => void;
  files:            Record<string, string>;
  projectId?:       string | null;
  currentContent?:  string;
  onSelectFile:     (filename: string, line?: number) => void;
  envVars?:         EnvVar[];
  onEnvVarsChange?: (vars: EnvVar[]) => void;
  onInsertCode?:    (code: string) => void;
}

const TABS: { id: SidebarTab; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: "ai",       icon: <Sparkles size={14} />,  label: "AI Assistant",  shortcut: "⌘I"    },
  { id: "search",   icon: <Search   size={14} />,  label: "Find in Files", shortcut: "⌘⇧F"  },
  { id: "git",      icon: <GitBranch size={14} />, label: "Git",           shortcut: "⌘⇧G"  },
  { id: "env",      icon: <KeyRound  size={14} />, label: "Env Vars",      shortcut: ""      },
  { id: "packages", icon: <Package   size={14} />, label: "Packages",      shortcut: ""      },
];

export function SidebarPanel({
  activeTab,
  onTabChange,
  files,
  projectId = null,
  currentContent = "",
  onSelectFile,
  envVars = [],
  onEnvVarsChange,
  onInsertCode,
}: SidebarPanelProps) {
  return (
    <div className="flex h-full shrink-0">
      {/* Icon rail */}
      <div className="w-10 flex flex-col items-center py-2 gap-1 bg-[#161b22] border-r border-white/8 shrink-0">
        {TABS.map(({ id, icon, label, shortcut }) => (
          <button
            key={id!}
            onClick={() => onTabChange(activeTab === id ? null : id)}
            title={shortcut ? `${label} (${shortcut})` : label}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              activeTab === id
                ? "bg-[#4ade80]/15 text-[#4ade80]"
                : "text-white/25 hover:text-white/60 hover:bg-white/5"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Slide-out panel */}
      {activeTab && (
        <div className="w-72 overflow-hidden border-r border-white/8 bg-[#0d1117] flex flex-col shrink-0">
          {activeTab === "ai" && (
            <AIChat
              onClose={() => onTabChange(null)}
              currentContent={currentContent}
              onInsertCode={onInsertCode}
            />
          )}
          {activeTab === "search" && (
            <SearchPanel
              files={files}
              onSelectFile={onSelectFile}
              onClose={() => onTabChange(null)}
            />
          )}
          {activeTab === "git" && (
            <GitPanel
              projectId={projectId}
              files={files}
              onClose={() => onTabChange(null)}
            />
          )}
          {activeTab === "env" && (
            <EnvPanel
              projectId={projectId}
              onClose={() => onTabChange(null)}
              onEnvChange={onEnvVarsChange ?? (() => {})}
              initialVars={envVars}
            />
          )}
          {activeTab === "packages" && (
            <PackagePanel
              projectId={projectId}
              onClose={() => onTabChange(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
