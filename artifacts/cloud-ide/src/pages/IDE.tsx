import { useState, useRef } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree } from "@/components/FileTree";
import { Editor, EditorRef } from "@/components/Editor";
import { TabBar } from "@/components/TabBar";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Toolbar } from "@/components/Toolbar";
import { TemplateSelector } from "@/components/TemplateSelector";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useBuild } from "@/hooks/useBuild";
import { ProjectTemplate } from "@/lib/templates";

export default function IDE() {
  const { files, saveFile, createFile, renameFile, deleteFile, loadTemplate } = useFileSystem();
  const { isBuilding, startBuild, status, logs, jobId } = useBuild();

  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"preview" | "build">("preview");
  const [showTemplates, setShowTemplates] = useState(false);

  const editorRef = useRef<EditorRef>(null);

  // Detect current language from open files
  const currentLanguage = (() => {
    const f = activeFile ?? Object.keys(files)[0] ?? "";
    const ext = f.split(".").pop()?.toLowerCase() ?? "";
    const extMap: Record<string, string> = {
      dart: "Dart", kt: "Kotlin", kts: "Kotlin", java: "Java",
      swift: "Swift", py: "Python", rs: "Rust", go: "Go",
      cs: "C#", cpp: "C++", c: "C", h: "C/C++",
      ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
      html: "HTML", css: "CSS", json: "JSON", xml: "XML", md: "Markdown",
    };
    return extMap[ext] ?? undefined;
  })();

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

  const handleRun = () => {
    setRightPanelTab("preview");
  };

  const handleBuild = () => {
    if (activeFile && editorRef.current) {
      const content = editorRef.current.getContent();
      saveFile(activeFile, content);
      startBuild({ ...files, [activeFile]: content });
    } else {
      startBuild(files);
    }
    setRightPanelTab("build");
  };

  const handleLoadTemplate = (template: ProjectTemplate) => {
    loadTemplate(template.files);
    setOpenFiles([]);
    setActiveFile(null);
    setShowTemplates(false);
    // Auto-open first file
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
        onRun={handleRun}
        onBuild={handleBuild}
        onNewProject={() => setShowTemplates(true)}
        buildStatus={status?.status}
        jobId={jobId}
        currentLanguage={currentLanguage}
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
              activeTab={rightPanelTab}
              onTabChange={setRightPanelTab}
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
