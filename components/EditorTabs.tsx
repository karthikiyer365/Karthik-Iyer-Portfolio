"use client";

import { useEditor } from "@/app/providers";

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop();
  
  if (ext === "md") {
    return (
      <svg className="w-3.5 h-3.5 text-[#519aba]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z" />
      </svg>
    );
  }
  
  if (ext === "css") {
    return (
      <svg className="w-3.5 h-3.5 text-[#56b6c2]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z" />
      </svg>
    );
  }
  
  return (
    <svg className="w-3.5 h-3.5 text-[#666666]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z" />
    </svg>
  );
}

export default function EditorTabs() {
  const { state, setActiveFile, closeFile } = useEditor();
  const { openFiles, activeFile } = state;

  if (openFiles.length === 0) return null;

  return (
    <div className="flex bg-[#0a0a0a] border-b border-[#1f1f1f] overflow-x-auto shrink-0">
      {openFiles.map((file) => {
        const isActive = file.path === activeFile;
        
        return (
          <div
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={`group flex items-center gap-2 px-3 h-9 cursor-pointer border-r border-[#1f1f1f] shrink-0 ${
              isActive
                ? "bg-[#141414] text-[#e5e5e5] border-t-2 border-t-[#3b82f6]"
                : "bg-[#0a0a0a] text-[#666666] hover:text-[#a3a3a3] border-t-2 border-t-transparent"
            }`}
          >
            <FileIcon name={file.name} />
            <span className="text-sm">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="p-0.5 rounded hover:bg-[#1f1f1f] opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            >
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
