// components/settings/SettingsView.tsx
"use client";

import SettingsSidebar from "./SettingsSidebar";
import SettingsContent from "./SettingsContent";

export default function SettingsView() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <SettingsSidebar />
      <SettingsContent />
    </div>
  );
}
