import type { Config } from "@netlify/functions";
import { parseJobInput, runAndStore } from "../../server/ai/resumeJobs";

// Runs one resume job (questions | generate) for /api/resume/jobs. Background mode:
// the caller gets an immediate 202 and the function has up to 15 minutes, so a slow
// free model can't hit the synchronous function time limit.
export default async (req: Request) => {
  const body = (await req.json().catch(() => null)) as { jobId?: unknown } | null;
  const input = parseJobInput(body);
  if (!input || typeof body?.jobId !== "string") return;
  await runAndStore(body.jobId, input);
};

export const config: Config = { background: true };
