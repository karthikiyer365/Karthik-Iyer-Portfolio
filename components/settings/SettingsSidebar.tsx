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
    <div className="w-64 shrink-0 bg-[#171717] border-r border-[#1f1f1f] overflow-y-auto px-3 py-3 flex flex-col gap-2">
      {/* profile */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded bg-[#2a1c27] border border-[#5a3a52] flex items-center justify-center text-[#e6a9d6] text-sm font-medium">
          K
        </div>
        <div className="leading-tight">
          <div className="text-[13px] text-[#e5e5e5] truncate max-w-[180px]">
            karthikiyer365@gmail.com
          </div>
          <div className="text-[11px] text-[#777]">Portfolio</div>
        </div>
      </div>

      {/* search (decorative) */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#202020] text-[#666] text-[12px]">
        <Search className="w-3.5 h-3.5" />
        Search settings ⌘F
      </div>

      {/* disabled top group */}
      <div className="mt-1 rounded bg-[#202020] opacity-50 select-none">
        {DISABLED_TOP.map((label) => (
          <div key={label} className="px-3 py-1.5 text-[13px] text-[#777]">
            {label}
          </div>
        ))}
      </div>

      {/* portfolio group */}
      <div className="px-2 pt-2 pb-1 text-[11px] tracking-wide text-[#777]">
        Portfolio
      </div>
      {NAV.map((n) => {
        const active = activeSubsection === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setActiveSubsection(n.id)}
            className={`text-left px-3 py-2 rounded text-[13px] text-[#e5e5e5] border ${
              active
                ? "bg-[#2a2a2a] border-[#333] border-l-2 border-l-[#c586c0]"
                : "border-transparent border-l-2 border-l-transparent hover:bg-[#1f1f1f]"
            }`}
          >
            {n.label}
          </button>
        );
      })}

      {/* more group (disabled) */}
      <div className="px-2 pt-2 pb-1 text-[11px] tracking-wide text-[#777]">
        More
      </div>
      <div className="rounded bg-[#202020] opacity-50 select-none">
        {DISABLED_MORE.map((label) => (
          <div
            key={label}
            className="px-3 py-1.5 text-[13px] text-[#777] flex items-center justify-between"
          >
            {label}
            {label === "Docs" && <span>↗</span>}
          </div>
        ))}
      </div>

      {/* résumé download (decorative, pink) */}
      <button
        type="button"
        className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded bg-[#2a1c27] hover:bg-[#34232f] border border-[#5a3a52] text-[13px] text-[#e6a9d6] text-left transition-colors"
      >
        <Download className="w-4 h-4 text-[#c586c0]" />
        Download résumé (PDF)
      </button>
    </div>
  );
}
