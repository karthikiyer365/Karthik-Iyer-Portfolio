# resume.md Graphical Formatting — Design

**Date:** 2026-05-30
**Status:** Approved (design) — pending spec review → implementation plan
**Scope:** Rewrite `content/resume.md` to be structural/graphical and less paragraphical, using a consistent visual vocabulary. Two exemplar sections (Skills, Experience) are fully designed here; the same vocabulary extends to the rest of the file.

---

## 1. Goal

Make the résumé read as **structure, not paragraphs** — scannable, on-theme with the "portfolio-as-VS-Code" concept, and visually richer. The brainstorm settled a reusable vocabulary and nailed down two anchor sections.

## 2. Rendering constraints (source of truth)

The résumé renders through `components/EditorWorkspace.tsx → MarkdownPreview` (ReactMarkdown + `remark-gfm`), with a **code-view toggle** that shows the raw markdown with line syntax highlighting.

- **No raw HTML.** ReactMarkdown is not configured with `rehype-raw`, so the vocabulary is limited to markdown-native constructs: fenced code blocks, GFM tables, mermaid blocks, blockquotes, emphasis, task lists.
- **Mermaid** is detected by the `code` renderer (`lang === "mermaid"`) and drawn via `components/MermaidDiagram.tsx`.
- **Code blocks** render at `text-xs` today (`EditorWorkspace.tsx` `pre/code` component).
- **Code-view toggle** means ASCII art is a feature: it looks intentional in both preview and raw view. Mermaid source shows as plain text in code-view (acceptable).

> The HTML mockups produced during brainstorm are **approximations**. Mermaid output is rendered by mermaid's own layout engine and will differ from the mocks in exact node shape/spacing. The ASCII blocks, by contrast, render verbatim.

## 3. Visual vocabulary (applies file-wide)

| Element | Construct | Notes |
|---|---|---|
| Proficiency / ratings | ASCII bar (`▰`/`▱`) in fenced code block | pure markdown, code-view safe |
| Multi-column groupings | aligned columns with `│` dividers + `───` header rules in code block | monospace alignment |
| Timelines / career arc | mermaid `flowchart TB` | reuse existing pink theme |
| Structured detail | ASCII boxes / tables | terminal feel |
| Emphasis | inline `code` tokens for tech keywords | maps to existing `#ce9178` style |

## 4. Anchor section A — Skills

**Pattern:** 1C — a 3-column ASCII proficiency-bar grid inside a single fenced code block.

- Three columns per row-band: `languages │ data/etl │ ml-ai`, then `cloud │ bi-viz │ tools`.
- `│` vertical dividers between columns; `───` rule under each column header.
- Each skill: label + segmented bar (`▰▰▰▰▰▱▱▱`) representing self-rated proficiency.
- Wide gutters between columns.

**Font size:** bump fenced code blocks from `text-xs` → `text-sm` (~13.5px) in `EditorWorkspace.tsx`.
- **This is a global change** to all fenced code blocks (skills grid, professional-snapshot block, any code). Accepted as desirable. If per-block sizing is later required, it needs special handling (e.g. a sentinel language tag) — out of scope here.

**Proficiency values:** self-rated by Karthik; placeholder levels in the mock are illustrative and will be set during implementation.

## 5. Anchor section B — Experience

**Pattern:** mermaid `flowchart TB`, "take 2" — a thin vertical spine, newest → oldest, with **GWU grouped** to show concurrent roles.

Spine (top → bottom):
```
RestoreFast · AI & Data Engineer   (2025 · now)
        │  2023
      GWU  ──► TA + Systems  (concurrent)
           ──► MSc Data Analytics
        │  2022
DPSY · Financial Analyst           (2022 · 23)
        │
Univ. Mumbai · B.E. CompE          (graduated)
```

- **GWU is a single spine node** that forks to two children (TA/Systems, MSc) marked concurrent — fixes the prior bug where they read as sequential.
- **Year labels on the connecting edges** (mermaid edge labels), not as separate clunky arrow rows.
- **Pink theme** reused from the existing career-path flowchart (`%%{init: themeVariables ...}%%`, `#dd0077`).
- Cleaner arrow placement: single top-down spine.

**Deferred (explicit non-goal for this pass):** the per-role **branch / info segmentation** — i.e. exactly which highlight bullets attach to each node and how they're styled. The structure (spine + forked GWU) is locked; the detail content is a follow-up step.

## 6. Other sections (apply the vocabulary)

Education, Projects, Volunteering, etc. adopt the same vocabulary (ASCII boxes/tables for projects, the existing `/skills`-style tree where it fits) but are **not individually designed in this spec**. They follow the patterns in §3 during implementation, keeping the file internally consistent.

## 7. Content alignment (fold-in)

The current `content/resume.md` header says **"DATA ANALYST"**. The canonical narrative chosen for this project (and already encoded in the chatbot's `KNOWLEDGE_MAP`) is **"AI & Data Engineer."** Since we are rewriting the file, the rewrite adopts the **AI & Data Engineer** identity so the résumé and the chatbot tell one story. This reconciles the divergence flagged earlier.

## 8. Files affected

| File | Change |
|---|---|
| `content/resume.md` | Rewrite: skills grid (1C), experience flowchart (take 2), vocabulary applied throughout, identity → AI & Data Engineer |
| `components/EditorWorkspace.tsx` | Fenced `pre/code` font `text-xs` → `text-sm` (global) |

## 9. Non-goals

- No renderer architecture change (no `rehype-raw`, no new components beyond what exists).
- No changes to chat, providers, or other surfaces.
- Branch/info segmentation of the experience flowchart (separate follow-up).
- Per-section bespoke designs beyond Skills + Experience (vocabulary applied, not individually specced).
- The `.ipynb` enhancement work (separate task, user will brief approach later).

## 10. Verification

- Render `resume.md` in-app, preview mode: skills grid aligns in 3 columns with visible dividers; experience renders as a top-down mermaid flowchart with forked GWU and year edge-labels.
- Toggle code-view: ASCII skills grid remains legible/aligned; mermaid shows as readable source.
- Confirm `text-sm` bump didn't break other code blocks (professional snapshot, etc.).
- No console errors from MermaidDiagram on the new flowchart syntax.
