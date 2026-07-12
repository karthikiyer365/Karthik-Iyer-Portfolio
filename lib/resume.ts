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

export type ResumeState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ResumeData };
