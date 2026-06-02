# Portfolio Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a VS Code–style "Portfolio Settings" screen with three read-only subsections (Tools & TechStack, Skills & Techniques, Contact info), opened from the existing TopBar gear icon, replacing `content/contact.md`.

**Architecture:** A reserved editor tab (`SETTINGS_PATH`) makes `EditorWorkspace` render `<SettingsView/>` instead of markdown. `SettingsView` is a self-contained nav-sidebar + content-pane unit. Active subsection lives in a new `SettingsProvider` context so the gear icon and the markdown contact-icons can both open settings at a chosen subsection. Data is hardcoded/typed (placeholders for Tools/Skills; real values for Contact from `contact.md`).

**Tech Stack:** Next.js 16 (app router, client components), React 18, Tailwind CSS v3, lucide-react. No unit-test framework — verification is `npx tsc --noEmit`, `npm run build`, and Playwright visual checks.

---

## Conventions for this plan

- **Branch:** `update` (session branch). All commits go here.
- **Pink accent:** `#c586c0`. Pink button surface `#2a1c27` / border `#5a3a52` / text `#e6a9d6`. Teal accent `#4ec9b0` (active tab underline, "on" toggles, link values). Surface card `#1a1a1a` (borderless, `rounded-[14px]`). Sidebar bg `#171717`. Row divider `#232323`.
- **Per-task verification (no test runner):** run `npx tsc --noEmit` and expect no new errors in the files you touched. Visual verification is consolidated in Task 14.
- **Reference mockup:** `docs/mockups/settings-mockup.html` (open via a local http server; `file://` is blocked in Playwright).

---

## File Structure

**Create:**
- `lib/settings.ts` — `SETTINGS_PATH`, `SETTINGS_LABEL`, `Subsection` type, item types, hardcoded data arrays.
- `components/settings/primitives.tsx` — `SurfaceCard`, `SettingRow`, `SegmentedTabs`, `SettingsToggle`, `SectionHeader`.
- `components/settings/ContactSection.tsx`
- `components/settings/SkillsSection.tsx`
- `components/settings/ToolsSection.tsx`
- `components/settings/SettingsContent.tsx`
- `components/settings/SettingsSidebar.tsx`
- `components/settings/SettingsView.tsx`

**Modify:**
- `app/providers.tsx` — add `SettingsProvider` + `useSettings`; wrap in `AppProviders`.
- `components/EditorTabs.tsx` — gear icon for the settings tab.
- `components/EditorWorkspace.tsx` — branch to `<SettingsView/>`; rewire `navigateToContact`.
- `components/TopBar.tsx` — wire gear button to open settings.

**Delete:**
- `content/contact.md` (replaced by Contact subsection).

---

### Task 1: Settings constants, types, and data

**Files:**
- Create: `lib/settings.ts`

- [ ] **Step 1: Create the file with all types and data**

```ts
// lib/settings.ts
// Single source of truth for the Portfolio Settings screen.
// Data is hardcoded (placeholders for Tools/Skills until a résumé is parsed;
// Contact values are real, migrated from the former content/contact.md).

/** Reserved editor-tab path that triggers the settings screen. */
export const SETTINGS_PATH = "settings";
export const SETTINGS_LABEL = "Portfolio Settings";

export type Subsection = "tools" | "skills" | "contact";

/* ---------- Tools & TechStack ---------- */

export type ToolTab = "all" | "core" | "tooling";

export interface ToolItem {
  name: string;
  description: string;
  group: "Languages & frameworks" | "Data, ML & infrastructure";
  tabs: ToolTab[]; // always includes "all"
}

export const TOOLS_DATA: ToolItem[] = [
  {
    name: "Python",
    description: "Primary language for data pipelines, ML, and backend services.",
    group: "Languages & frameworks",
    tabs: ["all", "core"],
  },
  {
    name: "TypeScript",
    description: "Full-stack work across Next.js, React, and Node.",
    group: "Languages & frameworks",
    tabs: ["all", "core"],
  },
  {
    name: "Next.js / React",
    description: "App-router frontends, server components, and Tailwind.",
    group: "Languages & frameworks",
    tabs: ["all", "core", "tooling"],
  },
  {
    name: "Postgres / Supabase",
    description: "Relational modeling, RLS, and edge functions.",
    group: "Data, ML & infrastructure",
    tabs: ["all", "core"],
  },
  {
    name: "Docker / AWS",
    description: "Containerized services and cloud deploys.",
    group: "Data, ML & infrastructure",
    tabs: ["all", "tooling"],
  },
];

/* ---------- Skills & Techniques ---------- */

export type SkillTab = "all" | "technical" | "applied";

export interface SkillItem {
  name: string;
  description: string;
  tabs: SkillTab[]; // always includes "all"
  featured: boolean;
}

export const SKILLS_DATA: SkillItem[] = [
  {
    name: "Data pipeline design",
    description: "Build and maintain ETL flows feeding analytics and ML workloads.",
    tabs: ["all", "technical"],
    featured: true,
  },
  {
    name: "Retrieval-augmented generation",
    description: "Pair vector search with LLM reasoning for grounded answers.",
    tabs: ["all", "technical", "applied"],
    featured: true,
  },
  {
    name: "System design",
    description: "Architect scalable backend services and clean data models.",
    tabs: ["all", "technical"],
    featured: false,
  },
  {
    name: "Statistical analysis",
    description: "Regression, hypothesis testing, and forecasting on messy data.",
    tabs: ["all", "applied"],
    featured: true,
  },
];

/* ---------- Contact ---------- */

export type ContactTab = "all" | "primary" | "social";

export interface ContactChannel {
  label: string;
  value: string;
  href?: string;
  tabs: ContactTab[]; // always includes "all"
  badge?: string; // small pink note, e.g. "fastest via SMS"
  subtext?: string; // muted second line
  /** Hidden when "Make contact details public" is OFF. */
  private?: boolean;
}

export const CONTACT_DATA: ContactChannel[] = [
  {
    label: "Email",
    value: "karthikiyer365@gmail.com",
    href: "mailto:karthikiyer365@gmail.com",
    tabs: ["all", "primary"],
    private: true,
  },
  {
    label: "Phone",
    value: "+1 (202) 713-1699",
    href: "tel:+12027131699",
    tabs: ["all", "primary"],
    badge: "fastest via SMS",
    private: true,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/kiyer8",
    href: "https://linkedin.com/in/kiyer8",
    tabs: ["all", "social"],
  },
  {
    label: "Location",
    value: "Arlington, VA",
    tabs: ["all"],
    subtext: "Open to remote & hybrid",
  },
];
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `lib/settings.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/settings.ts
git commit -m "feat:portfolio-settings add settings constants, types, and data"
```

---

### Task 2: SettingsProvider context

Adds shared `activeSubsection` state so both the gear icon and the markdown contact-icons can open settings at a chosen subsection.

**Files:**
- Modify: `app/providers.tsx`

- [ ] **Step 1: Add the context, provider, and hook**

Insert this block after the Content Context section (before `ROOT PROVIDER`) in `app/providers.tsx`:

```tsx
/* =========================
   Settings Context
========================= */

import type { Subsection } from "@/lib/settings";

interface SettingsContextType {
  activeSubsection: Subsection;
  setActiveSubsection: (s: Subsection) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

function SettingsProvider({ children }: { children: ReactNode }) {
  const [activeSubsection, setActiveSubsection] =
    useState<Subsection>("tools");
  return (
    <SettingsContext.Provider value={{ activeSubsection, setActiveSubsection }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
```

> Note: `import type` at module scope is fine in this file (other imports are at top); if the linter prefers top-of-file imports, move the `import type { Subsection }` line up with the other imports.

- [ ] **Step 2: Wrap the tree in `AppProviders`**

Replace the existing `AppProviders` body:

```tsx
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <EditorProvider>
      <PersonaProvider>
        <SettingsProvider>{children}</SettingsProvider>
      </PersonaProvider>
    </EditorProvider>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add app/providers.tsx
git commit -m "feat:portfolio-settings add SettingsProvider context"
```

---

### Task 3: Shared presentational primitives

**Files:**
- Create: `components/settings/primitives.tsx`

- [ ] **Step 1: Create the primitives**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `primitives.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/settings/primitives.tsx
git commit -m "feat:portfolio-settings add shared settings primitives"
```

---

### Task 4: ContactSection

**Files:**
- Create: `components/settings/ContactSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/settings/ContactSection.tsx
"use client";

import { useState } from "react";
import { CONTACT_DATA, type ContactTab } from "@/lib/settings";
import {
  SurfaceCard,
  SettingRow,
  SectionHeader,
  SegmentedTabs,
  SettingsToggle,
} from "./primitives";

const TABS: { id: ContactTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "primary", label: "Primary" },
  { id: "social", label: "Social" },
];

export default function ContactSection() {
  const [tab, setTab] = useState<ContactTab>("all");
  const [isPublic, setIsPublic] = useState(true);

  const channels = CONTACT_DATA.filter(
    (c) => c.tabs.includes(tab) && (isPublic || !c.private)
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#e5e5e5]">Contact</h1>
      <p className="text-[#888] text-sm mt-1 mb-5">
        How to reach me and where to find my work.
      </p>

      <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />

      <SettingsToggle
        title="Make contact details public"
        description="Show email and phone on the live portfolio."
        on={isPublic}
        onToggle={() => setIsPublic((v) => !v)}
      />

      <SectionHeader title="Channels" />

      <SurfaceCard>
        {channels.length === 0 ? (
          <SettingRow>
            <span className="text-[13px] text-[#666]">Nothing here yet.</span>
          </SettingRow>
        ) : (
          channels.map((c) => (
            <SettingRow key={c.label}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[15px] text-[#e5e5e5]">
                  {c.label}
                  {c.badge && (
                    <span className="ml-2 text-[10px] text-[#c586c0] align-middle">
                      {c.badge}
                    </span>
                  )}
                </span>
                <span className="text-right">
                  {c.href ? (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#4ec9b0] text-[14px] hover:underline"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <span className="text-[#4ec9b0] text-[14px]">{c.value}</span>
                  )}
                  {c.subtext && (
                    <span className="block text-[#888] text-[12px]">
                      {c.subtext}
                    </span>
                  )}
                </span>
              </div>
            </SettingRow>
          ))
        )}
      </SurfaceCard>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `ContactSection.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/settings/ContactSection.tsx
git commit -m "feat:portfolio-settings add ContactSection"
```

---

### Task 5: SkillsSection

**Files:**
- Create: `components/settings/SkillsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/settings/SkillsSection.tsx
"use client";

import { useState } from "react";
import { SKILLS_DATA, type SkillTab } from "@/lib/settings";
import {
  SurfaceCard,
  SettingRow,
  SectionHeader,
  SegmentedTabs,
  SettingsToggle,
} from "./primitives";

const TABS: { id: SkillTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "technical", label: "Technical" },
  { id: "applied", label: "Applied" },
];

export default function SkillsSection() {
  const [tab, setTab] = useState<SkillTab>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const skills = SKILLS_DATA.filter(
    (s) => s.tabs.includes(tab) && (!featuredOnly || s.featured)
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#e5e5e5]">
        Skills &amp; techniques
      </h1>
      <p className="text-[#888] text-sm mt-1 mb-5">
        Capabilities I bring to data, ML, and systems work.
      </p>

      <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />

      <SettingsToggle
        title="Show only featured skills"
        description="Hide skills not pinned to the front page."
        on={featuredOnly}
        onToggle={() => setFeaturedOnly((v) => !v)}
      />

      <SectionHeader title="Skills" info />

      <SurfaceCard>
        {skills.length === 0 ? (
          <SettingRow>
            <span className="text-[13px] text-[#666]">Nothing here yet.</span>
          </SettingRow>
        ) : (
          skills.map((s) => (
            <SettingRow key={s.name}>
              <div className="text-[15px] text-[#e5e5e5]">{s.name}</div>
              <div className="text-[13px] text-[#888] mt-0.5">
                {s.description}
              </div>
            </SettingRow>
          ))
        )}
      </SurfaceCard>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `SkillsSection.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/settings/SkillsSection.tsx
git commit -m "feat:portfolio-settings add SkillsSection"
```

---

### Task 6: ToolsSection

Handles the "Group by category" toggle (ON → grouped headers; OFF → flat list).

**Files:**
- Create: `components/settings/ToolsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/settings/ToolsSection.tsx
"use client";

import { useState } from "react";
import { TOOLS_DATA, type ToolItem, type ToolTab } from "@/lib/settings";
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

const GROUPS: ToolItem["group"][] = [
  "Languages & frameworks",
  "Data, ML & infrastructure",
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
        GROUPS.map((group) => {
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `ToolsSection.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/settings/ToolsSection.tsx
git commit -m "feat:portfolio-settings add ToolsSection"
```

---

### Task 7: SettingsContent (subsection switch)

**Files:**
- Create: `components/settings/SettingsContent.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/settings/SettingsContent.tsx
git commit -m "feat:portfolio-settings add SettingsContent switch"
```

---

### Task 8: SettingsSidebar

**Files:**
- Create: `components/settings/SettingsSidebar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/settings/SettingsSidebar.tsx
"use client";

import { Search, Download } from "lucide-react";
import { useSettings } from "@/app/providers";
import type { Subsection } from "@/lib/settings";

const NAV: { id: Subsection; label: string }[] = [
  { id: "tools", label: "Tools & TechStack" },
  { id: "skills", label: "Skills & Techniques" },
  { id: "contact", label: "Contact info" },
];

const DISABLED_TOP = ["General", "Appearance"];
const DISABLED_MORE = ["Experience", "Education", "Projects", "Docs"];

export default function SettingsSidebar() {
  const { activeSubsection, setActiveSubsection } = useSettings();

  return (
    <div className="w-64 shrink-0 bg-[#171717] border-r border-[#1f1f1f] overflow-y-auto px-3 py-3 flex flex-col gap-2">
      {/* profile */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded bg-[#2a1c27] border border-[#5a3a52] flex items-center justify-center text-[#e6a9d6] text-sm font-medium">
          K
        </div>
        <div className="leading-tight">
          <div className="text-[13px] text-[#e5e5e5] truncate max-w-[180px]">
            karthikiyer365@gmail.com
          </div>
          <div className="text-[11px] text-[#777]">Portfolio</div>
        </div>
      </div>

      {/* search (decorative) */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#202020] text-[#666] text-[12px]">
        <Search className="w-3.5 h-3.5" />
        Search settings ⌘F
      </div>

      {/* disabled top group */}
      <div className="mt-1 rounded bg-[#202020] opacity-50 select-none">
        {DISABLED_TOP.map((label) => (
          <div key={label} className="px-3 py-1.5 text-[13px] text-[#777]">
            {label}
          </div>
        ))}
      </div>

      {/* portfolio group */}
      <div className="px-2 pt-2 pb-1 text-[11px] tracking-wide text-[#777]">
        Portfolio
      </div>
      {NAV.map((n) => {
        const active = activeSubsection === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setActiveSubsection(n.id)}
            className={`text-left px-3 py-2 rounded text-[13px] text-[#e5e5e5] border ${
              active
                ? "bg-[#2a2a2a] border-[#333] border-l-2 border-l-[#c586c0]"
                : "border-transparent border-l-2 border-l-transparent hover:bg-[#1f1f1f]"
            }`}
          >
            {n.label}
          </button>
        );
      })}

      {/* more group (disabled) */}
      <div className="px-2 pt-2 pb-1 text-[11px] tracking-wide text-[#777]">
        More
      </div>
      <div className="rounded bg-[#202020] opacity-50 select-none">
        {DISABLED_MORE.map((label) => (
          <div
            key={label}
            className="px-3 py-1.5 text-[13px] text-[#777] flex items-center justify-between"
          >
            {label}
            {label === "Docs" && <span>↗</span>}
          </div>
        ))}
      </div>

      {/* résumé download (decorative, pink) */}
      <button
        type="button"
        className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded bg-[#2a1c27] hover:bg-[#34232f] border border-[#5a3a52] text-[13px] text-[#e6a9d6] text-left transition-colors"
      >
        <Download className="w-4 h-4 text-[#c586c0]" />
        Download résumé (PDF)
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/settings/SettingsSidebar.tsx
git commit -m "feat:portfolio-settings add SettingsSidebar"
```

---

### Task 9: SettingsView container

**Files:**
- Create: `components/settings/SettingsView.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/settings/SettingsView.tsx
git commit -m "feat:portfolio-settings add SettingsView container"
```

---

### Task 10: Gear icon for the settings tab

`EditorTabs` shows a generic file icon for the settings tab. Give it a gear so it reads as Settings.

**Files:**
- Modify: `components/EditorTabs.tsx`

- [ ] **Step 1: Teach FileIcon about the settings tab**

In `components/EditorTabs.tsx`, add an import at the top:

```tsx
import { SETTINGS_PATH } from "@/lib/settings";
```

Then change the `FileIcon` signature to also receive the path, and short-circuit to a gear:

```tsx
function FileIcon({ name, path }: { name: string; path: string }) {
  if (path === SETTINGS_PATH) {
    return (
      <svg className="w-3.5 h-3.5 text-[#c586c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }

  const ext = name.split(".").pop();
  // ...existing md / css / default branches unchanged...
}
```

- [ ] **Step 2: Pass the path where FileIcon is rendered**

In the tab map, update the call site:

```tsx
<FileIcon name={file.name} path={file.path} />
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/EditorTabs.tsx
git commit -m "feat:portfolio-settings gear icon for settings tab"
```

---

### Task 11: EditorWorkspace — render SettingsView + rewire contact icons

**Files:**
- Modify: `components/EditorWorkspace.tsx`

- [ ] **Step 1: Add imports**

At the top of `components/EditorWorkspace.tsx`:

```tsx
import { useEditor, useContent, useSettings } from "@/app/providers";
import { SETTINGS_PATH } from "@/lib/settings";
import SettingsView from "./settings/SettingsView";
import EditorTabs from "./EditorTabs";
```

(Keep existing imports; just ensure `useSettings`, `SETTINGS_PATH`, and `SettingsView` are added and `useContent`/`EditorTabs` remain.)

- [ ] **Step 2: Branch to SettingsView before the markdown/code logic**

In the `EditorWorkspace` component, immediately AFTER the existing empty-state block (`if (openFiles.length === 0 || !activeFile) { ... }`) and BEFORE `const content = getContent(activeFile);`, insert:

```tsx
  if (activeFile === SETTINGS_PATH) {
    return (
      <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
        <EditorTabs />
        <SettingsView />
      </div>
    );
  }
```

- [ ] **Step 3: Rewire navigateToContact**

In the `MarkdownPreview` function, replace:

```tsx
  const { openFile } = useEditor();
  const navigateToContact = () => openFile("portfolio/contact.md", "contact.md");
```

with:

```tsx
  const { openFile } = useEditor();
  const { setActiveSubsection } = useSettings();
  const navigateToContact = () => {
    setActiveSubsection("contact");
    openFile(SETTINGS_PATH, "Portfolio Settings");
  };
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/EditorWorkspace.tsx
git commit -m "feat:portfolio-settings render SettingsView and rewire contact icons"
```

---

### Task 12: TopBar gear icon → open settings

**Files:**
- Modify: `components/TopBar.tsx`

- [ ] **Step 1: Convert the Settings button to open the tab**

At the top of `components/TopBar.tsx`, add:

```tsx
import { useEditor, useSettings } from "@/app/providers";
import { SETTINGS_PATH, SETTINGS_LABEL } from "@/lib/settings";
```

Inside the `TopBar` component body, before the `return`:

```tsx
  const { openFile } = useEditor();
  const { setActiveSubsection } = useSettings();

  const openSettings = () => {
    setActiveSubsection("tools");
    openFile(SETTINGS_PATH, SETTINGS_LABEL);
  };
```

Then add `type="button"`, `onClick={openSettings}`, and a cursor to the existing Settings `<button>` (the one wrapping the gear `svg`):

```tsx
        <button
          type="button"
          onClick={openSettings}
          className="p-1 text-[#666666] hover:text-[#a3a3a3] transition-colors cursor-pointer"
          title="Settings"
        >
          {/* existing gear svg unchanged */}
        </button>
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/TopBar.tsx
git commit -m "feat:portfolio-settings wire TopBar gear icon to open settings"
```

---

### Task 13: Delete contact.md and verify no dangling references

**Files:**
- Delete: `content/contact.md`

- [ ] **Step 1: Confirm the only code reference was navigateToContact**

Run: `grep -rn "contact.md" app components lib content`
Expected: no matches in `app/`, `components/`, or `lib/` (Task 11 removed the `EditorWorkspace` reference). If any markdown in `content/` links to `contact.md` directly, note it — those become dead links and should be left as-is or updated to the `:mail:`/`:phone:`/`:link:` tokens that route to settings.

- [ ] **Step 2: Delete the file**

```bash
git rm content/contact.md
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds (the file tree is generated from `/content`, so the tab/tree simply no longer lists contact.md).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor:portfolio-settings remove contact.md, superseded by settings Contact"
```

---

### Task 14: Visual verification (Playwright)

No unit tests — verify behavior in the running app.

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run (background): `npm run dev`
Wait for: `Local: http://localhost:3000`

- [ ] **Step 2: Drive the app with Playwright and confirm each checkpoint**

Navigate to `http://localhost:3000`, resize to 1500×1000, then:

1. From the landing page, enter the IDE (open any file).
2. Click the **gear icon** in the TopBar → a "Portfolio Settings" tab opens with a pink gear icon, showing **Tools & tech stack** (default).
3. Confirm the borderless `#1a1a1a` surface cards, pink active-nav bar, pink avatar, pink ⓘ, pink résumé button.
4. Toggle **Group by category** OFF → rows collapse into a single "Stack" card; ON → two grouped cards.
5. Click **Core** / **Tooling** tabs → list filters (Docker/AWS only under Tooling/All).
6. Click **Skills & Techniques** → toggle **Show only featured** → "System design" disappears.
7. Click **Contact info** → real values present (karthikiyer365@gmail.com, +1 (202) 713-1699 with pink "fastest via SMS", linkedin.com/in/kiyer8, Arlington VA). Toggle **Make public** OFF → Email + Phone rows disappear; LinkedIn + Location remain.
8. Open `resume.md`, switch to preview, click a `:mail:`/`:phone:`/`:link:` icon → it opens the settings tab on the **Contact** subsection.
9. Close the settings tab via its × → falls back to another open file, no crash.
10. Confirm FileExplorer no longer lists `contact.md`.

Take screenshots of Tools, Skills, and Contact for the record.

- [ ] **Step 3: Final full build check**

Run: `npx tsc --noEmit && npm run build && npm run lint`
Expected: all pass, no new errors.

- [ ] **Step 4: Clean up Playwright artifacts**

```bash
rm -rf .playwright-mcp *.png 2>/dev/null || true
```

(Do NOT delete `docs/mockups/`.)

---

## Self-review notes

- **Spec coverage:** §3 architecture → Tasks 9/11/12; §4 components → Tasks 3–9; §5 data + filters → Tasks 1,4,5,6; §6 visual tokens → Tasks 3,8; §7 interactions → Tasks 4,5,6,8,11,12; §8 edge cases (empty filter) → empty-state rows in Tasks 4,5,6; §11 contact.md replacement → Tasks 11,13. All covered.
- **Type consistency:** `Subsection`, `ToolTab`/`SkillTab`/`ContactTab`, and the data interfaces are defined once in Task 1 and imported everywhere; `useSettings` defined in Task 2 and consumed in Tasks 7,8,11,12; `SETTINGS_PATH`/`SETTINGS_LABEL` consistent across Tasks 10,11,12.
- **No persistence:** all toggle/tab state is `useState`, reset on tab close — matches spec.
