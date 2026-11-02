"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ResumeData } from "@/lib/resume";
import {
  CONTENT_HEIGHT,
  PAGE_HEIGHT,
  PAGE_MARGIN,
  PAGE_WIDTH,
  estimateHeight,
  packResume,
  paginate,
  toBlocks,
  type Item,
} from "@/lib/resumePacker";

// Matches server/ai/texBuilder.ts. Typography constants are the ones
// lib/resumePacker.ts's estimateHeight assumes: Times New Roman, body 9.5pt
// (12.67px) on 15px lines, titles (org/role/project) 10.5pt on 17px lines,
// section headings 11pt.
const LINE = 15;
const TITLE = { fontSize: 14, lineHeight: "17px" } as const; // 10.5pt
// Shared by the pages and the off-screen measuring layer — they must match exactly.
const TEXT = { fontFamily: '"Times New Roman", Times, serif', fontSize: 12.67, lineHeight: `${LINE}px`, color: "#000" } as const;

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Two real US Letter pages. Every item of the pool is rendered once off-screen and
// measured; the packer then picks how many bullets fit so the resume is exactly 2
// pages with page 2 ≥ 70% full, and blocks (a whole role/project, a heading with its
// first entry) are laid onto pages without ever splitting.
export default function ResumeDocument({ data }: { data: ResumeData }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<Map<string, number> | null>(null);

  // Everything in the pool, so each item has a measured height.
  const poolItems = useMemo(() => {
    const all = toBlocks(data, {
      exp: data.experience.map((e) => e.bullets.length),
      proj: data.projects.map((p) => p.bullets.length),
      vol: data.volunteer.map((v) => v.bullets.length),
    });
    return all.flatMap((b) => b.items);
  }, [data]);

  useIso(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => {
      const m = new Map<string, number>();
      el.querySelectorAll<HTMLElement>("[data-item]").forEach((n) => m.set(n.dataset.item!, n.getBoundingClientRect().height));
      setHeights(m);
    };
    measure();
    // Re-measure once fonts settle — fallback-font heights would mis-pack.
    document.fonts?.ready.then(measure).catch(() => {});
  }, [poolItems]);

  const pages = useMemo(() => {
    const measure = (it: Item) => heights?.get(it.id) ?? estimateHeight(it);
    const sel = packResume(data, measure);
    return paginate(toBlocks(data, sel), measure).pages;
  }, [data, heights]);

  return (
    // Fixed 816px pages → wrap so they scroll sideways within the pane on narrow
    // screens. Print positions #print-resume absolutely (globals.css).
    <div className="overflow-x-auto">
      {/* print:hidden — invisible but still tall, it would print as extra blank sheets. */}
      <div ref={measureRef} aria-hidden className="print:hidden" style={{ position: "absolute", left: -10000, top: 0, width: PAGE_WIDTH - 2 * PAGE_MARGIN, visibility: "hidden", ...TEXT }}>
        {poolItems.map((it) => (
          <div key={it.id} data-item={it.id}>
            <ItemView it={it} />
          </div>
        ))}
      </div>
      <div id="print-resume" className="flex flex-col gap-6 items-center">
        {pages.map((blocks, p) => (
          <div
            key={p}
            className="resume-page"
            style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, padding: PAGE_MARGIN, boxSizing: "border-box", overflow: "hidden", ...TEXT }}
          >
            <div style={{ height: CONTENT_HEIGHT }}>
              {blocks.map((b) => (
                <div key={b.id} style={{ breakInside: "avoid" }}>
                  {b.items.map((it) => (
                    <ItemView key={it.id} it={it} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// "Download PDF": print ONLY the resume pages, from a blank iframe — printing the
// app itself lets site styling (dark background, layout height, browser
// headers/footers) leak into the PDF. Pages use inline styles, so copying their
// HTML carries the full layout; the iframe's <title> becomes the PDF filename.
export function printResume() {
  const pages = document.getElementById("print-resume");
  if (!pages) return;
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Karthik Iyer - Resume</title><style>
    @page { size: letter; margin: 0; }
    * { box-sizing: border-box; } /* same as the app's base styles the pages were measured under */
    html, body { margin: 0; padding: 0; background: #fff; }
    .resume-page { break-after: page; overflow: hidden; }
    .resume-page:last-child { break-after: auto; }
    a { color: inherit; }
  </style></head><body>${pages.innerHTML}</body></html>`);
  doc.close();
  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 1000);
}

// Bullets are plain text; strip any stray **bold** markers the model still emits.
const plain = (text: string) => text.replace(/\*\*/g, "");

const SEP = <span style={{ padding: "0 5px" }}>|</span>;
const row = { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 } as const;

// Spacing is padding only (never margin) so an item measured alone is exactly as
// tall as it is in a page.
function ItemView({ it }: { it: Item }) {
  switch (it.kind) {
    case "header": {
      const parts = it.contact.split("·").map((c) => c.trim());
      return (
        <div style={{ textAlign: "center", paddingBottom: 2 }}>
          <div style={{ fontSize: 26.67, lineHeight: "30px", fontWeight: 700 }}>{it.name}</div>
          <div style={{ fontSize: 12, lineHeight: "15px" }}>
            {parts.map((c, i) => (
              <span key={i} style={{ whiteSpace: "nowrap" }}>
                {i > 0 && SEP}
                {/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(c) ? (
                  <a href={`https://${c}`} style={{ textDecoration: "underline", color: "inherit" }}>{c}</a>
                ) : (
                  c
                )}
              </span>
            ))}
          </div>
        </div>
      );
    }
    case "heading":
      return (
        <div style={{ paddingTop: 5, paddingBottom: 2 }}>
          <div style={{ fontSize: 14.67, lineHeight: "18px", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #000", paddingBottom: 1 }}>{it.text}</div>
        </div>
      );
    case "summary":
      return <div style={{ textAlign: "justify" }}>{it.text}</div>;
    case "edu":
      return (
        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <strong>{it.org}</strong>
          {SEP}
          {it.degree}
          {SEP}
          {it.gpa}
          {SEP}
          {it.dates}
        </div>
      );
    case "skill":
      return (
        <div>
          <strong>{it.group}:</strong> {it.items}
        </div>
      );
    case "org":
      return (
        <div style={{ ...row, ...TITLE, paddingTop: 2 }}>
          <strong>{it.org}</strong>
          <span style={{ whiteSpace: "nowrap" }}>{it.location}</span>
        </div>
      );
    case "role":
      return (
        <div style={{ ...row, ...TITLE, paddingLeft: 19 }}>
          <span>
            <strong>{it.role}</strong>
            {it.subtitle && (
              <>
                {SEP}
                {it.subtitle}
              </>
            )}
          </span>
          <span style={{ whiteSpace: "nowrap" }}>{it.dates}</span>
        </div>
      );
    case "proj":
      return (
        <div style={{ ...TITLE, paddingTop: 2 }}>
          <strong>
            {it.name}
            {it.subtitle ? ` – ${it.subtitle}` : ""}
          </strong>
          {it.stack && (
            <>
              {SEP}
              <em>{it.stack}</em>
            </>
          )}
        </div>
      );
    case "bullet":
      return (
        <div style={{ display: "flex", paddingLeft: 12 }}>
          <span style={{ width: 14, flexShrink: 0 }}>•</span>
          <span style={{ textAlign: "justify" }}>{plain(it.text)}</span>
        </div>
      );
    case "vol":
      return (
        <div style={row}>
          <span>
            <strong>{it.org}</strong>
            {SEP}
            {it.role}
          </span>
          <span style={{ whiteSpace: "nowrap" }}>{it.dates}</span>
        </div>
      );
    case "cert":
      return (
        <div>
          <strong>{it.label}:</strong> {it.text}
        </div>
      );
  }
}
