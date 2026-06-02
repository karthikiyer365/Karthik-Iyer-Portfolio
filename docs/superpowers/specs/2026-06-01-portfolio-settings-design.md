# Portfolio Settings — Design Spec

**Date:** 2026-06-01
**Branch:** `update`
**Status:** Design approved (visual mockup signed off). Implementation plan pending.

---

## 1. Overview

Add a **"Portfolio Settings"** screen to the IDE-styled portfolio, modeled on the VS Code / Cursor settings panel. It opens as an editor tab from the **existing (currently dead) gear icon** in `TopBar`, and presents three visitor-facing subsections — **Tools & TechStack**, **Skills & Techniques**, and **Contact info** — inside the editor pane, with the file tree and chat panel unchanged on either side.

It is a **read-only, presentational** surface dressed in settings chrome: segmented tabs and toggles are live (they filter / re-render the view), but all create/edit/delete affordances are decorative and have been removed from the design.

Visual reference mockup: `docs/mockups/settings-mockup.html`.

---

## 2. Scope

### In scope
- A `SettingsView` rendered inside `EditorWorkspace` when a sentinel tab is active.
- Internal settings layout: nav sidebar (profile, search-look, grouped nav, résumé button) + content pane.
- Three subsection content components driven by colocated, typed, hardcoded data.
- Live segmented tabs (All / X / Y) and live toggles per section.
- Wiring the existing `TopBar` gear icon to open the settings tab.
- Pink accent system (`#c586c0`) layered on the existing teal theme.

### Out of scope (YAGNI)
- Any persistence, auth, or CRUD. "New"/edit/delete are **removed**, not stubbed.
- Disabled nav groups (General, Appearance, Experience, Education, Projects, Docs) are **non-interactive decoration**.
- Moving Tools/Skills/Contact data into content files or a DB — explicitly deferred (hardcoded now).
- Search-settings input is **visual only** (no search logic).

---

## 3. Architecture

The settings screen is a special **editor tab**, not a content file. It reuses the existing 3-column IDE shell.

```
TopBar gear icon (exists, currently no-op)
   │ onClick → openFile(SETTINGS_PATH, "Portfolio Settings")
   ▼
EditorWorkspace
   │ if activeFile === SETTINGS_PATH → render <SettingsView/>
   │ else                           → existing markdown / code view (unchanged)
   ▼
<SettingsView>            ── owns internal nav state (active subsection)
   ├── (EditorTabs already rendered above by EditorWorkspace)
   └── flex row
        ├── <SettingsSidebar/>   profile · search-look · Portfolio nav · disabled groups · résumé button
        └── <SettingsContent/>   switch(activeSubsection)
              ├── <ToolsSection/>    All / Core / Tooling     + "Group by category" toggle
              ├── <SkillsSection/>   All / Technical / Applied + "Show only featured" toggle
              └── <ContactSection/>  All / Primary / Social    + "Make public" toggle
```

- **FileExplorer** (left) and **ChatPanel** (right) are untouched.
- The "Portfolio Settings" tab is **closable** like any file tab (uses existing `EditorTabs` + `closeFile`).

### Sentinel tab
- A reserved path constant, e.g. `SETTINGS_PATH = "settings"` (does not collide with the `portfolio/...` content paths).
- `EditorTabs`/`FileIcon` render a gear icon for this tab instead of the file glyph.

---

## 4. Components

| Component | Responsibility | Depends on |
|---|---|---|
| `SettingsView` | Top-level container; holds `activeSubsection` state; lays out sidebar + content | editor context (for tab) |
| `SettingsSidebar` | Profile header, search-look box, Portfolio nav (3 live items), disabled groups, résumé download button | `activeSubsection`, setter |
| `SettingsContent` | Switches on `activeSubsection`, renders the right section | section components |
| `ToolsSection` | Renders tool groups; segmented filter; "Group by category" toggle | `TOOLS_DATA` |
| `SkillsSection` | Renders skills list; segmented filter; "Show only featured" toggle | `SKILLS_DATA` |
| `ContactSection` | Renders channel rows; segmented filter; "Make public" toggle | `CONTACT_DATA` |
| Shared primitives | `SettingsToggle`, `SegmentedTabs`, `SurfaceCard`, `SettingRow` | — |

**Isolation check:** each section component takes no props beyond what it owns; data is colocated typed consts; shared primitives are pure presentational. A section can be understood and changed without touching the others.

---

## 5. Data shape (hardcoded, typed, colocated)

Each section defines its own typed const. Fields are shaped so the live filters work.

```ts
type FilterTab = string; // e.g. "all" | "core" | "tooling"

interface ToolItem {
  name: string;
  description: string;
  group: string;        // "Languages & frameworks" | "Data, ML & infrastructure"
  tabs: FilterTab[];     // which segmented tabs this item appears under (always includes "all")
}

interface SkillItem {
  name: string;
  description: string;
  tabs: FilterTab[];     // "all" | "technical" | "applied"
  featured: boolean;     // drives "Show only featured" toggle
}

interface ContactChannel {
  label: string;         // "Email" | "Phone" | "LinkedIn" | "GitHub" | "Location"
  value: string;
  tabs: FilterTab[];     // "all" | "primary" | "social"
  href?: string;         // mailto:/tel:/https — value rendered in pink-teal link style
}
```

- `"all"` tab shows everything; other tabs filter by membership in `tabs`.
- Toggles:
  - **Group by category** (Tools): on → render grouped by `group`; off → single flat list.
  - **Show only featured** (Skills): on → only `featured === true`.
  - **Make contact details public** (Contact): on → show all; off → hide email/phone rows (others remain).
- All toggle/tab state is **local component state** (`useState`); nothing persists across reloads.

> Real contact values (email, phone, links, location) to be supplied by the user at implementation time; mockup uses placeholders.

---

## 6. Visual system

Tokens reused from the existing app; pink is added.

| Token | Hex | Use |
|---|---|---|
| Editor bg | `#0a0a0a` | content pane background |
| Settings sidebar bg | `#171717` | nav sidebar |
| Surface card | `#1a1a1a` | borderless rounded (14px) context box holding rows |
| Row divider | `#232323` | faint internal divider between rows |
| Row hover | `#1f1f1f` | row hover |
| Teal accent | `#4ec9b0` | active segmented tab underline, "on" toggles, contact link values |
| Active tab top border | `#3b82f6` | editor tab (existing) |
| **Pink accent** | **`#c586c0`** | active nav left bar, avatar tint, ⓘ info icons, résumé download button |
| Pink button bg / border / text | `#2a1c27` / `#5a3a52` / `#e6a9d6` | résumé download button + avatar chip |
| Muted text | `#888` / `#666` | descriptions, disabled groups |

**Layout rules (the "context box + grey padding" requirement):**
- Each content group = a **borderless** `#1a1a1a` surface card, `border-radius: 14px`.
- Rows inside: `padding: 16px 20px`; `1px #232323` top-border between rows; hover `#1f1f1f`.
- Section header (title + ⓘ) sits **above** the card on the bare editor bg.
- Toggle cards are the same borderless surface.
- Section vertical gap `~32px`; content pane padding `px-8 py-6`.
- Disabled nav groups rendered at `opacity-50`, non-interactive.

---

## 7. Behavior / interactions

- **Open:** gear icon → opens (and activates) the settings tab. If already open, just activates it.
- **Close:** the tab's × closes it via existing `closeFile`; falls back to last open file / empty state per existing reducer behavior.
- **Subsection nav:** clicking a Portfolio nav item sets `activeSubsection`; active item gets the pink left accent + `#2a2a2a` bg.
- **Segmented tabs:** click filters the visible items; active tab gets teal underline.
- **Toggles:** flip local state and re-render the list as described in §5.
- **Decorative:** search box, disabled groups, résumé button (until a real PDF/link is wired) take no functional action beyond styling/hover. Résumé button target (existing PDF or route) to be confirmed at implementation.

---

## 8. Error / edge handling

- Empty filter result (e.g., a tab with no items) → render a muted "Nothing here yet." line inside the surface card rather than an empty card.
- Settings tab is the active file but data const is empty → section renders its header + empty-state line (no crash).
- Closing the settings tab while it is active → existing reducer picks the next tab; no settings-specific handling needed.

---

## 9. Testing approach

- **Visual:** Playwright screenshots of all three subsections at 1500×1000 vs. the mockup (already validated for the mockup; repeat against the real build).
- **Interaction:** click each segmented tab and toggle; assert the rendered row set changes (featured filter, group-by, public toggle hiding email/phone).
- **Integration:** gear icon opens the tab; tab is closable; file tree + chat unaffected.
- **Type safety:** `tsc` clean on the new components and data consts (per `verify-before-push`).

---

## 10. Open questions for implementation

1. Real values for Contact (email, phone, LinkedIn, GitHub, location).
2. Does the résumé download button point at an existing PDF/route, or stay decorative for now?
3. Exact tool/skill content (mockup uses representative placeholders).
4. Should the mockup file (`docs/mockups/settings-mockup.html`) be kept as a reference artifact or removed after implementation?
