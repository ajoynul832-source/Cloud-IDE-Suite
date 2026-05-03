import { motion, AnimatePresence } from "framer-motion";
import { Gauge, Home, Circle, Plus, Minus, Type, CheckCircle2, Loader2, Save, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import type { AutosaveStatus } from "./Toolbar";

interface StatusBarProps {
  language?:           string;
  filename?:           string;
  runsRemaining?:      number | null;
  isRunning?:          boolean;
  isBuilding?:         boolean;
  cursorPos?:          { line: number; col: number } | null;
  fontSize?:           number;
  onFontSizeIncrease?: () => void;
  onFontSizeDecrease?: () => void;
  saveStatus?:         AutosaveStatus;
  hasUnsavedChanges?:  boolean;
  onSave?:             () => void;
}

const LANG_COLORS: Record<string, string> = {
  JavaScript:  "text-yellow-400/80",
  TypeScript:  "text-blue-400/80",
  Python:      "text-green-400/80",
  HTML:        "text-orange-400/80",
  CSS:         "text-pink-400/80",
  Bash:        "text-lime-400/80",
  C:           "text-sky-400/80",
  "C++":       "text-indigo-400/80",
  Markdown:    "text-purple-400/80",
  JSON:        "text-yellow-300/80",
  Rust:        "text-orange-500/80",
  Go:          "text-cyan-400/80",
  Perl:        "text-violet-400/80",
  Dart:        "text-sky-300/80",
  Kotlin:      "text-purple-400/80",
};

export function StatusBar({
  language,
  filename,
  runsRemaining,
  isRunning,
  isBuilding,
  cursorPos,
  fontSize,
  onFontSizeIncrease,
  onFontSizeDecrease,
  saveStatus = "idle",
  hasUnsavedChanges = false,
  onSave,
}: StatusBarProps) {
  const runsLow  = runsRemaining !== null && runsRemaining !== undefined && runsRemaining < 5;
  const runsOut  = runsRemaining === 0;
  const langColor = (language && LANG_COLORS[language]) ?? "text-white/45";

  return (
    <div className="h-6 bg-[#1c2128] border-t border-white/[0.06] flex items-center justify-between px-3 shrink-0 select-none relative">
      {/* Top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

      {/* Left */}
      <div className="flex items-center gap-2.5 text-[10px] font-mono text-white/35">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-[#4ade80]/80 transition-colors group"
          title="Back to home"
        >
          <Home size={9} className="group-hover:scale-110 transition-transform" />
          <span className="hidden sm:block">Home</span>
        </Link>

        <div className="w-px h-2.5 bg-white/[0.08]" />

        {filename && (
          <span className="truncate max-w-[160px] text-white/45" title={filename}>
            {filename.split("/").pop()}
          </span>
        )}

        {cursorPos && (
          <span className="text-white/25 hidden sm:block" title="Cursor position">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5 text-[10px] font-mono">

        {/* Save status */}
        <AnimatePresence mode="wait">
          {saveStatus === "saving" && (
            <motion.span
              key="saving"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              className="flex items-center gap-1 text-white/25"
            >
              <Loader2 size={8} className="animate-spin" />
              Saving…
            </motion.span>
          )}
          {saveStatus === "saved" && (
            <motion.span
              key="saved"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[#4ade80]/45"
            >
              <CheckCircle2 size={8} />
              Saved
            </motion.span>
          )}
          {saveStatus === "idle" && hasUnsavedChanges && onSave && (
            <motion.button
              key="unsaved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onSave}
              title="Save now (Ctrl+S)"
              className="flex items-center gap-1 text-amber-400/55 hover:text-amber-300 transition-colors"
            >
              <Save size={8} />
              Unsaved
            </motion.button>
          )}
        </AnimatePresence>

        {/* Running / building indicator */}
        <AnimatePresence>
          {isRunning && (
            <motion.span
              key="run"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-yellow-400/80"
            >
              <Circle size={6} className="fill-yellow-400 animate-pulse" />
              Running
            </motion.span>
          )}
          {isBuilding && (
            <motion.span
              key="build"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[#4ade80]/70"
            >
              <Circle size={6} className="fill-[#4ade80] animate-pulse" />
              Building
            </motion.span>
          )}
        </AnimatePresence>

        {/* Font size */}
        {filename && onFontSizeIncrease && onFontSizeDecrease && (
          <div className="flex items-center gap-0.5 text-white/25" title="Font size">
            <Type size={8} className="mr-0.5" />
            <button
              onClick={onFontSizeDecrease}
              className="w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-white/10 hover:text-white/60 transition-colors"
              title="Decrease font size"
            >
              <Minus size={7} />
            </button>
            <span className="w-5 text-center text-white/25">{fontSize}</span>
            <button
              onClick={onFontSizeIncrease}
              className="w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-white/10 hover:text-white/60 transition-colors"
              title="Increase font size"
            >
              <Plus size={7} />
            </button>
          </div>
        )}

        {/* Language */}
        {language && (
          <span className={`font-mono ${langColor} transition-colors`}>{language}</span>
        )}

        {/* Runs remaining */}
        {runsRemaining !== null && runsRemaining !== undefined && (
          <span
            className={[
              "flex items-center gap-1 transition-colors",
              runsOut ? "text-red-400/70" : runsLow ? "text-orange-400/80" : "text-white/30",
            ].join(" ")}
            title={`${runsRemaining} code runs remaining today (50/day, resets midnight UTC)`}
          >
            {runsOut ? <AlertCircle size={8} /> : <Gauge size={8} />}
            {runsOut ? "No runs left" : `${runsRemaining} runs`}
          </span>
        )}
      </div>
    </div>
  );
}
