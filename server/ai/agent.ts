import { callOpenRouterChat, getOpenRouterApiKey } from "./llm";
import { getHistory } from "./memory";
import { getPersonaResponse, personas } from "@/lib/personas";
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
            messages,
            tools: TOOL_DEFS,
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
            emit("Composing response...");
            return text;
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
