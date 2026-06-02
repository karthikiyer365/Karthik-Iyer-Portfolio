// components/settings/primitives.tsx
"use client";

import type { ReactNode } from "react";

/** Borderless elevated "context box" that holds rows. */
export function SurfaceCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] bg-[#1a1a1a] overflow-hidden">
      {children}
    </div>
  );
}

/** A single row inside a SurfaceCard. Divider drawn via border-top on all but first. */
export function SettingRow({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-4 border-t border-[#232323] first:border-t-0 hover:bg-[#1f1f1f] transition-colors">
      {children}
    </div>
  );
}

/** Section header that floats above a SurfaceCard on the bare editor bg. */
export function SectionHeader({
  title,
  info,
}: {
  title: string;
  info?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-[17px] text-[#e5e5e5]">{title}</h2>
      {info && <span className="text-[#c586c0] text-sm">&#9432;</span>}
    </div>
  );
}

/** Segmented filter tabs (All / X / Y). Active tab gets a teal underline. */
export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-6 text-sm border-b border-[#2a2a2a] mb-5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`pb-2 transition-colors ${
            active === t.id
              ? "text-[#e5e5e5] border-b-2 border-[#4ec9b0]"
              : "text-[#666] border-b-2 border-transparent hover:text-[#999]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** A toggle card: title + description on the left, switch on the right. */
export function SettingsToggle({
  title,
  description,
  on,
  onToggle,
}: {
  title: string;
  description: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[14px] bg-[#1a1a1a] px-5 py-4 mb-8">
      <div>
        <div className="text-[15px] text-[#e5e5e5]">{title}</div>
        <div className="text-[13px] text-[#888]">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
          on ? "bg-[#4ec9b0]" : "bg-[#3a3a3a]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#0a0a0a] transition-transform ${
            on ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
