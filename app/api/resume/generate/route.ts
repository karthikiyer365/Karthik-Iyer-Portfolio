import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat } from "@/server/ai/llm";
import type { OpenRouterMessage } from "@/server/ai/llm";
import {
  PERSONA_VOICE,
  CONTACT,
  readMaster,
  loadCorpus,
  retrieveEvidence,
  parseJson,
  normPersona,
} from "@/server/ai/resumeContext";
import { analyzeJd, formatReport } from "@/server/ai/keywordMatch";
import { checkResume } from "@/server/ai/resumeQuality";
import { BULLET_RULES } from "@/server/ai/bulletRules";
import { buildTex } from "@/server/ai/texBuilder";
import type { ResumeData } from "@/lib/resume";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  // Trust boundary: validate + cap the untrusted JD paste.
  const jdText = typeof body?.jdText === "string" ? body.jdText.slice(0, 12000) : "";
  const persona = normPersona(body?.persona);
  const answers = typeof body?.answers === "string" ? body.answers.slice(0, 4000).trim() : "";
  if (!jdText.trim()) {
    return NextResponse.json({ error: "jdText required" }, { status: 400 });
  }

  try {
    const master = readMaster();
    const corpus = await retrieveEvidence(jdText);
    // Script-side gap analysis (keyword_match.py port). INTERNAL: drives emphasis
    // and the fit_note honesty, never surfaces as a score UI.
    const gap = analyzeJd(jdText, `${master}\n${loadCorpus()}`);

    const systemPrompt = `You build Karthik Iyer's resume, tailored to a specific job, as JSON.

CONTACT (use verbatim as "contact"):
${CONTACT}

SKILLS & DATES REFERENCE (use ONLY for the skills list, exact titles/dates/locations, and contact — NOT for bullet content; ignore ASCII bars / JSON timeline formatting):
${master}

RETRIEVED EVIDENCE — the JD-relevant accomplishments, ranked most-relevant first. ALL experience and project bullets come from HERE:
${corpus}
${gap ? `\nKEYWORD GAP REPORT (script-computed, INTERNAL — never print the score or this report in the resume): missing keywords the JD emphasizes. Weave a missing keyword into skills/bullets ONLY where a real fact from the material supports it (aliases count: Spark covers PySpark need, etc.). Use the archetype to decide what to emphasize.\n${formatReport(gap)}\n` : ""}${answers ? `\nRECRUITER'S ANSWERS to clarifying questions about this role — weight these HEAVILY to decide what to emphasize and how to WORD bullets. In particular, when they confirm an adjacent skill counts (e.g. Supabase satisfies the cloud-data need), position Karthik's real adjacent experience toward that requirement using the role's language. Reposition and reword existing facts — never invent new ones:\n${answers}\n` : ""}
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
- EVERY experience and project bullet MUST be built from the RETRIEVED EVIDENCE only. The skills/dates reference is for the skills list, titles, dates, and locations — NEVER lift its summary or phrasing into bullets.
- Bullets MUST be specific and metric-led. Carry over the exact numbers, named tools/platforms (e.g. Procore, Xero, Twilio, Databricks, Spark, Pinecone), and named systems (e.g. DS-CAR, AFINN) from the retrieved evidence. NEVER flatten a concrete evidence point into vague phrasing like "AI-ready data products" — name the system, the tool, and the number.
- LAYOUT DECISION (do this FIRST, before writing any bullet): decide where Karthik's strongest JD-relevant content lives by weighing the retrieved evidence — the [experience] vs [project] groups are already ranked by relevance. Pick EXACTLY ONE layout and return it as "layout":
   A) 2 experiences (3-4 bullets each) + 4 projects (2 bullets each) — project-heavy: the JD's core requirements are best evidenced by project work (e.g. hands-on stack breadth, research/analytics builds).
   B) 2 experiences (4-5 bullets each) + 3 projects (2-3 bullets each) — depth over count: a few items carry outsized weight for this JD, so give them more bullets each.
   C) 3 experiences (3-5 bullets each) + 2 projects (2 bullets each) — balanced: professional track record leads, projects round out stack coverage.
   D) 4 experiences (3-4 bullets each) + 1 project (2 bullets) — experience-heavy: the JD prizes professional/industry tenure and progression over side work.
  Choose by where the BEST evidence is, not by symmetry. Every bullet must still earn its place — never pad a slot with weak material to hit the count; drop to the neighboring layout instead. Order experiences most-recent / most-relevant first; always keep the most recent role, the summary, and education. The document may flow past one page.
- Pick ONE of two formats: (A) include "leadership" (2-3 one-line items) AND "certifications" (2-4 short items) when the material has them and the role would value them; (B) return BOTH as empty arrays when the page is better spent elsewhere or the material is thin.
- "skills" MUST use EXACTLY these 5 groups, in this order, each on one line with the relevant items from the master resume: "Languages & Data", "Data Engineering", "AI / ML", "Cloud & DevOps", "BI & Visualization". Never return an empty skills list.
- "fit_note": 2-4 sentences addressed to the recruiter about how well Karthik fits THIS role — honest, not salesy. Where a requirement isn't explicitly on the resume but adjacent experience covers it, say so and explain why it transfers (name the real experience). If the fit is genuinely weak, be honest and direct — e.g. "candidly this is roughly a ${gap ? gap.score : 70}% match: the role leans further into <X> than Karthik's background does" — and say what DOES align. Never inflate. Mention the % only when the fit is weak.
- Tailor wording to the job's language only where a real fact already supports it.`;

    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Job description:\n${jdText}` },
    ];

    const maxTokens = 3600; // largest layouts (A/D) need the headroom
    const result = await callOpenRouterChat({ max_tokens: maxTokens, messages });
    let data = parseJson(result.content ?? "");
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "bad model output" }, { status: 502 });
    }

    // Per-layout hard caps: [experiences, exp bullets, projects, proj bullets].
    // Enforce whichever layout the model declared; default to balanced C.
    const LAYOUT_CAPS: Record<string, [number, number, number, number]> = {
      A: [2, 4, 4, 2],
      B: [2, 5, 3, 3],
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
    return NextResponse.json({ data: resume, fitNote, tex, quality, layout: chosenLayout });
  } catch (err) {
    console.error("[resume/generate] error", err);
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }
}
