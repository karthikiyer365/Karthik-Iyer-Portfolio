// components/settings/SkillsSection.tsx
"use client";

import { useState } from "react";
import { SKILLS_DATA, type SkillTab } from "@/lib/settings";
import {
  SurfaceCard,
  SettingRow,
  SectionHeader,
  SegmentedTabs,
  SettingsToggle,
} from "./primitives";

const TABS: { id: SkillTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "technical", label: "Technical" },
  { id: "applied", label: "Applied" },
];

export default function SkillsSection() {
  const [tab, setTab] = useState<SkillTab>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const skills = SKILLS_DATA.filter(
    (s) => s.tabs.includes(tab) && (!featuredOnly || s.featured)
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#e5e5e5]">
        Skills &amp; techniques
      </h1>
      <p className="text-[#888] text-sm mt-1 mb-5">
        Capabilities I bring to data, ML, and systems work.
      </p>

      <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />

      <SettingsToggle
        title="Show only featured skills"
        description="Hide skills not pinned to the front page."
        on={featuredOnly}
        onToggle={() => setFeaturedOnly((v) => !v)}
      />

      <SectionHeader title="Skills" info />

      <SurfaceCard>
        {skills.length === 0 ? (
          <SettingRow>
            <span className="text-[13px] text-[#666]">Nothing here yet.</span>
          </SettingRow>
        ) : (
          skills.map((s) => (
            <SettingRow key={s.name}>
              <div className="text-[15px] text-[#e5e5e5]">{s.name}</div>
              <div className="text-[13px] text-[#888] mt-0.5">
                {s.description}
              </div>
            </SettingRow>
          ))
        )}
      </SurfaceCard>
    </div>
  );
}
