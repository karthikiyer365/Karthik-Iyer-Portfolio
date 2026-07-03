"use client";

/**
 * Renders a vertical career timeline from a JSON array embedded in a
 * ```timeline fenced block in markdown. Mirrors how MermaidDiagram is wired
 * into EditorWorkspace's markdown renderer. Presentational only.
 *
 * Layout (design: "telescoping rails" / variant B v3):
 *   - Left column: two years — end year (`to`, bright) on top, start year
 *     (`from`, dim) below.
 *   - A single pink rail with a dot at the top. The rail line runs down to the
 *     BOTTOM of the entry's content (same endpoint as the nested rail).
 *   - Content: role + org sit bare (no box). Everything else nests one level
 *     in under a second pink rail of the SAME intensity:
 *       • stack  → pink highlight pill that hugs its text
 *       • concurrent → primary achievement lines (bold label, teal)
 *       • details / projects → unified arrow (›) bullets, dimmed
 *   - Both rails share the same bottom endpoint.
 *
 * Data shape (parsed from the fence body):
 *   [
 *     { "role": "AI & Data Engineer", "org": "RestoreFast", "location": "...",
 *       "from": 2025, "to": 2026, "stack": "Python · MCP · RAG · LLMs · Next.js",
 *       "concurrent": [{ "role": "Comms Module", "note": "· — ..." }] },
 *     { "org": "GWU", "from": 2023, "to": 2025, "projects": [...], "details": [...] },
 *     ...
 *   ]
 */

const PINK = "#dd0077"; // single intensity used for every rail + dot

interface ConcurrentRole {
  role: string;
  note?: string;
}

interface TimelineProject {
  title: string;
  note?: string;
  year?: string;
  link?: string;
}

interface TimelineEntry {
  org: string;
  role?: string;
  location?: string;
  from?: number;
  to?: number;
  stack?: string;
  details?: string[];
  concurrent?: ConcurrentRole[];
  projects?: TimelineProject[];
}

export default function CareerTimeline({ data }: { data: string }) {
  let entries: TimelineEntry[];
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) throw new Error("timeline data must be an array");
    entries = parsed as TimelineEntry[];
  } catch {
    // Fallback: never crash the résumé on a malformed block — show the raw source.
    return (
      <pre className="bg-surface-raised rounded-lg p-4 my-3 border border-line overflow-auto">
        <code className="text-xs text-[#ce9178] font-mono">{data}</code>
      </pre>
    );
  }

  return (
    <div className="my-5 pl-1 font-mono">
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        const hasNest =
          !!entry.stack ||
          !!entry.concurrent?.length ||
          !!entry.details?.length ||
          !!entry.projects?.length;

        return (
          <div key={i} className={`flex gap-2 ${isLast ? "" : "mb-5"}`}>
            {/* Years — end (bright) on top, start (dim) below */}
            <div className="flex w-10 shrink-0 flex-col gap-0.5 pt-px text-right leading-none">
              {entry.to != null && (
                <div className="text-[12px] font-semibold" style={{ color: PINK }}>
                  {entry.to}
                </div>
              )}
              {entry.from != null && entry.from !== entry.to && (
                <div className="text-[12px]" style={{ color: PINK, opacity: 0.35 }}>
                  {entry.from}
                </div>
              )}
            </div>

            {/* Primary rail: dot at top, line stretches to the bottom of content */}
            <div className="flex flex-col items-center self-stretch">
              <span
                className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_3px_#15060d]"
                style={{ backgroundColor: PINK }}
              />
              <span className="my-1 w-px flex-1" style={{ backgroundColor: PINK }} />
            </div>

            {/* Content — no padding-bottom so its bottom aligns with the nested rail */}
            <div className="flex-1">
              {entry.role && (
                <div className="text-[14px] font-semibold text-ink">{entry.role}</div>
              )}
              <div className="mt-px text-[12px] text-ink-secondary">
                {entry.org}
                {entry.location ? `, ${entry.location}` : ""}
              </div>

              {hasNest && (
                <div
                  className="mt-2 flex flex-col gap-1.5 pl-3"
                  style={{ borderLeft: `1px solid ${PINK}` }}
                >
                  {/* Stack — pink highlight pill that hugs its text */}
                  {entry.stack && (
                    <div>
                      <span
                        className="inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-medium text-ink max-w-full"
                        style={{ backgroundColor: "rgba(221,0,119,0.30)" }}
                      >
                        {entry.stack}
                      </span>
                    </div>
                  )}

                  {/* Concurrent → primary achievement lines */}
                  {entry.concurrent && entry.concurrent.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {entry.concurrent.map((c, j) => (
                        <div key={j} className="text-[14px] leading-snug text-accent-teal">
                          <span className="font-semibold">{c.role}</span>
                          <span className="text-ink-secondary">{c.note ? ` ${c.note}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Details + Projects → unified arrow bullets, dimmed */}
                  {((entry.details && entry.details.length > 0) ||
                    (entry.projects && entry.projects.length > 0)) && (
                    <div className="flex flex-col gap-0.5">
                      {entry.details?.map((d, j) => (
                        <div key={`d${j}`} className="text-[14px] leading-snug text-ink-secondary">
                          <span className="text-accent-teal">›</span> {d}
                        </div>
                      ))}
                      {entry.projects?.map((p, j) => (
                        <div key={`p${j}`} className="text-[14px] leading-snug text-ink-secondary">
                          <span className="text-accent-teal">›</span> {p.title}
                          <a href={p.link} className="text-accent-teal hover:underline">{p.note ? ` ${p.note}` : ""}</a>
                          {p.year ? ` · ${p.year}` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
