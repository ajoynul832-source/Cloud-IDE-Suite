import { useState, useRef, useEffect, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree } from "@/components/FileTree";
import { Editor, EditorRef } from "@/components/Editor";
import { TabBar } from "@/components/TabBar";
import { PreviewPanel, PanelTab } from "@/components/PreviewPanel";
import { Toolbar, AutosaveStatus } from "@/components/Toolbar";
import { StatusBar } from "@/components/StatusBar";
import { TemplateSelector } from "@/components/TemplateSelector";
import { ProjectsModal } from "@/components/ProjectsModal";
import { ShareModal } from "@/components/ShareModal";
import { SettingsPanel } from "@/components/SettingsPanel";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import AuthPage from "@/pages/AuthPage";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useBuild } from "@/hooks/useBuild";
import { useRun } from "@/hooks/useRun";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackSync } from "@/hooks/useSnackSync";
import { ProjectTemplate } from "@/lib/templates";
import {
  generateCSSPreview,
  generateMarkdownPreview,
  generateJSONPreview,
  generateSVGPreview,
} from "@/lib/preview-generators";
import { Zap, Code2, Globe, Terminal } from "lucide-react";
import { EditorTheme } from "@/components/Editor";

const AUTOSAVE_DEBOUNCE_MS = 3_000;
const FONT_SIZE_KEY        = "cloudide_font_size";
const WORD_WRAP_KEY        = "cloudide_word_wrap";
const THEME_KEY            = "cloudide_theme";

// ─── Language helpers ─────────────────────────────────────────────────────────

type RunTarget =
  | "javascript" | "typescript" | "python"
  | "html" | "css" | "markdown" | "json" | "svg"   // ← preview-only (no backend)
  | "bash" | "perl" | "c" | "cpp";                  // ← compiled / shell

/** Maps file extension → run target. null = not runnable. */
function getRunTarget(filename: string): RunTarget | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, RunTarget> = {
    // JS / TS
    js:  "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
    ts:  "typescript", tsx: "typescript",
    // Python
    py:  "python",
    // HTML
    html:"html",  htm: "html",
    // Frontend-only previews
    css: "css",   scss:"css",
    md:  "markdown", markdown:"markdown",
    json:"json",
    svg: "svg",
    // Shell
    sh:  "bash",  bash:"bash",
    // Scripting
    pl:  "perl",  pm:  "perl",
    // Compiled
    c:   "c",
    cpp: "cpp",   cxx: "cpp",  cc: "cpp",
  };
  return map[ext] ?? null;
}

/** Returns a human-readable language label for the status bar. */
function getDisplayLanguage(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    dart:"Dart", kt:"Kotlin", kts:"Kotlin", java:"Java", swift:"Swift",
    py:"Python", rs:"Rust", go:"Go", cs:"C#", cpp:"C++", cxx:"C++", cc:"C++", c:"C",
    ts:"TypeScript", tsx:"TypeScript", js:"JavaScript", jsx:"JavaScript",
    html:"HTML", css:"CSS", scss:"SCSS", json:"JSON", xml:"XML",
    md:"Markdown", markdown:"Markdown", svg:"SVG",
    sh:"Bash", bash:"Bash", pl:"Perl",
  };
  return map[ext];
}

/** True when the run button should say "Preview" rather than "Run". */
function isPreviewOnly(target: RunTarget | null): boolean {
  return target === "css" || target === "markdown" || target === "json" || target === "svg";
}

function loadPref<T>(key: string, fallback: T, parse: (v: string) => T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? parse(stored) : fallback;
  } catch { return fallback; }
}

// ─── Mobile import guard ──────────────────────────────────────────────────────
const MOBILE_IMPORT_PATTERNS = [
  /from\s+['"]react-native['"]/,
  /require\s*\(\s*['"]react-native['"]\s*\)/,
  /from\s+['"]expo['"]/,
  /from\s+['"]kivy/,
  /import\s+kivy/,
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function IDE() {
  const { files, saveFile, createFile, renameFile, deleteFile, loadTemplate, resetToDefaults } = useFileSystem();
  const { isBuilding, startBuild, status, logs, jobId, projectType } = useBuild();
  const { isRunning, stream, runsRemaining, runCode, showClientError } = useRun();
  const { saveProject, createVersion } = useProjects();
  const { user } = useAuth();
  const {
    isRNProject, snackData, embedUrl: snackEmbedUrl, isSyncing,
    syncError, platform: snackPlatform, setPlatform: setSnackPlatform, syncNow,
  } = useSnackSync(files);

  const [openFiles,     setOpenFiles]     = useState<string[]>([]);
  const [activeFile,    setActiveFile]    = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<PanelTab>("preview");

  const [showTemplates, setShowTemplates] = useState(false);
  const [showProjects,  setShowProjects]  = useState(false);
  const [showShare,     setShowShare]     = useState(false);
  const [showSignIn,    setShowSignIn]    = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);

  const [currentProjectId,   setCurrentProjectId]   = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>("Untitled Project");
  const [autosaveStatus,     setAutosaveStatus]     = useState<AutosaveStatus>("idle");
  const [localRunsRemaining, setLocalRunsRemaining] = useState<number | null>(null);
  const [cursorPos,          setCursorPos]          = useState<{ line: number; col: number } | null>(null);

  const [stdinInput, setStdinInput] = useState<string>("");

  const [fontSize, setFontSizeState] = useState<number>(() =>
    loadPref(FONT_SIZE_KEY, 13, Number)
  );
  const [wordWrap, setWordWrapState] = useState<boolean>(() =>
    loadPref(WORD_WRAP_KEY, false, (v) => v === "true")
  );

  const [theme, setThemeState] = useState<EditorTheme>(() =>
    loadPref(THEME_KEY, "vscodeDark" as EditorTheme, (v) => v as EditorTheme)
  );

  const setFontSize = useCallback((size: number) => {
    const clamped = Math.max(10, Math.min(24, size));
    setFontSizeState(clamped);
    localStorage.setItem(FONT_SIZE_KEY, String(clamped));
  }, []);

  const toggleWordWrap = useCallback(() => {
    setWordWrapState((prev) => {
      const next = !prev;
      localStorage.setItem(WORD_WRAP_KEY, String(next));
      return next;
    });
  }, []);

  const setTheme = useCallback((t: EditorTheme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
  }, []);

  const editorRef     = useRef<EditorRef>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHash = useRef<string>("");

  const runTarget       = getRunTarget(activeFile ?? "");
  const currentLanguage = getDisplayLanguage(activeFile ?? Object.keys(files)[0] ?? "");
  const canRun          = !!runTarget;
  const canShare        = !!currentProjectId;
  const previewMode     = isPreviewOnly(runTarget);

  const isMobileProject =
    Object.keys(files).some(f =>
      /\.(dart|kt|java|swift)$/.test(f) ||
      f.includes("pubspec.yaml") || f.includes("AndroidManifest.xml")
    ) ||
    Object.values(files).some(c =>
      c.includes("react-native") || c.includes("expo") ||
      c.includes("import Flutter") || c.includes("import kivy")
    );

  // Auto-open first file
  useEffect(() => {
    if (openFiles.length > 0 || Object.keys(files).length === 0) return;
    const allFiles = Object.keys(files);
    const preferred =
      allFiles.find(f => /\.(js|jsx|mjs)$/.test(f)) ??
      allFiles.find(f => /\.(ts|tsx)$/.test(f)) ??
      allFiles.find(f => /\.py$/.test(f)) ??
      allFiles.find(f => /\.html?$/.test(f)) ??
      allFiles[0];
    if (preferred) { setOpenFiles([preferred]); setActiveFile(preferred); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Sync runs-remaining from SSE hook
  useEffect(() => {
    if (runsRemaining !== null) setLocalRunsRemaining(runsRemaining);
  }, [runsRemaining]);

  // Fetch initial usage
  useEffect(() => {
    fetch("/api/usage", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { runsRemaining?: number }) => {
        if (typeof d.runsRemaining === "number") setLocalRunsRemaining(d.runsRemaining);
      })
      .catch(() => {});
  }, []);

  // Load forked project stored by SharedProject before navigate("/ide")
  useEffect(() => {
    const raw = sessionStorage.getItem("cloudide_pending_load");
    if (!raw) return;
    sessionStorage.removeItem("cloudide_pending_load");
    try {
      const { id, files: pendingFiles, name } = JSON.parse(raw) as {
        id: string; files: Record<string, string>; name: string;
      };
      loadTemplate(pendingFiles);
      setCurrentProjectId(id ?? null);
      setCurrentProjectName(name ?? "Forked Project");
      lastSavedHash.current = JSON.stringify(pendingFiles);
      setOpenFiles([]); setActiveFile(null); setCursorPos(null); setHtmlPreview(null);
      const first = Object.keys(pendingFiles).sort()[0];
      if (first) { setOpenFiles([first]); setActiveFile(first); }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global keyboard shortcuts (outside CodeMirror)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      // "?" → keyboard shortcuts modal
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey && !inInput) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // Ctrl+, / Cmd+, → settings panel
      if (e.key === "," && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setShowSettings((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Autosave
  const scheduleAutosave = useCallback(() => {
    if (!currentProjectId) return;
    const hash = JSON.stringify(files);
    if (hash === lastSavedHash.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const currentHash = JSON.stringify(files);
      if (currentHash === lastSavedHash.current) return;
      setAutosaveStatus("saving");
      const saved = await saveProject(currentProjectName, projectType, files, currentProjectId);
      if (saved) {
        lastSavedHash.current = currentHash;
        setAutosaveStatus("saved");
        setTimeout(() => setAutosaveStatus("idle"), 2_000);
      } else {
        setAutosaveStatus("idle");
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [currentProjectId, currentProjectName, projectType, files, saveProject]);

  useEffect(() => {
    scheduleAutosave();
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // ── Auto-switch to Preview tab for preview-type files or RN projects ───────
  useEffect(() => {
    if (!activeFile) return;
    const ext = activeFile.split(".").pop()?.toLowerCase() ?? "";
    if (["html", "htm", "css", "md", "markdown", "json", "svg"].includes(ext)) {
      setRightPanelTab("preview");
    }
  }, [activeFile]);

  // Switch to preview tab automatically when RN project is detected
  useEffect(() => {
    if (isRNProject) setRightPanelTab("preview");
  }, [isRNProject]);

  // ── Live preview: debounced auto-update for HTML/CSS/MD/JSON/SVG ──────────
  useEffect(() => {
    if (!activeFile) return;
    const content = files[activeFile];
    if (content === undefined) return;
    const ext = activeFile.split(".").pop()?.toLowerCase() ?? "";

    type PreviewFn = (c: string) => string;
    const PREVIEW_FNS: Record<string, PreviewFn> = {
      html: (c) => c,
      htm:  (c) => c,
      css:      generateCSSPreview,
      md:       generateMarkdownPreview,
      markdown: generateMarkdownPreview,
      json:     generateJSONPreview,
      svg:      generateSVGPreview,
    };
    const previewFn = PREVIEW_FNS[ext];
    if (!previewFn) return; // not a preview type

    const timer = setTimeout(() => {
      setHtmlPreview(previewFn(content));
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, files]);

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleSelectFile = (path: string) => {
    if (!openFiles.includes(path)) setOpenFiles((prev) => [...prev, path]);
    setActiveFile(path);
    setCursorPos(null);
  };

  const handleCloseFile = (path: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((p) => p !== path);
      if (activeFile === path) setActiveFile(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  };

  const handleRun = useCallback(async () => {
    const file = activeFile;
    if (!file) return;

    const content = editorRef.current?.getContent() ?? files[file] ?? "";
    saveFile(file, content);

    const target = getRunTarget(file);
    if (!target) { setRightPanelTab("preview"); return; }

    // ── Frontend-only previews (no backend call) ──────────────────────────
    if (target === "html") {
      setHtmlPreview(content);
      setRightPanelTab("preview");
      return;
    }
    if (target === "css") {
      setHtmlPreview(generateCSSPreview(content));
      setRightPanelTab("preview");
      return;
    }
    if (target === "markdown") {
      setHtmlPreview(generateMarkdownPreview(content));
      setRightPanelTab("preview");
      return;
    }
    if (target === "json") {
      setHtmlPreview(generateJSONPreview(content));
      setRightPanelTab("preview");
      return;
    }
    if (target === "svg") {
      setHtmlPreview(generateSVGPreview(content));
      setRightPanelTab("preview");
      return;
    }

    // ── Mobile guard — redirect to live preview tab ───────────────────────
    if (MOBILE_IMPORT_PATTERNS.some((p) => p.test(content))) {
      setRightPanelTab("preview");
      return;
    }

    // ── Backend execution (JS/TS/Python/Bash/Perl/C/C++) ─────────────────
    setRightPanelTab("console");
    await runCode(target, content, file, stdinInput || undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, files, saveFile, runCode, showClientError, stdinInput]);

  const handleBuild = () => {
    if (activeFile && editorRef.current) {
      const content = editorRef.current.getContent();
      saveFile(activeFile, content);
      startBuild({ ...files, [activeFile]: content });
    } else {
      startBuild(files);
    }
    const isRN = Object.values(files).some((c) =>
      c.includes("react-native") || c.includes("expo")
    );
    setRightPanelTab(isRN ? "preview" : "build");
  };

  const handleLoadTemplate = (template: ProjectTemplate) => {
    loadTemplate(template.files);
    setOpenFiles([]); setActiveFile(null);
    setShowTemplates(false); setHtmlPreview(null);
    setCurrentProjectId(null); setCurrentProjectName("Untitled Project");
    lastSavedHash.current = "";
    setCursorPos(null);
    const first = Object.keys(template.files).sort()[0];
    if (first) { setOpenFiles([first]); setActiveFile(first); }
  };

  const handleLoadProject = (
    loadedFiles: Record<string, string>, name: string, id: string
  ) => {
    loadTemplate(loadedFiles);
    setOpenFiles([]); setActiveFile(null); setHtmlPreview(null);
    setCurrentProjectId(id); setCurrentProjectName(name);
    lastSavedHash.current = JSON.stringify(loadedFiles);
    setCursorPos(null);
    const first = Object.keys(loadedFiles).sort()[0];
    if (first) { setOpenFiles([first]); setActiveFile(first); }
  };

  // ── Prettier format ────────────────────────────────────────────────────────

  const FORMATTABLE_EXT: Record<string, string> = {
    js: "babel", jsx: "babel", mjs: "babel", cjs: "babel",
    ts: "typescript", tsx: "typescript",
    html: "html", htm: "html",
    css: "css", scss: "scss", less: "less",
    json: "json",
    md: "markdown", markdown: "markdown",
  };

  const handleFormat = useCallback(async () => {
    if (!activeFile || !editorRef.current) return;
    const ext    = activeFile.split(".").pop()?.toLowerCase() ?? "";
    const parser = FORMATTABLE_EXT[ext];
    if (!parser) return; // unsupported type — silently skip
    const code = editorRef.current.getContent();
    try {
      const prettier = await import("prettier/standalone");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plugins: any[] = [];
      if (["babel", "json"].includes(parser)) {
        const [babel, estree] = await Promise.all([
          import("prettier/plugins/babel"),
          import("prettier/plugins/estree"),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins.push((babel as any).default ?? babel, (estree as any).default ?? estree);
      } else if (parser === "typescript") {
        const [ts, estree] = await Promise.all([
          import("prettier/plugins/typescript"),
          import("prettier/plugins/estree"),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins.push((ts as any).default ?? ts, (estree as any).default ?? estree);
      } else if (parser === "html") {
        const html = await import("prettier/plugins/html");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins.push((html as any).default ?? html);
      } else if (["css", "scss", "less"].includes(parser)) {
        const postcss = await import("prettier/plugins/postcss");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins.push((postcss as any).default ?? postcss);
      } else if (parser === "markdown") {
        const md = await import("prettier/plugins/markdown");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins.push((md as any).default ?? md);
      }
      const formatted = await prettier.format(code, {
        parser,
        plugins,
        semi: true,
        singleQuote: false,
        tabWidth: 2,
        printWidth: 100,
        trailingComma: "all",
      });
      editorRef.current.setContent(formatted);
      saveFile(activeFile, formatted);
    } catch (err) {
      console.warn("[Format] prettier failed:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, files, saveFile]);

  const handleDownload = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    Object.entries(files).forEach(([path, content]) => zip.file(path, content));
    const blob = await zip.generateAsync({ type: "blob" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${currentProjectName.replace(/[^a-z0-9-_ .]/gi, "-")}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files, currentProjectName]);

  const handleProjectSaved = (id: string, name: string) => {
    setCurrentProjectId(id);
    setCurrentProjectName(name);
    lastSavedHash.current = JSON.stringify(files);
    createVersion(id, "Saved");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d1117]">
      <Toolbar
        isBuilding={isBuilding}
        isRunning={isRunning}
        onRun={handleRun}
        onBuild={handleBuild}
        onNewProject={() => setShowTemplates(true)}
        onOpenProjects={() => user ? setShowProjects(true) : setShowSignIn(true)}
        onShare={() => user ? setShowShare(true) : setShowSignIn(true)}
        onReset={() => {
          resetToDefaults();
          setOpenFiles([]); setActiveFile(null); setHtmlPreview(null);
          setCurrentProjectId(null); setCurrentProjectName("Untitled Project");
          setCursorPos(null);
        }}
        onShowSettings={() => setShowSettings((v) => !v)}
        onShowShortcuts={() => setShowShortcuts(true)}
        buildStatus={status?.status}
        jobId={jobId}
        currentLanguage={currentLanguage}
        canRun={canRun}
        canShare={canShare}
        previewMode={previewMode}
        projectName={currentProjectName}
        autosaveStatus={autosaveStatus}
        runsRemaining={localRunsRemaining}
        showBuildButton={isMobileProject}
        onDownload={handleDownload}
        onFormat={handleFormat}
        wordWrap={wordWrap}
        onWordWrapToggle={toggleWordWrap}
      />

      {/* Guest warning banner */}
      {!user && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-amber-500/8 border-b border-amber-500/15 text-[11px] font-mono text-amber-300/70">
          <span className="text-amber-400">⚠</span>
          <span>Your work is only saved in this browser tab — sign in free to save permanently.</span>
          <button
            onClick={() => setShowSignIn(true)}
            className="ml-auto shrink-0 underline text-amber-300/90 hover:text-amber-200 transition-colors"
          >
            Sign in →
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={12} maxSize={40}>
            <FileTree
              files={files}
              activeFile={activeFile}
              onSelect={handleSelectFile}
              onCreate={createFile}
              onDelete={deleteFile}
              onRename={renameFile}
            />
          </ResizablePanel>

          <ResizableHandle className="bg-white/8 w-[1px] hover:bg-[#4ade80]/60 transition-colors" />

          <ResizablePanel defaultSize={50} minSize={25}>
            <div className="h-full flex flex-col bg-[#0d1117]">
              <TabBar
                openFiles={openFiles}
                activeFile={activeFile}
                onSelect={setActiveFile}
                onClose={handleCloseFile}
              />
              <div className="flex-1 overflow-hidden relative">
                {activeFile && files[activeFile] !== undefined ? (
                  <Editor
                    ref={editorRef}
                    key={activeFile}
                    initialContent={files[activeFile]}
                    filename={activeFile}
                    onChange={(content) => saveFile(activeFile, content)}
                    onRun={handleRun}
                    onFormat={handleFormat}
                    onCursorChange={(line, col) => setCursorPos({ line, col })}
                    fontSize={fontSize}
                    wordWrap={wordWrap}
                    theme={theme}
                  />
                ) : (
                  <WelcomeScreen
                    onNewProject={() => setShowTemplates(true)}
                    onSelectFile={(ext) => {
                      const match = Object.keys(files).find(k => k.endsWith(`.${ext}`));
                      if (match) handleSelectFile(match);
                    }}
                    files={files}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="bg-white/8 w-[1px] hover:bg-[#4ade80]/60 transition-colors" />

          <ResizablePanel defaultSize={30} minSize={18}>
            <PreviewPanel
              logs={logs}
              buildStatus={status?.status}
              buildError={status?.status === "failed" ? "Build failed" : null}
              isBuilding={isBuilding}
              isRunning={isRunning}
              activeTab={rightPanelTab}
              onTabChange={setRightPanelTab}
              stream={stream}
              htmlPreview={htmlPreview}
              runsRemaining={localRunsRemaining}
              livePreview={
                !!htmlPreview &&
                !!activeFile &&
                ["html","htm","css","md","markdown","json","svg"].includes(
                  activeFile.split(".").pop()?.toLowerCase() ?? ""
                )
              }
              stdinInput={stdinInput}
              onStdinChange={setStdinInput}
              isRNProject={isRNProject}
              snackData={snackData}
              embedUrl={snackEmbedUrl}
              isSyncing={isSyncing}
              syncError={syncError}
              snackPlatform={snackPlatform}
              onPlatform={setSnackPlatform}
              onSyncNow={syncNow}
              files={files}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <StatusBar
        language={currentLanguage}
        filename={activeFile ?? undefined}
        runsRemaining={localRunsRemaining}
        isRunning={isRunning}
        isBuilding={isBuilding}
        cursorPos={activeFile ? cursorPos : null}
        fontSize={fontSize}
        onFontSizeIncrease={() => setFontSize(fontSize + 1)}
        onFontSizeDecrease={() => setFontSize(fontSize - 1)}
      />

      {/* Modals */}
      {showTemplates && (
        <TemplateSelector onSelect={handleLoadTemplate} onClose={() => setShowTemplates(false)} />
      )}

      {showProjects && (
        <ProjectsModal
          currentFiles={files}
          currentProjectType={projectType}
          currentProjectId={currentProjectId}
          onLoad={handleLoadProject}
          onSaved={handleProjectSaved}
          onClose={() => setShowProjects(false)}
        />
      )}

      {showShare && currentProjectId && (
        <ShareModal
          projectId={currentProjectId}
          projectName={currentProjectName}
          onClose={() => setShowShare(false)}
        />
      )}

      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute -top-8 right-0 text-white/50 hover:text-white text-sm font-mono"
            >
              ✕ close
            </button>
            <AuthPage onSuccess={() => setShowSignIn(false)} />
          </div>
        </div>
      )}

      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        wordWrap={wordWrap}
        onWordWrapToggle={toggleWordWrap}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}

// ── Welcome screen ─────────────────────────────────────────────────────────────
const QUICK_START = [
  { ext: "js",   label: "JavaScript", icon: <Zap     size={20} className="text-yellow-400" />, bg: "bg-yellow-400/8  border-yellow-400/20  hover:border-yellow-400/50"  },
  { ext: "ts",   label: "TypeScript", icon: <Code2   size={20} className="text-blue-400"   />, bg: "bg-blue-400/8    border-blue-400/20    hover:border-blue-400/50"    },
  { ext: "py",   label: "Python",     icon: <Terminal size={20} className="text-green-400" />, bg: "bg-green-400/8   border-green-400/20   hover:border-green-400/50"   },
  { ext: "html", label: "HTML",       icon: <Globe   size={20} className="text-orange-400" />, bg: "bg-orange-400/8  border-orange-400/20  hover:border-orange-400/50"  },
] as const;

function WelcomeScreen({
  onNewProject, onSelectFile, files,
}: {
  onNewProject: () => void;
  onSelectFile: (ext: string) => void;
  files: Record<string, string>;
}) {
  const fileKeys = Object.keys(files);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117] text-white/50 select-none p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-sm font-mono text-white/30 mb-1">CloudIDE</p>
          <h2 className="text-white/80 font-semibold text-base">Open a file to start editing</h2>
          <p className="text-xs text-white/30 mt-1">or pick a quick-start below</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_START.map(({ ext, label, icon, bg }) => {
            const match = fileKeys.find(k => k.endsWith(`.${ext}`));
            return (
              <button
                key={ext}
                onClick={() => match ? onSelectFile(ext) : onNewProject()}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${bg} transition-all hover:scale-105`}
              >
                {icon}
                <span className="text-xs font-mono text-white/60">{label}</span>
                {match && <span className="text-[9px] text-white/30 font-mono truncate max-w-full">{match}</span>}
              </button>
            );
          })}
        </div>
        <button
          onClick={onNewProject}
          className="w-full py-2 rounded border border-white/10 text-xs font-mono text-white/40 hover:border-white/30 hover:text-white/70 transition-colors"
        >
          + New project from template
        </button>
      </div>
    </div>
  );
}
