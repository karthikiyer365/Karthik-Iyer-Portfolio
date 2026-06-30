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

  // Bidirectional one-page fit:
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
  }, [data]);

  return (
    <div
      id="print-resume"
      className="resume-page"
      style={{ width: PAGE_W, height: PAGE_H, overflow: "hidden", padding: PAD, margin: "0 auto" }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${100 / scale}%`,
          height: over ? "auto" : AVAIL, // underflow: fixed height + space-between fills it
          display: "flex",
          flexDirection: "column",
          justifyContent: over ? "flex-start" : "space-between",
        }}
      >
        <header style={{ marginBottom: 13 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: 0.3 }}>{data.name}</h1>
          {data.contact && (
            <p style={{ fontSize: 12, color: "#555", marginTop: 3 }}>{data.contact}</p>
          )}
        </header>

        {data.summary && (
          <Section title="Summary">
            <p style={{ fontSize: 12, lineHeight: 1.35 }}>{data.summary}</p>
          </Section>
        )}

        {data.experience?.length > 0 && (
          <Section title="Experience">
            {data.experience.map((e, i) => (
              <Entry key={i} left={e.role} org={e.org} right={e.dates} bullets={e.bullets} />
            ))}
          </Section>
        )}

        {data.projects?.length > 0 && (
          <Section title="Projects">
            {data.projects.map((p, i) => (
              <Entry key={i} left={p.name} bullets={p.bullets} />
            ))}
          </Section>
        )}

        {data.education?.length > 0 && (
          <Section title="Education">
            {data.education.map((ed, i) => (
              <div
                key={i}
                style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}
              >
                <span>
                  <strong>{ed.degree}</strong>
                  {ed.org ? ` — ${ed.org}` : ""}
                </span>
                <span style={{ color: "#555", whiteSpace: "nowrap" }}>{ed.dates}</span>
              </div>
            ))}
          </Section>
        )}

        {data.skills?.length > 0 && (
          <Section title="Skills">
            {data.skills.map((g, i) => (
              <p key={i} style={{ fontSize: 12, lineHeight: 1.35, marginBottom: 2 }}>
                <strong style={{ color: "#222" }}>{g.group}:</strong> {g.items.join(" · ")}
              </p>
            ))}
          </Section>
        )}

        {data.leadership && data.leadership.length > 0 && (
          <Section title="Leadership & Volunteering" last>
            <ul style={{ listStyle: "disc", paddingLeft: 18 }}>
              {data.leadership.map((l, i) => (
                <li key={i} style={{ fontSize: 12, lineHeight: 1.35, marginBottom: 2 }}>
                  {l}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

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
    <section style={{ marginBottom: last ? 0 : 11 }}>
      <h2
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          color: "#222",
          borderBottom: "1px solid #cfcfcf",
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Entry({
  left,
  org,
  right,
  bullets,
}: {
  left: string;
  org?: string;
  right?: string;
  bullets?: string[];
}) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13 }}>
          <strong>{left}</strong>
          {org ? <span style={{ color: "#444" }}> — {org}</span> : null}
        </span>
        {right ? (
          <span style={{ fontSize: 11.5, color: "#555", whiteSpace: "nowrap" }}>{right}</span>
        ) : null}
      </div>
      {bullets && bullets.length > 0 && (
        <ul style={{ listStyle: "disc", paddingLeft: 18, marginTop: 3 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ fontSize: 12, lineHeight: 1.35, marginBottom: 2 }}>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
