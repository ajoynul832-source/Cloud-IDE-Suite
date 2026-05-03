import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Wand2, Archive, Settings, HelpCircle, FolderOpen,
  Database, X, Search, FileCode, Zap, Terminal, Globe,
  WrapText, Eye, RotateCcw, Share2, Code2,
} from "lucide-react";
import type { ProjectTemplate } from "@/lib/templates";
import { PROJECT_TEMPLATES } from "@/lib/templates";

interface Command {
  id:       string;
  label:    string;
  kbd?:     string;
  icon:     React.ReactNode;
  category: "action" | "file" | "template" | "view";
  run:      () => void;
}

interface CommandPaletteProps {
  isOpen:          boolean;
  onClose:         () => void;
  files:           Record<string, string>;
  onSelectFile:    (filename: string) => void;
  onRun:           () => void;
  onFormat:        () => void;
  onDownload:      () => void;
  onShowSettings:  () => void;
  onShowShortcuts: () => void;
  onNewProject:    () => void;
  onOpenProjects:  () => void;
  onTabChange:     (tab: "preview" | "console" | "build") => void;
  onWordWrapToggle:() => void;
  onReset?:        () => void;
  onShare?:        () => void;
}

const QUICK_TEMPLATE_IDS = ["html-react-cdn", "ts-starter", "python-data", "html-threejs", "html-p5js", "html-chartjs"];

const FILE_ICONS: Record<string, React.ReactNode> = {
  js:   <FileCode size={12} className="text-yellow-400" />,
  jsx:  <FileCode size={12} className="text-yellow-400" />,
  ts:   <FileCode size={12} className="text-blue-400" />,
  tsx:  <FileCode size={12} className="text-blue-400" />,
  py:   <Terminal size={12} className="text-green-400" />,
  html: <Globe size={12} className="text-orange-400" />,
  css:  <Code2 size={12} className="text-purple-400" />,
};

function fileIcon(filename: string): React.ReactNode {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return FILE_ICONS[ext] ?? <FileCode size={12} className="text-white/40" />;
}

function fuzzy(haystack: string, needle: string): boolean {
  if (!needle) return true;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let hi = 0;
  for (let ni = 0; ni < n.length; ni++) {
    const pos = h.indexOf(n[ni], hi);
    if (pos === -1) return false;
    hi = pos + 1;
  }
  return true;
}

export function CommandPalette({
  isOpen, onClose,
  files, onSelectFile,
  onRun, onFormat, onDownload,
  onShowSettings, onShowShortcuts,
  onNewProject, onOpenProjects,
  onTabChange, onWordWrapToggle,
  onReset, onShare,
}: CommandPaletteProps) {
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef   = useRef<HTMLInputElement>(null);
  const listRef    = useRef<HTMLDivElement>(null);

  const exec = useCallback((fn: () => void) => {
    fn();
    onClose();
    setQuery("");
    setSelected(0);
  }, [onClose]);

  const ACTIONS: Command[] = [
    { id: "run",       label: "Run Current File",         kbd: "Ctrl+Enter",   icon: <Play size={13} className="text-[#4ade80]" />,     category: "action", run: () => exec(onRun) },
    { id: "format",    label: "Format Code",              kbd: "Ctrl+Shift+F", icon: <Wand2 size={13} className="text-purple-400" />,    category: "action", run: () => exec(onFormat) },
    { id: "download",  label: "Download Project ZIP",     kbd: "",             icon: <Archive size={13} className="text-blue-400" />,    category: "action", run: () => exec(onDownload) },
    { id: "settings",  label: "Open Settings",            kbd: "Ctrl+,",       icon: <Settings size={13} className="text-white/60" />,   category: "action", run: () => exec(onShowSettings) },
    { id: "shortcuts", label: "Keyboard Shortcuts",       kbd: "?",            icon: <HelpCircle size={13} className="text-white/60" />, category: "action", run: () => exec(onShowShortcuts) },
    { id: "newproj",   label: "New Project from Template",kbd: "",             icon: <FolderOpen size={13} className="text-[#4ade80]" />,category: "action", run: () => exec(onNewProject) },
    { id: "projects",  label: "Open Saved Projects",      kbd: "",             icon: <Database size={13} className="text-white/60" />,   category: "action", run: () => exec(onOpenProjects) },
    { id: "wordwrap",  label: "Toggle Word Wrap",         kbd: "Alt+Z",        icon: <WrapText size={13} className="text-white/60" />,   category: "action", run: () => exec(onWordWrapToggle) },
    { id: "preview",   label: "Switch to Preview Tab",    kbd: "",             icon: <Eye size={13} className="text-white/60" />,        category: "view",   run: () => exec(() => onTabChange("preview")) },
    { id: "console",   label: "Switch to Console Tab",    kbd: "",             icon: <Terminal size={13} className="text-white/60" />,   category: "view",   run: () => exec(() => onTabChange("console")) },
    { id: "build",     label: "Switch to Build Log Tab",  kbd: "",             icon: <Zap size={13} className="text-white/60" />,        category: "view",   run: () => exec(() => onTabChange("build")) },
    ...(onShare  ? [{ id: "share",  label: "Share Project",  kbd: "", icon: <Share2 size={13} className="text-white/60" />,  category: "action" as const, run: () => exec(onShare!) }]  : []),
    ...(onReset  ? [{ id: "reset",  label: "Reset Workspace",kbd: "", icon: <RotateCcw size={13} className="text-red-400" />, category: "action" as const, run: () => exec(onReset!) }]  : []),
  ];

  const fileCommands: Command[] = Object.keys(files).map((f) => ({
    id:       `file:${f}`,
    label:    f,
    icon:     fileIcon(f),
    category: "file" as const,
    run:      () => exec(() => onSelectFile(f)),
  }));

  const templateCommands: Command[] = QUICK_TEMPLATE_IDS
    .map((id) => PROJECT_TEMPLATES.find((t) => t.id === id))
    .filter((t): t is ProjectTemplate => !!t)
    .map((t) => ({
      id:       `tpl:${t.id}`,
      label:    `Template: ${t.name}`,
      icon:     <span className="text-sm">{t.icon}</span>,
      category: "template" as const,
      run:      () => exec(onNewProject),
    }));

  const allCommands: Command[] = [...ACTIONS, ...fileCommands, ...templateCommands];

  const filtered = query.trim()
    ? allCommands.filter((c) => fuzzy(c.label, query))
    : allCommands;

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setQuery("");
      setSelected(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); setQuery(""); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[selected]?.run();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, filtered, selected, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!isOpen) return null;

  const sections = query.trim() ? null : [
    { label: "Actions",   items: ACTIONS.filter((c) => c.category === "action") },
    { label: "Views",     items: ACTIONS.filter((c) => c.category === "view") },
    { label: "Files",     items: fileCommands.slice(0, 8) },
  ];

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh] bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); setQuery(""); } }}
    >
      <div className="w-full max-w-[560px] bg-[#161b22] border border-white/12 rounded-xl shadow-2xl overflow-hidden">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
          <Search size={14} className="text-white/30 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or file name…"
            className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/25 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={13} />
            </button>
          )}
          <kbd className="text-[10px] font-mono text-white/25 bg-white/6 border border-white/10 px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-1.5">

          {query.trim() ? (
            filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs font-mono text-white/30">
                No results for "{query}"
              </div>
            ) : (
              filtered.map((cmd, i) => (
                <CommandRow
                  key={cmd.id}
                  cmd={cmd}
                  isSelected={i === selected}
                  onMouseEnter={() => setSelected(i)}
                  onClick={cmd.run}
                />
              ))
            )
          ) : (
            sections!.map((section) => {
              if (section.items.length === 0) return null;
              const sectionStart = globalIdx;
              globalIdx += section.items.length;
              return (
                <div key={section.label}>
                  <div className="px-4 py-1 text-[9px] font-mono uppercase tracking-widest text-white/25 mt-1">
                    {section.label}
                  </div>
                  {section.items.map((cmd, i) => (
                    <CommandRow
                      key={cmd.id}
                      cmd={cmd}
                      isSelected={sectionStart + i === selected}
                      onMouseEnter={() => setSelected(sectionStart + i)}
                      onClick={cmd.run}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/8 flex items-center gap-4 text-[10px] font-mono text-white/25">
          <span className="flex items-center gap-1"><kbd className="bg-white/8 px-1 rounded">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-white/8 px-1 rounded">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="bg-white/8 px-1 rounded">Esc</kbd> close</span>
          <span className="ml-auto opacity-60">Ctrl+Shift+P</span>
        </div>
      </div>
    </div>
  );
}

function CommandRow({
  cmd, isSelected, onMouseEnter, onClick,
}: {
  cmd: Command;
  isSelected: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={[
        "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
        isSelected ? "bg-white/8 text-white" : "text-white/60 hover:bg-white/5",
      ].join(" ")}
    >
      <span className="shrink-0 w-5 flex items-center justify-center">
        {cmd.icon}
      </span>
      <span className="flex-1 font-mono text-xs truncate">
        {cmd.label}
      </span>
      {cmd.kbd && (
        <kbd className="shrink-0 text-[9px] font-mono text-white/25 bg-white/6 border border-white/10 px-1.5 py-0.5 rounded">
          {cmd.kbd}
        </kbd>
      )}
      {cmd.category === "file" && (
        <span className="shrink-0 text-[9px] font-mono text-white/20">file</span>
      )}
      {cmd.category === "template" && (
        <span className="shrink-0 text-[9px] font-mono text-[#4ade80]/40">template</span>
      )}
    </button>
  );
}
