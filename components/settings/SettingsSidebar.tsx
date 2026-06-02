// components/settings/SettingsSidebar.tsx
"use client";

import { Search, Download } from "lucide-react";
import { useSettings } from "@/app/providers";
import type { Subsection } from "@/lib/settings";

const NAV: { id: Subsection; label: string }[] = [
  { id: "tools", label: "Tools & TechStack" },
  { id: "skills", label: "Skills & Techniques" },
  { id: "contact", label: "Contact info" },
];

const DISABLED_TOP = ["General", "Appearance"];
const DISABLED_MORE = ["Experience", "Education", "Projects", "Docs"];

export default function SettingsSidebar() {
  const { activeSubsection, setActiveSubsection } = useSettings();

  return (
    <div className="w-60 shrink-0 bg-surface-1 border-r border-line-subtle overflow-y-auto px-2.5 py-3 flex flex-col gap-1.5">
      {/* profile */}
      <div className="flex items-center gap-2 px-1">
        <img
          src="/img.png"
          alt="Karthik Iyer"
          className="w-7 h-7 rounded bg-ink object-cover shrink-0"
        />
        <div className="leading-tight min-w-0">
          <div className="text-desc text-ink truncate">
            karthikiyer365@gmail.com
          </div>
          <div className="text-meta text-ink-muted">Portfolio</div>
        </div>
      </div>

      {/* search (decorative) */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-titlebar text-ink-muted text-desc">
        <Search className="w-3.5 h-3.5" />
        Search settings ⌘F
      </div>

      {/* disabled top group */}
      <div className="mt-1 rounded bg-titlebar opacity-50 select-none">
        {DISABLED_TOP.map((label) => (
          <div key={label} className="px-3 py-1.5 text-desc text-ink-muted">
            {label}
          </div>
        ))}
      </div>

      {/* portfolio group */}
      <div className="px-2 pt-2 pb-0.5 text-meta tracking-wide text-ink-muted">
        Portfolio
      </div>
      {NAV.map((n) => {
        const active = activeSubsection === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setActiveSubsection(n.id)}
            className={`text-left px-3 py-1.5 rounded text-body text-ink border-l-2 ${
              active
                ? "bg-line border-l-accent-pink"
                : "border-l-transparent hover:bg-surface-2"
            }`}
          >
            {n.label}
          </button>
        );
      })}

      {/* more group (disabled) */}
      <div className="px-2 pt-2 pb-0.5 text-meta tracking-wide text-ink-muted">
        More
      </div>
      <div className="rounded bg-titlebar opacity-50 select-none">
        {DISABLED_MORE.map((label) => (
          <div
            key={label}
            className="px-3 py-1.5 text-desc text-ink-muted flex items-center justify-between"
          >
            {label}
            {label === "Docs" && <span>↗</span>}
          </div>
        ))}
      </div>

      {/* résumé download (decorative, pink) */}
      <button
        type="button"
        className="mt-2 flex items-center gap-2 px-3 py-2 rounded border border-accent-pink bg-transparent hover:bg-accent-pink/30 active:bg-accent-pink/40 text-body text-ink text-left transition-colors"
      >
        <Download className="w-4 h-4 text-accent-pink" />
        Download résumé (PDF)
      </button>
    </div>
  );
}
