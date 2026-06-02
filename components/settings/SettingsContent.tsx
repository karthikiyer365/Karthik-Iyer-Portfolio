// components/settings/SettingsContent.tsx
"use client";

import { useSettings } from "@/app/providers";
import ToolsSection from "./ToolsSection";
import SkillsSection from "./SkillsSection";
import ContactSection from "./ContactSection";

export default function SettingsContent() {
  const { activeSubsection } = useSettings();

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      {activeSubsection === "tools" && <ToolsSection />}
      {activeSubsection === "skills" && <SkillsSection />}
      {activeSubsection === "contact" && <ContactSection />}
    </div>
  );
}
