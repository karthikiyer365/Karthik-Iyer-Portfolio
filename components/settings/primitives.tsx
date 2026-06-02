// components/settings/primitives.tsx
"use client";

import type { ReactNode } from "react";

/** Borderless elevated "context box" that holds rows. */
export function SurfaceCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] bg-surface-raised overflow-hidden">
      {children}
    </div>
  );
}

/** A single row inside a SurfaceCard. Divider drawn via border-top on all but first. */
export function SettingRow({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-3 border-t border-line-subtle first:border-t-0 hover:bg-surface-2 transition-colors">
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
    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-title font-medium text-ink">{title}</h2>
      {info && <span className="text-accent-pink text-xs">&#9432;</span>}
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
    <div className="flex gap-5 text-desc border-b border-line mb-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`pb-2 transition-colors ${
            active === t.id
              ? "text-ink border-b-2 border-accent-teal"
              : "text-ink-muted border-b-2 border-transparent hover:text-ink-secondary"
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
    <div className="flex items-center justify-between rounded-[14px] bg-surface-raised px-5 py-3.5 mb-7">
      <div>
        <div className="text-body font-medium text-ink">{title}</div>
        <div className="text-desc text-ink-secondary">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
          on ? "bg-accent-teal" : "bg-line-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-bg transition-transform ${
            on ? "translate-x-4" : ""
          }`}
        />
      </button>
    </div>
  );
}
