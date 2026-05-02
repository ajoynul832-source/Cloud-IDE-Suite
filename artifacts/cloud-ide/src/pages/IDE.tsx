import { useState, useRef, useEffect, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree } from "@/components/FileTree";
import { Editor, EditorRef } from "@/components/Editor";
import { TabBar } from "@/components/TabBar";
import { PreviewPanel, PanelTab } from "@/components/PreviewPanel";
import { Toolbar, AutosaveStatus } from "@/components/Toolbar";
import { TemplateSelector } from "@/components/TemplateSelector";
import { ProjectsModal } from "@/components/ProjectsModal";
import { ShareModal } from "@/components/ShareModal";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useBuild } from "@/hooks/useBuild";
import { useRun } from "@/hooks/useRun";
import { useProjects } from "@/hooks/useProjects";
import { getUserKey } from "@/lib/user-key";
import { ProjectTemplate } from "@/lib/templates";

const AUTOSAVE_DEBOUNCE_MS = 3_000;

function getExecLanguage(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
    ts: "typescript", tsx: "typescript",
    py: "python",
    html: "html", htm: "html",
  };
  return map[ext] ?? null;
}

function getDisplayLanguage(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const extMap: Record<string, string> = {
    dart: "Dart", kt: "Kotlin", kts: "Kotlin", java: "Java",
    swift: "Swift", py: "Python", rs: "Rust", go: "Go",
    cs: "C#", cpp: "C++", c: "C", h: "C/C++",
    ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
    html: "HTML", css: "CSS", json: "JSON", xml: "XML", md: "Markdown",
  };
  return extMap[ext];
}

export default function IDE() {
  const { files, saveFile, createFile, renameFile, deleteFile, loadTemplate } = useFileSystem();
  const { isBuilding, startBuild, status, logs, jobId, projectType, previewData } = useBuild();
  const { isRunning, stream, runsRemaining, runCode } = useRun();
  const { saveProject, createVersion } = useProjects();

  const [openFiles,     setOpenFiles]     = useState<string[]>([]);
  const [activeFile,    setActiveFile]    = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<PanelTab>("preview");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showProjects,  setShowProjects]  = useState(false);
  const [showShare,     setShowShare]     = useState(false);
  const [htmlPreview,   setHtmlPreview]   = useState<string | null>(null);

  const [currentProjectId,   setCurrentProjectId]   = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>("Untitled Project");
  const [autosaveStatus,     setAutosaveStatus]     = useState<AutosaveStatus>("idle");
  // Seeded from GET /api/usage on mount, then kept live via SSE usage events
  const [localRunsRemaining, setLocalRunsRemaining] = useState<number | null>(null);

  const editorRef     = useRef<EditorRef>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHash = useRef<string>("");

  const currentLanguage = getDisplayLanguage(activeFile ?? Object.keys(files)[0] ?? "");
  const canRun   = !!activeFile && !!getExecLanguage(activeFile);
  const canShare = !!currentProjectId;

  // Merge server-reported runsRemaining (from SSE events) into local state
  useEffect(() => {
    if (runsRemaining !== null) setLocalRunsRemaining(runsRemaining);
  }, [runsRemaining]);

  // ─── Fetch initial usage on mount ────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/usage", { headers: { "X-User-Key": getUserKey() } })
      .then((r) => r.json())
      .then((d: { runsRemaining?: number }) => {
        if (typeof d.runsRemaining === "number") setLocalRunsRemaining(d.runsRemaining);
      })
      .catch(() => {}); // non-critical
  }, []);

  // ─── Autosave ─────────────────────────────────────────────────────────────────

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

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectFile = (path: string) => {
    if (!openFiles.includes(path)) setOpenFiles((prev) => [...prev, path]);
    setActiveFile(path);
  };

  const handleCloseFile = (path: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((p) => p !== path);
      if (activeFile === path) setActiveFile(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  };

  const handleRun = async () => {
    const file = activeFile;
    if (!file) return;
    const content = editorRef.current?.getContent() ?? files[file] ?? "";
    saveFile(file, content);
    const lang = getExecLanguage(file);
    if (!lang) { setRightPanelTab("preview"); return; }
    if (lang === "html") { setHtmlPreview(content); setRightPanelTab("preview"); return; }
    setRightPanelTab("console");
    await runCode(lang, content, file);
  };

  const handleBuild = () => {
    if (activeFile && editorRef.current) {
      const content = editorRef.current.getContent();
      saveFile(activeFile, content);
      startBuild({ ...files, [activeFile]: content });
    } else {
      startBuild(files);
    }
    const isRN = Object.values(files).some((c) => c.includes("react-native") || c.includes("expo"));
    setRightPanelTab(isRN ? "preview" : "build");
  };

  const handleLoadTemplate = (template: ProjectTemplate) => {
    loadTemplate(template.files);
    setOpenFiles([]); setActiveFile(null);
    setShowTemplates(false); setHtmlPreview(null);
    setCurrentProjectId(null); setCurrentProjectName("Untitled Project");
    lastSavedHash.current = "";
    const first = Object.keys(template.files).sort()[0];
    if (first) { setOpenFiles([first]); setActiveFile(first); }
  };

  const handleLoadProject = (loadedFiles: Record<string, string>, name: string, id: string) => {
    loadTemplate(loadedFiles);
    setOpenFiles([]); setActiveFile(null); setHtmlPreview(null);
    setCurrentProjectId(id); setCurrentProjectName(name);
    lastSavedHash.current = JSON.stringify(loadedFiles);
    const first = Object.keys(loadedFiles).sort()[0];
    if (first) { setOpenFiles([first]); setActiveFile(first); }
  };

  const handleProjectSaved = (id: string, name: string) => {
    setCurrentProjectId(id);
    setCurrentProjectName(name);
    lastSavedHash.current = JSON.stringify(files);
    createVersion(id, "Saved");
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <Toolbar
        isBuilding={isBuilding}
        isRunning={isRunning}
        onRun={handleRun}
        onBuild={handleBuild}
        onNewProject={() => setShowTemplates(true)}
        onOpenProjects={() => setShowProjects(true)}
        onShare={() => setShowShare(true)}
        buildStatus={status?.status}
        jobId={jobId}
        currentLanguage={currentLanguage}
        canRun={canRun}
        canShare={canShare}
        projectName={currentProjectName}
        autosaveStatus={autosaveStatus}
        runsRemaining={localRunsRemaining}
      />

      <div className="flex-1 overflow-hidden">
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

          <ResizableHandle className="bg-border w-[1px] hover:bg-primary transition-colors" />

          <ResizablePanel defaultSize={50} minSize={25}>
            <div className="h-full flex flex-col bg-background">
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
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground font-mono text-sm gap-3">
                    <span>Select a file to edit</span>
                    <button onClick={() => setShowTemplates(true)} className="text-xs text-primary hover:underline">
                      or start a new project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="bg-border w-[1px] hover:bg-primary transition-colors" />

          <ResizablePanel defaultSize={30} minSize={18}>
            <PreviewPanel
              logs={logs}
              isBuilding={isBuilding}
              isRunning={isRunning}
              activeTab={rightPanelTab}
              onTabChange={setRightPanelTab}
              stream={stream}
              snackPreview={previewData}
              htmlPreview={htmlPreview}
              projectType={projectType}
              runsRemaining={localRunsRemaining}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

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
    </div>
  );
}
