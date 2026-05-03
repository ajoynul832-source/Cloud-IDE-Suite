import { useEffect, useRef, useState } from "react";
import { StreamState } from "@/hooks/useRun";
import { Trash2, Clock, Copy, Check, Terminal, ChevronDown, ChevronRight } from "lucide-react";

interface ConsoleOutputProps {
  stream:          StreamState;
  isRunning:       boolean;
  runsRemaining?:  number | null;
  stdinInput?:     string;
  onStdinChange?:  (v: string) => void;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return [
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join(":");
}

// ── ANSI → HTML ───────────────────────────────────────────────────────────────
// Converts ANSI escape sequences to styled <span> elements.
// Text is HTML-escaped first to prevent XSS.

const ANSI_FG: Record<number, string> = {
  30: "#6e7681",  31: "#ff7b72",  32: "#4ade80",  33: "#e3b341",
  34: "#79c0ff",  35: "#d2a8ff",  36: "#56d364",  37: "#e6edf3",
  90: "#8b949e",  91: "#ff9492",  92: "#6de9a9",  93: "#f0c040",
  94: "#a5d6ff",  95: "#f0b3ff",  96: "#71e8e8",  97: "#ffffff",
};

function ansiToHtml(raw: string): string {
  // 1. HTML-escape all content first (prevents XSS)
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Split on ANSI escape sequences: ESC [ <codes> m
  const parts = escaped.split(/\x1b\[([0-9;]*)m/);

  let html      = "";
  let openSpan  = false;

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Plain text segment
      html += parts[i];
    } else {
      // ANSI code segment
      const codes = parts[i] === "" ? [0] : parts[i].split(";").map(Number);

      if (openSpan) {
        html += "</span>";
        openSpan = false;
      }

      const isReset = codes.includes(0);
      if (isReset) continue;

      const fgCode = codes.find((c) => (c >= 30 && c <= 37) || (c >= 90 && c <= 97));
      const isBold = codes.includes(1);
      const isItalic = codes.includes(3);
      const isUnder  = codes.includes(4);
      const isDim    = codes.includes(2);

      // Only open a span if we have styling to apply
      if (fgCode !== undefined || isBold || isItalic || isUnder || isDim) {
        const styles: string[] = [];
        if (fgCode !== undefined) styles.push(`color:${ANSI_FG[fgCode]}`);
        if (isBold)   styles.push("font-weight:700");
        if (isItalic) styles.push("font-style:italic");
        if (isUnder)  styles.push("text-decoration:underline");
        if (isDim)    styles.push("opacity:0.5");
        html += `<span style="${styles.join(";")}">`;
        openSpan = true;
      }
    }
  }

  if (openSpan) html += "</span>";
  return html;
}

export function ConsoleOutput({ stream, isRunning, runsRemaining, stdinInput, onStdinChange }: ConsoleOutputProps) {
  const bottomRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cleared,        setCleared]        = useState(false);
  const [clearedAt,      setClearedAt]      = useState(0);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [stdinOpen,      setStdinOpen]      = useState(false);

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

  const stdinPanel = onStdinChange ? (
    <div className="shrink-0 border-b border-white/8">
      <button
        onClick={() => setStdinOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-white/40 hover:text-white/70 transition-colors"
      >
        {stdinOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Terminal size={10} />
        <span className="uppercase tracking-widest">Stdin</span>
        {stdinInput && stdinInput.length > 0 && (
          <span className="ml-1 text-[#4ade80]/60">
            ({stdinInput.split("\n").filter(Boolean).length} line{stdinInput.split("\n").filter(Boolean).length !== 1 ? "s" : ""})
          </span>
        )}
      </button>
      {stdinOpen && (
        <textarea
          value={stdinInput ?? ""}
          onChange={(e) => onStdinChange(e.target.value)}
          placeholder={"Type program input here…\nEach line = one Enter press"}
          spellCheck={false}
          rows={4}
          className="w-full bg-[#0a0d12] border-t border-white/5 text-white/75 font-mono text-[11px] px-3 py-2 resize-none outline-none placeholder:text-white/20 leading-relaxed"
        />
      )}
    </div>
  ) : null;

  if (!hasContent && !isRunning) {
    return (
      <div className="h-full flex flex-col bg-[#0d1117] font-mono text-xs">
        {stdinPanel}
        <div className="flex-1 p-4 text-white/40 flex flex-col gap-2">
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
          <p className="text-[10px] opacity-60">Execute: JS · TS · Python · Bash · Perl · C · C++</p>
          <p className="text-[10px] opacity-40">Preview: HTML · CSS · Markdown · JSON · SVG</p>
          <p className="text-[10px] opacity-40 mt-1">
            ↑ Expand <span className="text-white/50">Stdin</span> above to provide program input (e.g. Python <code className="text-white/50">input()</code>)
          </p>
          {runsRemaining !== null && runsRemaining !== undefined && (
            <p className={["text-[10px] mt-1", runsLow ? "text-orange-400" : "text-white/30"].join(" ")}>
              {runsRemaining === 0
                ? "No runs left today — resets at midnight UTC"
                : `${runsRemaining} runs remaining today`}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0d1117] font-mono text-xs">
      {stdinPanel}

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

        {/* Copy output */}
        {hasContent && !isRunning && (
          <button
            onClick={() => {
              const text = visibleChunks.map((c) => c.text).join("");
              navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }).catch(() => {});
            }}
            title="Copy all output"
            className={["transition-colors", copied ? "text-[#4ade80]" : "text-white/25 hover:text-white/70"].join(" ")}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        )}

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
                chunk.type === "stderr" ? "text-red-400" : "text-white/85",
              ].join(" ")}
              // Safe: ansiToHtml HTML-escapes all text before adding span tags
              dangerouslySetInnerHTML={{ __html: ansiToHtml(chunk.text) }}
            />
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
