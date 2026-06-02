"use client";

import { useEditor, useContent } from "@/app/providers";
import type { FileNode } from "@/types/editor";

export default function FileExplorer() {
  const { fileTree } = useContent();

  return (
    <div className="flex flex-col w-60 h-full bg-surface-2 border-r border-line-subtle">
      <div className="flex-1 overflow-y-auto py-2">
        {fileTree.map((node) => (
          <TreeNode key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const { state, openFile, toggleFolder } = useEditor();
  const isFolder = node.type === "folder";
  const isExpanded = state.expandedFolders.includes(node.path);
  const isActive = state.activeFile === node.path;

  return (
    <div>
      <button
        onClick={() =>
          isFolder ? toggleFolder(node.path) : openFile(node.path, node.name)
        }
        className={`flex items-center gap-1 w-full py-[3px] pr-2 text-body ${
          isActive ? "bg-selection text-ink" : "text-ink-secondary hover:bg-surface-raised"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span>{node.name}</span>
      </button>

      {isFolder &&
        isExpanded &&
        node.children?.map((child) => (
          <TreeNode key={child.path} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}
