"use client";

import { useState } from "react";
import { useEditor, useContent } from "@/app/providers";
import type { FileNode } from "@/types/editor";

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className="w-[10px] h-[10px] shrink-0 transition-transform duration-100"
      style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M6 4l4 4-4 4z" />
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop() ?? "";

  if (ext === "ipynb") {
    // Jupyter notebook — bracket/cell icon
    return (
      <svg className="w-[14px] h-[14px] shrink-0" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="#e5a00d" strokeWidth="1.2" />
        <line x1="5.5" y1="4.5" x2="10.5" y2="4.5" stroke="#e5a00d" strokeWidth="1" />
        <line x1="5.5" y1="7" x2="10.5" y2="7" stroke="#e5a00d" strokeWidth="1" />
        <line x1="5.5" y1="9.5" x2="8.5" y2="9.5" stroke="#e5a00d" strokeWidth="1" />
      </svg>
    );
  }

  if (ext === "md") {
    // Markdown — diamond/gem shape
    return (
      <svg className="w-[14px] h-[14px] shrink-0" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14 8L8 14L2 8Z" stroke="#569cd6" strokeWidth="1.2" fill="none" />
        <path d="M8 5L11 8L8 11L5 8Z" fill="#569cd6" opacity="0.4" />
      </svg>
    );
  }

  if (name.startsWith(".git") || name === ".gitkeep") {
    // Git file — gear icon
    return (
      <svg className="w-[14px] h-[14px] shrink-0" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="#707070" strokeWidth="1.1" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="#707070" strokeWidth="1" />
      </svg>
    );
  }

  // Default — simple document outline
  const defaultColor = "#707070";
  return (
    <svg className="w-[14px] h-[14px] shrink-0" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 1.5h5l4 4v8a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 13.5v-10A1.5 1.5 0 014 1.5z"
        stroke={defaultColor}
        strokeWidth="1.1"
      />
      <path d="M9 1.5v4h4" stroke={defaultColor} strokeWidth="1.1" />
    </svg>
  );
}

export default function FileExplorer() {
  const { fileTree } = useContent();
  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <div className="flex flex-col w-56 h-full bg-surface-2 border-r border-line-subtle select-none">

      {sectionOpen && (
        <div className="flex-1 overflow-y-auto pb-4">
          {fileTree.map((node) => (
            <TreeNode key={node.path} node={node} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const { state, openFile, toggleFolder } = useEditor();
  const isFolder = node.type === "folder";
  const isExpanded = state.expandedFolders.includes(node.path);
  const isActive = state.activeFile === node.path;

  const paddingLeft = depth * 12 + 12;

  return (
    <>
      <button
        type="button"
        onClick={() =>
          isFolder ? toggleFolder(node.path) : openFile(node.path, node.name)
        }
        className={[
          "group relative flex items-center gap-1.5 w-full h-[24px] pr-3 text-body cursor-pointer",
          isActive
            ? "bg-selection bg-[#444444]"
            : "text-ink-secondary hover:bg-[#ffffff08]",
        ].join(" ")}
        style={{ paddingLeft }}
      >
        {/* Indent guides */}
        {Array.from({ length: depth }).map((_, i) => (
          <span
            key={i}
            className="absolute top-0 bottom-0 w-px bg-[#444444]"
            style={{ left: i * 12 + 18 }}
          />
        ))}

        {isFolder ? (
          <span className="text-[#444444]">
            <ChevronIcon expanded={isExpanded} />
          </span>
        ) : (
          <>
            <span className="absolute w-py bg-[#444444]" />
            <FileIcon name={node.name} />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder &&
        isExpanded &&
        node.children?.map((child) => (
          <TreeNode key={child.path} node={child} depth={depth + 1} />
        ))}
    </>
  );
}
