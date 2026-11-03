import { queryPineconeByText, isPineconeConfigured } from "./pinecone";
// Baked from server/ai/resumeMaster.md + charts/data at build (scripts/bake-master.mjs)
// so the serverless functions bundle it — no runtime fs read (which ENOENTs on Netlify).
import resumeMaster from "./resumeMaster.json";

export const PERSONA_VOICE: Record<string, string> = {
  recruiter: "Lead with impact and measurable outcomes; frame the background as a fit for the role.",
  "tech-lead": "Lead with architecture, technical depth, and trade-offs.",
  executive: "Lead with business impact, scale, and leadership.",
};

// Real contact lives in lib/settings.ts, not resume.md — pass it verbatim so the
// model stops emitting [Email]/[Phone] placeholders.
export const CONTACT =
  "Arlington, VA · karthikiyer365@gmail.com · +1 (202) 713-1699 · github.com/karthikiyer365 · linkedin.com/in/karthikiyer365 · karthikiyer.info";

export function readMaster(): string {
  return resumeMaster.text;
}

// The master resume as structured entries — the only source of titles, orgs, dates,
// education, volunteer and certifications in a generated resume. Parses
// resumeMaster.md's shape: "## SECTION", "### org | location" (projects:
// "### name – subtitle | stack"), "#### role, subtitle | dates", "- bullet".
export interface MasterRole { org: string; location: string; role: string; subtitle?: string; dates: string; bullets: string[] }
export interface MasterProject { id: string; name: string; subtitle?: string; stack: string; bullets: string[] }
export interface Master {
  contact: string;
  summary: string;
  experience: MasterRole[];
  projects: MasterProject[];
  education: { org: string; degree: string; gpa: string; dates: string }[];
  volunteer: { org: string; role: string; dates: string; bullets: string[] }[];
  certifications: string[];
  publication: string;
}

export function parseMaster(text = resumeMaster.text): Master {
  const m: Master = { contact: "", summary: "", experience: [], projects: [], education: [], volunteer: [], certifications: [], publication: "" };
  const pair = (s: string): [string, string] => {
    const i = s.lastIndexOf(" | ");
    return i < 0 ? [s.trim(), ""] : [s.slice(0, i).trim(), s.slice(i + 3).trim()];
  };
  const splitFirst = (s: string, sep: string): [string, string | undefined] => {
    const i = s.indexOf(sep);
    return i < 0 ? [s, undefined] : [s.slice(0, i), s.slice(i + sep.length)];
  };
  let section = "";
  let sub = ""; // ### heading inside CERTIFICATIONS…
  let org = "";
  let location = "";
  let bullets: string[] | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) continue;
    if (line.startsWith("## ")) {
      section = line.slice(3);
      bullets = null;
    } else if (line.startsWith("### ")) {
      const [a, b] = pair(line.slice(4));
      bullets = null;
      if (section === "PROJECTS") {
        const [name, subtitle] = splitFirst(a, " – ");
        const p: MasterProject = { id: name, name, subtitle, stack: b, bullets: [] };
        m.projects.push(p);
        bullets = p.bullets;
      } else {
        [org, location, sub] = [a, b, a];
      }
    } else if (line.startsWith("#### ")) {
      const [head, dates] = pair(line.slice(5));
      const [role, subtitle] = splitFirst(head, ", ");
      if (section === "WORK EXPERIENCE") {
        const r: MasterRole = { org, location, role, subtitle, dates, bullets: [] };
        m.experience.push(r);
        bullets = r.bullets;
      } else if (section === "EDUCATION") {
        const gpa = head.match(/\((C?GPA [^)]+)\)/)?.[1] ?? "";
        m.education.push({ org, degree: head.replace(/\s*\(C?GPA [^)]+\)/, "").trim(), gpa, dates });
      } else {
        // Volunteer: "#### org, role | dates"
        const v = { org: role, role: subtitle ?? "", dates, bullets: [] as string[] };
        m.volunteer.push(v);
        bullets = v.bullets;
      }
    } else if (line.startsWith("- ")) {
      bullets?.push(line.slice(2));
    } else if (!m.contact && section === "") {
      m.contact = line.split(" | ").join(" · ");
    } else if (section === "PROFESSIONAL SUMMARY") {
      m.summary = line;
    } else if (sub === "Certifications") {
      m.certifications = line.split(" | ").map((c) => c.trim());
    } else if (sub === "Publication") {
      m.publication = line;
    }
  }
  return m;
}

// Narrative text from the chart JSONs (hero/storyline/outcomes), baked at build —
// keyword gap analysis input and the fallback when Pinecone is unavailable.
export function loadCorpus(): string {
  return resumeMaster.corpus;
}

// RAG: retrieve the JD-relevant evidence chunks from Pinecone, grouped by role and
// ordered by relevance. Falls back to stuffing if the index is unconfigured/down.
export async function retrieveEvidence(jdText: string): Promise<string> {
  if (!isPineconeConfigured()) return loadCorpus();
  let hits;
  try {
    hits = await queryPineconeByText(jdText, 60);
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
