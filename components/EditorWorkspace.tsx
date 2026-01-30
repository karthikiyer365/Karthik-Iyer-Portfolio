"use client";

import { useEditor } from "../app/providers";
import EditorTabs from "./EditorTabs";
import CursorCaret from "./CursorCaret";
import { getFileContent } from "../content";

export default function EditorWorkspace() {
  const { state } = useEditor();
  const { activeFile, openFiles } = state;

  // Welcome screen when no files are open
  if (openFiles.length === 0 || !activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#171717] text-[#666666]">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-[#1f1f1f]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <p className="text-sm mb-1">Select a file to open</p>
          <p className="text-xs text-[#444444]">or explore the file tree</p>
        </div>
      </div>
    );
  }

  const content = getFileContent(activeFile);
  const lines = content.split("\n");

  return (
    <div className="flex-1 flex flex-col bg-[#171717] overflow-hidden">
      {/* Tabs */}
      <EditorTabs />

      {/* Breadcrumb */}
      <div className="flex items-center h-6 px-4 bg-[#10100e] text-[11px] text-[#666666] shrink-0">
        {activeFile.split("/").map((part: string, idx: number, arr: string[]) => (
          <span key={idx} className="flex items-center">
            {idx > 0 && (
              <svg
                className="w-3 h-3 mx-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            <span className={idx === arr.length - 1 ? "text-[#a3a3a3]" : ""}>
              {part}
            </span>
          </span>
        ))}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          {/* Line Numbers */}
          <div className="sticky left-0 flex flex-col items-end py-4 px-3 bg-[#10100e] text-[#444444] select-none shrink-0">
            {lines.map((_, idx) => (
              <div key={idx} className="leading-6 text-right text-xs">
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Code Content */}
          <div className="flex-1 py-4 px-4 bg-[#101010]">
            {lines.map((line, idx) => (
              <div key={idx} className="leading-6">
                {renderLine(line, activeFile)}
                {idx === lines.length - 1 && <CursorCaret />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple syntax highlighting
function renderLine(line: string, filePath: string) {
  const isMd = filePath.endsWith(".md");
  const isCss = filePath.endsWith(".css");

  if (!line.trim()) {
    return <span className="text-transparent">.</span>;
  }

  if (isMd) {
    // Markdown headers
    if (line.startsWith("# ")) {
      return <span className="text-[#569cd6] font-semibold text-lg">{line}</span>;
    }
    if (line.startsWith("## ")) {
      return <span className="text-[#4ec9b0] font-medium">{line}</span>;
    }
    if (line.startsWith("### ")) {
      return <span className="text-[#dcdcaa]">{line}</span>;
    }
    // Lists
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return <span className="text-[#ce9178]">{line}</span>;
    }
    // Bold
    if (line.includes("**")) {
      return <span className="text-[#c586c0]">{line}</span>;
    }
    // Code inline
    if (line.includes("`")) {
      return <span className="text-[#d7ba7d]">{line}</span>;
    }
  }

  if (isCss) {
    // Property: value style
    if (line.includes(":")) {
      const [prop, ...rest] = line.split(":");
      const value = rest.join(":");
      return (
        <span>
          <span className="text-[#9cdcfe]">{prop}</span>
          <span className="text-[#666666]">:</span>
          <span className="text-[#ce9178]">{value}</span>
        </span>
      );
    }
    // Comments
    if (line.trim().startsWith("/*") || line.trim().startsWith("*") || line.trim().startsWith("*/")) {
      return <span className="text-[#6a9955]">{line}</span>;
    }
    // Selectors
    if (line.trim().startsWith(".") || line.trim().endsWith("{") || line.trim() === "}") {
      return <span className="text-[#d7ba7d]">{line}</span>;
    }
  }

  return <span className="text-[#d4d4d4]">{line}</span>;
}
