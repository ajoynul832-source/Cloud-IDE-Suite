import { useEffect, useRef } from "react";
import { RunOutput } from "@/hooks/useRun";

interface ConsoleOutputProps {
  output: RunOutput | null;
  isRunning: boolean;
}

export function ConsoleOutput({ output, isRunning }: ConsoleOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  if (isRunning) {
    return (
      <div className="h-full bg-background font-mono text-xs p-4 flex items-start gap-2">
        <span className="inline-block w-2 h-2 mt-1 bg-primary rounded-full animate-pulse shrink-0" />
        <span className="text-muted-foreground">Running…</span>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="h-full bg-background font-mono text-xs p-4 text-muted-foreground italic">
        Press <span className="text-primary font-semibold">Run</span> to execute the current file.
        <p className="mt-2 not-italic text-[10px]">Supports: JavaScript · TypeScript · Python · HTML</p>
      </div>
    );
  }

  const { stdout, stderr, exitCode, duration, error } = output;
  const succeeded = exitCode === 0;

  return (
    <div className="h-full bg-background font-mono text-xs overflow-y-auto" ref={undefined}>
      {/* Status bar */}
      <div
        className={[
          "sticky top-0 flex items-center gap-3 px-4 py-1.5 border-b border-border text-[10px]",
          succeeded ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
        ].join(" ")}
      >
        <span
          className={[
            "w-2 h-2 rounded-full",
            succeeded ? "bg-primary" : "bg-destructive",
          ].join(" ")}
        />
        <span>
          {error === "timeout"
            ? "Timed out"
            : succeeded
            ? "Exited successfully"
            : `Exited with code ${exitCode}`}
        </span>
        <span className="ml-auto text-muted-foreground">{duration}ms</span>
      </div>

      <div className="p-4 space-y-2">
        {stdout && (
          <pre className="text-foreground whitespace-pre-wrap leading-relaxed">{stdout}</pre>
        )}
        {stderr && (
          <pre className="text-destructive whitespace-pre-wrap leading-relaxed">{stderr}</pre>
        )}
        {!stdout && !stderr && (
          <span className="text-muted-foreground italic">No output.</span>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
