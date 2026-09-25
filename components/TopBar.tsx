"use client";

import { Menu } from "lucide-react";
import { useEditor, useSettings } from "@/app/providers";
import { SETTINGS_PATH, SETTINGS_LABEL } from "@/lib/settings";

type TopBarProps = {
  onClose?: () => void;
  onOpenFiles?: () => void;
};

export default function TopBar({ onClose, onOpenFiles }: TopBarProps) {
  const { openFile } = useEditor();
  const { setActiveSubsection } = useSettings();

  const openSettings = () => {
    setActiveSubsection("tools");
    openFile(SETTINGS_PATH, SETTINGS_LABEL);
  };

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className="flex items-center justify-between h-10 px-3 bg-titlebar border-b border-line-subtle select-none shrink-0">
      {/* Left - Window Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Close"
          title="Back to landing"
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 cursor-pointer"
        />
        <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 cursor-pointer" />
        <button
          type="button"
          aria-label="Toggle fullscreen"
          title="Toggle fullscreen"
          onClick={toggleFullscreen}
          className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 cursor-pointer"
        />
        {/* Mobile-only: open file explorer drawer */}
        <button
          type="button"
          aria-label="Open files"
          title="Files"
          onClick={onOpenFiles}
          className="md:hidden ml-1 p-1 text-accent-pink hover:brightness-110 transition-all"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Center - Repository Name */}
      <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 text-ink-muted text-desc">
        Karthik Iyer's Portfolio
      </div>

      {/* Right - Links (first word dropped on mobile so all three fit) */}
      <div className="flex items-center gap-3 md:gap-4 text-xs md:text-desc whitespace-nowrap">
        <a
          href="https://projects.karthikiyer.info/#tickets"
          target="_blank"
          rel="noreferrer"
          className="text-ink-muted hover:text-accent-pink transition-colors"
        >
          <span className="hidden md:inline">Live </span>Dashboards
        </a>
        <a
          href="https://writing.karthikiyer.info"
          target="_blank"
          rel="noreferrer"
          className="text-ink-muted hover:text-accent-pink transition-colors"
        >
          <span className="hidden md:inline">Tech </span>Blog
        </a>
        <button
          type="button"
          onClick={openSettings}
          className="text-accent-pink hover:brightness-110 transition-all cursor-pointer"
        >
          <span className="hidden md:inline">Tech </span>Stack &amp; Contact
        </button>
      </div>
    </div>
  );
}
