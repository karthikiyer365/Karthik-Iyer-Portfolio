"use client";

import { useEditor } from "@/app/providers";
import { FileNode } from "@/types/editor";

// File tree structure
const fileTree: FileNode[] = [
  {
    name: "portfolio",
    type: "folder",
    path: "portfolio",
    children: [
      {
        name: "projects",
        type: "folder",
        path: "portfolio/projects",
        children: [
          { name: "crime-prediction.md", type: "file", path: "portfolio/projects/crime-prediction.md" },
          { name: "football-analytics.md", type: "file", path: "portfolio/projects/football-analytics.md" },
          { name: "yelp-analysis.md", type: "file", path: "portfolio/projects/yelp-analysis.md" },
        ],
      },
      {
        name: "experience",
        type: "folder",
        path: "portfolio/experience",
        children: [
          { name: "timeline.md", type: "file", path: "portfolio/experience/timeline.md" },
        ],
      },
      { name: "README.md", type: "file", path: "portfolio/README.md" },
      { name: "tools.css", type: "file", path: "portfolio/tools.css" },
      { name: "contact.css", type: "file", path: "portfolio/contact.css" },
    ],
  },
];

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop();
  
  if (ext === "md") {
    return (
      <svg className="w-4 h-4 text-[#519aba]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 17v-4l1.5 2 1.5-2v4h1v-5h-1l-1.5 2-1.5-2h-1v5h1z" />
      </svg>
    );
  }
  
  if (ext === "css") {
    return (
      <svg className="w-4 h-4 text-[#56b6c2]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h2v1H8v-1zm0 2h4v1H8v-1zm0 2h3v1H8v-1z" />
      </svg>
    );
  }
  
  return (
    <svg className="w-4 h-4 text-[#666666]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z" />
    </svg>
  );
}

function FolderIcon({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <svg className="w-4 h-4 text-[#dcb67a]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-8l-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zm0 12H4V8h16v10z" />
      </svg>
    );
  }
  
  return (
    <svg className="w-4 h-4 text-[#dcb67a]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-3 h-3 text-[#666666] transition-transform duration-150 ${
        isOpen ? "rotate-90" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
}

function TreeNode({ node, depth }: TreeNodeProps) {
  const { state, openFile, toggleFolder } = useEditor();
  const isFolder = node.type === "folder";
  const isExpanded = state.expandedFolders.includes(node.path);
  const isActive = state.activeFile === node.path;

  const handleClick = () => {
    if (isFolder) {
      toggleFolder(node.path);
    } else {
      openFile(node.path, node.name);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1 w-full py-[3px] pr-2 text-left text-sm transition-colors ${
          isActive
            ? "bg-[#1f1f1f] text-[#e5e5e5] border-l-2 border-l-[#3b82f6]"
            : "text-[#a3a3a3] hover:bg-[#1a1a1a] border-l-2 border-l-transparent"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder && <ChevronIcon isOpen={isExpanded} />}
        {!isFolder && <span className="w-3" />}
        {isFolder ? <FolderIcon isOpen={isExpanded} /> : <FileIcon name={node.name} />}
        <span className="ml-1 truncate">{node.name}</span>
      </button>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer() {
  return (
    <div className="flex flex-col w-60 h-full bg-[#141414] border-r border-[#1f1f1f] shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center h-9 px-4 text-[11px] font-medium uppercase tracking-wider text-[#666666] border-b border-[#1f1f1f] shrink-0">
        Explorer
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {fileTree.map((node) => (
          <TreeNode key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}
