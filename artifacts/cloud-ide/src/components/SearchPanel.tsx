import { useState, useMemo, useCallback } from "react";
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-[#161b22] shrink-0">
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">Search</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/70">
          <X size={12} />
        </button>
      </div>

      {/* Input */}
      <div className="px-2 py-2 shrink-0 space-y-1.5">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all files…"
            className="w-full bg-[#1c2128] border border-white/10 rounded pl-7 pr-2 py-1.5 text-[11px] text-white/80 placeholder-white/25 focus:outline-none focus:border-[#4ade80]/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60"
            >
              <X size={9} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCaseSensitive((v) => !v)}
            title="Case sensitive"
            className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors ${
              caseSensitive
                ? "border-[#4ade80]/50 text-[#4ade80] bg-[#4ade80]/10"
                : "border-white/10 text-white/30 hover:border-white/25"
            }`}
          >
            Aa
          </button>
          <button
            onClick={() => setUseRegex((v) => !v)}
            title="Use regular expression"
            className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors ${
              useRegex
                ? "border-[#4ade80]/50 text-[#4ade80] bg-[#4ade80]/10"
                : "border-white/10 text-white/30 hover:border-white/25"
            }`}
          >
            .*
          </button>
          {query && (
            <span className="ml-auto text-[9px] text-white/25">
              {totalMatches} result{totalMatches !== 1 ? "s" : ""} in {results.length} file{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() && (
          <div className="px-3 py-8 text-center text-white/20 text-[11px]">
            Type to search across all files
          </div>
        )}
        {query.trim() && results.length === 0 && (
          <div className="px-3 py-8 text-center text-white/20 text-[11px]">
            No results for "{query}"
          </div>
        )}
        {results.map(({ filename, matches }) => {
          const isCollapsed = collapsed.has(filename);
          const shortName = filename.split("/").pop() ?? filename;
          return (
            <div key={filename} className="border-b border-white/5">
              <button
                onClick={() => toggleCollapse(filename)}
                className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 text-left"
              >
                {isCollapsed ? <ChevronRight size={10} className="text-white/30 shrink-0" /> : <ChevronDown size={10} className="text-white/30 shrink-0" />}
                <File size={10} className="text-white/30 shrink-0" />
                <span className="text-[11px] text-white/70 truncate flex-1">{shortName}</span>
                <span className="text-[9px] text-white/25 shrink-0">{matches.length}</span>
              </button>
              {!isCollapsed && matches.map((m, i) => (
                <button
                  key={i}
                  onClick={() => onSelectFile(filename, m.line)}
                  className="w-full flex items-start gap-2 px-4 py-1 hover:bg-[#4ade80]/5 text-left group"
                >
                  <span className="text-white/20 shrink-0 w-6 text-right">{m.line}</span>
                  <span className="text-white/50 truncate group-hover:text-white/70 flex-1">
                    {m.text.length > 80 ? m.text.slice(0, 80) + "…" : m.text}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
