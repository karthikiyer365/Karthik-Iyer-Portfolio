"use client";

import { useEditor, useSettings } from "@/app/providers";
import { SETTINGS_PATH, SETTINGS_LABEL } from "@/lib/settings";

export default function FooterBar() {
  const { openFile } = useEditor();
  const { setActiveSubsection } = useSettings();

  const openContact = () => {
    setActiveSubsection("contact");
    openFile(SETTINGS_PATH, SETTINGS_LABEL);
  };

  return (
    <div className="flex items-center justify-center gap-4 md:gap-6 h-8 px-3 bg-titlebar border-t border-line-subtle select-none shrink-0 text-xs md:text-desc text-accent-pink">
      <button
        type="button"
        onClick={openContact}
        className="hover:brightness-125 transition-all cursor-pointer"
      >
        Contact Info
      </button>
      <span>&copy; 2026 Karthik Iyer</span>
    </div>
  );
}
