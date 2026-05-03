import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Terminal as TerminalIcon, X, RotateCcw, AlertCircle } from "lucide-react";

interface TerminalTabProps {
  isActive: boolean;
}

interface OutputLine {
  text: string;
  type: "output" | "input" | "error" | "info";
  id: number;
}

let lineId = 0;

const WELCOME_LINES: OutputLine[] = [
  { text: "CloudIDE Terminal — Interactive Shell", type: "info", id: lineId++ },
  { text: "Type commands and press Enter to execute.", type: "info", id: lineId++ },
  { text: "Supported: ls, pwd, echo, date, node -e '...', python3 -c '...'", type: "info", id: lineId++ },
  { text: "", type: "output", id: lineId++ },
];

export function TerminalTab({ isActive }: TerminalTabProps) {
  const [lines,   setLines]   = useState<OutputLine[]>(WELCOME_LINES);
  const [input,   setInput]   = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [ws,      setWs]      = useState<WebSocket | null>(null);
  const [wsState, setWsState] = useState<"connecting" | "open" | "closed" | "error">("closed");
  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addLine = useCallback((text: string, type: OutputLine["type"] = "output") => {
    setLines((prev) => [...prev, { text, type, id: lineId++ }]);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, isActive]);

  const connect = useCallback(() => {
    if (ws?.readyState === WebSocket.OPEN) return;
    setWsState("connecting");
    addLine("Connecting to terminal…", "info");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/terminal`;

    try {
      const socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        setWsState("open");
        addLine("Connected.", "info");
      };
      socket.onmessage = (ev) => {
        const data = typeof ev.data === "string" ? ev.data : "";
        data.split("\n").forEach((line) => {
          if (line !== "") addLine(line, "output");
        });
      };
      socket.onerror = () => {
        setWsState("error");
        addLine("WebSocket error. Falling back to HTTP execution.", "error");
      };
      socket.onclose = () => {
        setWsState("closed");
        addLine("Terminal disconnected.", "info");
      };
      setWs(socket);
    } catch {
      setWsState("error");
      addLine("Failed to connect. Using HTTP fallback.", "error");
    }
  }, [ws, addLine]);

  const runHttpFallback = useCallback(async (cmd: string) => {
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "bash", code: cmd }),
      });
      if (!res.ok || !res.body) {
        addLine("Execution failed", "error");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split("\n\n");
        for (const ev of events) {
          const dataLine = ev.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          try {
            const msg = JSON.parse(dataLine.slice(6)) as { type: string; text?: string };
            if (msg.type === "stdout" && msg.text) addLine(msg.text, "output");
            if (msg.type === "stderr" && msg.text) addLine(msg.text, "error");
          } catch {}
        }
      }
    } catch (err) {
      addLine(`Error: ${err instanceof Error ? err.message : "Unknown"}`, "error");
    }
  }, [addLine]);

  const handleSubmit = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd) return;
    addLine(`$ ${cmd}`, "input");
    setHistory((prev) => [cmd, ...prev.slice(0, 49)]);
    setHistIdx(-1);
    setInput("");

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(cmd + "\n");
    } else {
      await runHttpFallback(cmd);
    }
  }, [input, ws, addLine, runHttpFallback]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? "" : history[next] ?? "");
      return;
    }
    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      addLine("^C", "error");
      setInput("");
    }
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines(WELCOME_LINES);
    }
  };

  const clear = () => { setLines(WELCOME_LINES); setInput(""); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-[#0d1117] font-mono text-[11px]"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] bg-gradient-to-r from-white/[0.01] to-transparent shrink-0">
        <div className="flex items-center gap-2.5">
          <TerminalIcon size={11} className="text-[#4ade80]" />
          <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">Terminal</span>
          <div className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${
            wsState === "open" ? "text-[#4ade80] bg-[#4ade80]/12 border border-[#4ade80]/25" :
            wsState === "connecting" ? "text-yellow-400 bg-yellow-400/12 border border-yellow-400/25 animate-pulse" :
            wsState === "error" ? "text-red-400 bg-red-400/12 border border-red-400/25" : 
            "text-white/30 bg-white/5 border border-white/10"
          }`}>
            {wsState === "open" ? "● Connected" : wsState === "connecting" ? "⟳ Connecting…" : wsState === "error" ? "✕ Error" : "○ Offline"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {wsState !== "open" && (
            <button
              onClick={(e) => { e.stopPropagation(); connect(); }}
              className="px-3 py-1 text-[9px] font-bold text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/25 rounded hover:bg-[#4ade80]/20 transition-all"
              title="Connect to terminal server"
            >
              Connect
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); clear(); }}
            title="Clear terminal (Ctrl+L)"
            className="px-2 py-1 rounded text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors"
          >
            <RotateCcw size={10} />
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 cursor-text scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {lines.map((line) => (
          <div
            key={line.id}
            className={`leading-relaxed whitespace-pre-wrap break-all text-[11px] font-mono ${
              line.type === "input"  ? "text-[#4ade80]/85 font-semibold" :
              line.type === "error"  ? "text-red-300 bg-red-500/8 px-2 py-1 rounded border-l-2 border-red-400/40" :
              line.type === "info"   ? "text-white/35 italic text-[10px]" :
              "text-white/70"
            }`}
          >
            {line.text || "\u00a0"}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2.5 px-4 py-2 border-t border-white/[0.08] bg-gradient-to-r from-white/[0.01] to-transparent shrink-0">
        <span className="text-[#4ade80]/70 shrink-0 font-bold">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={wsState === "open" ? "type a command…" : "type a command (Bash via HTTP fallback)…"}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-[#4ade80]/80 placeholder-white/15 focus:outline-none text-[11px] font-mono caret-[#4ade80]"
        />
      </div>

      {wsState === "error" && (
        <div className="px-4 py-2 bg-red-500/8 border-t border-red-400/20 flex items-center gap-2 shrink-0">
          <AlertCircle size={10} className="text-red-400 shrink-0" />
          <span className="text-[10px] text-red-300/75 font-mono">WebSocket unavailable — using HTTP fallback for bash execution</span>
        </div>
      )}
    </motion.div>
  );
}
