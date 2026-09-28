// components/settings/AppearanceSection.tsx
"use client";

import { useTheme, type Theme } from "@/app/providers";
import { SegmentedTabs } from "./primitives";

const THEMES: { id: Theme; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h1 className="text-[18px] font-semibold text-ink">Appearance</h1>
      <p className="text-desc text-ink-secondary mt-1 mb-4">
        Choose a light or dark theme. Your choice is remembered on this device.
      </p>

      <SegmentedTabs tabs={THEMES} active={theme} onChange={setTheme} />
    </div>
  );
}
