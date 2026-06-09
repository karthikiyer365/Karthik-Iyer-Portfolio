import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/server/ai/memory";

export async function POST(req: NextRequest) {
  const { sessionId } = (await req.json()) as { sessionId: string };
  clearSession(sessionId);
  return NextResponse.json({ ok: true });
}
