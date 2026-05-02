import { useState, useRef } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree } from "@/components/FileTree";
import { Editor, EditorRef } from "@/components/Editor";
import { TabBar } from "@/components/TabBar";
import { PreviewPanel, PanelTab } from "@/components/PreviewPanel";
import { Toolbar } from "@/components/Toolbar";
import { TemplateSelector } from "@/components/TemplateSelector";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useBuild } from "@/hooks/useBuild";
import { useRun } from "@/hooks/useRun";
import { ProjectTemplate } from "@/lib/templates";

/** Map file extension → execution language for /api/run */
function getExecLanguage(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    html: "html",
    htm: "html",
  };
  return map[ext] ?? null;
}

/** Map file extension → display language name */
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
  const { isRunning, output: runOutput, runCode } = useRun();

  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<PanelTab>("preview");
  const [showTemplates, setShowTemplates] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);

  const editorRef = useRef<EditorRef>(null);

  const currentLanguage = getDisplayLanguage(activeFile ?? Object.keys(files)[0] ?? "");

  const handleSelectFile = (path: string) => {
    if (!openFiles.includes(path)) {
      setOpenFiles((prev) => [...prev, path]);
    }
    setActiveFile(path);
  };

  const handleCloseFile = (path: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((p) => p !== path);
      if (activeFile === path) {
        setActiveFile(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  };

  /** Save current editor content then execute via /api/run */
  const handleRun = async () => {
    const file = activeFile;
    if (!file) return;

    // Flush unsaved edits
    const content = editorRef.current?.getContent() ?? files[file] ?? "";
    saveFile(file, content);

    const lang = getExecLanguage(file);

    if (!lang) {
      // Language not executable server-side — just switch to preview
      setRightPanelTab("preview");
      return;
    }

    // HTML → render in iframe, no server round-trip needed
    if (lang === "html") {
      setHtmlPreview(content);
      setRightPanelTab("preview");
      return;
    }

    setRightPanelTab("console");
    await runCode(lang, content, file);
  };

  const handleBuild = () => {
    // Save active editor content first
    if (activeFile && editorRef.current) {
      const content = editorRef.current.getContent();
      saveFile(activeFile, content);
      startBuild({ ...files, [activeFile]: content });
    } else {
      startBuild(files);
    }

    // React Native → Preview tab (Expo Snack will appear when ready)
    // Others → Build Log tab
    const willUseSnack = Object.keys(files).some((p) =>
      Object.values(files).some((c) => c.includes("react-native") || c.includes("expo"))
    );
    setRightPanelTab(willUseSnack ? "preview" : "build");
  };

  const handleLoadTemplate = (template: ProjectTemplate) => {
    loadTemplate(template.files);
    setOpenFiles([]);
    setActiveFile(null);
    setShowTemplates(false);
    setHtmlPreview(null);
    const first = Object.keys(template.files).sort()[0];
    if (first) {
      setOpenFiles([first]);
      setActiveFile(first);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <Toolbar
        isBuilding={isBuilding}
        isRunning={isRunning}
        onRun={handleRun}
        onBuild={handleBuild}
        onNewProject={() => setShowTemplates(true)}
        buildStatus={status?.status}
        jobId={jobId}
        currentLanguage={currentLanguage}
        canRun={!!activeFile && !!getExecLanguage(activeFile ?? "")}
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
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="text-xs text-primary hover:underline"
                    >
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
              consoleOutput={runOutput}
              snackPreview={previewData}
              htmlPreview={htmlPreview}
              projectType={projectType}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {showTemplates && (
        <TemplateSelector
          onSelect={handleLoadTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
