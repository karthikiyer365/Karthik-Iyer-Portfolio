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
  { id: "technical", label: "Technical" },
  { id: "soft", label: "Soft" },
];

const CATEGORIES: Record<SkillTab, string[]> = {
  technical: ["Analytics", "ETL", "UI/UX", "AI", "Development"],
  soft: ["Leadership", "Management", "Critical Thinking"],
};

export default function SkillsSection() {
  const [tab, setTab] = useState<SkillTab>("technical");
  const [sortByCategory, setSortByCategory] = useState(false);

  const skills = SKILLS_DATA.filter((s) => s.tabs.includes(tab));

  return (
    <div>
      <h1 className="text-[18px] font-semibold text-ink">
        Skills &amp; techniques
      </h1>
      <p className="text-desc text-ink-secondary mt-1 mb-4">
        Capabilities I bring to data, ML, and systems work.
      </p>

      <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />

      <SettingsToggle
        title="Sort by category"
        description="Group skills by category."
        on={sortByCategory}
        onToggle={() => setSortByCategory((v) => !v)}
      />

      <SectionHeader title="Skills" info />

      {sortByCategory ? (
        CATEGORIES[tab].map((category) => {
          const categorySkills = skills.filter((s) => s.category === category);

          if (categorySkills.length === 0) return null;

          return (
            <div key={category} className="mb-4">
              <SectionHeader title={category} />

              <SurfaceCard>
                {categorySkills.map((s) => (
                  <SettingRow key={s.name}>
                    <div className="text-body font-medium text-ink">
                      {s.name}
                    </div>
                    <div className="text-desc text-ink-secondary mt-0.5">
                      {s.description}
                    </div>
                  </SettingRow>
                ))}
              </SurfaceCard>
            </div>
          );
        })
      ) : (
        <SurfaceCard>
          {skills.length === 0 ? (
            <SettingRow>
              <span className="text-desc text-ink-muted">Nothing here yet.</span>
            </SettingRow>
          ) : (
            skills.map((s) => (
              <SettingRow key={s.name}>
                <div className="text-body font-medium text-ink">{s.name}</div>
                <div className="text-desc text-ink-secondary mt-0.5">
                  {s.description}
                </div>
              </SettingRow>
            ))
          )}
        </SurfaceCard>
      )}
    </div>
  );
}