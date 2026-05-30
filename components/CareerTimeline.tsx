"use client";

/**
 * Renders a vertical career timeline from a JSON array embedded in a
 * ```timeline fenced block in markdown. Mirrors how MermaidDiagram is wired
 * into EditorWorkspace's markdown renderer. Presentational only.
 *
 * Data shape (parsed from the fence body):
 *   [
 *     { "org": "RestoreFast", "role": "AI & Data Engineer", "period": "2025 · now" },
 *     { "org": "GWU", "period": "2023 – 2025", "concurrent": [
 *         { "role": "TA + Systems", "note": "97% tickets" }, ...
 *     ]},
 *     ...
 *   ]
 */

interface ConcurrentRole {
  role: string;
  note?: string;
}

interface TimelineEntry {
  org: string;
  role?: string;
  period?: string;
  concurrent?: ConcurrentRole[];
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
      <pre className="bg-[#1a1a1a] rounded-lg p-4 my-3 border border-[#2a2a2a] overflow-auto">
        <code className="text-xs text-[#ce9178] font-mono">{data}</code>
      </pre>
    );
  }

  return (
    <div className="my-5 pl-1 font-mono">
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return (
          <div key={i} className="flex gap-3">
            {/* Rail: dot + connector */}
            <div className="flex flex-col items-center">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#dd0077] shadow-[0_0_0_3px_#15060d]" />
              {!isLast && <span className="my-1 w-px flex-1 bg-[#dd0077]/50" />}
            </div>

            {/* Content */}
            <div className={isLast ? "flex-1" : "flex-1 pb-5"}>
              <div className="inline-block rounded-md border border-white/80 bg-black px-3 py-1.5">
                <div className="text-[12px] font-semibold text-white">
                  {entry.org}
                  {entry.role ? ` · ${entry.role}` : ""}
                </div>
                {entry.period && (
                  <div className="text-[10px] text-[#dd0077]">{entry.period}</div>
                )}
              </div>

              {entry.concurrent && entry.concurrent.length > 0 && (
                <div className="mt-1.5 ml-3 space-y-1 border-l border-[#dd0077] pl-3">
                  {entry.concurrent.map((c, j) => (
                    <div key={j} className="text-[11px] text-[#4ec9b0]">
                      {c.role}
                      {c.note ? ` · ${c.note}` : ""}
                    </div>
                  ))}
                  <div className="text-[9px] text-[#dcdcaa]">⟂ concurrent</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
