"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ResumeData } from "@/lib/resume";

// US Letter at 96dpi.
const PAGE_W = 816;
const PAGE_H = 1056;
const PAD = 52;
const AVAIL = PAGE_H - PAD * 2; // usable height
const MIN_SCALE = 0.55; // floor safety net; the 4-bullet budget keeps us well above this.

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function ResumeDocument({ data }: { data: ResumeData }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [over, setOver] = useState(false);

  // Extended format (3 experiences / 2 projects) is inferred from the content —
  // no prop threading. It flows naturally past one page; print paginates onto
  // sheet 2 (print CSS is position:absolute + visible overflow).
  const isExtended =
    (data.experience?.length ?? 0) > 2 || (data.projects?.length ?? 0) > 1;

  // Bidirectional one-page fit (standard format only):
  //  - overflow  -> scale the content DOWN to fit (reliable), pack from the top.
  //  - underflow -> keep scale 1 and let `justify-content: space-between` distribute
  //    the spare vertical space between sections (fills the page WITHOUT enlarging text).
  // Re-measures on resize / font load.
  useIso(() => {
    const el = innerRef.current;
    if (!el) return;
    if (isExtended) {
      setOver(false);
      setScale(1);
      return;
    }
    const measure = () => {
      const raw = el.scrollHeight;
      if (raw > AVAIL + 1) {
        setOver(true);
        setScale(Math.max(AVAIL / raw, MIN_SCALE));
      } else {
        setOver(false);
        setScale(1);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [data, isExtended]);

  return (
    // Fixed 816px page → wrap so it scrolls sideways within its pane on narrow
    // screens instead of dragging the whole editor. Print uses position:absolute
    // (globals.css), so this static wrapper never clips the PDF.
    <div className="overflow-x-auto">
    <div
      id="print-resume"
      className="resume-page"
      style={{
        width: PAGE_W,
        // Extended: natural height (≥1 page), content flows to sheet 2 in print.
        height: isExtended ? "auto" : PAGE_H,
        minHeight: PAGE_H,
        overflow: isExtended ? "visible" : "hidden",
        padding: PAD,
        margin: "0 auto",
        // Jake template preamble: Helvetica (\usepackage{helvet}, \sfdefault)
        fontFamily: "Helvetica, Arial, sans-serif",
      }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${100 / scale}%`,
          // standard underflow: fixed height + space-between fills the page
          height: isExtended || over ? "auto" : AVAIL,
          display: "flex",
          flexDirection: "column",
          justifyContent: isExtended || over ? "flex-start" : "space-between",
        }}
      >
        {/* Jake heading: centered small-caps name, one contact line with | separators */}
        <header style={{ marginBottom: 10, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontVariant: "small-caps", letterSpacing: 0.5 }}>
            {data.name}
          </h1>
          {data.contact && (
            <p style={{ fontSize: 11.5, color: "#333", marginTop: 3 }}>
              {data.contact.split("·").map((c) => c.trim()).join("  |  ")}
            </p>
          )}
        </header>

        {data.summary && (
          <Section title="Summary">
            <p style={{ fontSize: 12, lineHeight: 1.35 }}>{data.summary}</p>
          </Section>
        )}

        {data.skills?.length > 0 && (
          <Section title="Skills">
            {data.skills.map((g, i) => (
              <p key={i} style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <strong style={{ color: "#111" }}>{g.group}:</strong> {g.items.join(", ")}
              </p>
            ))}
          </Section>
        )}

        {data.experience?.length > 0 && (
          <Section title="Experience">
            {data.experience.map((e, i) => (
              <Entry
                key={i}
                topLeft={e.org}
                topRight={e.location ?? ""}
                subLeft={e.role}
                subRight={e.dates}
                bullets={e.bullets}
              />
            ))}
          </Section>
        )}

        {data.projects?.length > 0 && (
          <Section title="Projects">
            {data.projects.map((p, i) => (
              <Entry
                key={i}
                topLeft={p.name}
                topLeftExtra={p.stack}
                bullets={p.bullets}
              />
            ))}
          </Section>
        )}

        {data.education?.length > 0 && (
          <Section title="Education">
            {data.education.map((ed, i) => (
              <Entry
                key={i}
                topLeft={ed.org}
                topRight={ed.location ?? ""}
                subLeft={ed.degree}
                subRight={ed.dates}
              />
            ))}
          </Section>
        )}

        {((data.leadership?.length ?? 0) > 0 || (data.certifications?.length ?? 0) > 0) && (
          <Section title="Leadership & Certifications" last>
            {data.leadership && data.leadership.length > 0 && (
              <p style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 1 }}>
                <strong style={{ color: "#111" }}>Leadership:</strong> {data.leadership.join("; ")}
              </p>
            )}
            {data.certifications && data.certifications.length > 0 && (
              <p style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 1 }}>
                <strong style={{ color: "#111" }}>Certifications:</strong> {data.certifications.join(", ")}
              </p>
            )}
          </Section>
        )}
      </div>
    </div>
    </div>
  );
}

// Bullets carry **keyword** markers from the LLM (tools/concepts). Render them
// as <strong> — a two-line split beats pulling in a markdown renderer per <li>.
function renderBold(text: string) {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((seg, i) => (i % 2 ? <strong key={i}>{seg}</strong> : seg));
}

// Jake \section: small-caps title over a full-width black titlerule.
function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section style={{ marginBottom: last ? 0 : 9 }}>
      <h2
        style={{
          fontSize: 14.5,
          fontWeight: 600,
          fontVariant: "small-caps",
          letterSpacing: 0.4,
          color: "#000",
          borderBottom: "1px solid #000",
          paddingBottom: 1,
          marginBottom: 4,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

// Jake \resumeSubheading: bold left / plain right, then italic left / italic right.
// Project headings use topLeftExtra for the " | stack" suffix and no second line.
function Entry({
  topLeft,
  topLeftExtra,
  topRight,
  subLeft,
  subRight,
  bullets,
}: {
  topLeft: string;
  topLeftExtra?: string;
  topRight?: string;
  subLeft?: string;
  subRight?: string;
  bullets?: string[];
}) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12.5 }}>
          <strong>{topLeft}</strong>
          {topLeftExtra ? (
            <span style={{ color: "#333" }}>
              {" | "}
              <em>{topLeftExtra}</em>
            </span>
          ) : null}
        </span>
        {topRight ? (
          <span style={{ fontSize: 12, color: "#333", whiteSpace: "nowrap" }}>{topRight}</span>
        ) : null}
      </div>
      {(subLeft || subRight) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          {subLeft ? <em style={{ fontSize: 11.5, color: "#333" }}>{subLeft}</em> : <span />}
          {subRight ? (
            <em style={{ fontSize: 11.5, color: "#333", whiteSpace: "nowrap" }}>{subRight}</em>
          ) : null}
        </div>
      )}
      {bullets && bullets.length > 0 && (
        <ul style={{ listStyle: "disc", paddingLeft: 18, marginTop: 2 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ fontSize: 12, lineHeight: 1.35, marginBottom: 2 }}>
              {renderBold(b)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
