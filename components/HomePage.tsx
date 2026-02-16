"use client";

import { useCallback, useState } from "react";
import LandingPage from "@/components/LandingPage";
import TopBar from "@/components/TopBar";
import FileExplorer from "@/components/FileExplorer";
import EditorWorkspace from "@/components/EditorWorkspace";
import ChatPanel from "@/components/ChatPanel";
import { useEditor, ContentProvider } from "@/app/providers";
import type { FileNode } from "@/types/editor";

type ViewMode = "landing" | "ide";

interface HomePageProps {
  fileTree: FileNode[];
  fileContents: Record<string, string>;
}

export default function HomePage({ fileTree, fileContents }: HomePageProps) {
  const { openFile, resetEditor } = useEditor();
  const [view, setView] = useState<ViewMode>("landing");

  const handleNavigate = useCallback(
    (filePath: string) => {
      const name = filePath.split("/").pop() || filePath;
      setView("ide");
      openFile(filePath, name);
    },
    [openFile]
  );

  return (
    <ContentProvider fileTree={fileTree} fileContents={fileContents}>
      {view === "landing" ? (
        <LandingPage onNavigate={handleNavigate} />
      ) : (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0a]">
          <TopBar
            onClose={() => {
              resetEditor();
              setView("landing");
            }}
          />
          <div className="flex flex-1 overflow-hidden">
            <FileExplorer />
            <EditorWorkspace />
            <ChatPanel />
          </div>
        </div>
      )}
    </ContentProvider>
  );
}
