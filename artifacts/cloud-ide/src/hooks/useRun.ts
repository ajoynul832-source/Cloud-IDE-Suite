import { useState, useCallback, useRef } from "react";

export interface StreamChunk {
  type:      "stdout" | "stderr" | "error";
  text:      string;
  timestamp: number;
}

export interface RunOutput {
  stdout:   string;
  stderr:   string;
  exitCode: number;
  duration: number;
  error?:   string;
  html?:    string;
}

export interface StreamState {
  chunks: StreamChunk[];
  result: RunOutput | null;
}

function makeChunk(type: StreamChunk["type"], text: string): StreamChunk {
  return { type, text, timestamp: Date.now() };
}

export function useRun() {
  const [isRunning,     setIsRunning]     = useState(false);
  const [stream,        setStream]        = useState<StreamState>({ chunks: [], result: null });
  const [runsRemaining, setRunsRemaining] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runCode = useCallback(async (
    language: string,
    code:     string,
    filename?: string,
    stdin?:    string,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setStream({ chunks: [], result: null });

    try {
      const res = await fetch("/api/run/stream", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ language, code, filename, stdin: stdin || undefined }),
        signal:      controller.signal,
      });

      if (!res.ok || !res.body) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string; remaining?: number };
        const msg = errorData.error ?? `HTTP ${res.status}`;
        if (typeof errorData.remaining === "number") setRunsRemaining(errorData.remaining);
        setStream({
          chunks: [makeChunk("stderr", msg)],
          result: { stdout: "", stderr: msg, exitCode: -1, duration: 0, error: "request_failed" },
        });
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let stdout        = "";
      let stderr        = "";
      let htmlContent:  string | undefined;
      let isHtmlPreview = false;
      let execError:    string | undefined;

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";

        for (const message of messages) {
          const dataLine = message.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          let event: {
            type:      string;
            chunk?:    string;
            exitCode?: number;
            duration?: number;
            error?:    string;
            remaining?: number;
          };

          try { event = JSON.parse(dataLine.slice(6)) as typeof event; }
          catch { continue; }

          if (event.type === "usage") {
            if (typeof event.remaining === "number") setRunsRemaining(event.remaining);
          } else if (event.type === "stdout") {
            const chunk = event.chunk ?? "";
            if (chunk === "__HTML_PREVIEW__") {
              isHtmlPreview = true;
            } else {
              stdout += chunk;
              setStream((prev) => ({ ...prev, chunks: [...prev.chunks, makeChunk("stdout", chunk)] }));
            }
          } else if (event.type === "stderr") {
            const chunk = event.chunk ?? "";
            stderr += chunk;
            setStream((prev) => ({ ...prev, chunks: [...prev.chunks, makeChunk("stderr", chunk)] }));
          } else if (event.type === "error") {
            execError = event.error;
            if (event.chunk && event.chunk !== "__HTML_PREVIEW__") {
              stderr += event.chunk;
              setStream((prev) => ({ ...prev, chunks: [...prev.chunks, makeChunk("error", event.chunk!)] }));
            }
          } else if (event.type === "done") {
            if (isHtmlPreview) htmlContent = event.chunk;
            setStream((prev) => ({
              ...prev,
              result: {
                stdout, stderr,
                exitCode: event.exitCode ?? 0,
                duration: event.duration ?? 0,
                error: execError,
                html: htmlContent,
              },
            }));
            break outer;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Network error";
      setStream({
        chunks: [makeChunk("error", msg)],
        result: { stdout: "", stderr: msg, exitCode: -1, duration: 0, error: "network" },
      });
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, []);

  const clearOutput = useCallback(() => {
    abortRef.current?.abort();
    setStream({ chunks: [], result: null });
  }, []);

  const showClientError = useCallback((message: string) => {
    setStream({
      chunks: [makeChunk("error", message)],
      result: { stdout: "", stderr: message, exitCode: 1, duration: 0, error: "client" },
    });
  }, []);

  return { isRunning, stream, output: stream.result, runsRemaining, runCode, clearOutput, showClientError };
}
