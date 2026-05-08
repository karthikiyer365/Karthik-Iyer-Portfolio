"use client";

import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "./MermaidDiagram";

/* ===================== ipynb types ===================== */

interface NotebookCell {
  cell_type: "markdown" | "code" | "raw";
  source: string | string[];
  metadata?: Record<string, unknown>;
  execution_count?: number | null;
  outputs?: CellOutput[];
}

interface StreamOutput {
  output_type: "stream";
  name?: string;
  text: string | string[];
}

interface DataOutput {
  output_type: "execute_result" | "display_data";
  data?: Record<string, unknown>;
  execution_count?: number | null;
}

interface ErrorOutput {
  output_type: "error";
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

type CellOutput = StreamOutput | DataOutput | ErrorOutput;

interface Notebook {
  cells: NotebookCell[];
  metadata?: Record<string, unknown>;
  nbformat?: number;
}

/* ===================== helpers ===================== */

function joinSource(source: string | string[]): string {
  return Array.isArray(source) ? source.join("") : source;
}

function stripAnsi(str: string): string {
  return str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b]\[[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}

/* ===================== component ===================== */

export default function NotebookRenderer({ content }: { content: string }) {
  let notebook: Notebook;
  try {
    notebook = JSON.parse(content) as Notebook;
  } catch {
    return (
      <div className="flex-1 overflow-auto px-8 py-6 text-red-400 text-sm font-mono">
        Failed to parse notebook JSON.
      </div>
    );
  }

  if (!notebook.cells?.length) {
    return (
      <div className="flex-1 overflow-auto px-8 py-6 text-[#666] text-sm">
        Empty notebook.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-6 py-4 space-y-1">
      {notebook.cells.map((cell, idx) => (
        <CellBlock key={idx} cell={cell} />
      ))}
    </div>
  );
}

/* ===================== Cell Block ===================== */

function CellBlock({ cell }: { cell: NotebookCell }) {
  if (cell.cell_type === "markdown") {
    return <MarkdownCell source={joinSource(cell.source)} />;
  }

  if (cell.cell_type === "code") {
    return (
      <CodeCell
        source={joinSource(cell.source)}
        executionCount={cell.execution_count ?? null}
        outputs={cell.outputs ?? []}
      />
    );
  }

  // raw cell
  return (
    <div className="px-4 py-2 text-xs text-[#888] font-mono whitespace-pre-wrap bg-[#111] rounded border border-[#1f1f1f]">
      {joinSource(cell.source)}
    </div>
  );
}

/* ===================== Markdown Cell ===================== */

function MarkdownCell({ source }: { source: string }) {
  return (
    <div className="px-4 py-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

/* ===================== Code Cell ===================== */

function CodeCell({
  source,
  executionCount,
  outputs,
}: {
  source: string;
  executionCount: number | null;
  outputs: CellOutput[];
}) {
  const label =
    executionCount != null ? `[${executionCount}]:` : "[ ]:";

  return (
    <div className="rounded-lg border border-[#2a2a2a] overflow-hidden">
      {/* Input */}
      <div className="flex bg-[#1a1a1a]">
        <div className="flex items-start shrink-0 w-14 pt-2.5 pr-1 text-right">
          <span className="w-full text-[10px] font-mono text-[#4e7aab]">
            {label}
          </span>
        </div>
        <pre className="flex-1 py-2.5 pr-4 overflow-x-auto text-xs font-mono leading-5 text-[#d4d4d4]">
          {colorizePython(source)}
        </pre>
      </div>

      {/* Outputs */}
      {outputs.length > 0 && (
        <div className="border-t border-[#2a2a2a] bg-[#111]">
          {outputs.map((out, i) => (
            <OutputBlock key={i} output={out} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== Output Block ===================== */

function OutputBlock({ output }: { output: CellOutput }) {
  if (output.output_type === "stream") {
    const text = joinSource(output.text);
    return (
      <div className="flex">
        <div className="shrink-0 w-14" />
        <pre className="flex-1 py-2 pr-4 text-xs font-mono text-[#ccc] whitespace-pre-wrap overflow-x-auto">
          {text}
        </pre>
      </div>
    );
  }

  if (output.output_type === "error") {
    const tb = (output.traceback ?? []).map(stripAnsi).join("\n");
    return (
      <div className="flex">
        <div className="shrink-0 w-14" />
        <pre className="flex-1 py-2 pr-4 text-xs font-mono text-[#f44747] whitespace-pre-wrap overflow-x-auto">
          {output.ename}: {output.evalue}
          {tb && `\n${tb}`}
        </pre>
      </div>
    );
  }

  // execute_result or display_data
  const data = output.data ?? {};

  // Image
  const imgPng = data["image/png"];
  const imgJpg = data["image/jpeg"];
  const imgSvg = data["image/svg+xml"];

  if (typeof imgPng === "string") {
    return (
      <div className="flex">
        <div className="shrink-0 w-14" />
        <div className="py-2 pr-4">
          <img
            src={`data:image/png;base64,${imgPng}`}
            alt="output"
            className="max-w-full rounded"
          />
        </div>
      </div>
    );
  }

  if (typeof imgJpg === "string") {
    return (
      <div className="flex">
        <div className="shrink-0 w-14" />
        <div className="py-2 pr-4">
          <img
            src={`data:image/jpeg;base64,${imgJpg}`}
            alt="output"
            className="max-w-full rounded"
          />
        </div>
      </div>
    );
  }

  if (typeof imgSvg === "string" || Array.isArray(imgSvg)) {
    const svgStr = Array.isArray(imgSvg) ? imgSvg.join("") : imgSvg;
    return (
      <div className="flex">
        <div className="shrink-0 w-14" />
        <div
          className="py-2 pr-4 overflow-auto"
          dangerouslySetInnerHTML={{ __html: svgStr }}
        />
      </div>
    );
  }

  // HTML output
  const html = data["text/html"];
  if (html) {
    const htmlStr = Array.isArray(html) ? html.join("") : String(html);
    const hasScript = /<script[\s>]/i.test(htmlStr);

    if (hasScript) {
      return (
        <div className="flex">
          <div className="shrink-0 w-14" />
          <div className="flex-1 py-2 pr-4">
            <HtmlIframe html={htmlStr} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex">
        <div className="shrink-0 w-14" />
        <div
          className="flex-1 py-2 pr-4 text-xs overflow-auto notebook-html-output"
          dangerouslySetInnerHTML={{ __html: htmlStr }}
        />
      </div>
    );
  }

  // text/plain fallback
  const plain = data["text/plain"];
  if (plain) {
    const text = Array.isArray(plain) ? plain.join("") : String(plain);
    return (
      <div className="flex">
        <div className="shrink-0 w-14" />
        <pre className="flex-1 py-2 pr-4 text-xs font-mono text-[#ccc] whitespace-pre-wrap overflow-x-auto">
          {text}
        </pre>
      </div>
    );
  }

  return null;
}

/* ===================== HTML Iframe (for plotly etc.) ===================== */

function HtmlIframe({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(400);

  const srcdoc = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<style>
  body { margin: 0; padding: 0; background: #111; overflow: hidden; }
  .plotly-graph-div { width: 100% !important; }
</style>
</head><body>${html}
<script>
  function notifyHeight() {
    var h = document.body.scrollHeight || document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'iframe-height', height: h }, '*');
  }
  window.addEventListener('load', function() { setTimeout(notifyHeight, 500); });
  new MutationObserver(notifyHeight).observe(document.body, { childList: true, subtree: true });
</script>
</body></html>`;

  useEffect(() => {
    function handleMsg(e: MessageEvent) {
      if (e.data?.type === "iframe-height" && typeof e.data.height === "number") {
        setHeight(Math.min(e.data.height + 16, 900));
      }
    }
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      sandbox="allow-scripts"
      className="w-full border-0 rounded bg-[#111]"
      style={{ height: `${height}px` }}
      title="notebook output"
    />
  );
}

/* ===================== Python syntax coloring ===================== */

const PY_KEYWORDS = new Set([
  "import",
  "from",
  "as",
  "def",
  "class",
  "return",
  "if",
  "elif",
  "else",
  "for",
  "while",
  "in",
  "not",
  "and",
  "or",
  "is",
  "with",
  "try",
  "except",
  "finally",
  "raise",
  "pass",
  "break",
  "continue",
  "yield",
  "lambda",
  "global",
  "nonlocal",
  "assert",
  "del",
  "True",
  "False",
  "None",
  "async",
  "await",
]);

function colorizePython(code: string): React.ReactNode[] {
  return code.split("\n").map((line, lineIdx, arr) => (
    <span key={lineIdx}>
      {colorizeLine(line)}
      {lineIdx < arr.length - 1 && "\n"}
    </span>
  ));
}

function colorizeLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  // leading whitespace
  const leadingMatch = line.match(/^(\s+)/);
  if (leadingMatch) {
    nodes.push(leadingMatch[0]);
    i = leadingMatch[0].length;
  }

  // comment
  if (line.trimStart().startsWith("#")) {
    nodes.push(
      <span key="cmt" className="text-[#6a9955]">
        {line.slice(i)}
      </span>
    );
    return nodes;
  }

  // tokenize rest
  const rest = line.slice(i);
  const tokenRe =
    /(\b\d+\.?\d*\b)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([a-zA-Z_]\w*)|([^\w\s]+|\s+)/g;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenRe.exec(rest)) !== null) {
    const [token] = match;
    const isNum = match[1] !== undefined;
    const isStr = match[2] !== undefined;
    const isIdent = match[3] !== undefined;

    if (isNum) {
      nodes.push(
        <span key={key++} className="text-[#b5cea8]">
          {token}
        </span>
      );
    } else if (isStr) {
      nodes.push(
        <span key={key++} className="text-[#ce9178]">
          {token}
        </span>
      );
    } else if (isIdent && PY_KEYWORDS.has(token)) {
      nodes.push(
        <span key={key++} className="text-[#569cd6]">
          {token}
        </span>
      );
    } else if (isIdent) {
      nodes.push(
        <span key={key++} className="text-[#d4d4d4]">
          {token}
        </span>
      );
    } else {
      nodes.push(
        <span key={key++} className="text-[#d4d4d4]">
          {token}
        </span>
      );
    }
  }

  return nodes;
}

/* ===================== Shared markdown components ===================== */

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-bold text-[#e5e5e5] mb-4 mt-2 border-b border-[#2a2a2a] pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-semibold text-[#4ec9b0] mb-3 mt-6">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-medium text-[#dcdcaa] mb-2 mt-4">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-[#d4d4d4] leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 mb-3 text-sm text-[#d4d4d4] space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 mb-3 text-sm text-[#d4d4d4] space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-[#4ec9b0] pl-4 my-3 text-[#999]">
      {children}
    </blockquote>
  ),
  a: ({
    children,
    href,
  }: {
    children?: React.ReactNode;
    href?: string;
  }) => (
    <a
      href={href}
      className="text-[#569cd6] underline hover:text-[#7cb8f0]"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-auto my-3">
      <table className="border-collapse text-sm w-full">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-left text-[#e5e5e5]">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-[#333] px-3 py-1.5 text-[#d4d4d4]">
      {children}
    </td>
  ),
  hr: () => <hr className="border-[#2a2a2a] my-6" />,
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="max-w-full rounded-lg my-4"
    />
  ),
  code: ({
    className,
    children,
  }: {
    className?: string;
    children?: React.ReactNode;
  }) => {
    const match = /language-(\w+)/.exec(className || "");
    const lang = match ? match[1] : "";
    const codeStr = String(children).replace(/\n$/, "");

    if (lang === "mermaid") {
      return <MermaidDiagram chart={codeStr} />;
    }

    if (lang) {
      return (
        <pre className="bg-[#1a1a1a] rounded-lg p-4 overflow-auto my-3 border border-[#2a2a2a]">
          <code className="text-xs text-[#d4d4d4] font-mono">{codeStr}</code>
        </pre>
      );
    }

    return (
      <code className="bg-[#2a2a2a] text-[#ce9178] px-1.5 py-0.5 rounded text-xs">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
};
