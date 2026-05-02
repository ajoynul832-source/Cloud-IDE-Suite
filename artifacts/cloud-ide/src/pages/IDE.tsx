import { useState, useRef } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree } from "@/components/FileTree";
import { Editor, EditorRef } from "@/components/Editor";
import { TabBar } from "@/components/TabBar";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Toolbar } from "@/components/Toolbar";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useBuild } from "@/hooks/useBuild";

export default function IDE() {
  const { files, saveFile, createFile, renameFile, deleteFile } = useFileSystem();
  const { isBuilding, startBuild, status, logs, jobId } = useBuild();
  
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"preview" | "build">("preview");
  
  const editorRef = useRef<EditorRef>(null);

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
    // If there is an active file, make sure we save its latest content from the editor
    if (activeFile && editorRef.current) {
      const content = editorRef.current.getContent();
      saveFile(activeFile, content);
      
      // Update local copy so we zip the freshest
      const currentFiles = { ...files, [activeFile]: content };
      startBuild(currentFiles);
    } else {
      startBuild(files);
    }
    setRightPanelTab("build");
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <Toolbar 
        isBuilding={isBuilding} 
        onRun={handleRun} 
        onBuild={handleBuild} 
        buildStatus={status?.status}
        jobId={jobId}
      />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={10} maxSize={40}>
            <FileTree
              files={files}
              activeFile={activeFile}
              onSelect={handleSelectFile}
              onCreate={createFile}
              onDelete={deleteFile}
              onRename={renameFile}
            />
          </ResizablePanel>
          
          <ResizableHandle className="bg-border w-1 hover:bg-primary transition-colors" />
          
          <ResizablePanel defaultSize={50} minSize={30}>
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
                    initialContent={files[activeFile]}
                    filename={activeFile}
                    onChange={(content) => saveFile(activeFile, content)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-sm">
                    Select a file to edit
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="bg-border w-1 hover:bg-primary transition-colors" />
          
          <ResizablePanel defaultSize={30} minSize={20}>
            <PreviewPanel 
              logs={logs} 
              isBuilding={isBuilding} 
              activeTab={rightPanelTab}
              onTabChange={setRightPanelTab}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
