import { motion } from "framer-motion";
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
      { keys: ["Ctrl", "Shift", "P"],   mac: ["⌘", "⇧", "P"],   label: "Command palette" },
      { keys: ["Ctrl", ","],             mac: ["⌘", ","],         label: "Open settings" },
      { keys: ["Alt", "Z"],                                        label: "Toggle word wrap" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="px-2 py-1 rounded bg-[#4ade80]/12 border border-[#4ade80]/25 font-mono text-[10px] text-[#4ade80]/70 leading-none">
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c2128] to-[#161b22] border border-white/12 rounded-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-gradient-to-r from-white/5 to-transparent sticky top-0 z-10"
        >
          <div className="flex items-center gap-3">
            <Command size={16} className="text-[#4ade80]" />
            <span className="font-mono text-sm font-bold text-white tracking-widest uppercase">
              Keyboard Shortcuts
            </span>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={18} />
          </motion.button>
        </motion.div>

        {/* Sections */}
        <div className="p-6 space-y-7">
          {SECTIONS.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <h3 className="text-xs font-mono font-bold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, j) => (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 + j * 0.02 }}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="font-mono text-sm text-white/50">{shortcut.label}</span>
                    <div className="flex gap-1.5">
                      {(isMac && shortcut.mac ? shortcut.mac : shortcut.keys).map((key, idx) => (
                        <Kbd key={idx}>{key}</Kbd>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="px-6 py-3 border-t border-white/8 bg-white/[0.02] text-center text-[10px] font-mono text-white/25"
        >
          Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/50 text-[9px] border border-white/15">Esc</kbd> to close
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
