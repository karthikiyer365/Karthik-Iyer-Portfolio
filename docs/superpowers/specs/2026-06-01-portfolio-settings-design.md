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

**Real contact data** (sourced from `content/contact.md`, which this section replaces):

| Label | Value | Tabs | Note |
|---|---|---|---|
| Email | karthikiyer365@gmail.com | all, primary | `mailto:` |
| Phone | +1 (202) 713-1699 | all, primary | pink "fastest via SMS" badge (from Preferred Methods) · `tel:` |
| LinkedIn | linkedin.com/in/kiyer8 | all, social | `https:` |
| Location | Arlington, VA | all | subtext "Open to remote & hybrid" |

No GitHub channel (not present in `contact.md`).

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
| **Pink accent** | **`#dd0077`** | active nav left bar, ⓘ info icons, settings-tab gear, contact badge, résumé download button (matches CareerTimeline + landing buttons) |
| Pink button | `border-[#dd0077]` transparent, `hover:bg-[#dd0077]/30` | résumé download button (mirrors landing ActionButton) |
| Profile avatar | `/img.png` | landing logo image (replaces "K" chip) |
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

## 10. Resolved decisions

1. **Contact data** — sourced from `content/contact.md` (see §5 table). GitHub dropped. This section **replaces** `contact.md` (see §11).
2. **Résumé download** — **decorative for now** (styled button, no download action). Real PDF/route deferred.
3. **Tool/Skill content** — **build the template with placeholder content**; user will provide a résumé later to parse for the real Tools & Skills entries.
4. **Mockup file** — kept as reference artifact at `docs/mockups/settings-mockup.html`.

---

## 11. `contact.md` replacement (dependency to handle in the plan)

The Contact subsection supersedes `content/contact.md`. Removing that file has two ripple effects that the plan must address:

1. **`navigateToContact` in `EditorWorkspace.tsx`** — the `:mail:` / `:phone:` / `:link:` icons in markdown currently call `openFile("portfolio/contact.md", "contact.md")`. After removal this must instead **open the settings tab and select the Contact subsection** (e.g., open `SETTINGS_PATH` with an initial subsection of `contact`). This implies `SettingsView` should accept an optional initial-subsection signal.
2. **File tree** — `contact.md` disappears from `FileExplorer` automatically once the file is deleted (tree is generated from `/content`). No code change needed there, but resume/other markdown links pointing at contact must be re-checked.

**Decision needed at implementation:** delete `content/contact.md` outright, or keep the file but stop linking to it. Recommended: delete it and rewire `navigateToContact` to the settings Contact subsection, so there's a single source of truth.

> Minor: the sidebar profile header in the mockup still shows a placeholder `karthik.iyer@resto… / RestoreFast`. Align to real identity (`karthikiyer365@gmail.com`) at implementation, or keep the company subtitle — cosmetic, confirm during build.
