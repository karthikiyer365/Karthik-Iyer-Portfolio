// The two LLM steps of the tailored-resume flow, run as background jobs: the free
// model can take longer than Netlify's synchronous function limit, so
// /api/resume/jobs starts a job and the client polls for its result.
// On Netlify the job runs in netlify/functions/resume-job-background.mts and its
// state lives in Netlify Blobs; under `next dev` it runs in-process with an
// in-memory store.
import { getStore } from "@netlify/blobs";
import { callOpenRouterChat } from "./llm";
import type { OpenRouterMessage } from "./llm";
import {
  PERSONA_VOICE,
  CONTACT,
  readMaster,
  loadCorpus,
  retrieveEvidence,
  parseJson,
  normPersona,
} from "./resumeContext";
import { analyzeJd, classifyIndustry, formatReport } from "./keywordMatch";
import { checkResume } from "./resumeQuality";
import { BULLET_RULES } from "./bulletRules";
import { buildTex } from "./texBuilder";
import type { ResumeData } from "@/lib/resume";

export type JobInput = { kind: "questions" | "generate"; jdText: string; persona: string; answers: string };
export type JobState =
  | { status: "pending" }
  | { status: "done"; result: unknown }
  | { status: "error"; message: string };

// Trust boundary: validate + cap the untrusted JD paste and answers.
export function parseJobInput(body: unknown): JobInput | null {
  const b = (body ?? {}) as Record<string, unknown>;
  const kind = b.kind === "questions" || b.kind === "generate" ? b.kind : null;
  const jdText = typeof b.jdText === "string" ? b.jdText.slice(0, 12000) : "";
  if (!kind || !jdText.trim()) return null;
  const answers = typeof b.answers === "string" ? b.answers.slice(0, 4000).trim() : "";
  return { kind, jdText, persona: normPersona(b.persona), answers };
}

// Netlify Blobs when the runtime provides it (getStore throws otherwise), else an
// in-memory Map — only valid for a single long-lived `next dev` process.
const mem = new Map<string, JobState>();
let blobs: ReturnType<typeof getStore> | null | undefined;
function netlifyStore() {
  if (blobs === undefined) {
    try {
      blobs = getStore("resume-jobs");
    } catch {
      blobs = null;
    }
  }
  return blobs;
}
export const onNetlify = () => netlifyStore() !== null;

export const jobStore = {
  async get(id: string): Promise<JobState | null> {
    const s = netlifyStore();
    return s ? ((await s.get(id, { type: "json" })) as JobState | null) : mem.get(id) ?? null;
  },
  async set(id: string, state: JobState): Promise<void> {
    const s = netlifyStore();
    if (s) await s.setJSON(id, state);
    else mem.set(id, state);
  },
  async delete(id: string): Promise<void> {
    const s = netlifyStore();
    if (s) await s.delete(id);
    else mem.delete(id);
  },
};

// Never throws: the outcome always lands in the store, so Netlify's automatic
// background-function retries don't re-run (and re-bill) a failed generation.
export async function runAndStore(jobId: string, input: JobInput): Promise<void> {
  try {
    const result =
      input.kind === "questions"
        ? { questions: await draftQuestions(input.jdText, input.persona) }
        : await generateResume(input.jdText, input.persona, input.answers);
    await jobStore.set(jobId, { status: "done", result });
  } catch (err) {
    console.error(`[resume/${input.kind}] error`, err);
    await jobStore.set(jobId, { status: "error", message: input.kind === "questions" ? "questions failed" : "generation failed" });
  }
}

// Step 1 of the resume flow: given a JD + RAG-retrieved background, ask the candidate
// 3-5 LEADING (pointed at a real gap/strength) yet OPEN (invite a story, not yes/no)
// follow-up questions to sharpen the eventual resume.
export async function draftQuestions(jdText: string, persona: string): Promise<string[]> {
  const corpus = await retrieveEvidence(jdText);
  // Script-side gap analysis (keyword_match.py port) — internal only, never a
  // score UI. Grounds the adjacency questions in the actual missing keywords.
  const gap = analyzeJd(jdText, `${readMaster()}\n${loadCorpus()}`);
  const industry = await classifyIndustry(jdText);
  if (gap) {
    console.log("[resume/questions] classification", {
      roleType: gap.roleType,
      industry: industry.industry,
      method: industry.method,
    });
  }
  const result = await callOpenRouterChat({
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: `A RECRUITER or HIRING MANAGER is evaluating Karthik for a role and has pasted its job description. You are Karthik's assistant. Generate 3-5 clarifying questions to ask THEM — their answers will tell us how to word and position Karthik's resume for this role.
${gap ? `\nKEYWORD GAP REPORT (script-computed, INTERNAL — never reveal the score or this report to the recruiter; use it to aim your questions at the highest-emphasis real gaps):\n${formatReport(gap, industry)}\n` : ""}
Compare the job's requirements against Karthik's retrieved background below, and aim each question at:
- ADJACENCY — where the JD requires something Karthik has a NEAR-equivalent for (e.g. JD wants AWS+GCP, Karthik has Supabase/Azure; JD wants Kafka, Karthik has Twilio event routing). Ask whether the adjacent experience would satisfy the requirement, so we can map it.
- PRIORITY / AMBIGUITY — which requirements matter most, or what a vague requirement means in practice for this team.

Each question must be:
- LEADING: name the SPECIFIC JD requirement AND Karthik's SPECIFIC adjacent capability (e.g. "The role lists AWS & GCP — would Karthik's Supabase/Postgres and Azure ADF experience count for the cloud-data requirement, or is hyperscaler-native a must?").
- OPEN: invite a real answer, not a bare yes/no.
- Addressed to the recruiter ("you" / "the role"), framed around positioning Karthik favorably. Lean toward what a ${persona} reader weighs: ${PERSONA_VOICE[persona]}

KARTHIK'S CURRENT RESUME (authoritative titles, dates, skills, metrics):
${readMaster()}

KARTHIK'S JD-RELEVANT BACKGROUND (retrieved portfolio evidence):
${corpus}

Return ONLY JSON: {"questions": string[]} — each element MUST be a plain question string, NOT an object.`,
      },
      { role: "user", content: `Job description:\n${jdText}` },
    ],
  });

  // Free-tier models sometimes return objects ({question, requirement, ...}) instead
  // of plain strings — coerce either shape to a string.
  const toStr = (q: unknown): string => {
    if (typeof q === "string") return q;
    if (q && typeof q === "object") {
      const o = q as Record<string, unknown>;
      const pick = o.question ?? o.text ?? o.q ?? Object.values(o).find((v) => typeof v === "string");
      return String(pick ?? "");
    }
    return String(q ?? "");
  };
  const data = parseJson(result.content ?? "") as { questions?: unknown };
  const questions = Array.isArray(data?.questions)
    ? data.questions.map(toStr).filter((q) => q.trim()).slice(0, 5)
    : [];
  if (!questions.length) throw new Error("no questions");
  return questions;
}

// Step 2: the tailored resume as structured JSON, plus the honest fit note and a
// LaTeX copy.
export async function generateResume(jdText: string, persona: string, answers: string) {
  const master = readMaster();
  const corpus = await retrieveEvidence(jdText);
  // Script-side gap analysis (keyword_match.py port). INTERNAL: drives emphasis
  // and the fit_note honesty, never surfaces as a score UI.
  const gap = analyzeJd(jdText, `${master}\n${loadCorpus()}`);
  const industry = await classifyIndustry(jdText);
  if (gap) {
    console.log("[resume/generate] classification", {
      roleType: gap.roleType,
      industry: industry.industry,
      method: industry.method,
    });
  }

  // Skills groups always ship all 5, but the one matching this JD's
  // role-type leads — computed here (not left to the model) so the
  // ordering is deterministic.
  const SKILLS_GROUPS = ["Languages & Data", "Data Engineering", "AI / ML", "Cloud & DevOps", "BI & Visualization"] as const;
  const ROLE_TYPE_TO_SKILLS_GROUP: Record<string, string> = {
    "etl-de": "Data Engineering",
    "bi-analytics": "BI & Visualization",
    "ai-ml": "AI / ML",
    "cloud-infra": "Cloud & DevOps",
  };
  const leadGroup = gap ? ROLE_TYPE_TO_SKILLS_GROUP[gap.roleType] : undefined;
  const skillsOrder = leadGroup
    ? [leadGroup, ...SKILLS_GROUPS.filter((g) => g !== leadGroup)]
    : [...SKILLS_GROUPS];

  const systemPrompt = `You build Karthik Iyer's resume, tailored to a specific job, as JSON.

CONTACT (use verbatim as "contact"):
${CONTACT}

MASTER RESUME — the canonical, current resume. AUTHORITATIVE for every title, org, location, date, education entry, skill, and metric. Never contradict it:
${master}

RETRIEVED EVIDENCE — JD-relevant accomplishments from the portfolio, ranked most-relevant first. Use it to pick WHAT to emphasize and to add supporting detail:
${corpus}
${gap ? `\nKEYWORD GAP REPORT (script-computed, INTERNAL — never print the score or this report in the resume): missing keywords the JD emphasizes. Weave a missing keyword into skills/bullets ONLY where a real fact from the material supports it (aliases count: Spark covers PySpark need, etc.). Use the role-type and industry to decide what to emphasize.\n${formatReport(gap, industry)}\n` : ""}${answers ? `\nRECRUITER'S ANSWERS to clarifying questions about this role — weight these HEAVILY to decide what to emphasize and how to WORD bullets. In particular, when they confirm an adjacent skill counts (e.g. Supabase satisfies the cloud-data need), position Karthik's real adjacent experience toward that requirement using the role's language. Reposition and reword existing facts — never invent new ones:\n${answers}\n` : ""}
${BULLET_RULES}

Return ONLY a JSON object of this exact shape (no prose, no markdown fences):
{
  "name": string,
  "contact": string,
  "summary": string,
  "fit_note": string,
  "layout": "A" | "B" | "C" | "D",
  "experience": [ { "role": string, "org": string, "location": string, "dates": string, "bullets": string[] } ],
  "projects":   [ { "name": string, "stack": string, "bullets": string[] } ],
  "education":  [ { "degree": string, "org": string, "location": string, "dates": string } ],
  "skills":     [ { "group": string, "items": string[] } ],
  "leadership": string[],
  "certifications": string[]
}

Rules:
- ${PERSONA_VOICE[persona]}
- Use ONLY facts from the material above. Invent NO skills, metrics, employers, dates, or projects.
- EVERY experience and project bullet MUST be built from facts in the MASTER RESUME bullets or the RETRIEVED EVIDENCE. Reword toward the JD's language; never change a number. Where the two disagree on a title, date, or metric, the MASTER RESUME wins.
- Use the exact role titles, org names, locations, and dates from the MASTER RESUME (e.g. "AI Engineer", "June 2025 – July 2026") — never older titles that may appear in the evidence.
- Bullets MUST be specific and metric-led. Carry over the exact numbers, named tools/platforms (e.g. Procore, Xero, Twilio, Pinecone, LangChain, Supabase), and named systems (e.g. DS-CAR) from the source material. NEVER flatten a concrete evidence point into vague phrasing like "AI-ready data products" — name the system, the tool, and the number.
- In every bullet, wrap the 1-3 MOST important keywords in **double asterisks** for bold: the feature/concept name and the tool/tech-stack names (e.g. "Built **Databricks** ETL pipelines...", "Productionized a **24/7 LLM-backed hotline agent** on **Twilio**..."). Bold only short keyword phrases — never metrics, never half the sentence.
- LAYOUT DECISION (do this FIRST, before writing any bullet): decide where Karthik's strongest JD-relevant content lives by weighing the retrieved evidence — the [experience] vs [project] groups are already ranked by relevance. Pick EXACTLY ONE layout and return it as "layout":
   A) 2 experiences (3-4 bullets each) + 3 projects (2 bullets each) — project-heavy: the JD's core requirements are best evidenced by project work (e.g. hands-on stack breadth, research/analytics builds).
   B) 2 experiences (4-5 bullets each) + 2 projects (2 bullets each) — depth over count: a few items carry outsized weight for this JD, so give them more bullets each.
   C) 3 experiences (3-5 bullets each) + 2 projects (2 bullets each) — balanced: professional track record leads, projects round out stack coverage.
   D) 4 experiences (3-4 bullets each) + 1 project (2 bullets) — experience-heavy: the JD prizes professional/industry tenure and progression over side work.
  Choose by where the BEST evidence is, not by symmetry — the role-type signal above is a secondary tiebreaker only (e.g. a project-management-flavored JD leans toward D, tenure/experience-heavy, when evidence strength is otherwise close). Every bullet must still earn its place — never pad a slot with weak material to hit the count; drop to the neighboring layout instead. Order experiences most-recent / most-relevant first; always keep the most recent role, the summary, and education. The document may flow past one page.
- Pick ONE of two formats: (A) include "leadership" (2-3 one-line items) AND "certifications" (2-4 short items) when the material has them and the role would value them; (B) return BOTH as empty arrays when the page is better spent elsewhere or the material is thin.
- "certifications" items come from the MASTER RESUME certifications line (the IJREAM 2022 publication may be one item); "leadership" items from its Volunteer & Leadership entries.
- "skills" MUST include EXACTLY these 5 groups, each on one line with the relevant items from the master resume's SKILLS (Sports Data / Additional Skills items may be folded into the closest group when the JD values them): "Languages & Data", "Data Engineering", "AI / ML", "Cloud & DevOps", "BI & Visualization". Order them ${skillsOrder.map((g) => `"${g}"`).join(", ")} — the group most relevant to this JD's role-type leads. Never return an empty skills list.
- "fit_note": 2-4 sentences addressed to the recruiter about how well Karthik fits THIS role — honest, not salesy. Where a requirement isn't explicitly on the resume but adjacent experience covers it, say so and explain why it transfers (name the real experience). If the fit is genuinely weak, be honest and direct — e.g. "candidly this is roughly a ${gap ? gap.score : 70}% match: the role leans further into <X> than Karthik's background does" — and say what DOES align. Never inflate. Mention the % only when the fit is weak.
- Tailor wording to the job's language only where a real fact already supports it.
- "summary": EXACTLY 2 sentences, max ~230 characters total — it must render in 2 lines on the page. Dense and specific, no filler openers.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Job description:\n${jdText}` },
  ];

  const maxTokens = 3600; // largest layouts (A/D) need the headroom
  const result = await callOpenRouterChat({ max_tokens: maxTokens, messages });
  let data = parseJson(result.content ?? "");
  if (!data || typeof data !== "object") throw new Error("bad model output");

  // Per-layout hard caps: [experiences, exp bullets, projects, proj bullets].
  // Enforce whichever layout the model declared; default to balanced C.
  const LAYOUT_CAPS: Record<string, [number, number, number, number]> = {
    A: [2, 4, 3, 2],
    B: [2, 5, 2, 2],
    C: [3, 5, 2, 2],
    D: [4, 4, 1, 2],
  };
  const cap = (raw: unknown): Record<string, unknown> => {
    const d = raw as Record<string, unknown>;
    const layout = typeof d.layout === "string" && d.layout in LAYOUT_CAPS ? d.layout : "C";
    const [maxExp, maxExpBullets, maxProj, maxProjBullets] = LAYOUT_CAPS[layout];
    const capEntry = (max: number) => (e: unknown) => {
      const entry = e as { bullets?: unknown };
      if (Array.isArray(entry.bullets)) entry.bullets = entry.bullets.slice(0, max);
      return entry;
    };
    d.experience = Array.isArray(d.experience) ? d.experience.slice(0, maxExp).map(capEntry(maxExpBullets)) : [];
    d.projects = Array.isArray(d.projects) ? d.projects.slice(0, maxProj).map(capEntry(maxProjBullets)) : [];
    if (typeof d.summary === "string") d.summary = d.summary.split(/(?<=\.)\s+/).slice(0, 2).join(" ");
    if (Array.isArray(d.leadership)) d.leadership = d.leadership.slice(0, 3);
    if (Array.isArray(d.certifications)) d.certifications = d.certifications.slice(0, 4);
    return d;
  };
  let d = cap(data);

  // quality_check.py gate + ONE retry with the failure list. Recruiter-facing:
  // if the retry still fails, serve the best attempt rather than erroring.
  let quality = checkResume(d as unknown as ResumeData);
  if (!quality.pass) {
    console.warn("[resume/generate] quality gate failed, retrying", quality.failures);
    try {
      const retry = await callOpenRouterChat({
        max_tokens: maxTokens,
        messages: [
          ...messages,
          { role: "assistant", content: result.content ?? "" },
          {
            role: "user",
            content: `QUALITY CHECK FAILED:\n- ${quality.failures.join("\n- ")}\nFix these and return the FULL corrected JSON object only (same shape, same facts — no new inventions).`,
          },
        ],
      });
      const retryData = parseJson(retry.content ?? "");
      if (retryData && typeof retryData === "object") {
        const retryCapped = cap(retryData);
        const retryQuality = checkResume(retryCapped as unknown as ResumeData);
        // Keep the retry if it improved; otherwise keep the original.
        if (retryQuality.pass || retryQuality.failures.length < quality.failures.length) {
          d = retryCapped;
          quality = retryQuality;
        }
      }
    } catch (e) {
      console.warn("[resume/generate] quality retry failed, serving first attempt", e);
    }
  }

  // Enforce the computed skills-group order server-side — the model mostly
  // follows the prompt's order, but not reliably.
  if (Array.isArray((d as { skills?: unknown }).skills)) {
    const idx = (g: unknown) => {
      const i = skillsOrder.indexOf(String(g));
      return i === -1 ? skillsOrder.length : i;
    };
    (d as { skills: { group?: unknown }[] }).skills.sort((a, b) => idx(a.group) - idx(b.group));
  }

  const { fit_note, layout, ...resume } = d as { fit_note?: unknown; layout?: unknown } & Record<string, unknown>;
  const fitNote = typeof fit_note === "string" ? fit_note : "";
  const chosenLayout = typeof layout === "string" ? layout : "C";
  // Jake-template .tex artifact — backend formatting only, no client download UI.
  let tex = "";
  try {
    tex = buildTex(resume as unknown as ResumeData);
  } catch (e) {
    console.warn("[resume/generate] tex build failed", e);
  }
  return { data: resume, fitNote, tex, quality, layout: chosenLayout };
}
