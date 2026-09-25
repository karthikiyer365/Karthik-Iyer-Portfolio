"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, type Theme } from "@/app/providers";

let mermaidPromise: Promise<typeof import("mermaid")> | null = null;
function getMermaid() {
  if (!mermaidPromise) mermaidPromise = import("mermaid");
  return mermaidPromise;
}

const MERMAID_THEME: Record<Theme, Parameters<typeof import("mermaid").default.initialize>[0]> = {
  light: { startOnLoad: false, theme: "default" },
  dark: {
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
  },
};

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    getMermaid()
      .then(async (mod) => {
        if (cancelled) return;
        mod.default.initialize(MERMAID_THEME[theme]);
        const { svg: rendered } = await mod.default.render(id, chart);
        if (!cancelled) setSvg(rendered);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [chart, theme]);

  if (error) {
    return (
      <pre className="text-danger text-xs bg-surface-raised p-3 rounded overflow-auto">
        {error}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="text-ink-muted text-xs p-3">Rendering diagram...</div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 overflow-x-auto [&>svg]:mx-auto [&>svg]:block"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
