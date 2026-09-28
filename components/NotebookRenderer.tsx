"use client";

import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "./MermaidDiagram";
import { useEditor, useTheme } from "@/app/providers";

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

export default function NotebookRenderer({
  content,
  githubUrl,
}: {
  content: string;
  githubUrl?: string;
}) {
  let notebook: Notebook;
  try {
    notebook = JSON.parse(content) as Notebook;
  } catch {
    return (
      <div className="flex-1 overflow-auto px-8 py-6 text-danger text-sm font-mono">
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

  // Repo link renders next to the title, which lives in the first markdown cell.
  const titleCellIdx = notebook.cells.findIndex((c) => c.cell_type === "markdown");

  return (
    <div className="flex-1 overflow-auto px-6 py-4 space-y-1">
      {notebook.cells.map((cell, idx) => (
        <CellBlock
          key={idx}
          cell={cell}
          githubUrl={idx === titleCellIdx ? githubUrl : undefined}
        />
      ))}
    </div>
  );
}

/* ===================== Cell Block ===================== */

function CellBlock({
  cell,
  githubUrl,
}: {
  cell: NotebookCell;
  githubUrl?: string;
}) {
  if (cell.cell_type === "markdown") {
    return <MarkdownCell source={joinSource(cell.source)} githubUrl={githubUrl} />;
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

function MarkdownCell({
  source,
  githubUrl,
}: {
  source: string;
  githubUrl?: string;
}) {
  const { openFile } = useEditor();
  const components = {
    ...markdownComponents,
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="flex items-center gap-3 text-[19px] font-semibold text-ink mb-3 mt-1 border-b border-line-subtle pb-2">
        <span>{children}</span>
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] font-normal px-2 py-0.5 rounded bg-accent-pink/10 text-accent-pink hover:bg-accent-pink/20 transition-colors shrink-0"
          >
            {githubUrl.includes("github.com") ? "View on GitHub" : "Go Live!!"}
          </a>
        )}
      </h1>
    ),
    a: ({ children, href }: { children?: React.ReactNode; href?: string }) => {
      if (href?.startsWith("portfolio/")) {
        const filePath = decodeURIComponent(href);
        const displayName = filePath.split("/").pop()?.replace(/\.ipynb$/, "") ?? filePath;
        return (
          <button
            type="button"
            onClick={() => openFile(filePath, displayName)}
            className="text-ink font-semibold hover:text-accent-teal transition-colors cursor-pointer"
          >
            {children}
          </button>
        );
      }
      return (
        <a href={href} className="text-accent-teal hover:underline" target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    },
  };
  return (
    <div className="px-4 py-3">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
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
    <div className="my-4">
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
        <div className="my-4">
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

/*
 * Notebook outputs have a dark theme baked in (plotly_dark template, D3 inline
 * styles). In the light theme we restyle them at runtime instead of editing the
 * .ipynb files. Dark theme renders the outputs untouched.
 */
const LIGHT_CHART_CSS = `
  body { background: #fff !important; }
  [style*="background:#111"] { background: #fff !important; }
  [style*="color:#e5e5e5"] { color: #1a1a1a !important; }
  [style*="color:#8a8a8a"], [style*="color:#9a9a9a"] { color: #6b6b6b !important; }
  #net-tip { background: #fff !important; border-color: #e0e0e0 !important; color: #1a1a1a !important; box-shadow: 0 4px 16px rgba(0,0,0,.12) !important; }
  #net-svg text[fill="#cfcfcf"] { fill: #2e2e2e; }
  text[fill="#ededed"] { fill: #1a1a1a; }
  #net-svg text[fill="#777"] { fill: #6b6b6b; }
  #net-svg circle[stroke="#111"] { stroke: #fff; }
`;

const LIGHT_CHART_SCRIPT = `
(function () {
  var TEXT = { "#4ec9b0": "#0b7c66", "#88c0b4": "#3d8f7f", "#bfbfbf": "#5c5c5c", "#b8b8b8": "#5c5c5c", "#cfcfcf": "#5c5c5c", "#e5e5e5": "#1a1a1a" };
  var TEAL_SCALE = [[0, "#f4f4f4"], [0.3, "#bfe9df"], [0.65, "#4ec9b0"], [1, "#0b7c66"]];
  var AXIS = { gridcolor: "rgba(0,0,0,0.08)", linecolor: "rgba(0,0,0,0.12)", zerolinecolor: "rgba(0,0,0,0.12)", "tickfont.color": "#6b6b6b" };
  function mapText(c) { return (c && TEXT[String(c).toLowerCase()]) || c; }
  function isTealScale(cs) { return Array.isArray(cs) && cs.length && String(cs[cs.length - 1][1]).toLowerCase() === "#4ec9b0"; }
  function setAxis(u, prefix) { for (var k in AXIS) u[prefix + "." + k] = AXIS[k]; }

  function lighten(gd) {
    if (gd.dataset.light) return;
    gd.dataset.light = "1";
    var L = gd.layout || {};
    var u = {
      paper_bgcolor: "#fff", plot_bgcolor: "#fff",
      "font.color": "#5c5c5c", "title.font.color": "#1a1a1a", "legend.font.color": "#5c5c5c",
      "hoverlabel.bgcolor": "#fff", "hoverlabel.font.color": "#1a1a1a"
    };
    Object.keys(L).forEach(function (k) {
      if (/^[xy]axis\\d*$/.test(k)) { setAxis(u, k); u[k + ".title.font.color"] = "#5c5c5c"; }
      if (/^polar\\d*$/.test(k)) { u[k + ".bgcolor"] = "#fff"; setAxis(u, k + ".radialaxis"); setAxis(u, k + ".angularaxis"); }
    });
    (L.annotations || []).forEach(function (a, i) {
      if (a.font && a.font.color) u["annotations[" + i + "].font.color"] = mapText(a.font.color);
    });
    Plotly.relayout(gd, u);
    (gd.data || []).forEach(function (t, i) {
      var r = {};
      if (t.type === "heatmap" && isTealScale(t.colorscale)) r.colorscale = [TEAL_SCALE];
      if (t.textfont && t.textfont.color) r["textfont.color"] = [mapText(t.textfont.color)];
      if (Object.keys(r).length) Plotly.restyle(gd, r, [i]);
    });
  }

  function scan() {
    if (!window.Plotly) return;
    document.querySelectorAll(".js-plotly-plot").forEach(function (gd) { if (gd._fullLayout) lighten(gd); });
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("load", function () { scan(); setTimeout(scan, 300); setTimeout(scan, 1000); });
})();
`;

function HtmlIframe({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(400);
  const { theme } = useTheme();
  const light = theme === "light";

  const srcdoc = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<style>
  body { margin: 0; padding: 0; background: #111; overflow: hidden; }
  .plotly-graph-div { width: 100% !important; }
  ${light ? LIGHT_CHART_CSS : ""}
</style>
</head><body>${html}
${light ? `<script>${LIGHT_CHART_SCRIPT}</script>` : ""}
<script>
  var heightTimer;
  function notifyHeight() {
    var h = document.body.scrollHeight || document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'iframe-height', height: h }, '*');
  }
  function scheduleHeight() {
    clearTimeout(heightTimer);
    heightTimer = setTimeout(notifyHeight, 50);
  }
  window.addEventListener('load', function() { setTimeout(notifyHeight, 500); });
  window.addEventListener('resize', scheduleHeight);
  if (window.ResizeObserver) {
    new ResizeObserver(scheduleHeight).observe(document.body);
  }
  new MutationObserver(scheduleHeight).observe(document.body, { childList: true, subtree: true });
</script>
</body></html>`;

  useEffect(() => {
    function handleMsg(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;

      if (e.data?.type === "iframe-height" && typeof e.data.height === "number") {
        setHeight(Math.min(e.data.height + 24, 1200));
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
      <code className="bg-surface-raised text-syn-string px-1.5 py-0.5 rounded text-[11px] font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
};
