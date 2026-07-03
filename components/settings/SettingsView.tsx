// components/settings/SettingsView.tsx
"use client";

import { Download } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import SettingsContent from "./SettingsContent";
import { useSettings } from "@/app/providers";
import type { Subsection } from "@/lib/settings";

const MOBILE_NAV: { id: Subsection; label: string }[] = [
  { id: "tools", label: "Tools & TechStack" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

export default function SettingsView() {
  const { activeSubsection, setActiveSubsection } = useSettings();

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Desktop: full IDE settings sidebar. Hidden on mobile. */}
      <SettingsSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile: compact header + horizontal section tabs (desktop uses sidebar). */}
        <div className="md:hidden shrink-0 border-b border-line-subtle">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src="/img.png"
                alt="Karthik Iyer"
                className="w-7 h-7 rounded bg-ink object-cover shrink-0"
              />
              <div className="leading-tight min-w-0">
                <div className="text-desc text-ink truncate">
                  karthikiyer365@gmail.com
                </div>
                <div className="text-meta text-ink-muted">Portfolio · Settings</div>
              </div>
            </div>
            <a
              href="/Karthik-Iyer-Resume.pdf"
              download="Karthik Iyer - Resume.pdf"
              className="shrink-0 flex items-center gap-1.5 rounded border border-accent-pink px-2.5 py-1 text-meta text-accent-pink hover:bg-accent-pink/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </a>
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 pb-2">
            {MOBILE_NAV.map((n) => {
              const active = activeSubsection === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setActiveSubsection(n.id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-desc transition-colors ${
                    active
                      ? "border-accent-pink bg-accent-pink/15 text-accent-pink"
                      : "border-line text-ink-muted"
                  }`}
                >
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>

        <SettingsContent />
      </div>
    </div>
  );
}
