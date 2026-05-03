import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, ChevronRight, File } from "lucide-react";

interface SearchResult {
  filename: string;
  matches: { line: number; col: number; text: string; matchStart: number; matchEnd: number }[];
}

interface SearchPanelProps {
  files: Record<string, string>;
  onSelectFile: (filename: string, line?: number) => void;
  onClose: () => void;
}

export function SearchPanel({ files, onSelectFile, onClose }: SearchPanelProps) {
  const [query, setQuery]           = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex]     = useState(false);
  const [collapsed, setCollapsed]   = useState<Set<string>>(new Set());

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const matches: SearchResult[] = [];

    let pattern: RegExp | null = null;
    try {
      pattern = useRegex
        ? new RegExp(query, caseSensitive ? "g" : "gi")
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), caseSensitive ? "g" : "gi");
    } catch {
      return [];
    }

    for (const [filename, content] of Object.entries(files)) {
      const lines = content.split("\n");
      const fileMatches: SearchResult["matches"] = [];
      lines.forEach((lineText, idx) => {
        pattern!.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pattern!.exec(lineText)) !== null) {
          fileMatches.push({
            line: idx + 1,
            col: m.index + 1,
            text: lineText.trim(),
            matchStart: m.index,
            matchEnd: m.index + m[0].length,
          });
          if (!pattern!.global) break;
        }
      });
      if (fileMatches.length > 0) {
        matches.push({ filename, matches: fileMatches });
      }
    }
    return matches;
  }, [query, files, caseSensitive, useRegex]);

  const totalMatches = results.reduce((s, r) => s + r.matches.length, 0);

  const toggleCollapse = useCallback((filename: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white/70 text-xs font-mono">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-[#161b22] shrink-0"
      >
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">Search</span>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors"
        >
          <X size={12} />
        </motion.button>
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="px-2 py-2 shrink-0 space-y-1.5 border-b border-white/8 bg-gradient-to-b from-white/[0.02] to-transparent"
      >
        <div className="relative">
          <Search size={11} className="absolute left-2 top-2.5 text-white/25 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full pl-7 pr-2 py-1.5 rounded bg-white/5 border border-white/10 text-white/80 placeholder:text-white/20 outline-none focus:border-[#4ade80]/40 focus:bg-white/[0.08] transition-all text-[11px]"
          />
        </div>
        <div className="flex gap-1.5 px-0.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`px-2 py-1 rounded text-[9px] transition-all border ${
              caseSensitive
                ? "border-[#4ade80]/50 text-[#4ade80] bg-[#4ade80]/10"
                : "border-white/10 text-white/30 hover:border-white/25"
            }`}
            title="Case sensitive"
          >
            Aa
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUseRegex(!useRegex)}
            className={`px-2 py-1 rounded text-[9px] transition-all border ${
              useRegex
                ? "border-[#4ade80]/50 text-[#4ade80] bg-[#4ade80]/10"
                : "border-white/10 text-white/30 hover:border-white/25"
            }`}
            title="Regex"
          >
            .*
          </motion.button>
          {query && (
            <span className="ml-auto text-[9px] text-white/25 py-1">
              {totalMatches} result{totalMatches !== 1 ? "s" : ""} in {results.length} file{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </motion.div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!query.trim() && (
            <motion.div
              key="empty-search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 py-8 text-center text-white/20 text-[11px]"
            >
              Type to search across all files
            </motion.div>
          )}
          {query.trim() && results.length === 0 && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 py-8 text-center text-white/20 text-[11px]"
            >
              No results for "{query}"
            </motion.div>
          )}
          {results.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0"
            >
              {results.map(({ filename, matches }, fileIdx) => {
                const isCollapsed = collapsed.has(filename);
                const shortName = filename.split("/").pop() ?? filename;
                return (
                  <motion.div
                    key={filename}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: fileIdx * 0.03 }}
                    className="border-b border-white/5"
                  >
                    <motion.button
                      onClick={() => toggleCollapse(filename)}
                      whileHover={{ x: 4 }}
                      className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 text-left transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight size={10} className="text-white/30 shrink-0" />
                      ) : (
                        <ChevronDown size={10} className="text-white/30 shrink-0" />
                      )}
                      <File size={10} className="text-white/30 shrink-0" />
                      <span className="text-[11px] text-white/70 truncate flex-1">{shortName}</span>
                      <span className="text-[9px] text-white/25 shrink-0">{matches.length}</span>
                    </motion.button>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        >
                          {matches.map((m, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.02 }}
                              onClick={() => onSelectFile(filename, m.line)}
                              whileHover={{ x: 2 }}
                              className="w-full flex items-start gap-2 px-4 py-1 hover:bg-[#4ade80]/5 text-left group transition-colors"
                            >
                              <span className="text-white/20 shrink-0 w-6 text-right text-[10px]">{m.line}</span>
                              <span className="text-white/50 truncate group-hover:text-white/70 flex-1 text-[10px]">
                                {m.text.length > 60 ? m.text.slice(0, 60) + "…" : m.text}
                              </span>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
