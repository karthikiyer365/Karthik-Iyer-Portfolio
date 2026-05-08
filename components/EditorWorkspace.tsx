"use client";

import { useState } from "react";
import { useEditor, useContent } from "@/app/providers";
import EditorTabs from "./EditorTabs";
import CursorCaret from "./CursorCaret";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "./MermaidDiagram";
import NotebookRenderer from "./NotebookRenderer";

type ViewMode = "code" | "preview";

export default function EditorWorkspace() {
  const { state } = useEditor();
  const { getContent } = useContent();
  const { activeFile, openFiles } = state;
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

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

  const content = getContent(activeFile);
  const isMd = activeFile.endsWith(".md");
  const isNotebook = activeFile.endsWith(".ipynb");
  const hasPreview = isMd || isNotebook;

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
      <EditorTabs />

      {/* Breadcrumb + view toggle */}
      <div className="flex items-center justify-between h-7 px-4 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center text-[11px] text-[#666666]">
          {activeFile
            .split("/")
            .map((part: string, idx: number, arr: string[]) => (
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
                <span
                  className={idx === arr.length - 1 ? "text-[#a3a3a3]" : ""}
                >
                  {part}
                </span>
              </span>
            ))}
        </div>

        {hasPreview && (
          <button
            onClick={() =>
              setViewMode((v) => (v === "code" ? "preview" : "code"))
            }
            className="text-[10px] px-2 py-0.5 rounded bg-[#2a2a2a] text-[#888] hover:text-[#ccc] transition-colors"
          >
            {viewMode === "preview" ? "< >" : "Preview"}
          </button>
        )}
      </div>

      {/* Content */}
      {hasPreview && viewMode === "preview" ? (
        isNotebook ? (
          <NotebookRenderer content={content} />
        ) : (
          <MarkdownPreview content={content} />
        )
      ) : (
        <CodeView content={content} filePath={activeFile} />
      )}
    </div>
  );
}

/* ===================== Markdown Preview ===================== */

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="flex-1 overflow-auto px-8 py-6 prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[#e5e5e5] mb-4 mt-2 border-b border-[#2a2a2a] pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-[#4ec9b0] mb-3 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-[#dcdcaa] mb-2 mt-4">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-[#d4d4d4] leading-relaxed mb-3">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3 text-sm text-[#d4d4d4] space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3 text-sm text-[#d4d4d4] space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#4ec9b0] pl-4 my-3 text-[#999]">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-[#569cd6] underline hover:text-[#7cb8f0]"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-auto my-3">
              <table className="border-collapse text-sm w-full">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-left text-[#e5e5e5]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[#333] px-3 py-1.5 text-[#d4d4d4]">
              {children}
            </td>
          ),
          hr: () => <hr className="border-[#2a2a2a] my-6" />,
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt ?? ""}
              className="max-w-full rounded-lg my-4"
            />
          ),
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : "";
            const codeStr = String(children).replace(/\n$/, "");

            if (lang === "mermaid") {
              return <MermaidDiagram chart={codeStr} />;
            }

            if (lang) {
              return (
                <pre className="bg-[#1a1a1a] rounded-lg p-4 overflow-auto my-3 border border-[#2a2a2a]">
                  <code className="text-xs text-[#d4d4d4] font-mono">
                    {codeStr}
                  </code>
                </pre>
              );
            }

            return (
              <code className="bg-[#2a2a2a] text-[#ce9178] px-1.5 py-0.5 rounded text-xs">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ===================== Code View ===================== */

function CodeView({
  content,
  filePath,
}: {
  content: string;
  filePath: string;
}) {
  const lines = content.split("\n");

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex min-h-full">
        <div className="sticky left-0 flex flex-col items-end py-4 px-3 bg-[#0a0a0a] text-[#444444] select-none shrink-0">
          {lines.map((_, idx) => (
            <div key={idx} className="leading-6 text-right text-xs">
              {idx + 1}
            </div>
          ))}
        </div>
        <div className="flex-1 py-4 px-4 bg-[#0a0a0a]">
          {lines.map((line, idx) => (
            <div key={idx} className="leading-6">
              {renderLine(line, filePath)}
              {idx === lines.length - 1 && <CursorCaret />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderLine(line: string, filePath: string) {
  const isMd = filePath.endsWith(".md");
  const isCss = filePath.endsWith(".css");

  if (!line.trim()) {
    return <span className="text-transparent">.</span>;
  }

  if (isMd) {
    if (line.startsWith("# "))
      return (
        <span className="text-[#569cd6] font-semibold text-lg">{line}</span>
      );
    if (line.startsWith("## "))
      return <span className="text-[#4ec9b0] font-medium">{line}</span>;
    if (line.startsWith("### "))
      return <span className="text-[#dcdcaa]">{line}</span>;
    if (line.startsWith("- ") || line.startsWith("* "))
      return <span className="text-[#ce9178]">{line}</span>;
    if (line.includes("**"))
      return <span className="text-[#c586c0]">{line}</span>;
    if (line.includes("`"))
      return <span className="text-[#d7ba7d]">{line}</span>;
  }

  if (isCss) {
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
    if (
      line.trim().startsWith("/*") ||
      line.trim().startsWith("*") ||
      line.trim().startsWith("*/")
    )
      return <span className="text-[#6a9955]">{line}</span>;
    if (
      line.trim().startsWith(".") ||
      line.trim().endsWith("{") ||
      line.trim() === "}"
    )
      return <span className="text-[#d7ba7d]">{line}</span>;
  }

  return <span className="text-[#d4d4d4]">{line}</span>;
}
