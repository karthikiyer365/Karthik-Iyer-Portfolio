"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import LandingPage from "@/components/LandingPage";
import TopBar from "@/components/TopBar";
import FileExplorer from "@/components/FileExplorer";
import EditorWorkspace from "@/components/EditorWorkspace";
import ChatPanel from "@/components/ChatPanel";
import { useEditor, ContentProvider } from "@/app/providers";
import { SETTINGS_PATH, SETTINGS_LABEL } from "@/lib/settings";
import type { FileNode } from "@/types/editor";

type ViewMode = "landing" | "ide";

interface HomePageProps {
  fileTree: FileNode[];
  fileContents: Record<string, string>;
}

export default function HomePage({ fileTree, fileContents }: HomePageProps) {
  const { openFile, resetEditor, state } = useEditor();
  const [view, setView] = useState<ViewMode>("landing");
  // Mobile only: which off-canvas panel is open (desktop shows both inline).
  const [drawer, setDrawer] = useState<"files" | "chat" | null>(null);

  // Close the files drawer once a file is opened so the editor is visible.
  useEffect(() => {
    setDrawer(null);
  }, [state.activeFile]);

  const handleNavigate = useCallback(
    (filePath: string) => {
      const name =
        filePath === SETTINGS_PATH
          ? SETTINGS_LABEL
          : filePath.split("/").pop() || filePath;
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
            onOpenFiles={() => setDrawer("files")}
          />
          <div className="flex flex-1 overflow-hidden">
            {/* File explorer: inline on desktop, off-canvas drawer on mobile */}
            <div
              className={`fixed inset-y-0 left-0 z-30 transition-transform md:static md:z-auto md:translate-x-0 ${
                drawer === "files" ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <FileExplorer />
            </div>
            <EditorWorkspace />
            {/* Chat: inline on desktop, off-canvas drawer on mobile */}
            <div
              className={`fixed inset-y-0 right-0 z-30 transition-transform md:static md:z-auto md:translate-x-0 ${
                drawer === "chat" ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <ChatPanel />
            </div>
            {/* Mobile backdrop */}
            {drawer && (
              <div
                className="fixed inset-0 z-20 bg-black/50 md:hidden"
                onClick={() => setDrawer(null)}
              />
            )}
            {/* Mobile-only floating chat button; hidden while chat is open */}
            {drawer !== "chat" && (
              <button
                type="button"
                aria-label="Open chat"
                onClick={() => setDrawer("chat")}
                className="md:hidden fixed bottom-5 right-5 z-30 flex items-center gap-1.5 rounded-full border border-accent-pink bg-accent-pink/20 px-3.5 py-2.5 text-accent-pink text-[13px] font-mono font-semibold shadow-lg hover:bg-accent-pink/30 active:bg-accent-pink/40 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                kAI
              </button>
            )}
          </div>
        </div>
      )}
    </ContentProvider>
  );
}
