"use client";

import { useEditor, useSettings } from "@/app/providers";
import { SETTINGS_PATH, SETTINGS_LABEL } from "@/lib/settings";

type TopBarProps = {
  onClose?: () => void;
};

export default function TopBar({ onClose }: TopBarProps) {
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
      </div>

      {/* Center - Repository Name */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-ink-muted text-desc">
        Karthik Iyer's Portfolio
      </div>

      {/* Right - Utility Icons */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          className="p-1 text-ink-muted hover:text-ink-secondary transition-colors"
          title="Search"
        >
          <svg
            className="w-[18px] h-[18px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* Split View */}
        <button
          className="p-1 text-ink-muted hover:text-ink-secondary transition-colors"
          title="Split View"
        >
          <svg
            className="w-[18px] h-[18px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={openSettings}
          className="p-1 text-accent-pink hover:brightness-110 transition-all cursor-pointer"
          title="Settings"
        >
          <svg
            className="w-[18px] h-[18px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
