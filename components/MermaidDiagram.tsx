"use client";

import { useEffect, useRef, useState } from "react";

let mermaidPromise: Promise<typeof import("mermaid")> | null = null;
function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          darkMode: true,
          background: "#0a0a0a",
          primaryColor: "#1e3a5f",
          primaryTextColor: "#e5e5e5",
          lineColor: "#444",
          secondaryColor: "#1a1a1a",
        },
      });
      return mod;
    });
  }
  return mermaidPromise;
}

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    getMermaid()
      .then(async (mod) => {
        if (cancelled) return;
        const { svg: rendered } = await mod.default.render(id, chart);
        if (!cancelled) setSvg(rendered);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre className="text-red-400 text-xs bg-[#1a1a1a] p-3 rounded overflow-auto">
        {error}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="text-[#666] text-xs p-3">Rendering diagram...</div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
