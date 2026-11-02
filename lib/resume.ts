// Virtual (non-disk) tab for the generated resume. EditorWorkspace special-cases
// this path the same way it does SETTINGS_PATH.
export const GENERATED_RESUME_PATH = "generated/Tailored Resume.md";
export const GENERATED_RESUME_LABEL = "Tailored Resume.md";

// Structured, tailored resume content. The LLM fills this from Karthik's master
// resume; the template (ResumeDocument) owns all layout. Keeping content and layout
// separate is what makes "fits one page" a code job, not an LLM guess.
export interface ResumeData {
  name: string;
  contact: string; // single line: location · email · phone · links
  summary: string;
  experience: { role: string; org: string; location?: string; dates: string; bullets: string[] }[];
  projects: { name: string; stack?: string; bullets: string[] }[];
  education: { degree: string; org: string; location?: string; dates: string }[];
  skills: { group: string; items: string[] }[];
  // Format A includes both; format B omits both (LLM's layout call).
  leadership?: string[];
  certifications?: string[];
}

type Experience = ResumeData["experience"][number];

// Consecutive roles at the same org render under one org header (e.g. three GWU
// roles) — shared by ResumeDocument and texBuilder so both layouts agree.
export function groupByOrg(exps: Experience[]): { org: string; location?: string; roles: Experience[] }[] {
  const groups: { org: string; location?: string; roles: Experience[] }[] = [];
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
