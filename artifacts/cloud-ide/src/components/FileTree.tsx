import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FileCode, FileJson, FileText, File, FileType, X,
  Braces, Terminal, Globe, Cpu, ChevronRight, ChevronDown, FilePlus,
} from "lucide-react";

interface FileTreeProps {
  files:      Record<string, string>;
  activeFile: string | null;
  onSelect:   (path: string) => void;
  onCreate:   (path: string) => void;
  onDelete:   (path: string) => void;
  onRename:   (oldPath: string, newPath: string) => void;
}

function getIcon(path: string) {
  const ext  = path.split(".").pop()?.toLowerCase() ?? "";
  const base = path.split("/").pop() ?? "";

  if (base === "pubspec.yaml" || base === "buildozer.spec") return <FileJson size={13} className="text-yellow-400" />;
  if (base === "AndroidManifest.xml") return <FileCode size={13} className="text-green-400" />;
  if (base === "go.mod" || base === "Cargo.toml" || base === "package.json") return <FileJson size={13} className="text-orange-400" />;
  if (base === "CMakeLists.txt") return <Cpu size={13} className="text-cyan-400" />;

  switch (ext) {
    case "dart":  return <FileCode size={13} className="text-sky-400" />;
    case "kt": case "kts": return <FileCode size={13} className="text-purple-400" />;
    case "java":  return <FileCode size={13} className="text-orange-400" />;
    case "swift": return <FileCode size={13} className="text-orange-300" />;
    case "m": case "mm": return <FileCode size={13} className="text-orange-300" />;
    case "c": case "h":  return <Cpu size={13} className="text-blue-300" />;
    case "cpp": case "cxx": case "cc": case "hpp": case "hxx": return <Cpu size={13} className="text-blue-400" />;
    case "cs":   return <FileCode size={13} className="text-violet-400" />;
    case "html": case "htm": return <Globe size={13} className="text-orange-400" />;
    case "css": case "scss": case "less": return <FileType size={13} className="text-blue-400" />;
    case "js": case "jsx":   return <Braces size={13} className="text-yellow-400" />;
    case "ts": case "tsx":   return <Braces size={13} className="text-blue-400" />;
    case "rs":   return <FileCode size={13} className="text-orange-500" />;
    case "go":   return <FileCode size={13} className="text-cyan-400" />;
    case "py":   return <FileCode size={13} className="text-green-400" />;
    case "json": return <FileJson size={13} className="text-yellow-300" />;
    case "xml": case "plist": return <FileJson size={13} className="text-pink-400" />;
    case "yaml": case "yml": return <FileJson size={13} className="text-yellow-400" />;
    case "toml": return <FileJson size={13} className="text-amber-400" />;
    case "gradle": return <Terminal size={13} className="text-green-500" />;
    case "md": case "markdown": case "txt": case "rst": return <FileText size={13} className="text-gray-400" />;
    case "sh": case "bash": case "zsh": return <Terminal size={13} className="text-green-400" />;
    default: return <File size={13} className="text-gray-500" />;
  }
}

export function FileTree({ files, activeFile, onSelect, onCreate, onDelete, onRename }: FileTreeProps) {
  const [editingPath,      setEditingPath]      = useState<string | null>(null);
  const [editValue,        setEditValue]        = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [creatingFile,     setCreatingFile]     = useState(false);
  const [newFileName,      setNewFileName]      = useState("");
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const commitNewFile = () => {
    if (newFileName.trim()) onCreate(newFileName.trim());
    setCreatingFile(false);
    setNewFileName("");
  };

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const paths = Object.keys(files).sort();

  const folderMap: Record<string, string[]> = {};
  const rootFiles: string[] = [];
  paths.forEach((p) => {
    const parts = p.split("/");
    if (parts.length > 1) {
      const folder = parts.slice(0, -1).join("/");
      if (!folderMap[folder]) folderMap[folder] = [];
      folderMap[folder].push(p);
    } else {
      rootFiles.push(p);
    }
  });

  const renderFile = (path: string, indent = false) => {
    const isActive = activeFile === path;
    const filename = path.split("/").pop() || path;

    return (
      <motion.div
        key={path}
        data-testid={`item-file-${path}`}
        whileHover={{ x: 4 }}
        onClick={() => onSelect(path)}
        onDoubleClick={() => { setEditingPath(path); setEditValue(path); }}
        className={[
          "group flex items-center pr-2 py-[3px] cursor-pointer text-xs font-mono truncate transition-all",
          indent ? "pl-7" : "pl-5",
          isActive
            ? "bg-sidebar-accent text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-white",
        ].join(" ")}
      >
        <span className="mr-1.5 shrink-0">{getIcon(path)}</span>

        {editingPath === path ? (
          <input
            autoFocus
            className="flex-1 bg-input text-white px-1 text-xs border border-primary outline-none min-w-0 font-mono"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              if (editValue && editValue !== path) onRename(path, editValue);
              setEditingPath(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (editValue && editValue !== path) onRename(path, editValue);
                setEditingPath(null);
              }
              if (e.key === "Escape") setEditingPath(null);
            }}
          />
        ) : (
          <span className="truncate flex-1">{filename}</span>
        )}

        <button
          data-testid={`button-delete-file-${path}`}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete ${path}?`)) onDelete(path);
          }}
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive ml-1 shrink-0"
        >
          <X size={12} />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col select-none">
      <div className="px-3 py-2 border-b border-sidebar-border flex justify-between items-center">
        <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-muted-foreground">
          Explorer
        </span>
        <button
          data-testid="button-create-file"
          onClick={() => { setCreatingFile(true); setNewFileName(""); setTimeout(() => newFileInputRef.current?.focus(), 10); }}
          className="text-white/30 hover:text-[#4ade80] transition-colors"
          title="New file"
        >
          <FilePlus size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* Inline new-file input */}
        {creatingFile && (
          <div className="flex items-center gap-1 pl-4 pr-2 py-[3px] bg-[#4ade80]/5 border-b border-[#4ade80]/10">
            <File size={13} className="text-white/30 shrink-0 mr-0.5" />
            <input
              ref={newFileInputRef}
              autoFocus
              placeholder="filename.ext"
              className="flex-1 bg-transparent text-white text-[11px] font-mono outline-none border-b border-[#4ade80]/60 pb-0.5 min-w-0 placeholder:text-white/25"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={commitNewFile}
              onKeyDown={(e) => {
                if (e.key === "Enter")  commitNewFile();
                if (e.key === "Escape") { setCreatingFile(false); setNewFileName(""); }
              }}
            />
          </div>
        )}

        {/* Folders */}
        {Object.entries(folderMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([folder, filePaths]) => {
            const isCollapsed = collapsedFolders.has(folder);
            const folderName  = folder.split("/").pop() || folder;
            return (
              <div key={folder}>
                <button
                  className="w-full flex items-center px-3 py-[4px] text-[10px] font-mono font-semibold tracking-wider uppercase text-muted-foreground/60 hover:text-muted-foreground hover:bg-sidebar-accent/20 transition-colors"
                  onClick={() => toggleFolder(folder)}
                  title={isCollapsed ? `Expand ${folderName}` : `Collapse ${folderName}`}
                >
                  {isCollapsed
                    ? <ChevronRight size={11} className="mr-1 shrink-0" />
                    : <ChevronDown  size={11} className="mr-1 shrink-0" />
                  }
                  {folderName}
                </button>
                {!isCollapsed && filePaths.sort().map((p) => renderFile(p, true))}
              </div>
            );
          })}

        {/* Root files */}
        {rootFiles.sort().map((p) => renderFile(p, false))}
      </div>
    </div>
  );
}
