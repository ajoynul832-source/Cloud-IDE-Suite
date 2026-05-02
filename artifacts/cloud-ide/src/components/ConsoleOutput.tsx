import { useEffect, useRef } from "react";
import { StreamState } from "@/hooks/useRun";
import { Gauge } from "lucide-react";

interface ConsoleOutputProps {
  stream:         StreamState;
  isRunning:      boolean;
  runsRemaining?: number | null;
}

export function ConsoleOutput({ stream, isRunning, runsRemaining }: ConsoleOutputProps) {
  const bottomRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream.chunks.length]);

  const hasContent = stream.chunks.length > 0;
  const { result } = stream;
  const succeeded  = result ? result.exitCode === 0 : null;
  const runsLow    = runsRemaining !== null && runsRemaining !== undefined && runsRemaining < 5;

  if (!hasContent && !isRunning) {
    return (
      <div className="h-full bg-background font-mono text-xs p-4 text-muted-foreground flex flex-col gap-2">
        <p>
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-primary font-semibold text-[10px]">Run</kbd>{" "}
          to execute the current file.
        </p>
        <p className="text-[10px] opacity-60">Supports: JavaScript · TypeScript · Python · HTML</p>
        {runsRemaining !== null && runsRemaining !== undefined && (
          <p className={["text-[10px] flex items-center gap-1 mt-1", runsLow ? "text-orange-400" : "text-muted-foreground/60"].join(" ")}>
            <Gauge size={10} />
            {runsRemaining === 0 ? "No runs left today" : `${runsRemaining} runs left today`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background font-mono text-xs">
      {/* Status bar */}
      {(isRunning || result) && (
        <div
          className={[
            "shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-border text-[10px]",
            isRunning
              ? "bg-yellow-500/10 text-yellow-400"
              : succeeded
              ? "bg-primary/10 text-primary"
              : "bg-destructive/10 text-destructive",
          ].join(" ")}
        >
          <span
            className={[
              "w-1.5 h-1.5 rounded-full",
              isRunning ? "bg-yellow-400 animate-pulse" : succeeded ? "bg-primary" : "bg-destructive",
            ].join(" ")}
          />
          {isRunning ? (
            <span>Running…</span>
          ) : result?.error === "timeout" ? (
            <span>Timed out after 10s</span>
          ) : succeeded ? (
            <span>Exited successfully</span>
          ) : (
            <span>Exited with code {result?.exitCode}</span>
          )}
          {result && <span className="text-muted-foreground">{result.duration}ms</span>}

          {/* Runs remaining badge — shown after execution */}
          {!isRunning && runsRemaining !== null && runsRemaining !== undefined && (
            <span
              className={[
                "ml-auto flex items-center gap-1",
                runsLow ? "text-orange-400" : "text-muted-foreground",
              ].join(" ")}
              title="Runs remaining today"
            >
              <Gauge size={9} />
              {runsRemaining === 0 ? "No runs left" : `${runsRemaining} left today`}
            </span>
          )}
        </div>
      )}

      {/* Output area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-0">
        {stream.chunks.map((chunk, i) => (
          <pre
            key={i}
            className={[
              "whitespace-pre-wrap leading-relaxed",
              chunk.type === "stdout" ? "text-foreground" : "text-destructive",
            ].join(" ")}
          >
            {chunk.text}
          </pre>
        ))}
        {!hasContent && isRunning && (
          <span className="text-muted-foreground italic">Waiting for output…</span>
        )}
        {result && !stream.chunks.some((c) => c.text.trim()) && (
          <span className="text-muted-foreground italic">No output.</span>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
