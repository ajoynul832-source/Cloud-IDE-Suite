import { useState, useCallback, useRef } from "react";

export interface StreamChunk {
  type: "stdout" | "stderr" | "error";
  text: string;
}

export interface RunOutput {
  /** Accumulated stdout (plain text) */
  stdout: string;
  /** Accumulated stderr (plain text) */
  stderr: string;
  exitCode: number;
  duration: number;
  error?: string;
  /** Set when server returns HTML for iframe preview */
  html?: string;
}

export interface StreamState {
  /** Live chunks arriving before execution finishes */
  chunks: StreamChunk[];
  /** Set once execution is complete */
  result: RunOutput | null;
}

export function useRun() {
  const [isRunning, setIsRunning] = useState(false);
  const [stream, setStream] = useState<StreamState>({ chunks: [], result: null });
  const abortRef = useRef<AbortController | null>(null);

  const runCode = useCallback(async (
    language: string,
    code: string,
    filename?: string,
  ) => {
    // Cancel any in-flight execution
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setStream({ chunks: [], result: null });

    try {
      const res = await fetch(`/api/run/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, filename }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        setStream({
          chunks: [{ type: "stderr", text: errorData.error ?? `HTTP ${res.status}` }],
          result: { stdout: "", stderr: errorData.error ?? "", exitCode: -1, duration: 0, error: "request_failed" },
        });
        return;
      }

      // SSE streaming read
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let stdout = "";
      let stderr = "";
      let htmlContent: string | undefined;
      let isHtmlPreview = false;
      let execError: string | undefined;

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on double-newline (SSE message boundary)
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";

        for (const message of messages) {
          const dataLine = message.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          let event: {
            type: string;
            chunk?: string;
            exitCode?: number;
            duration?: number;
            error?: string;
          };

          try {
            event = JSON.parse(dataLine.slice(6)) as typeof event;
          } catch {
            continue;
          }

          if (event.type === "stdout") {
            const chunk = event.chunk ?? "";
            if (chunk === "__HTML_PREVIEW__") {
              isHtmlPreview = true;
            } else {
              stdout += chunk;
              setStream((prev) => ({
                ...prev,
                chunks: [...prev.chunks, { type: "stdout", text: chunk }],
              }));
            }
          } else if (event.type === "stderr") {
            const chunk = event.chunk ?? "";
            stderr += chunk;
            setStream((prev) => ({
              ...prev,
              chunks: [...prev.chunks, { type: "stderr", text: chunk }],
            }));
          } else if (event.type === "error") {
            execError = event.error;
            if (event.chunk && event.chunk !== "__HTML_PREVIEW__") {
              stderr += event.chunk;
              setStream((prev) => ({
                ...prev,
                chunks: [...prev.chunks, { type: "error", text: event.chunk! }],
              }));
            }
          } else if (event.type === "done") {
            if (isHtmlPreview) htmlContent = event.chunk;
            const result: RunOutput = {
              stdout,
              stderr,
              exitCode: event.exitCode ?? 0,
              duration: event.duration ?? 0,
              error: execError,
              html: htmlContent,
            };
            setStream((prev) => ({ ...prev, result }));
            break outer;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Network error";
      setStream({
        chunks: [{ type: "error", text: msg }],
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

  // Convenience: combined output object for backward compat
  const output: RunOutput | null = stream.result;

  return { isRunning, stream, output, runCode, clearOutput };
}
