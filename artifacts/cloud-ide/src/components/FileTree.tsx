import { useState } from "react";
import { FileCode, FileJson, FileText, File, X } from "lucide-react";

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string | null;
  onSelect: (path: string) => void;
  onCreate: (path: string) => void;
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
}

export function FileTree({ files, activeFile, onSelect, onCreate, onDelete, onRename }: FileTreeProps) {
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleCreate = () => {
    const name = prompt("Enter file name (e.g. lib/new_file.dart):");
    if (name) {
      onCreate(name);
    }
  };

  const getIcon = (path: string) => {
    const ext = path.split(".").pop();
    if (ext === "dart") return <FileCode size={14} className="text-blue-400" />;
    if (ext === "yaml" || ext === "json") return <FileJson size={14} className="text-yellow-400" />;
    if (ext === "md" || ext === "txt") return <FileText size={14} className="text-gray-400" />;
    return <File size={14} className="text-gray-400" />;
  };

  const paths = Object.keys(files).sort();

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-2 border-b border-sidebar-border flex justify-between items-center text-xs font-mono text-sidebar-foreground">
        <span>EXPLORER</span>
        <button
          data-testid="button-create-file"
          onClick={handleCreate}
          className="hover:text-primary transition-colors"
        >
          + File
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {paths.map((path) => (
          <div
            key={path}
            data-testid={`item-file-${path}`}
            className={[
              "group flex items-center px-3 py-1 cursor-pointer text-sm font-mono",
              activeFile === path
                ? "bg-sidebar-accent text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white",
            ].join(" ")}
            onClick={() => onSelect(path)}
            onDoubleClick={() => {
              setEditingPath(path);
              setEditValue(path);
            }}
          >
            <span className="mr-2">{getIcon(path)}</span>

            {editingPath === path ? (
              <input
                autoFocus
                className="flex-1 bg-input text-white px-1 text-xs border border-primary outline-none"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => {
                  if (editValue && editValue !== path) {
                    onRename(path, editValue);
                  }
                  setEditingPath(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (editValue && editValue !== path) {
                      onRename(path, editValue);
                    }
                    setEditingPath(null);
                  }
                  if (e.key === "Escape") {
                    setEditingPath(null);
                  }
                }}
              />
            ) : (
              <span className="truncate flex-1">{path}</span>
            )}

            <button
              data-testid={`button-delete-file-${path}`}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${path}?`)) {
                  onDelete(path);
                }
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive ml-2"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
