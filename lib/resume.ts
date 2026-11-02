// Virtual (non-disk) tab for the generated resume. EditorWorkspace special-cases
// this path the same way it does SETTINGS_PATH.
export const GENERATED_RESUME_PATH = "generated/Tailored Resume.md";
export const GENERATED_RESUME_LABEL = "Tailored Resume.md";

// Structured, tailored resume content — the candidate POOL. Titles, orgs, dates,
// education, volunteer and certifications come verbatim from the master resume;
// the LLM only writes the summary, skills items and bullets. Every bullets array is
// ranked most-relevant first and holds more than fits: lib/resumePacker.ts picks how
// many of each to show so the resume is exactly 2 pages with page 2 ≥ 70% full.
// The templates (ResumeDocument, texBuilder) own all layout.
export interface ResumeEntry {
  role: string;
  subtitle?: string; // "Teaching Assistant | Decision Making & Data Analytics"
  org: string;
  location: string;
  dates: string;
  bullets: string[];
  fill?: number; // page-2 filler priority (lower = added first); undefined = always shown
}

export interface ResumeProject {
  name: string;
  subtitle?: string; // "Name – subtitle"
  stack?: string; // rendered in italics
  bullets: string[];
  fill?: number;
}

export interface ResumeData {
  name: string;
  contact: string; // single line: location · phone · email · links
  summary: string;
  education: { org: string; degree: string; gpa: string; dates: string }[];
  skills: { group: string; items: string[] }[]; // exactly 5, per role family
  experience: ResumeEntry[];
  projects: ResumeProject[];
  volunteer: { org: string; role: string; dates: string; bullets: string[] }[];
  certifications: string[];
  publication: string;
}

// Consecutive roles at the same org render under one org header (e.g. three GWU
// roles) — shared by ResumeDocument and texBuilder so both layouts agree.
export function groupByOrg<E extends { org: string; location?: string }>(
  exps: E[]
): { org: string; location?: string; roles: E[] }[] {
  const groups: { org: string; location?: string; roles: E[] }[] = [];
  for (const e of exps) {
    const last = groups[groups.length - 1];
    if (last && last.org === e.org) last.roles.push(e);
    else groups.push({ org: e.org, location: e.location, roles: [e] });
  }
  return groups;
}

export type ResumeState =
  | { status: "loading"; elapsed?: number } // seconds since the job started
  | { status: "error"; message: string }
  | { status: "ready"; data: ResumeData };
