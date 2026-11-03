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
  readMaster,
  parseMaster,
  loadCorpus,
  retrieveEvidence,
  parseJson,
  normPersona,
} from "./resumeContext";
import { analyzeJd, classifyIndustry, formatReport } from "./keywordMatch";
import { checkResume } from "./resumeQuality";
import { BULLET_RULES } from "./bulletRules";
import { buildTex } from "./texBuilder";
import { FAMILY_PROFILES, pickRoleFamily } from "./resumeProfiles";
import { estimateHeight, packResume } from "@/lib/resumePacker";
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

// Step 2: the tailored resume. The JD picks a role family (resumeProfiles), which
// decides the summary title, the 5 skills groups and which roles/projects are core
// vs. page-2 filler. Titles, orgs, dates, education, volunteer and certifications
// come verbatim from the master resume; the LLM writes only the summary, skills
// items and a RANKED pool of bullets per entry. The pool is returned as-is —
// lib/resumePacker.ts picks how much of it fits 2 pages (in the browser with real
// measurements, here with estimates for the LaTeX copy).
export async function generateResume(jdText: string, persona: string, answers: string) {
  const master = parseMaster();
  const family = pickRoleFamily(jdText);
  const profile = FAMILY_PROFILES[family];
  const corpus = await retrieveEvidence(jdText);
  // Script-side gap analysis (keyword_match.py port). INTERNAL: drives emphasis
  // and the fit_note honesty, never surfaces as a score UI.
  const gap = analyzeJd(jdText, `${readMaster()}\n${loadCorpus()}`);
  const industry = await classifyIndustry(jdText);
  console.log("[resume/generate] classification", {
    family,
    roleType: gap?.roleType,
    industry: industry.industry,
    method: industry.method,
  });

  // Experience keeps master (chronological) order; projects follow the profile.
  // Filler priority: projects first, then roles — lower `fill` is added first.
  const expIds = [...profile.experience, ...profile.experienceFiller];
  const exps = master.experience.filter((e) => expIds.includes(e.role));
  const projIds = [...profile.projects, ...profile.projectFiller];
  const projs = projIds.map((id) => master.projects.find((p) => p.id === id)).filter((p) => p !== undefined);
  const expFill = (role: string) => {
    const i = profile.experienceFiller.indexOf(role);
    return i < 0 ? undefined : 100 + i;
  };
  const projFill = (id: string) => {
    const i = profile.projectFiller.indexOf(id);
    return i < 0 ? undefined : i;
  };

  const entryBlock = (key: string, head: string, bullets: string[]) =>
    `[${key}] ${head}\n${bullets.map((b) => `- ${b}`).join("\n")}`;
  const entries = [
    ...exps.map((e, i) => entryBlock(`E${i + 1}`, `${e.role}${e.subtitle ? `, ${e.subtitle}` : ""} — ${e.org} (${e.dates})`, e.bullets)),
    ...projs.map((p, i) => entryBlock(`P${i + 1}`, `${p.name} – ${p.subtitle ?? ""} (${p.stack})`, p.bullets)),
  ].join("\n\n");

  const systemPrompt = `You tailor Karthik Iyer's resume to a job, targeting a ${profile.label} role. Return JSON only.

ENTRIES — Karthik's real roles [E#] and projects [P#] with their master bullets (the ONLY facts you may use, plus the evidence below for the same role/project):
${entries}

RETRIEVED EVIDENCE — JD-relevant detail from the portfolio, for emphasis and supporting facts:
${corpus}

MASTER SKILLS (choose skills items only from these and the entries above):
${readMaster().split("## SKILLS")[1]?.split("## ")[0]?.trim() ?? ""}
${gap ? `\nKEYWORD GAP REPORT (script-computed, INTERNAL — never print it): weave a missing keyword in ONLY where a real fact supports it.\n${formatReport(gap, industry)}\n` : ""}${answers ? `\nRECRUITER'S NOTES about the role — weight HEAVILY when choosing emphasis and wording (reposition real facts, never invent):\n${answers}\n` : ""}
${BULLET_RULES}

Return ONLY this JSON object (no prose, no fences):
{
  "summary": string,
  "fit_note": string,
  "skills": { ${profile.skills.map((g) => `"${g.group}": string[]`).join(", ")} },
  "bullets": { "E1": string[], ..., "P1": string[], ... }
}

Rules:
- ${PERSONA_VOICE[persona]}
- "bullets": for EVERY [E#] and [P#] key above, rewrite that entry's master bullets toward the JD's language, RANKED most relevant to this job first. Return as many as the entry has (you may merge or split, at most one more than given). Never move a fact to a different entry. Never change a number, tool, or name.
- Each bullet: ONE to TWO lines (~25-35 words), plain text — no bold, no markdown. Lead with the action and its object, e.g. "Built ETL data pipelines in Python and SQL loading 6 business systems…".
- "summary": exactly 3 lines on the page — 2-3 sentences, 360-420 characters. It MUST open "${profile.summaryTitle} with 2+ years". Dense and specific; no filler.
- "skills": exactly the 5 groups shown, each 5-9 short items relevant to this JD, most relevant first.
- "fit_note": 2-4 sentences to the recruiter on how well Karthik fits THIS role — honest, not salesy. Where a requirement isn't on the resume but adjacent experience covers it, say so and why it transfers. If the fit is weak, say so plainly${gap ? ` (e.g. "candidly this is roughly a ${gap.score}% match")` : ""} and what does align. Mention a % only when the fit is weak.
- Invent NO skills, metrics, employers, dates, titles, or projects.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Job description:\n${jdText}` },
  ];
  const maxTokens = 4500; // ~30 ranked bullets + summary + skills

  type Raw = { summary?: unknown; fit_note?: unknown; skills?: Record<string, unknown>; bullets?: Record<string, unknown> };
  // 3 lines on the page ≈ 430 chars (~135/line at 9.5pt Times): keep whole
  // sentences up to that — the model overshoots the prompt's range often enough
  // to need a hard cap.
  const capSummary = (text: string) => {
    const [first, ...rest] = text.trim().split(/(?<=\.)\s+/);
    let out = first;
    for (const s of rest) {
      if (`${out} ${s}`.length > 430) break;
      out = `${out} ${s}`;
    }
    return out;
  };
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : []);

  // Merge the LLM output into the master skeleton. Anything the model skipped or
  // mangled falls back to master text, so a partial reply still yields a full resume.
  const build = (raw: Raw): ResumeData => ({
    name: "Karthik Iyer",
    contact: master.contact,
    summary: capSummary(typeof raw.summary === "string" && raw.summary.trim() ? raw.summary : master.summary),
    education: master.education,
    skills: profile.skills.map((g) => {
      const items = strings(raw.skills?.[g.group]);
      return { group: g.group, items: items.length ? items : g.items };
    }),
    experience: exps.map((e, i) => {
      const b = strings(raw.bullets?.[`E${i + 1}`]);
      return { role: e.role, subtitle: e.subtitle, org: e.org, location: e.location, dates: e.dates, bullets: b.length ? b : e.bullets, fill: expFill(e.role) };
    }),
    projects: projs.map((p, i) => {
      const b = strings(raw.bullets?.[`P${i + 1}`]);
      return { name: p.name, subtitle: p.subtitle, stack: p.stack, bullets: b.length ? b : p.bullets, fill: projFill(p.id) };
    }),
    volunteer: master.volunteer,
    certifications: master.certifications,
    publication: master.publication,
  });

  const result = await callOpenRouterChat({ max_tokens: maxTokens, messages, json: true });
  // Unparseable reply → build from master bullets alone (accurate, just untailored)
  // rather than failing the recruiter's request.
  let first: unknown = null;
  try {
    first = parseJson(result.content ?? "");
  } catch (e) {
    console.warn("[resume/generate] unparseable model output, using master bullets", e);
  }
  let raw = (first && typeof first === "object" ? first : {}) as Raw;
  let data = build(raw);

  // quality_check.py gate + ONE retry with the failure list. Recruiter-facing:
  // if the retry still fails, serve the best attempt rather than erroring.
  let quality = checkResume(data);
  if (!quality.pass) {
    console.warn("[resume/generate] quality gate failed, retrying", quality.failures);
    try {
      const retry = await callOpenRouterChat({
        max_tokens: maxTokens,
        json: true,
        messages: [
          ...messages,
          { role: "assistant", content: result.content ?? "" },
          {
            role: "user",
            content: `QUALITY CHECK FAILED:\n- ${quality.failures.join("\n- ")}\nFix these and return the FULL corrected JSON object only (same shape, same facts — no new inventions).`,
          },
        ],
      });
      const retryRaw = parseJson(retry.content ?? "");
      if (retryRaw && typeof retryRaw === "object") {
        const retryData = build(retryRaw as Raw);
        const retryQuality = checkResume(retryData);
        // Keep the retry if it improved; otherwise keep the original.
        if (retryQuality.pass || retryQuality.failures.length < quality.failures.length) {
          [raw, data, quality] = [retryRaw as Raw, retryData, retryQuality];
        }
      }
    } catch (e) {
      console.warn("[resume/generate] quality retry failed, serving first attempt", e);
    }
  }

  const fitNote = typeof raw.fit_note === "string" ? raw.fit_note : "";
  // LaTeX copy — backend artifact, packed with estimated heights.
  let tex = "";
  try {
    tex = buildTex(data, packResume(data, estimateHeight));
  } catch (e) {
    console.warn("[resume/generate] tex build failed", e);
  }
  return { data, fitNote, tex, quality, family };
}
