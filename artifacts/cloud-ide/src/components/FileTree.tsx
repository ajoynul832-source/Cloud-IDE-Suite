import { useState } from "react";
import {
  FileCode,
  FileJson,
  FileText,
  File,
  FileType,
  X,
  Braces,
  Terminal,
  Globe,
  Cpu,
} from "lucide-react";

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string | null;
  onSelect: (path: string) => void;
  onCreate: (path: string) => void;
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
}

function getIcon(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const base = path.split("/").pop() ?? "";

  // Config/manifest files
  if (base === "pubspec.yaml" || base === "buildozer.spec") return <FileJson size={13} className="text-yellow-400" />;
  if (base === "AndroidManifest.xml") return <FileCode size={13} className="text-green-400" />;
  if (base === "go.mod" || base === "Cargo.toml" || base === "package.json") return <FileJson size={13} className="text-orange-400" />;
  if (base === "CMakeLists.txt") return <Cpu size={13} className="text-cyan-400" />;

  switch (ext) {
    // Dart / Flutter
    case "dart": return <FileCode size={13} className="text-sky-400" />;
    // Kotlin
    case "kt": case "kts": return <FileCode size={13} className="text-purple-400" />;
    // Java
    case "java": return <FileCode size={13} className="text-orange-400" />;
    // Swift / Obj-C
    case "swift": return <FileCode size={13} className="text-orange-300" />;
    case "m": case "mm": return <FileCode size={13} className="text-orange-300" />;
    // C / C++ / NDK
    case "c": case "h": return <Cpu size={13} className="text-blue-300" />;
    case "cpp": case "cxx": case "cc": case "hpp": case "hxx": return <Cpu size={13} className="text-blue-400" />;
    // C#
    case "cs": return <FileCode size={13} className="text-violet-400" />;
    // Web
    case "html": case "htm": return <Globe size={13} className="text-orange-400" />;
    case "css": case "scss": case "less": return <FileType size={13} className="text-blue-400" />;
    case "js": case "jsx": return <Braces size={13} className="text-yellow-400" />;
    case "ts": case "tsx": return <Braces size={13} className="text-blue-400" />;
    // Rust
    case "rs": return <FileCode size={13} className="text-orange-500" />;
    // Go
    case "go": return <FileCode size={13} className="text-cyan-400" />;
    // Python
    case "py": return <FileCode size={13} className="text-green-400" />;
    // Data / config
    case "json": return <FileJson size={13} className="text-yellow-300" />;
    case "xml": case "plist": return <FileJson size={13} className="text-pink-400" />;
    case "yaml": case "yml": return <FileJson size={13} className="text-yellow-400" />;
    case "toml": return <FileJson size={13} className="text-amber-400" />;
    case "gradle": return <Terminal size={13} className="text-green-500" />;
    // Docs
    case "md": case "markdown": case "txt": case "rst": return <FileText size={13} className="text-gray-400" />;
    // Shell
    case "sh": case "bash": case "zsh": return <Terminal size={13} className="text-green-400" />;
    default: return <File size={13} className="text-gray-500" />;
  }
}

export function FileTree({ files, activeFile, onSelect, onCreate, onDelete, onRename }: FileTreeProps) {
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleCreate = () => {
    const name = prompt("File name (e.g. lib/feature.dart, src/main.rs):");
    if (name?.trim()) onCreate(name.trim());
  };

  const paths = Object.keys(files).sort();

  // Group into folders
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

  const renderFile = (path: string) => {
    const isActive = activeFile === path;
    const filename = path.split("/").pop() || path;

    return (
      <div
        key={path}
        data-testid={`item-file-${path}`}
        className={[
          "group flex items-center pl-5 pr-2 py-[3px] cursor-pointer text-xs font-mono truncate",
          isActive
            ? "bg-sidebar-accent text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-white",
        ].join(" ")}
        onClick={() => onSelect(path)}
        onDoubleClick={() => { setEditingPath(path); setEditValue(path); }}
      >
        <span className="mr-1.5 shrink-0">{getIcon(path)}</span>

        {editingPath === path ? (
          <input
            autoFocus
            className="flex-1 bg-input text-white px-1 text-xs border border-primary outline-none min-w-0"
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
      </div>
    );
  };

  const renderedFolders = new Set<string>();

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col select-none">
      <div className="px-3 py-2 border-b border-sidebar-border flex justify-between items-center">
        <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-muted-foreground">
          Explorer
        </span>
        <button
          data-testid="button-create-file"
          onClick={handleCreate}
          className="text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors"
          title="New file"
        >
          + File
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* Folders first */}
        {Object.entries(folderMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([folder, filePaths]) => {
            if (renderedFolders.has(folder)) return null;
            renderedFolders.add(folder);
            const folderName = folder.split("/").pop() || folder;
            return (
              <div key={folder}>
                <div className="flex items-center px-3 py-[3px] text-[10px] font-mono font-semibold tracking-wider uppercase text-muted-foreground/60">
                  <span className="mr-1">▸</span>
                  {folderName}
                </div>
                {filePaths.sort().map(renderFile)}
              </div>
            );
          })}

        {/* Root files */}
        {rootFiles.sort().map(renderFile)}
      </div>
    </div>
  );
}
