"use client";

import { useEditor } from "@/app/providers";
import { FileNode } from "@/types/editor";
import { useEffect, useState } from "react";
import { trpc } from "@/server/trpc/react";

/* ---------------- File Explorer ---------------- */

type TreeItem = { id: string; title?: string | null; organization?: string | null; skill?: string | null; type?: string | null; tech_domain?: string | null; contact_type?: string | null; contact_detail?: string | null };

const EMPTY_TREE: FileNode[] = [
  {
    name: "portfolio",
    type: "folder",
    path: "portfolio",
    children: [],
  },
];

export default function FileExplorer() {
  const { data, isLoading, isError } = trpc.explorer.getTree.useQuery();
  const [tree, setTree] = useState<FileNode[]>(EMPTY_TREE);

  useEffect(() => {
    if (isError || !data) {
      setTree(EMPTY_TREE);
      return;
    }

    const projects = (data.projects ?? []) as TreeItem[];
    const exp = (data.exp ?? []) as TreeItem[];
    const skillset = (data.skillset ?? []) as TreeItem[];
    const contact = (data.contact ?? []) as TreeItem[];

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
            children: projects.map((p) => {
              const label = p.title || p.id;
              return {
                name: `${label}.md`,
                type: "file" as const,
                path: `portfolio/projects/${label}.md`,
                table: "projects" as const,
                recordId: p.id,
              };
            }),
          },
          {
            name: "experience",
            type: "folder",
            path: "portfolio/experience",
            children: exp.map((e) => {
              const label = e.title || e.organization || e.id;
              return {
                name: `${label}.md`,
                type: "file" as const,
                path: `portfolio/experience/${label}.md`,
                table: "exp" as const,
                recordId: e.id,
              };
            }),
          },
          {
            name: "skillset",
            type: "folder",
            path: "portfolio/skillset",
            children: skillset.map((s) => {
              const label = s.skill || s.type || s.tech_domain || s.id;
              return {
                name: `${label}.md`,
                type: "file" as const,
                path: `portfolio/skillset/${label}.md`,
                table: "skillset" as const,
                recordId: s.id,
              };
            }),
          },
          {
            name: "contact",
            type: "folder",
            path: "portfolio/contact",
            children: contact.map((c) => {
              const label = c.contact_type || c.contact_detail || c.id;
              return {
                name: `${label}.md`,
                type: "file" as const,
                path: `portfolio/contact/${label}.md`,
                table: "contact" as const,
                recordId: c.id,
              };
            }),
          },
        ],
      },
    ];

    setTree(fileTree);
  }, [data, isError]);

  return (
    <div className="flex flex-col w-60 h-full bg-[#1e1e1e] border-r border-[#1f1f1f]">
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="px-3 py-2 text-xs text-[#666666]">Loading...</div>
        ) : (
          tree.map((node) => (
            <TreeNode key={node.path} node={node} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- Tree Node ---------------- */

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
        className={`flex items-center gap-1 w-full py-[3px] pr-2 text-sm ${
          isActive ? "bg-[#04395e]" : "hover:bg-[#1a1a1a]"
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
