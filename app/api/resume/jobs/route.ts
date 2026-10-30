import { NextRequest, NextResponse } from "next/server";
import { jobStore, onNetlify, parseJobInput, runAndStore } from "@/server/ai/resumeJobs";

// Start a resume job (questions | generate) and return its id right away. The work
// runs in netlify/functions/resume-job-background.mts on Netlify (15-min limit),
// in-process under `next dev`.
export async function POST(req: NextRequest) {
  const input = parseJobInput(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "kind and jdText required" }, { status: 400 });

  const jobId = crypto.randomUUID();
  await jobStore.set(jobId, { status: "pending" });

  if (onNetlify()) {
    const res = await fetch(`${req.nextUrl.origin}/.netlify/functions/resume-job-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, ...input }),
    });
    if (res.status !== 202) {
      await jobStore.delete(jobId);
      return NextResponse.json({ error: "could not start job" }, { status: 502 });
    }
  } else {
    void runAndStore(jobId, input);
  }
  return NextResponse.json({ jobId }, { status: 202 });
}

// Poll a job. A finished job is deleted once read.
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("id") ?? "";
  const state = jobId ? await jobStore.get(jobId) : null;
  if (!state) return NextResponse.json({ error: "unknown job" }, { status: 404 });
  if (state.status !== "pending") await jobStore.delete(jobId);
  return NextResponse.json(state);
}
