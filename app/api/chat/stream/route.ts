import { NextRequest } from "next/server";
import { createChatAgent } from "@/server/ai/agent";
import { addMessage } from "@/server/ai/memory";
import type { Persona } from "@/types/editor";

export async function POST(req: NextRequest) {
  const { sessionId, persona, message } = (await req.json()) as {
    sessionId: string;
    persona: Persona;
    message: string;
  };

  addMessage(sessionId, {
    role: "user",
    content: message,
    timestamp: Date.now(),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        const agent = await createChatAgent(persona, sessionId, {
          onThinkingStep(step) {
            send({ type: "thinking", step });
          },
        });

        const response = await agent.invoke();

        addMessage(sessionId, {
          role: "assistant",
          content: response,
          timestamp: Date.now(),
        });

        send({ type: "done", response });
      } catch (err) {
        send({
          type: "done",
          response: "Sorry, something went wrong. Please try again.",
        });
        console.error("[stream] error", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
