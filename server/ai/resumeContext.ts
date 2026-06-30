import fs from "fs";
import path from "path";
import { queryPineconeByText, isPineconeConfigured } from "./pinecone";

export const PERSONA_VOICE: Record<string, string> = {
  recruiter: "Lead with impact and measurable outcomes; frame the background as a fit for the role.",
  "tech-lead": "Lead with architecture, technical depth, and trade-offs.",
  executive: "Lead with business impact, scale, and leadership.",
};

// Real contact lives in lib/settings.ts, not resume.md — pass it verbatim so the
// model stops emitting [Email]/[Phone] placeholders.
export const CONTACT =
  "Washington, DC · karthikiyer365@gmail.com · +1 (202) 713-1699 · linkedin.com/in/karthikiyer365 · github.com/karthikiyer365";

export function readMaster(): string {
  return fs.readFileSync(path.join(process.cwd(), "content/resume.md"), "utf8");
}

// Mine only the narrative text from the chart JSONs (hero/storyline/outcomes) — the
// fallback when Pinecone is unavailable.
export function loadCorpus(): string {
  const dirs = ["charts/data", "charts/data/projects"];
  const parts: string[] = [];
  for (const d of dirs) {
    const dir = path.join(process.cwd(), d);
    let files: string[] = [];
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        const bits: string[] = [];
        if (typeof j.hero === "string") bits.push(j.hero);
        if (typeof j.storyline === "string") bits.push(j.storyline);
        if (j.outcomes && typeof j.outcomes === "object") {
          bits.push(Object.entries(j.outcomes).map(([k, v]) => `${k}: ${v}`).join("; "));
        }
        if (bits.length) parts.push(bits.join("\n"));
      } catch {
        /* skip malformed */
      }
    }
  }
  return parts.join("\n\n---\n\n");
}

// RAG: retrieve the JD-relevant evidence chunks from Pinecone, grouped by role and
// ordered by relevance. Falls back to stuffing if the index is unconfigured/down.
export async function retrieveEvidence(jdText: string): Promise<string> {
  if (!isPineconeConfigured()) return loadCorpus();
  let hits;
  try {
    hits = await queryPineconeByText(jdText, 40);
  } catch (e) {
    console.warn("[resume] retrieval failed, falling back to stuffing", e);
    return loadCorpus();
  }
  if (!hits.length) return loadCorpus();

  const s = (v: unknown) => String(v ?? "").trim();
  const groups = new Map<string, { type: string; role: string; company: string; dates: string; best: number; lines: string[] }>();
  for (const h of hits) {
    const role = s(h.role);
    const company = s(h.company);
    const key = `${role}|${company}`;
    let g = groups.get(key);
    if (!g) {
      g = { type: s(h.type), role, company, dates: s(h.dates), best: h.score ?? 0, lines: [] };
      groups.set(key, g);
    }
    g.best = Math.max(g.best, h.score ?? 0);
    const text = s(h.text);
    const detail = text.includes(" — ") ? text.split(" — ").slice(1).join(" — ") : text;
    g.lines.push(`- ${detail}`);
  }
  return [...groups.values()]
    .sort((a, b) => b.best - a.best)
    .map((g) => `[${g.type}] ${g.role} — ${g.company} · ${g.dates}\n${g.lines.join("\n")}`)
    .join("\n\n");
}

// Tolerate fenced / prose-wrapped JSON from a free-tier model.
export function parseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let raw = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const a = raw.indexOf("{");
    const b = raw.lastIndexOf("}");
    if (a !== -1 && b > a) raw = raw.slice(a, b + 1);
    return JSON.parse(raw);
  }
}

export function normPersona(p: unknown): string {
  return typeof p === "string" && p in PERSONA_VOICE ? p : "recruiter";
}
