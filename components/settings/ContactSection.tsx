// components/settings/ContactSection.tsx
"use client";

import { useState } from "react";
import { CONTACT_DATA, type ContactTab } from "@/lib/settings";
import {
  SurfaceCard,
  SettingRow,
  SectionHeader,
  SegmentedTabs,
  SettingsToggle,
} from "./primitives";

const TABS: { id: ContactTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "primary", label: "Primary" },
  { id: "social", label: "Social" },
];

export default function ContactSection() {
  const [tab, setTab] = useState<ContactTab>("all");
  const [isPublic, setIsPublic] = useState(true);

  const channels = CONTACT_DATA.filter(
    (c) => c.tabs.includes(tab) && (isPublic || !c.private)
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#e5e5e5]">Contact</h1>
      <p className="text-[#888] text-sm mt-1 mb-5">
        How to reach me and where to find my work.
      </p>

      <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />

      <SettingsToggle
        title="Make contact details public"
        description="Show email and phone on the live portfolio."
        on={isPublic}
        onToggle={() => setIsPublic((v) => !v)}
      />

      <SectionHeader title="Channels" />

      <SurfaceCard>
        {channels.length === 0 ? (
          <SettingRow>
            <span className="text-[13px] text-[#666]">Nothing here yet.</span>
          </SettingRow>
        ) : (
          channels.map((c) => (
            <SettingRow key={c.label}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[15px] text-[#e5e5e5]">
                  {c.label}
                  {c.badge && (
                    <span className="ml-2 text-[10px] text-[#dd0077] align-middle">
                      {c.badge}
                    </span>
                  )}
                </span>
                <span className="text-right">
                  {c.href ? (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#4ec9b0] text-[14px] hover:underline"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <span className="text-[#4ec9b0] text-[14px]">{c.value}</span>
                  )}
                  {c.subtext && (
                    <span className="block text-[#888] text-[12px]">
                      {c.subtext}
                    </span>
                  )}
                </span>
              </div>
            </SettingRow>
          ))
        )}
      </SurfaceCard>
    </div>
  );
}
