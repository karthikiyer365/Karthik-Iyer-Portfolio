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
  { id: "work", label: "Work" },
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
      <h1 className="text-[18px] font-semibold text-ink">Contact</h1>
      <p className="text-desc text-ink-secondary mt-1 mb-4">
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
            <span className="text-desc text-ink-muted">Nothing here yet.</span>
          </SettingRow>
        ) : (
          channels.map((c) => (
            <SettingRow key={c.label}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-body font-medium text-ink">
                  {c.label}
                  {c.badge && (
                    <span className="ml-2 text-[10px] text-accent-pink align-middle">
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
                      className="text-desc text-accent-teal hover:underline"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <span className="text-desc text-accent-teal">{c.value}</span>
                  )}
                  {c.subtext && (
                    <span className="block text-meta text-ink-muted">
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
