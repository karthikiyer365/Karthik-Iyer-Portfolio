// components/settings/ToolsSection.tsx
"use client";

import { useState } from "react";
import {
  TOOLS_DATA,
  TOOL_GROUPS,
  type ToolItem,
  type ToolTab,
} from "@/lib/settings";
import {
  SurfaceCard,
  SettingRow,
  SectionHeader,
  SegmentedTabs,
  SettingsToggle,
} from "./primitives";

const TABS: { id: ToolTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "core", label: "Core" },
  { id: "tooling", label: "Tooling" },
];

function ToolRow({ item }: { item: ToolItem }) {
  return (
    <SettingRow>
      <div className="text-body font-medium text-ink">{item.name}</div>
      <div className="text-desc text-ink-secondary mt-0.5">
        {item.description}
      </div>
    </SettingRow>
  );
}

export default function ToolsSection() {
  const [tab, setTab] = useState<ToolTab>("all");
  const [grouped, setGrouped] = useState(true);

  const items = TOOLS_DATA.filter((t) => t.tabs.includes(tab));

  return (
    <div>
      <h1 className="text-[18px] font-semibold text-ink">
        Tools &amp; tech stack
      </h1>
      <p className="text-desc text-ink-secondary mt-1 mb-4">
        Languages, frameworks, and platforms I build with day to day.
      </p>

      <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />

      <SettingsToggle
        title="Group by category"
        description="Cluster the stack by language, framework, and infra."
        on={grouped}
        onToggle={() => setGrouped((v) => !v)}
      />

      {grouped ? (
        TOOL_GROUPS.map((group) => {
          const groupItems = items.filter((t) => t.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group} className="mb-7 last:mb-0">
              <SectionHeader title={group} info />
              <SurfaceCard>
                {groupItems.map((item) => (
                  <ToolRow key={item.name} item={item} />
                ))}
              </SurfaceCard>
            </div>
          );
        })
      ) : (
        <>
          <SectionHeader title="Stack" info />
          <SurfaceCard>
            {items.length === 0 ? (
              <SettingRow>
                <span className="text-desc text-ink-muted">
                  Nothing here yet.
                </span>
              </SettingRow>
            ) : (
              items.map((item) => <ToolRow key={item.name} item={item} />)
            )}
          </SurfaceCard>
        </>
      )}
    </div>
  );
}
