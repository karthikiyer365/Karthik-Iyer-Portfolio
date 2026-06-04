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
      <div className="flex-1 overflow-auto px-8 py-6 text-ink-muted text-body">
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
    return <CodeCell outputs={cell.outputs ?? []} />;
  }

  // raw cell
  return (
    <div className="px-4 py-2 text-xs text-ink-secondary font-mono whitespace-pre-wrap bg-bg rounded border border-line-subtle">
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

function CodeCell({ outputs }: { outputs: CellOutput[] }) {
  // Code input is intentionally hidden — only rendered outputs (charts,
  // tables, images) are shown. Cells with no rich output render nothing.
  if (!outputs || outputs.length === 0) return null;
  return (
    <div className="my-3">
      {outputs.map((out, i) => (
        <OutputBlock key={i} output={out} />
      ))}
    </div>
  );
}

/* ===================== Output Block ===================== */

function OutputBlock({ output }: { output: CellOutput }) {
  // Bare-text outputs (stdout, plain reprs, tracebacks) are suppressed —
  // only rich visuals (images, SVG, HTML tables, embedded charts) render.
  if (output.output_type === "stream" || output.output_type === "error") {
    return null;
  }

  // execute_result or display_data
  const data = output.data ?? {};

  // Image
  const imgPng = data["image/png"];
  const imgJpg = data["image/jpeg"];
  const imgSvg = data["image/svg+xml"];

  if (typeof imgPng === "string") {
    return (
      <div className="my-2">
        <img
          src={`data:image/png;base64,${imgPng}`}
          alt="output"
          className="max-w-full rounded"
        />
      </div>
    );
  }

  if (typeof imgJpg === "string") {
    return (
      <div className="my-2">
        <img
          src={`data:image/jpeg;base64,${imgJpg}`}
          alt="output"
          className="max-w-full rounded"
        />
      </div>
    );
  }

  if (typeof imgSvg === "string" || Array.isArray(imgSvg)) {
    const svgStr = Array.isArray(imgSvg) ? imgSvg.join("") : imgSvg;
    return (
      <div
        className="my-2 overflow-auto"
        dangerouslySetInnerHTML={{ __html: svgStr }}
      />
    );
  }

  // HTML output (Plotly charts run in an iframe; tables render inline)
  const html = data["text/html"];
  if (html) {
    const htmlStr = Array.isArray(html) ? html.join("") : String(html);
    if (/<script[\s>]/i.test(htmlStr)) {
      return (
        <div className="my-3">
          <HtmlIframe html={htmlStr} />
        </div>
      );
    }
    return (
      <div
        className="my-3 overflow-auto notebook-html-output"
        dangerouslySetInnerHTML={{ __html: htmlStr }}
      />
    );
  }

  // text/plain and everything else: suppressed
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
      className="w-full border-0 rounded bg-bg"
      style={{ height: `${height}px` }}
      title="notebook output"
    />
  );
}

/* ===================== Shared markdown components ===================== */

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-[19px] font-semibold text-ink mb-3 mt-1 border-b border-line-subtle pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-[15px] font-semibold text-accent-teal mb-2 mt-6">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-body font-semibold text-ink mb-1.5 mt-4">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-body text-ink-body leading-relaxed mb-2.5">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 mb-2.5 text-body text-ink-body space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 mb-2.5 text-body text-ink-body space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-accent-teal pl-4 my-3 text-ink-secondary">
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
      className="text-accent-teal hover:underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-auto my-3">
      <table className="border-collapse text-desc w-full">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-line-strong bg-surface-raised px-3 py-1.5 text-left text-ink font-medium">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-line-strong px-3 py-1.5 text-ink-body">
      {children}
    </td>
  ),
  hr: () => <hr className="border-line-subtle my-6" />,
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
        <pre className="bg-surface-raised rounded-lg p-4 overflow-auto my-3 border border-line">
          <code className="text-code text-ink-body font-mono">{codeStr}</code>
        </pre>
      );
    }

    return (
      <code className="bg-surface-raised text-[#ce9178] px-1.5 py-0.5 rounded text-[11px] font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
};
