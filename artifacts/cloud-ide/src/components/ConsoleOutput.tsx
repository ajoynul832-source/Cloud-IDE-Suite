import { useEffect, useRef, useState } from "react";
import { StreamState } from "@/hooks/useRun";
import { Trash2, Clock } from "lucide-react";

interface ConsoleOutputProps {
  stream:         StreamState;
  isRunning:      boolean;
  runsRemaining?: number | null;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return [
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join(":");
}

export function ConsoleOutput({ stream, isRunning, runsRemaining }: ConsoleOutputProps) {
  const bottomRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cleared,        setCleared]        = useState(false);
  const [clearedAt,      setClearedAt]      = useState(0);
  const [showTimestamps, setShowTimestamps] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream.chunks.length]);

  useEffect(() => {
    if (isRunning) { setCleared(false); setClearedAt(stream.chunks.length); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const visibleChunks = cleared ? stream.chunks.slice(clearedAt) : stream.chunks;
  const hasContent    = visibleChunks.length > 0;
  const { result }    = stream;
  const succeeded     = result ? result.exitCode === 0 : null;
  const runsLow       = runsRemaining !== null && runsRemaining !== undefined && runsRemaining < 5;

  if (!hasContent && !isRunning) {
    return (
      <div className="h-full bg-[#0d1117] font-mono text-xs p-4 text-white/40 flex flex-col gap-2">
        <p>
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[#4ade80] font-semibold text-[10px]">
            Run ▶
          </kbd>{" "}
          or{" "}
          <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/60 font-semibold text-[10px]">
            Ctrl+Enter
          </kbd>{" "}
          to execute the current file.
        </p>
        <p className="text-[10px] opacity-60">Supports: JavaScript · TypeScript · Python · HTML</p>
        {runsRemaining !== null && runsRemaining !== undefined && (
          <p className={["text-[10px] mt-1", runsLow ? "text-orange-400" : "text-white/30"].join(" ")}>
            {runsRemaining === 0
              ? "No runs left today — resets at midnight UTC"
              : `${runsRemaining} runs remaining today`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0d1117] font-mono text-xs">
      {/* Status bar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-white/8">
        <div className={[
          "flex items-center gap-2 flex-1 text-[10px]",
          isRunning
            ? "text-yellow-400"
            : succeeded === true
              ? "text-[#4ade80]"
              : succeeded === false
                ? "text-red-400"
                : "text-white/40",
        ].join(" ")}>
          <span className={[
            "w-1.5 h-1.5 rounded-full shrink-0",
            isRunning
              ? "bg-yellow-400 animate-pulse"
              : succeeded === true
                ? "bg-[#4ade80]"
                : succeeded === false
                  ? "bg-red-400"
                  : "bg-white/20",
          ].join(" ")} />

          {isRunning ? (
            <span>Running…</span>
          ) : result?.error === "timeout" ? (
            <span>Timed out after 10s</span>
          ) : succeeded === true ? (
            <span>Exited successfully</span>
          ) : succeeded === false ? (
            <span>Exited with code {result?.exitCode}</span>
          ) : null}

          {result && (
            <span className="text-white/30">{result.duration}ms</span>
          )}
        </div>

        {/* Timestamp toggle */}
        <button
          onClick={() => setShowTimestamps((v) => !v)}
          title={showTimestamps ? "Hide timestamps" : "Show timestamps"}
          className={[
            "transition-colors",
            showTimestamps ? "text-[#4ade80]/70" : "text-white/25 hover:text-white/50",
          ].join(" ")}
        >
          <Clock size={11} />
        </button>

        {/* Clear button */}
        {hasContent && !isRunning && (
          <button
            onClick={() => { setCleared(true); setClearedAt(stream.chunks.length); }}
            title="Clear console"
            className="text-white/25 hover:text-white/70 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Output area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-0">
        {visibleChunks.map((chunk, i) => (
          <div key={i} className="flex items-start gap-2">
            {showTimestamps && (
              <span className="shrink-0 text-white/20 text-[10px] leading-relaxed pt-[1px] select-none">
                {fmtTime(chunk.timestamp)}
              </span>
            )}
            <pre
              className={[
                "whitespace-pre-wrap leading-relaxed text-[11px] flex-1 min-w-0",
                chunk.type === "stdout" ? "text-white/85" : "text-red-400",
              ].join(" ")}
            >
              {chunk.text}
            </pre>
          </div>
        ))}

        {!hasContent && isRunning && (
          <span className="text-white/30 italic">Waiting for output…</span>
        )}
        {result && !visibleChunks.some((c) => c.text.trim()) && (
          <span className="text-white/30 italic">No output.</span>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
