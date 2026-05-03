import { X, Command } from "lucide-react";

interface Shortcut {
  keys: string[];
  mac?: string[];
  label: string;
}

interface Section {
  title: string;
  items: Shortcut[];
}

const SECTIONS: Section[] = [
  {
    title: "Code Execution",
    items: [
      { keys: ["Ctrl", "Enter"],         mac: ["⌘", "↩"],        label: "Run / Preview current file" },
    ],
  },
  {
    title: "Editing",
    items: [
      { keys: ["Tab"],                                             label: "Indent selection (4 spaces)" },
      { keys: ["Shift", "Tab"],                                    label: "Dedent selection" },
      { keys: ["Ctrl", "Z"],             mac: ["⌘", "Z"],         label: "Undo" },
      { keys: ["Ctrl", "Y"],             mac: ["⌘", "⇧", "Z"],   label: "Redo" },
      { keys: ["Ctrl", "/"],             mac: ["⌘", "/"],         label: "Toggle line comment" },
      { keys: ["Ctrl", "Shift", "F"],   mac: ["⌘", "⇧", "F"],   label: "Format with Prettier" },
      { keys: ["Ctrl", "D"],             mac: ["⌘", "D"],         label: "Select next occurrence" },
      { keys: ["Ctrl", "F"],             mac: ["⌘", "F"],         label: "Find in file" },
      { keys: ["Alt", "↑ / ↓"],         mac: ["⌥", "↑ / ↓"],    label: "Move line up / down" },
      { keys: ["Ctrl", "A"],             mac: ["⌘", "A"],         label: "Select all" },
    ],
  },
  {
    title: "IDE",
    items: [
      { keys: ["?"],                                               label: "Open keyboard shortcuts" },
      { keys: ["Ctrl", ","],             mac: ["⌘", ","],         label: "Open settings" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 font-mono text-[10px] text-white/70 leading-none">
      {children}
    </kbd>
  );
}

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#161b22] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <Command size={15} className="text-[#4ade80]" />
            <span className="font-mono text-sm font-bold text-white tracking-widest uppercase">
              Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors p-1"
          >
            <X size={15} />
          </button>
        </div>

        {/* Sections */}
        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {SECTIONS.map(({ title, items }) => (
            <div key={title}>
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-white/30 mb-3 pb-1 border-b border-white/5">
                {title}
              </h3>
              <div className="space-y-2.5">
                {items.map(({ keys, mac, label }) => {
                  const displayKeys = isMac && mac ? mac : keys;
                  return (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[11px] text-white/60 flex-1">{label}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {displayKeys.map((k, i) => (
                          <span key={i} className="flex items-center gap-0.5">
                            <Kbd>{k}</Kbd>
                            {i < displayKeys.length - 1 && (
                              <span className="text-white/20 text-[9px] mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/8 flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/25">
            Press <Kbd>?</Kbd> anywhere to open this panel
          </span>
        </div>
      </div>
    </div>
  );
}
