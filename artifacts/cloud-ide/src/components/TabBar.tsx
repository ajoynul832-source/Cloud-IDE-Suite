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
      <div className="h-9 bg-card border-b border-border flex items-center px-2 text-xs text-muted-foreground font-mono" />
    );
  }

  return (
    <div className="h-9 bg-card border-b border-border flex overflow-x-auto">
      {openFiles.map((path) => {
        const isActive = activeFile === path;
        const filename = path.split("/").pop() || path;

        return (
          <div
            key={path}
            data-testid={`tab-file-${path}`}
            onClick={() => onSelect(path)}
            className={[
              "group flex items-center px-3 min-w-[120px] max-w-[200px] border-r border-border cursor-pointer select-none text-sm font-mono",
              isActive
                ? "bg-background text-primary border-t-2 border-t-primary"
                : "bg-card text-muted-foreground border-t-2 border-t-transparent hover:bg-background/50 hover:text-foreground",
            ].join(" ")}
          >
            <span className="truncate flex-1 mr-2">{filename}</span>
            <button
              data-testid={`button-close-tab-${path}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose(path);
              }}
              className={[
                "p-0.5 rounded-sm hover:bg-muted",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              ].join(" ")}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
