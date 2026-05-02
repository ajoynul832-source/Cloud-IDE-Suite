import { useState, useCallback } from "react";

export interface RunOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  error?: string;
  html?: string;
}

export function useRun() {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<RunOutput | null>(null);

  const runCode = useCallback(async (
    language: string,
    code: string,
    filename?: string,
  ) => {
    setIsRunning(true);
    setOutput(null);

    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

    try {
      const res = await fetch(`${baseUrl}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, filename }),
      });

      const data = await res.json() as RunOutput & { error?: string };

      if (!res.ok) {
        setOutput({
          stdout: "",
          stderr: (data as { error?: string }).error ?? `HTTP ${res.status}`,
          exitCode: -1,
          duration: 0,
          error: "request_failed",
        });
        return;
      }

      setOutput(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setOutput({ stdout: "", stderr: msg, exitCode: -1, duration: 0, error: "network" });
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearOutput = useCallback(() => setOutput(null), []);

  return { isRunning, output, runCode, clearOutput };
}
