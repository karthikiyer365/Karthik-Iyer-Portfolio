import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat } from "@/server/ai/llm";
import { retrieveEvidence, readMaster, loadCorpus, parseJson, normPersona, PERSONA_VOICE } from "@/server/ai/resumeContext";
import { analyzeJd, classifyIndustry, formatReport } from "@/server/ai/keywordMatch";

// Step 1 of the resume flow: given a JD + RAG-retrieved background, ask the candidate
// 3-5 LEADING (pointed at a real gap/strength) yet OPEN (invite a story, not yes/no)
// follow-up questions to sharpen the eventual resume.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jdText = typeof body?.jdText === "string" ? body.jdText.slice(0, 12000) : "";
  const persona = normPersona(body?.persona);
  if (!jdText.trim()) {
    return NextResponse.json({ error: "jdText required" }, { status: 400 });
  }

  try {
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

KARTHIK'S JD-RELEVANT BACKGROUND:
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
    if (!questions.length) {
      return NextResponse.json({ error: "no questions" }, { status: 502 });
    }
    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[resume/questions] error", err);
    return NextResponse.json({ error: "questions failed" }, { status: 500 });
  }
}
