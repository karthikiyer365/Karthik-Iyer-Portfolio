import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat } from "@/server/ai/llm";
import {
  PERSONA_VOICE,
  CONTACT,
  readMaster,
  retrieveEvidence,
  parseJson,
  normPersona,
} from "@/server/ai/resumeContext";

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

    const result = await callOpenRouterChat({
      max_tokens: 2200,
      messages: [
        {
          role: "system",
          content: `You build Karthik Iyer's resume, tailored to a specific job, as JSON.

CONTACT (use verbatim as "contact"):
${CONTACT}

SKILLS & DATES REFERENCE (use ONLY for the skills list, exact titles/dates, and contact — NOT for bullet content; ignore ASCII bars / JSON timeline formatting):
${master}

RETRIEVED EVIDENCE — the JD-relevant accomplishments, ranked most-relevant first. ALL experience and project bullets come from HERE:
${corpus}
${answers ? `\nRECRUITER'S ANSWERS to clarifying questions about this role — weight these HEAVILY to decide what to emphasize and how to WORD bullets. In particular, when they confirm an adjacent skill counts (e.g. Supabase satisfies the cloud-data need), position Karthik's real adjacent experience toward that requirement using the role's language. Reposition and reword existing facts — never invent new ones:\n${answers}\n` : ""}
Return ONLY a JSON object of this exact shape (no prose, no markdown fences):
{
  "name": string,
  "contact": string,
  "summary": string,
  "experience": [ { "role": string, "org": string, "dates": string, "bullets": string[] } ],
  "projects":   [ { "name": string, "bullets": string[] } ],
  "education":  [ { "degree": string, "org": string, "dates": string } ],
  "skills":     [ { "group": string, "items": string[] } ],
  "leadership": string[]
}

Rules:
- ${PERSONA_VOICE[persona]}
- Use ONLY facts from the material above. Invent NO skills, metrics, employers, dates, or projects.
- EVERY experience and project bullet MUST be built from the RETRIEVED EVIDENCE only. The skills/dates reference is for the skills list, titles, and dates — NEVER lift its summary or phrasing into bullets.
- Bullets MUST be specific and metric-led. Carry over the exact numbers, named tools/platforms (e.g. Procore, Xero, Twilio, Databricks, Spark, Pinecone), and named systems (e.g. DS-CAR, AFINN) from the retrieved evidence. NEVER flatten a concrete evidence point into vague phrasing like "AI-ready data products" — name the system, the tool, and the number.
- Choose EXACTLY ONE of these layouts to fill one page:
   A) 3 experiences, no project.
   B) 2 experiences + 1 project.
  Hard count rules: ALWAYS at least 2 experiences; AT MOST 1 project; experiences + projects total AT MOST 3. Give each EXPERIENCE exactly 4 substantive bullets and the PROJECT 4 bullets. The page auto-fits — do not pad to fill; pick the 4 strongest, most JD-relevant bullets per entry.
- Order experiences most-recent / most-relevant first. Always keep the summary, the most recent role, and education.
- Project bullets must detail the technical stack, methods, and architecture (not just outcomes).
- "skills" MUST be 4-6 labeled groups (e.g. "Languages", "ML / AI", "Data & ETL", "Cloud", "Visualization", "Tools"), each with the relevant items from the master resume. Never return an empty skills list.
- "leadership": 2-4 short one-line items covering leadership, volunteering, or extracurricular achievements from the material. One line each.
- Tailor wording to the job's language only where a real fact already supports it.`,
        },
        { role: "user", content: `Job description:\n${jdText}` },
      ],
    });

    const data = parseJson(result.content ?? "");
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "bad model output" }, { status: 502 });
    }
    // Hard caps: ≥2 experiences, ≤1 project, exp+proj ≤ 3, ≤4 bullets each.
    const d = data as Record<string, unknown>;
    const capEntry = (e: unknown) => {
      const entry = e as { bullets?: unknown };
      if (Array.isArray(entry.bullets)) entry.bullets = entry.bullets.slice(0, 4);
      return entry;
    };
    const exp = Array.isArray(d.experience) ? d.experience.slice(0, 3).map(capEntry) : [];
    const projAllowed = Math.max(0, Math.min(1, 3 - exp.length));
    const proj = Array.isArray(d.projects) ? d.projects.slice(0, projAllowed).map(capEntry) : [];
    d.experience = exp;
    d.projects = proj;
    if (Array.isArray(d.leadership)) d.leadership = d.leadership.slice(0, 4);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[resume/generate] error", err);
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }
}
