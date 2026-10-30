const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
export const OPENROUTER_MODEL = "nvidia/nemotron-3.5-super-vl:free";

export function getOpenRouterApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY ?? null;
}

export type OpenRouterMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> }
  | { role: "tool"; content: string; tool_call_id: string };

export interface OpenRouterChatResult {
  content: string | null;
  tool_calls?: Array<{ id: string; name: string; arguments: string }>;
}

export async function callOpenRouterChat(opts: {
  messages: OpenRouterMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: Array<{ type: "function"; function: { name: string; description: string; parameters: object } }>;
  tool_choice?: "auto" | "required";
}): Promise<OpenRouterChatResult> {
  const key = getOpenRouterApiKey();
  if (!key) throw new Error("Missing OPENROUTER_API_KEY");
  const body: Record<string, unknown> = {
    model: opts.model ?? OPENROUTER_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.max_tokens ?? 700,
    // Nemotron reasons by default and spends ~500-600 of max_tokens on it, truncating
    // replies and JSON. Off = full budget for the answer.
    reasoning: { enabled: false },
  };
  if (opts.tools?.length) {
    body.tools = opts.tools;
    body.tool_choice = opts.tool_choice ?? "auto";
  }
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> } }> };
  const msg = data.choices?.[0]?.message;
  const content = msg?.content ?? null;
  const tool_calls = msg?.tool_calls?.map((tc) => ({ id: tc.id, name: tc.function.name, arguments: tc.function.arguments }));
  return { content, tool_calls };
}
