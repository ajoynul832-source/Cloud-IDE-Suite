import { useEffect, useRef } from "react";

interface BuildLogProps {
  logs?: string | null;
}

export function BuildLog({ logs }: BuildLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full bg-background font-mono text-xs overflow-y-auto p-4" ref={containerRef}>
      {logs ? (
        <pre className="text-primary whitespace-pre-wrap leading-relaxed">{logs}</pre>
      ) : (
        <div className="text-muted-foreground italic">No build logs available.</div>
      )}
    </div>
  );
}
