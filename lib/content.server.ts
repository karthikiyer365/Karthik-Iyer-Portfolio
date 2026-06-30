import fs from "fs";
import path from "path";
import type { FileNode } from "@/types/editor";

const CONTENT_DIR = path.join(process.cwd(), "content");

const SORT_ORDER: Record<string, string[]> = {
  portfolio: [
    "Summary.ipynb",
    "Resume.md",
    "education",
    "experiences",
    "projects",
  ],
  "portfolio/experiences": [
    "AI & Data Engineer - RestoreFast.ipynb",
    "Teaching Assistant - GWU.ipynb",
    "Technical Systems Admin - GWU.ipynb",
    "Financial Analyst - DPSY & Associates.ipynb",
    "SMO Lead - TechAnalogy.ipynb",
  ],
};

function buildFileTree(dir: string, prefix: string): FileNode[] {
  if (!fs.existsSync(dir)) return [];

  const order = SORT_ORDER[prefix];
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith(".") && !e.name.endsWith(".ts"))
    .sort((a, b) => {
      if (order) {
        const ai = order.indexOf(a.name);
        const bi = order.indexOf(b.name);
        if (ai !== -1 || bi !== -1) {
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        }
      }
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  return entries.map((entry) => {
    const filePath = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      return {
        name: entry.name,
        type: "folder" as const,
        path: filePath,
        children: buildFileTree(path.join(dir, entry.name), filePath),
      };
    }
    return {
      name: entry.name,
      type: "file" as const,
      path: filePath,
    };
  });
}

function readAllFiles(
  dir: string,
  prefix: string
): Record<string, string> {
  if (!fs.existsSync(dir)) return {};
  const result: Record<string, string> = {};

  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith(".") && !e.name.endsWith(".ts"));

  for (const entry of entries) {
    const filePath = `${prefix}/${entry.name}`;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(result, readAllFiles(fullPath, filePath));
    } else {
      result[filePath] = fs.readFileSync(fullPath, "utf-8");
    }
  }

  return result;
}

export function loadContent() {
  const children = buildFileTree(CONTENT_DIR, "portfolio");

  const fileTree: FileNode[] =
    children.length > 0
      ? [
          {
            name: "portfolio",
            type: "folder",
            path: "portfolio",
            children,
          },
        ]
      : [];

  const fileContents = readAllFiles(CONTENT_DIR, "portfolio");

  return { fileTree, fileContents };
}
