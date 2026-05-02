import { X, Type, AlignJustify, Settings } from "lucide-react";

interface SettingsPanelProps {
  isOpen:            boolean;
  onClose:           () => void;
  fontSize:          number;
  onFontSizeChange:  (size: number) => void;
  wordWrap:          boolean;
  onWordWrapToggle:  () => void;
}

const FONT_PRESETS = [11, 13, 15, 17];

export function SettingsPanel({
  isOpen,
  onClose,
  fontSize,
  onFontSizeChange,
  wordWrap,
  onWordWrapToggle,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40"
      onClick={onClose}
    >
      <div
        className="absolute top-11 right-0 w-72 bg-[#161b22] border border-white/10 border-t-0 shadow-2xl"
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
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Font size */}
        <div className="px-4 py-4 border-b border-white/8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Type size={12} className="text-white/40" />
              <span className="font-mono text-[11px] text-white/60">Font Size</span>
            </div>
            <span className="font-mono text-[11px] text-white/40">{fontSize}px</span>
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

        {/* Word wrap */}
        <div className="px-4 py-4 border-b border-white/8">
          <button
            onClick={onWordWrapToggle}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <AlignJustify size={12} className="text-white/40" />
              <span className="font-mono text-[11px] text-white/60">Word Wrap</span>
            </div>
            <div className={[
              "relative w-9 h-5 rounded-full transition-colors",
              wordWrap ? "bg-[#4ade80]" : "bg-white/15 group-hover:bg-white/25",
            ].join(" ")}>
              <div className={[
                "absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform duration-200",
                wordWrap ? "translate-x-[18px]" : "translate-x-[3px]",
              ].join(" ")} />
            </div>
          </button>
        </div>

        <div className="px-4 py-3 text-[10px] font-mono text-white/25">
          Changes apply instantly. Saved automatically.
        </div>
      </div>
    </div>
  );
}
