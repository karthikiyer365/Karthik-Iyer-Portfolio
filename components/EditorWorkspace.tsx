"use client";

import { useState } from "react";
import { useEditor, useContent, useSettings } from "@/app/providers";
import { SETTINGS_PATH, SETTINGS_LABEL } from "@/lib/settings";
import EditorTabs from "./EditorTabs";
import SettingsView from "./settings/SettingsView";
import CursorCaret from "./CursorCaret";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "./MermaidDiagram";
import CareerTimeline from "./CareerTimeline";
import NotebookRenderer from "./NotebookRenderer";
import { Mail, Phone, Link } from "lucide-react";

type ViewMode = "code" | "preview";

export default function EditorWorkspace() {
  const { state } = useEditor();
  const { getContent } = useContent();
  const { activeFile, openFiles } = state;
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  if (openFiles.length === 0 || !activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-1 text-ink-muted">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-line-subtle"
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
          <p className="text-body mb-1">Select a file to open</p>
          <p className="text-meta text-ink-faint">or explore the file tree</p>
        </div>
      </div>
    );
  }

  if (activeFile === SETTINGS_PATH) {
    return (
      <div className="flex-1 flex flex-col bg-bg overflow-hidden">
        <EditorTabs />
        <SettingsView />
      </div>
    );
  }

  const content = getContent(activeFile);
  const isMd = activeFile.endsWith(".md");
  const isNotebook = activeFile.endsWith(".ipynb");
  const hasPreview = isMd || isNotebook;

  return (
    <div className="flex-1 flex flex-col bg-bg overflow-hidden">
      <EditorTabs />

      {/* Breadcrumb + view toggle */}
      <div className="flex items-center justify-between h-7 px-4 bg-bg shrink-0">
        <div className="flex items-center font-mono text-meta text-ink-muted">
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
                  className={idx === arr.length - 1 ? "text-ink-secondary" : ""}
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
            className="font-mono text-[10px] px-2 py-0.5 rounded bg-line text-ink-secondary hover:text-ink transition-colors"
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
  const { openFile } = useEditor();
  const { setActiveSubsection } = useSettings();
  const navigateToContact = () => {
    setActiveSubsection("contact");
    openFile(SETTINGS_PATH, SETTINGS_LABEL);
  };
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[760px] px-8 py-7">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-[19px] font-semibold text-ink mb-3 mt-1 border-b border-line-subtle pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-[15px] font-semibold text-accent-teal mb-2 mt-6">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-body font-semibold text-ink mb-1.5 mt-4">
                {children}
              </h3>
            ),
            h4: ({ children }) => {
              const iconMap: Record<string, React.ReactNode> = {
                ":mail:": <button type="button" onClick={navigateToContact} className="inline cursor-pointer hover:text-accent-teal transition-colors"><Mail className="inline h-3.5 w-3.5 -mt-0.5" /></button>,
                ":phone:": <button type="button" onClick={navigateToContact} className="inline cursor-pointer hover:text-accent-teal transition-colors"><Phone className="inline h-3.5 w-3.5 -mt-0.5" /></button>,
                ":link:": <button type="button" onClick={navigateToContact} className="inline cursor-pointer hover:text-accent-teal transition-colors"><Link className="inline h-3.5 w-3.5 -mt-0.5" /></button>,
              };
              const replaceTokens = (node: React.ReactNode): React.ReactNode => {
                if (typeof node === "string") {
                  const parts: React.ReactNode[] = [];
                  let remaining = node;
                  let key = 0;
                  while (remaining.length > 0) {
                    let earliest = -1;
                    let match = "";
                    for (const token of Object.keys(iconMap)) {
                      const idx = remaining.indexOf(token);
                      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
                        earliest = idx;
                        match = token;
                      }
                    }
                    if (earliest === -1) {
                      parts.push(remaining);
                      break;
                    }
                    if (earliest > 0) parts.push(remaining.slice(0, earliest));
                    parts.push(<span key={key++}>{iconMap[match]}</span>);
                    remaining = remaining.slice(earliest + match.length);
                  }
                  return parts.length === 1 ? parts[0] : <>{parts}</>;
                }
                if (Array.isArray(node)) return node.map((n, i) => <span key={i}>{replaceTokens(n)}</span>);
                if (node && typeof node === "object" && "props" in node) {
                  const el = node as React.ReactElement<{ children?: React.ReactNode }>;
                  return { ...el, props: { ...el.props, children: replaceTokens(el.props.children) } };
                }
                return node;
              };
              return (
                <h4 className="text-desc text-ink-secondary mb-3">
                  {replaceTokens(children)}
                </h4>
              );
            },
            p: ({ children }) => (
              <p className="text-body text-ink-body leading-relaxed mb-2.5">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 mb-2.5 text-body text-ink-body space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 mb-2.5 text-body text-ink-body space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-accent-teal pl-4 my-3 text-ink-secondary">
                {children}
              </blockquote>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                className="text-accent-teal hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="overflow-auto my-3">
                <table className="border-collapse text-desc w-full">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-line-strong bg-surface-raised px-3 py-1.5 text-left text-ink font-medium">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-line-strong px-3 py-1.5 text-ink-body">
                {children}
              </td>
            ),
            hr: () => <hr className="border-line-subtle my-6" />,
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

              if (lang === "timeline") {
                return <CareerTimeline data={codeStr} />;
              }

              if (lang) {
                return (
                  <pre className="bg-surface-raised rounded-lg p-4 overflow-auto my-3 border border-line">
                    <code className="text-code text-ink-body font-mono">
                      {codeStr}
                    </code>
                  </pre>
                );
              }

              return (
                <code className="bg-surface-raised text-[#ce9178] px-1.5 py-0.5 rounded text-[11px] font-mono">
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
    <div className="flex-1 overflow-auto font-mono text-code">
      <div className="flex min-h-full">
        <div className="sticky left-0 flex flex-col items-end py-4 px-3 bg-bg text-ink-faint select-none shrink-0">
          {lines.map((_, idx) => (
            <div key={idx} className="leading-6 text-right text-[11px]">
              {idx + 1}
            </div>
          ))}
        </div>
        <div className="flex-1 py-4 px-4 bg-bg">
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
          <span className="text-ink-muted">:</span>
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

  return <span className="text-ink-body">{line}</span>;
}
