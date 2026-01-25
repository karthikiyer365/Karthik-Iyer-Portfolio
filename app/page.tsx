"use client";

import TopBar from "@/components/TopBar";
import FileExplorer from "@/components/FileExplorer";
import EditorWorkspace from "@/components/EditorWorkspace";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0a]">
      {/* Top Bar - Editor Chrome */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        <FileExplorer />

        {/* Center Panel - Editor Workspace */}
        <EditorWorkspace />

        {/* Right Sidebar - Chat Panel */}
        <ChatPanel />
      </div>
    </div>
  );
}
