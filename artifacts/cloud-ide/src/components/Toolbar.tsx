import {
  Play, Box, Download, Loader2, FolderOpen, ChevronDown,
  Database, Share2, Compass, CheckCircle2, LogOut, User, RotateCcw,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

export type AutosaveStatus = "idle" | "saving" | "saved";

interface ToolbarProps {
  isBuilding:       boolean;
  isRunning?:       boolean;
  onRun:            () => void;
  onBuild:          () => void;
  onNewProject:     () => void;
  onOpenProjects:   () => void;
  onShare?:         () => void;
  onReset?:         () => void;
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
  onReset,
  buildStatus,
  jobId,
  currentLanguage,
  canRun,
  canShare,
  projectName,
  autosaveStatus = "idle",
  runsRemaining,
}: ToolbarProps) {
  const { user, logout } = useAuth();
  const runDisabled = isRunning || !canRun || runsRemaining === 0;

  return (
    <div className="h-11 bg-[#161b22] border-b border-white/8 flex items-center justify-between px-3 shrink-0 gap-2">

      {/* ── Left: brand + nav ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 min-w-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 mr-1 group" title="Home">
          <Box className="text-[#4ade80] group-hover:scale-110 transition-transform" size={17} />
          <span className="font-mono font-bold text-white text-xs tracking-widest uppercase hidden sm:block">
            CloudIDE
          </span>
        </Link>

        <div className="w-px h-4 bg-white/10 shrink-0 mx-1" />

        <button
          data-testid="button-new-project"
          onClick={onNewProject}
          className="flex items-center gap-1 text-[11px] font-mono text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/8 shrink-0"
        >
          <FolderOpen size={12} />
          <span className="hidden sm:block">New</span>
          <ChevronDown size={10} />
        </button>

        <button
          data-testid="button-projects"
          onClick={onOpenProjects}
          title="Save & load projects"
          className="flex items-center gap-1 text-[11px] font-mono text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/8 shrink-0"
        >
          <Database size={12} />
          <span className="hidden md:block">Projects</span>
        </button>

        <Link
          href="/explore"
          className="flex items-center gap-1 text-[11px] font-mono text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/8 shrink-0"
        >
          <Compass size={12} />
          <span className="hidden md:block">Explore</span>
        </Link>

        {canShare && onShare && (
          <button
            data-testid="button-share"
            onClick={onShare}
            title="Share this project"
            className="flex items-center gap-1 text-[11px] font-mono text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/8 shrink-0"
          >
            <Share2 size={12} />
            <span className="hidden md:block">Share</span>
          </button>
        )}

        {onReset && (
          <button
            onClick={() => {
              if (confirm("Reset to default JavaScript files? Your current code will be lost.")) {
                onReset();
              }
            }}
            title="Reset workspace to default JavaScript files"
            className="flex items-center gap-1 text-[11px] font-mono text-white/50 hover:text-orange-400 transition-colors px-2 py-1 rounded hover:bg-orange-400/10 shrink-0"
          >
            <RotateCcw size={11} />
            <span className="hidden lg:block">Reset</span>
          </button>
        )}

        {/* Project name + autosave */}
        {projectName && (
          <>
            <div className="w-px h-3.5 bg-white/10 shrink-0 mx-1" />
            <span className="text-[11px] font-mono text-white/40 truncate max-w-[130px]" title={projectName}>
              {projectName}
            </span>
            {autosaveStatus === "saving" && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-white/30 shrink-0">
                <Loader2 size={8} className="animate-spin" />saving
              </span>
            )}
            {autosaveStatus === "saved" && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-[#4ade80]/60 shrink-0">
                <CheckCircle2 size={8} />saved
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Right: actions + user ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Run — prominent green when active */}
        <button
          data-testid="button-run"
          onClick={onRun}
          disabled={runDisabled}
          title={
            runsRemaining === 0
              ? "Daily run limit reached (50/day). Resets at midnight UTC."
              : canRun
              ? "Run current file  (Ctrl+Enter)"
              : "Open a JS, TS, Python, or HTML file to run"
          }
          className={[
            "flex items-center gap-1.5 px-3 h-7 rounded font-mono text-xs font-bold transition-all",
            runDisabled
              ? "bg-white/8 text-white/30 cursor-not-allowed"
              : "bg-[#4ade80] text-black hover:bg-[#4ade80]/90 hover:scale-105 shadow-[0_0_12px_rgba(74,222,128,0.35)]",
          ].join(" ")}
        >
          {isRunning ? (
            <><Loader2 size={11} className="animate-spin" />Running…</>
          ) : (
            <><Play size={11} fill="currentColor" />Run</>
          )}
        </button>

        {/* Build APK */}
        <button
          data-testid="button-build-apk"
          onClick={onBuild}
          disabled={isBuilding}
          className={[
            "flex items-center gap-1.5 px-3 h-7 rounded font-mono text-xs font-semibold transition-all border",
            isBuilding
              ? "border-white/15 text-white/30 cursor-not-allowed"
              : "border-white/20 text-white/60 hover:border-white/40 hover:text-white",
          ].join(" ")}
        >
          {isBuilding ? (
            <><Loader2 size={11} className="animate-spin" />Building…</>
          ) : (
            <><Box size={11} />Build APK</>
          )}
        </button>

        {/* Download APK */}
        {buildStatus === "success" && jobId && (
          <a
            data-testid="button-download-apk"
            href={`/api/download/${jobId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 h-7 rounded font-mono text-xs font-semibold border border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/10 transition-colors"
          >
            <Download size={11} />Download APK
          </a>
        )}

        {buildStatus === "failed" && (
          <span className="text-xs font-mono text-red-400">Build failed</span>
        )}

        {/* User */}
        {user && (
          <>
            <div className="w-px h-5 bg-white/10 hidden md:block" />
            <div className="hidden md:flex items-center gap-1.5">
              <User size={11} className="text-white/40" />
              <span className="font-mono text-[10px] text-white/40 max-w-[110px] truncate" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut size={11} />
              </button>
            </div>
          </>
        )}

        {!user && (
          <Link
            href="/auth"
            className="hidden md:flex items-center gap-1 text-[11px] font-mono text-white/40 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/8"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
