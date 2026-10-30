import { callOpenRouterChat, getOpenRouterApiKey } from "./llm";
import { getHistory } from "./memory";
import { getPersonaResponse, personas, turnReminder } from "@/lib/personas";
import { TOOL_DEFS, executeTool } from "./tools";
import type { Persona } from "@/types/editor";
import type { OpenRouterMessage } from "./llm";

interface AgentOptions {
  onThinkingStep?: (step: string) => void;
}

export async function createChatAgent(
  persona: Persona,
  sessionId: string,
  options?: AgentOptions
) {
  const hasApiKey = Boolean(getOpenRouterApiKey());
  const emit = options?.onThinkingStep ?? (() => {});

  if (!hasApiKey) {
    return {
      async invoke(): Promise<string> {
        const history = getHistory(sessionId);
        const lastUser = [...history]
          .reverse()
          .find((entry) => entry.role === "user");
        const query = lastUser?.content ?? "";
        emit("Using fallback responses (no API key configured)");
        return getPersonaResponse(persona, query);
      },
    };
  }

  const systemPrompt =
    personas.find((p) => p.id === persona)?.systemPrompt ??
    "You are a helpful assistant.";

  return {
    async invoke(): Promise<string> {
      const history = getHistory(sessionId);
      // Persona of the most recent earlier turn (the last entry is the current question).
      const prevPersona = history.slice(0, -1).reverse().find((e) => e.persona)?.persona;
      const reminder: OpenRouterMessage = { role: "system", content: turnReminder(persona, prevPersona) };
      let messages: OpenRouterMessage[] = [
        { role: "system", content: systemPrompt },
        ...history.map((e) => ({
          role: e.role as "user" | "assistant",
          content: e.content,
        })),
      ];

      emit("Thinking...");

      try {
        for (let round = 0; round < 5; round++) {
          const result = await callOpenRouterChat({
            messages: [...messages, reminder],
            tools: TOOL_DEFS,
            // Nemotron skips retrieval on "auto" and invents details — force one
            // lookup before the first answer.
            tool_choice: round === 0 ? "required" : "auto",
          });
          const toolCalls = result.tool_calls;

          if (toolCalls?.length) {
            messages = [
              ...messages,
              {
                role: "assistant",
                content: result.content,
                tool_calls: toolCalls.map((tc) => ({
                  id: tc.id,
                  type: "function" as const,
                  function: { name: tc.name, arguments: tc.arguments },
                })),
              },
            ];
            for (const tc of toolCalls) {
              emit(`Calling tool: ${tc.name}`);
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(tc.arguments) as Record<string, unknown>;
              } catch {
                /* empty */
              }
              const toolResult = await executeTool(
                sessionId,
                tc.name,
                args
              );
              const preview = toolResult.slice(0, 80);
              emit(`Received result (${toolResult.length} chars): ${preview}...`);
              messages = [
                ...messages,
                { role: "tool", content: toolResult, tool_call_id: tc.id },
              ];
            }
            emit("Looking for more context...");
            continue;
          }

          const text = result.content ?? "";
          if (text) {
            // Model declares its reply shape as a leading [format: x] tag — surface
            // it as a thinking step and strip it from the visible reply.
            const tag = text.match(/^\s*\[format:\s*([a-z_]+)\]\s*/i);
            if (tag) emit(`Response classification: ${tag[1].toLowerCase()}`);
            emit("Composing response...");
            return tag ? text.slice(tag[0].length) : text;
          }
        }

        const last = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");
        return last &&
          "content" in last &&
          typeof last.content === "string"
          ? last.content
          : "";
      } catch (error) {
        console.error("[chat] invoke: agent failed", { error });
        emit("Falling back to static response");
        const lastUser = [...history]
          .reverse()
          .find((e) => e.role === "user");
        return getPersonaResponse(persona, lastUser?.content ?? "");
      }
    },
  };
}
