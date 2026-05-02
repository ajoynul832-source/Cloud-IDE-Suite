import { useState, useEffect, useCallback } from "react";

// Bump this version any time the default files change — old data gets replaced
const STORAGE_KEY    = "cloudide_files_v3";
const STORAGE_KEY_OLD = "cloudide_files";

const DEFAULT_FILES: Record<string, string> = {
  "index.js": `// Welcome to Cloud IDE!
// Click Run ▶ to execute this file.

console.log("Hello from Cloud IDE!");

// Try some JavaScript:
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

const sum = numbers.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);

// Async/await works too:
async function greet(name) {
  return \`Hello, \${name}!\`;
}

greet("World").then(msg => console.log(msg));
`,
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HTML Preview</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #0d1117; color: #e6edf3; }
    h1 { color: #58a6ff; }
    button { padding: 0.5rem 1rem; background: #238636; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    button:hover { background: #2ea043; }
    #output { margin-top: 1rem; padding: 1rem; background: #161b22; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>HTML Preview</h1>
  <p>Click Run ▶ to render this HTML in the Preview panel.</p>
  <button onclick="document.getElementById('output').textContent = 'Button clicked! ' + new Date().toLocaleTimeString()">
    Click me
  </button>
  <div id="output">Output will appear here.</div>
</body>
</html>
`,
  "README.md": `# Cloud IDE

Welcome! This is your starter workspace.

## Quick start
- **index.js** — Click **Run** to execute JavaScript in the Console
- **index.html** — Click **Run** to render HTML in the Preview panel

## Templates
Click **New** in the toolbar to load a Flutter, React Native, Python, or other template.

## Build APK
Click **Build APK** to compile Flutter or Android projects.
`,
};

export function useFileSystem() {
  const [files, setFiles] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Remove legacy keys so they don't accumulate
    localStorage.removeItem(STORAGE_KEY_OLD);
    localStorage.removeItem("cloudide_files_v2");

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, string>;
        // Reject old saves that only contain mobile templates (no runnable file)
        const keys = Object.keys(parsed);
        const hasRunnable = keys.some(k =>
          /\.(js|jsx|ts|tsx|py|html?)$/.test(k) &&
          !Object.values(parsed).some(v =>
            v.includes("from 'react-native'") || v.includes("from \"react-native\"") ||
            v.includes("import kivy") || v.includes("from kivy")
          )
        );
        if (hasRunnable) {
          setFiles(parsed);
        } else {
          setFiles(DEFAULT_FILES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FILES));
        }
      } catch {
        setFiles(DEFAULT_FILES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FILES));
      }
    } else {
      setFiles(DEFAULT_FILES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FILES));
    }
  }, []);

  const saveFile = useCallback((path: string, content: string) => {
    setFiles((prev) => {
      const next = { ...prev, [path]: content };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const createFile = useCallback((path: string, content: string = "") => {
    if (!path.trim()) return false;
    setFiles((prev) => {
      if (prev[path]) return prev;
      const next = { ...prev, [path]: content };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return true;
  }, []);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    if (!newPath.trim() || oldPath === newPath) return false;
    setFiles((prev) => {
      if (!prev[oldPath] || prev[newPath]) return prev;
      const next = { ...prev };
      next[newPath] = next[oldPath];
      delete next[oldPath];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return true;
  }, []);

  const deleteFile = useCallback((path: string) => {
    setFiles((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const loadTemplate = useCallback((templateFiles: Record<string, string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templateFiles));
    setFiles(templateFiles);
  }, []);

  const resetToDefaults = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FILES));
    setFiles(DEFAULT_FILES);
  }, []);

  return {
    files,
    saveFile,
    createFile,
    renameFile,
    deleteFile,
    loadTemplate,
    resetToDefaults,
  };
}
