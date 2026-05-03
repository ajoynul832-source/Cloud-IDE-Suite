import { motion } from "framer-motion";
import { X } from "lucide-react";

interface TabBarProps {
  openFiles: string[];
  activeFile: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export function TabBar({ openFiles, activeFile, onSelect, onClose }: TabBarProps) {
  if (openFiles.length === 0) {
    return (
      <div className="h-9 bg-[#161b22] border-b border-white/8 flex items-center px-2 text-xs text-white/30 font-mono" />
    );
  }

  return (
    <div className="h-9 bg-[#0d1117] border-b border-white/8 flex overflow-x-auto">
      {openFiles.map((path) => {
        const isActive = activeFile === path;
        const filename = path.split("/").pop() || path;

        return (
          <motion.button
            key={path}
            data-testid={`tab-file-${path}`}
            onClick={() => onSelect(path)}
            whileHover={{ y: -2 }}
            layout
            className={[
              "group flex items-center px-4 min-w-[140px] max-w-[220px] h-full border-r border-white/8 cursor-pointer select-none text-sm font-mono transition-all relative",
              isActive
                ? "bg-[#161b22] text-[#4ade80] shadow-[inset_0_2px_0_rgba(74,222,128,0.4)]"
                : "bg-[#0d1117] text-white/40 hover:text-white/70 hover:bg-white/[0.04]",
            ].join(" ")}
          >
            <span className="truncate flex-1 mr-2">{filename}</span>
            <motion.button
              data-testid={`button-close-tab-${path}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose(path);
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={[
                "p-1 rounded opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-all",
                isActive ? "text-[#4ade80] hover:text-red-400" : "text-white/30 hover:text-white/80",
              ].join(" ")}
            >
              <X size={13} />
            </motion.button>

            {/* Active indicator line */}
            {isActive && (
              <motion.div
                layoutId="active-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4ade80]/40 to-[#4ade80]/20"
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
