import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Box, Download, Loader2, FolderOpen, ChevronDown,
  Database, Share2, Compass, CheckCircle2, LogOut, User, RotateCcw,
  Settings, HelpCircle, Archive, Wand2, WrapText, Rocket, CreditCard,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export type AutosaveStatus = "idle" | "saving" | "saved";

interface ToolbarProps {
  isBuilding:        boolean;
  isRunning?:        boolean;
  onRun:             () => void;
  onBuild:           () => void;
  onNewProject:      () => void;
  onOpenProjects:    () => void;
  onShare?:          () => void;
  onReset?:          () => void;
  onShowSettings?:   () => void;
  onShowShortcuts?:  () => void;
  onDeploy?:         () => void;
  buildStatus?:      string | null;
  jobId?:            string | null;
  currentLanguage?:  string;
  canRun?:           boolean;
  canShare?:         boolean;
  previewMode?:      boolean;
  projectName?:      string;
  autosaveStatus?:   AutosaveStatus;
  runsRemaining?:    number | null;
  showBuildButton?:  boolean;
  onDownload?:       () => void;
  onFormat?:         () => void;
  wordWrap?:         boolean;
  onWordWrapToggle?: () => void;
}

function NavBtn({ onClick, icon, label, title, danger = false }: {
  onClick?: () => void;
  icon: React.ReactNode;
  label?: string;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        "flex items-center gap-1.5 text-[11px] font-mono px-2 py-1.5 rounded-md transition-all duration-150 shrink-0 select-none",
        danger
          ? "text-white/40 hover:text-orange-400 hover:bg-orange-400/10"
          : "text-white/40 hover:text-white/90 hover:bg-white/[0.07]",
      ].join(" ")}
    >
      {icon}
      {label && <span className="hidden md:block">{label}</span>}
    </button>
  );
}

function IconBtn({ onClick, icon, title, active = false }: {
  onClick?: () => void;
  icon: React.ReactNode;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0",
        active
          ? "text-[#4ade80] bg-[#4ade80]/12 hover:bg-[#4ade80]/20"
          : "text-white/35 hover:text-white/80 hover:bg-white/[0.07]",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}

const Divider = () => <div className="w-px h-4 bg-white/[0.08] shrink-0 mx-0.5" />;

export function Toolbar({
  isBuilding,
  isRunning,
  onRun,
  onBuild,
  onNewProject,
  onOpenProjects,
  onShare,
  onReset,
  onShowSettings,
  onShowShortcuts,
  onDeploy,
  buildStatus,
  jobId,
  currentLanguage,
  canRun,
  canShare,
  previewMode,
  projectName,
  autosaveStatus = "idle",
  runsRemaining,
  showBuildButton = false,
  onDownload,
  onFormat,
  wordWrap,
  onWordWrapToggle,
}: ToolbarProps) {
  const { user, logout } = useAuth();
  const runDisabled = isRunning || !canRun || runsRemaining === 0;

  return (
    <div className="h-11 bg-[#161b22] border-b border-white/[0.07] flex items-center justify-between px-2.5 shrink-0 gap-2 relative">
      {/* Subtle top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />

      {/* ── Left ────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 min-w-0">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 mr-1.5 group" title="Home">
          <div className="relative">
            <div className="absolute inset-0 bg-[#4ade80] blur-sm opacity-0 group-hover:opacity-40 rounded-full transition-opacity" />
            <Box className="relative text-[#4ade80] transition-transform group-hover:scale-110" size={16} />
          </div>
          <span className="font-mono font-black text-white text-[11px] tracking-widest uppercase hidden sm:block">
            Cloud<span className="text-[#4ade80]">IDE</span>
          </span>
        </Link>

        <Divider />

        <NavBtn onClick={onNewProject} icon={<FolderOpen size={12} />} label="New" title="New project" />
        <NavBtn onClick={onOpenProjects} icon={<Database size={12} />} label="Projects" title="Save & load projects" />
        <Link
          href="/explore"
          className="flex items-center gap-1.5 text-[11px] font-mono text-white/40 hover:text-white/90 hover:bg-white/[0.07] px-2 py-1.5 rounded-md transition-all shrink-0"
        >
          <Compass size={12} />
          <span className="hidden md:block">Explore</span>
        </Link>

        {canShare && onShare && (
          <NavBtn onClick={onShare} icon={<Share2 size={12} />} label="Share" title="Share this project" />
        )}

        {onReset && (
          <NavBtn
            onClick={() => { if (confirm("Reset to default files? Current code will be lost.")) onReset?.(); }}
            icon={<RotateCcw size={11} />}
            label="Reset"
            title="Reset workspace"
            danger
          />
        )}

        {projectName && (
          <>
            <Divider />
            <span className="text-[11px] font-mono text-white/35 truncate max-w-[120px]" title={projectName}>
              {projectName}
            </span>
            <AnimatePresence mode="wait">
              {autosaveStatus === "saving" && (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-white/25 ml-1 shrink-0"
                >
                  <Loader2 size={8} className="animate-spin" />saving
                </motion.span>
              )}
              {autosaveStatus === "saved" && (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-[#4ade80]/50 ml-1 shrink-0"
                >
                  <CheckCircle2 size={8} />saved
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ── Right ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Run button */}
        <motion.button
          data-testid="button-run"
          onClick={onRun}
          disabled={runDisabled}
          whileTap={runDisabled ? {} : { scale: 0.95 }}
          title={
            runsRemaining === 0
              ? "Daily run limit reached (50/day). Resets at midnight UTC."
              : canRun && previewMode
              ? "Preview in right panel  (Ctrl+Enter)"
              : canRun
              ? "Run current file  (Ctrl+Enter)"
              : "Open a runnable file to run it"
          }
          className={[
            "flex items-center gap-1.5 px-3.5 h-7 rounded-lg font-mono text-[11px] font-bold transition-all select-none shrink-0",
            runDisabled
              ? "bg-white/[0.06] text-white/25 cursor-not-allowed"
              : "bg-[#4ade80] text-black hover:bg-[#22c55e] shadow-[0_0_14px_rgba(74,222,128,0.35)] hover:shadow-[0_0_20px_rgba(74,222,128,0.55)]",
          ].join(" ")}
        >
          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.span key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" />Running…
              </motion.span>
            ) : previewMode ? (
              <motion.span key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <Play size={10} fill="currentColor" />Preview
              </motion.span>
            ) : (
              <motion.span key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <Play size={10} fill="currentColor" />Run
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Build APK */}
        {showBuildButton && (
          <button
            data-testid="button-build-apk"
            onClick={onBuild}
            disabled={isBuilding}
            className={[
              "flex items-center gap-1.5 px-3 h-7 rounded-lg font-mono text-[11px] font-semibold transition-all border shrink-0",
              isBuilding
                ? "border-white/10 text-white/25 cursor-not-allowed"
                : "border-white/15 text-white/50 hover:border-[#4ade80]/40 hover:text-[#4ade80] hover:bg-[#4ade80]/8",
            ].join(" ")}
          >
            {isBuilding ? (
              <><Loader2 size={11} className="animate-spin" />Building…</>
            ) : (
              <><Box size={11} />Build APK</>
            )}
          </button>
        )}

        {/* Download APK */}
        {buildStatus === "success" && jobId && (
          <a
            data-testid="button-download-apk"
            href={`/api/download/${jobId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg font-mono text-[11px] font-semibold border border-[#4ade80]/35 text-[#4ade80] hover:bg-[#4ade80]/10 transition-colors shadow-[0_0_10px_rgba(74,222,128,0.15)] shrink-0"
          >
            <Download size={11} />Download APK
          </a>
        )}

        {buildStatus === "failed" && (
          <span className="text-[11px] font-mono text-red-400/80">Build failed</span>
        )}

        <Divider />

        {/* Deploy */}
        {onDeploy && (
          <IconBtn onClick={onDeploy} icon={<Rocket size={12} />} title="Deploy a shareable preview URL" />
        )}

        {/* Billing */}
        <Link
          href="/billing"
          title="Billing & plans"
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-all"
        >
          <CreditCard size={12} />
        </Link>

        {/* Word wrap */}
        {onWordWrapToggle && (
          <IconBtn onClick={onWordWrapToggle} icon={<WrapText size={12} />} title={`Word wrap: ${wordWrap ? "on" : "off"}  (Alt+Z)`} active={wordWrap} />
        )}

        {/* Format */}
        {onFormat && (
          <button
            onClick={onFormat}
            title="Format with Prettier  (Ctrl+Shift+F)"
            className="flex items-center gap-1 px-2 h-7 rounded-md text-[11px] font-mono text-white/35 hover:text-white/80 hover:bg-white/[0.07] transition-all shrink-0"
          >
            <Wand2 size={12} />
            <span className="hidden lg:block">Format</span>
          </button>
        )}

        {/* Download ZIP */}
        {onDownload && (
          <IconBtn onClick={onDownload} icon={<Archive size={12} />} title="Download all files as ZIP" />
        )}

        <Divider />

        {/* Settings */}
        {onShowSettings && (
          <IconBtn onClick={onShowSettings} icon={<Settings size={12} />} title="Editor settings  (Ctrl+,)" />
        )}

        {/* Keyboard shortcuts */}
        {onShowShortcuts && (
          <IconBtn onClick={onShowShortcuts} icon={<HelpCircle size={12} />} title="Keyboard shortcuts  (?)" />
        )}

        {/* User */}
        {user ? (
          <>
            <Divider />
            <div className="hidden md:flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4ade80]/40 to-blue-500/40 border border-white/15 flex items-center justify-center shrink-0">
                <User size={9} className="text-white/70" />
              </div>
              <span className="font-mono text-[10px] text-white/35 max-w-[100px] truncate" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1 rounded-md text-white/25 hover:text-red-400/80 hover:bg-red-400/10 transition-all"
              >
                <LogOut size={10} />
              </button>
            </div>
          </>
        ) : (
          <Link
            href="/auth"
            className="hidden md:flex items-center gap-1 text-[11px] font-mono text-white/35 hover:text-white/80 transition-all px-2 py-1.5 rounded-md hover:bg-white/[0.07] ml-0.5 shrink-0"
          >
            Sign in
          </Link>
        )}
      </div>

      {/* Bottom gradient line — subtle accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4ade80]/10 to-transparent pointer-events-none" />
    </div>
  );
}
