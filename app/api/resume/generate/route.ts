import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { callOpenRouterChat } from "@/server/ai/llm";

// ponytail: no RAG. Karthik's whole resume (~4K tokens) fits in one prompt, so we
// stuff content/resume.md verbatim instead of retrieving from Pinecone. Add RAG only
// if the master content ever outgrows the model context.
const PERSONA_VOICE: Record<string, string> = {
  recruiter: "Lead with impact and measurable outcomes; frame the background as a fit for the role.",
  "tech-lead": "Lead with architecture, technical depth, and trade-offs.",
  executive: "Lead with business impact, scale, and leadership.",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  // Trust boundary: validate + cap the untrusted JD paste.
  const jdText = typeof body?.jdText === "string" ? body.jdText.slice(0, 12000) : "";
  const persona =
    typeof body?.persona === "string" && body.persona in PERSONA_VOICE
      ? (body.persona as string)
      : "recruiter";
  if (!jdText.trim()) {
    return NextResponse.json({ error: "jdText required" }, { status: 400 });
  }

  try {
    const master = fs.readFileSync(
      path.join(process.cwd(), "content/resume.md"),
      "utf8"
    );
    const result = await callOpenRouterChat({
      max_tokens: 1400,
      messages: [
        {
          role: "system",
          content: `You write Karthik Iyer's resume, tailored to a specific job. His master resume is below — ignore its ASCII bars and JSON timeline formatting, just extract the facts:

${master}

Rules:
- ONE page. Markdown only.
- ${PERSONA_VOICE[persona]}
- Use ONLY facts present in the master resume above. Invent NO skills, metrics, employers, dates, or projects.
- Tailor wording to the job description's language only where a real fact already supports it. Prioritize the most JD-relevant experience; always keep the summary, the most recent role, and education.`,
        },
        { role: "user", content: `Job description:\n${jdText}` },
      ],
    });
    return NextResponse.json({ md: result.content ?? "" });
  } catch (err) {
    console.error("[resume/generate] error", err);
    return NextResponse.json(
      { error: "generation failed" },
      { status: 500 }
    );
  }
}
