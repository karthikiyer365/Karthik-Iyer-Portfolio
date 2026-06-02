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
      <div className="text-[15px] text-[#e5e5e5]">{item.name}</div>
      <div className="text-[13px] text-[#888] mt-0.5">{item.description}</div>
    </SettingRow>
  );
}

export default function ToolsSection() {
  const [tab, setTab] = useState<ToolTab>("all");
  const [grouped, setGrouped] = useState(true);

  const items = TOOLS_DATA.filter((t) => t.tabs.includes(tab));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#e5e5e5]">
        Tools &amp; tech stack
      </h1>
      <p className="text-[#888] text-sm mt-1 mb-5">
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
            <div key={group} className="mb-8 last:mb-0">
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
                <span className="text-[13px] text-[#666]">
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
