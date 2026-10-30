"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Lato } from "next/font/google";
import { groupByOrg, type ResumeData } from "@/lib/resume";

// Matches the resume PDF (public/Karthik-Iyer-Resume.pdf) and server/ai/texBuilder.ts.
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"] });

// US Letter at 96dpi (matches @page size in globals.css).
const PAGE_W = 816;
const PAGE_H = 1056;
const PAD = 38;
const PRINT_BUFFER = 28; // print engine lays text slightly taller than screen measure — end content this far above the sheet edge
const AVAIL = PAGE_H - PAD * 2 - PRINT_BUFFER; // usable height
const MIN_SCALE = 0.55; // floor safety net; the 4-bullet budget keeps us well above this.

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function ResumeDocument({ data }: { data: ResumeData }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [over, setOver] = useState(false);
  // MIN_SCALE clamps, but the page is overflow:hidden — past the floor, content is
  // cropped off the sheet. Surface that instead of shipping a resume missing bullets.
  const [clipped, setClipped] = useState(false);

  // Bidirectional one-page fit (all formats):
  //  - overflow  -> scale the content DOWN to fit (reliable), pack from the top.
  //  - underflow -> keep scale 1 and let `justify-content: space-between` distribute
  //    the spare vertical space between sections (fills the page WITHOUT enlarging text).
  // Re-measures on resize / font load.
  useIso(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => {
      const raw = el.scrollHeight;
      if (raw > AVAIL + 1) {
        const fit = AVAIL / raw;
        setOver(true);
        setScale(Math.max(fit, MIN_SCALE));
        setClipped(fit < MIN_SCALE);
      } else {
        setOver(false);
        setScale(1);
        setClipped(false);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [data]);

  return (
    // Fixed 816px page → wrap so it scrolls sideways within its pane on narrow
    // screens instead of dragging the whole editor. Print uses position:absolute
    // (globals.css), so this static wrapper never clips the PDF.
    <div className="overflow-x-auto">
      {clipped && (
        <p className="print:hidden mb-2 text-xs text-red-600">
          Content exceeds one page even at minimum scale — the bottom is cropped. Regenerate with a shorter layout.
        </p>
      )}
    <div
      id="print-resume"
      className="resume-page"
      style={{
        width: PAGE_W,
        height: PAGE_H,
        overflow: "hidden",
        padding: PAD,
        margin: "0 auto",
        fontFamily: lato.style.fontFamily,
      }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${100 / scale}%`,
          // underflow: fixed height + space-between fills the page
          height: over ? "auto" : AVAIL,
          display: "flex",
          flexDirection: "column",
          justifyContent: over ? "flex-start" : "space-between",
        }}
      >
        {/* Centered uppercase name, one contact line with | separators; domains underlined */}
        <header style={{ marginBottom: 5, textAlign: "center" }}>
          <h1 style={{ fontSize: 26, lineHeight: 1.1, fontWeight: 700, letterSpacing: 0.3 }}>
            {data.name.toUpperCase()}
          </h1>
          {data.contact && (
            <p style={{ fontSize: 11.5, color: "#222", marginTop: 2 }}>
              {data.contact.split("·").map((c, i) => {
                const t = c.trim();
                return (
                  <span key={i}>
                    {i > 0 && "  |  "}
                    {/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t) ? (
                      <a href={`https://${t}`} style={{ textDecoration: "underline", color: "inherit" }}>{t}</a>
                    ) : (
                      t
                    )}
                  </span>
                );
              })}
            </p>
          )}
        </header>

        {data.summary && (
          <Section title="Professional Summary">
            <p style={{ fontSize: 12, lineHeight: 1.35, textAlign: "justify" }}>{data.summary}</p>
          </Section>
        )}

        {data.skills?.length > 0 && (
          <Section title="Skills">
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 1, fontSize: 12, lineHeight: 1.35 }}>
              {data.skills.map((g, i) => (
                <div key={i} style={{ display: "contents" }}>
                  <strong>{g.group}</strong>
                  <span>{g.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.education?.length > 0 && (
          <Section title="Education">
            {data.education.map((ed, i) => (
              <Row
                key={i}
                left={<strong>{ed.org}  |  {ed.degree}</strong>}
                right={[ed.location, ed.dates].filter(Boolean).join("  |  ")}
              />
            ))}
          </Section>
        )}

        {data.experience?.length > 0 && (
          <Section title="Work Experience">
            {groupByOrg(data.experience).map((g, i) => (
              <div key={i} style={{ marginBottom: 3 }}>
                <Row left={<strong>{g.org}</strong>} right={g.location ?? ""} />
                {g.roles.map((e, j) => (
                  <div key={j}>
                    <Row left={<strong>{e.role}</strong>} right={e.dates} indent />
                    <Bullets items={e.bullets} />
                  </div>
                ))}
              </div>
            ))}
          </Section>
        )}

        {data.projects?.length > 0 && (
          <Section title="Projects">
            {data.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 3 }}>
                <Row left={<strong>{p.stack ? `${p.name}  |  ${p.stack}` : p.name}</strong>} />
                <Bullets items={p.bullets} />
              </div>
            ))}
          </Section>
        )}

        {((data.leadership?.length ?? 0) > 0 || (data.certifications?.length ?? 0) > 0) && (
          <Section title="Certifications, Publications & Volunteer Experience" last>
            {data.certifications && data.certifications.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 700 }}>Certifications</p>
                <p style={{ fontSize: 12, lineHeight: 1.35, marginBottom: 2 }}>{data.certifications.join("  |  ")}</p>
              </>
            )}
            {data.leadership && data.leadership.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 700 }}>Volunteer &amp; Leadership</p>
                <Bullets items={data.leadership} />
              </>
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

// Bold uppercase title over a full-width black rule (texBuilder \section).
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
    <section style={{ marginBottom: last ? 0 : 5 }}>
      <h2
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
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

// Left / right-aligned line (texBuilder \orgline, \roleline, \eduline, \projline).
function Row({ left, right, indent }: { left: React.ReactNode; right?: string; indent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, fontSize: 12, paddingLeft: indent ? 19 : 0 }}>
      <span>{left}</span>
      {right ? <span style={{ whiteSpace: "nowrap" }}>{right}</span> : null}
    </div>
  );
}

function Bullets({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <ul style={{ listStyle: "disc", paddingLeft: 36, marginTop: 1, marginBottom: 1 }}>
      {items.map((b, i) => (
        <li key={i} style={{ fontSize: 12, lineHeight: 1.35, textAlign: "justify" }}>
          {renderBold(b)}
        </li>
      ))}
    </ul>
  );
}
