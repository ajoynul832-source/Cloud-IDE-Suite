import { motion, AnimatePresence } from "framer-motion";
import { X, Type, AlignJustify, Settings, Palette, Keyboard } from "lucide-react";
import { EditorTheme } from "@/components/Editor";

interface SettingsPanelProps {
  isOpen:           boolean;
  onClose:          () => void;
  fontSize:         number;
  onFontSizeChange: (size: number) => void;
  wordWrap:         boolean;
  onWordWrapToggle: () => void;
  theme:            EditorTheme;
  onThemeChange:    (t: EditorTheme) => void;
}

const FONT_PRESETS = [11, 13, 15, 17];

type ThemeMeta = { id: EditorTheme; label: string; bg: string; accent: string; sample: string };
const THEMES: ThemeMeta[] = [
  { id: "vscodeDark",  label: "VS Code",      bg: "#1e1e1e", accent: "#569cd6", sample: "#d4d4d4" },
  { id: "githubDark",  label: "GitHub Dark",  bg: "#0d1117", accent: "#79c0ff", sample: "#e6edf3" },
  { id: "dracula",     label: "Dracula",       bg: "#282a36", accent: "#ff79c6", sample: "#f8f8f2" },
  { id: "monokai",     label: "Monokai",       bg: "#272822", accent: "#a6e22e", sample: "#f8f8f2" },
];

const SHORTCUTS = [
  ["Ctrl+Enter",   "Run / Preview"],
  ["Ctrl+/",       "Toggle comment"],
  ["Ctrl+F",       "Find & Replace"],
  ["Alt+Z",        "Word wrap"],
];

export function SettingsPanel({
  isOpen, onClose,
  fontSize, onFontSizeChange,
  wordWrap, onWordWrapToggle,
  theme, onThemeChange,
}: SettingsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40"
        >
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-11 right-0 w-96 bg-gradient-to-b from-[#1c2128] to-[#161b22] border border-white/12 border-t-0 shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-y-auto max-h-[calc(100vh-44px)] backdrop-blur-xl"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-gradient-to-r from-white/5 to-transparent sticky top-0 z-10"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={13} className="text-white/50" />
                <span className="font-mono text-xs font-semibold text-white/70 tracking-widest uppercase">
                  Settings
                </span>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-white/30 hover:text-white/80 transition-colors"
              >
                <X size={14} />
              </motion.button>
            </motion.div>

            {/* Content */}
            <div className="divide-y divide-white/8">
              {/* Theme */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="px-5 py-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={12} className="text-white/40" />
                  <span className="font-mono text-[11px] text-white/60">Theme</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((t) => (
                    <motion.button
                      key={t.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onThemeChange(t.id)}
                      className={[
                        "flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all",
                        theme === t.id
                          ? "border-[#4ade80]/40 bg-[#4ade80]/12 shadow-[0_0_12px_rgba(74,222,128,0.15)]"
                          : "border-white/12 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06]",
                      ].join(" ")}
                    >
                      <div
                        className="w-8 h-8 rounded-md shrink-0 border"
                        style={{ background: t.bg, borderColor: `${t.accent}40` }}
                      />
                      <span className={[
                        "font-mono text-[10px] font-medium",
                        theme === t.id ? "text-[#4ade80]" : "text-white/50",
                      ].join(" ")}>
                        {t.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Font Size */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="px-5 py-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Type size={12} className="text-white/40" />
                    <span className="font-mono text-[11px] text-white/60">Font Size</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#4ade80] font-bold">{fontSize}px</span>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))}
                    className="w-9 h-8 rounded bg-white/8 border border-white/12 text-white/50 hover:text-white hover:border-white/25 font-mono text-sm transition-all"
                  >
                    −
                  </motion.button>
                  <div className="flex gap-1 flex-1">
                    {FONT_PRESETS.map((size) => (
                      <motion.button
                        key={size}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onFontSizeChange(size)}
                        className={[
                          "flex-1 h-8 rounded font-mono text-[10px] transition-all border",
                          fontSize === size
                            ? "bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/30 shadow-[0_0_8px_rgba(74,222,128,0.1)]"
                            : "bg-white/5 border-white/12 text-white/40 hover:text-white/80 hover:border-white/20",
                        ].join(" ")}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))}
                    className="w-9 h-8 rounded bg-white/8 border border-white/12 text-white/50 hover:text-white hover:border-white/25 font-mono text-sm transition-all"
                  >
                    +
                  </motion.button>
                </div>
              </motion.div>

              {/* Word Wrap */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-5 py-4"
              >
                <motion.button
                  onClick={onWordWrapToggle}
                  whileHover={{ scale: 1.01 }}
                  className="w-full flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <AlignJustify size={12} className="text-white/40" />
                    <span className="font-mono text-[11px] text-white/60">Word Wrap</span>
                  </div>
                  <motion.div
                    className={[
                      "relative w-10 h-6 rounded-full transition-colors",
                      wordWrap ? "bg-[#4ade80]" : "bg-white/15 group-hover:bg-white/20",
                    ].join(" ")}
                  >
                    <motion.div
                      layout
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                      animate={{ x: wordWrap ? 20 : 2 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    />
                  </motion.div>
                </motion.button>
              </motion.div>

              {/* Quick shortcuts */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="px-5 py-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Keyboard size={12} className="text-white/40" />
                  <span className="font-mono text-[11px] text-white/60">Quick Shortcuts</span>
                </div>
                <div className="space-y-1.5">
                  {SHORTCUTS.map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-white/40">{desc}</span>
                      <kbd className="font-mono text-[9px] text-[#4ade80]/60 bg-[#4ade80]/10 px-2 py-1 rounded border border-[#4ade80]/20">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Footer */}
              <div className="px-5 py-3 text-[10px] font-mono text-white/20 text-center">
                Changes apply instantly
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
