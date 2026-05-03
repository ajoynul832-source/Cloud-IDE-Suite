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
  ["Ctrl+Z",       "Undo"],
  ["Ctrl+Shift+Z", "Redo"],
  ["Tab",          "Indent block"],
  ["Shift+Tab",    "Dedent block"],
  ["Alt+Click",    "Multi-cursor"],
  ["?",            "All shortcuts"],
];

export function SettingsPanel({
  isOpen, onClose,
  fontSize, onFontSizeChange,
  wordWrap, onWordWrapToggle,
  theme, onThemeChange,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute top-11 right-0 w-80 bg-[#161b22] border border-white/10 border-t-0 shadow-2xl overflow-y-auto max-h-[calc(100vh-44px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Settings size={13} className="text-white/40" />
            <span className="font-mono text-xs font-semibold text-white/70 tracking-widest uppercase">
              Editor Settings
            </span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* ── Theme ─────────────────────────────────────────────────── */}
        <div className="px-4 py-4 border-b border-white/8">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={12} className="text-white/40" />
            <span className="font-mono text-[11px] text-white/60">Color Theme</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={[
                  "flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all",
                  theme === t.id
                    ? "border-[#4ade80]/50 bg-[#4ade80]/8 shadow-[0_0_8px_rgba(74,222,128,0.1)]"
                    : "border-white/8 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {/* Mini preview swatch */}
                <div
                  className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center border"
                  style={{ background: t.bg, borderColor: `${t.accent}40` }}
                >
                  <span className="text-[9px] font-mono font-bold" style={{ color: t.accent }}>
                    {"</>"}
                  </span>
                </div>
                <span className={[
                  "font-mono text-[10px] leading-tight font-medium",
                  theme === t.id ? "text-[#4ade80]" : "text-white/50",
                ].join(" ")}>
                  {t.label}
                  {theme === t.id && (
                    <span className="block text-[8px] text-[#4ade80]/50 mt-0.5">active</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Font Size ─────────────────────────────────────────────── */}
        <div className="px-4 py-4 border-b border-white/8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Type size={12} className="text-white/40" />
              <span className="font-mono text-[11px] text-white/60">Font Size</span>
            </div>
            <span className="font-mono text-[11px] text-[#4ade80]">{fontSize}px</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))}
              className="w-8 h-7 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 font-mono text-sm transition-colors flex items-center justify-center"
            >
              −
            </button>
            <div className="flex gap-1 flex-1 justify-center">
              {FONT_PRESETS.map((size) => (
                <button
                  key={size}
                  onClick={() => onFontSizeChange(size)}
                  className={[
                    "flex-1 h-7 rounded font-mono text-[11px] transition-colors border",
                    fontSize === size
                      ? "bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/30"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30",
                  ].join(" ")}
                >
                  {size}
                </button>
              ))}
            </div>
            <button
              onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))}
              className="w-8 h-7 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 font-mono text-sm transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* ── Word Wrap ─────────────────────────────────────────────── */}
        <div className="px-4 py-4 border-b border-white/8">
          <button onClick={onWordWrapToggle} className="w-full flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <AlignJustify size={12} className="text-white/40" />
              <span className="font-mono text-[11px] text-white/60">Word Wrap</span>
            </div>
            <div className={[
              "relative w-9 h-5 rounded-full transition-colors duration-200",
              wordWrap ? "bg-[#4ade80]" : "bg-white/15 group-hover:bg-white/25",
            ].join(" ")}>
              <div className={[
                "absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform duration-200",
                wordWrap ? "translate-x-[18px]" : "translate-x-[3px]",
              ].join(" ")} />
            </div>
          </button>
        </div>

        {/* ── Keyboard Reference ────────────────────────────────────── */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Keyboard size={12} className="text-white/40" />
            <span className="font-mono text-[11px] text-white/60">Key Shortcuts</span>
          </div>
          <div className="space-y-2">
            {SHORTCUTS.map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-white/40">{desc}</span>
                <kbd className="font-mono text-[9px] text-white/35 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4 text-[10px] font-mono text-white/20">
          Changes apply instantly · Saved to your browser
        </div>
      </div>
    </div>
  );
}
