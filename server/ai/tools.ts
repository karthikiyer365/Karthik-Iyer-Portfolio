import { getRelevantHistory, getHistory } from "./memory";
import {
  isPineconeConfigured,
  queryPineconeByText,
  type PineconeSearchHit,
} from "./pinecone";
import { callOpenRouterChat } from "./llm";

export type ToolDef = { type: "function"; function: { name: string; description: string; parameters: { type: "object"; properties: Record<string, { type: string; description?: string; items?: { type: string } }>; required: string[] } } };

export const TOOL_DEFS: ToolDef[] = [
  { type: "function", function: { name: "fetch_relevant_chat_history", description: "Retrieve relevant factoids from session chat history by keywords.", parameters: { type: "object", properties: { query: { type: "string", description: "Keywords to search" } }, required: ["query"] } } },
  { type: "function", function: { name: "get_relevant_info", description: "Semantic search over knowledge base (resume, portfolio).", parameters: { type: "object", properties: { query: { type: "string", description: "Search query" } }, required: ["query"] } } },
  { type: "function", function: { name: "generate_document", description: "Compile fit-match document from job description and highlights.", parameters: { type: "object", properties: { jobDescription: { type: "string", description: "Job description" }, highlights: { type: "array", items: { type: "string" }, description: "Bullet highlights" } }, required: ["jobDescription", "highlights"] } } },
];

/**
 * Execute a tool by name with the given args. Returns the tool result as a string.
 */
export async function executeTool(
  sessionId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "fetch_relevant_chat_history": {
      const query = typeof args.query === "string" ? args.query : "";
      const snippets = getRelevantHistory(sessionId, query);
      return snippets.length > 0 ? snippets.join("\n\n") : "No relevant chat history found.";
    }
    case "get_relevant_info": {
      if (!isPineconeConfigured()) {
        console.warn("[get_relevant_info] Skipped: set PINECONE_API_KEY, PINECONE_INDEX (and PINECONE_HOST for serverless).");
        return "Pinecone is not configured. Set PINECONE_API_KEY, PINECONE_INDEX, and for serverless indexes set PINECONE_HOST (from Pinecone console).";
      }
      try {
        const query = typeof args.query === "string" ? args.query : "";
        const hits = await queryPineconeByText(query, 10);
        console.info("[get_relevant_info]", { query, hitCount: hits.length });
        if (hits.length === 0) return "No relevant documents found.";
        const fmt = (hit: PineconeSearchHit) => {
          const parts: string[] = [];
          if (hit.title != null && String(hit.title).trim()) parts.push(`**${hit.title}**`);
          if (hit.source != null && String(hit.source).trim()) parts.push(`Source: ${hit.source}`);
          const t = hit.content ?? hit.chunk_text ?? (hit.text != null ? String(hit.text) : null);
          if (t != null && String(t).trim()) parts.push(String(t).trim());
          return parts.length > 0 ? parts.join("\n") : `(Record ${hit.id})`;
        };
        return hits.map(fmt).join("\n\n---\n\n");
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[get_relevant_info] Pinecone error", { query: typeof args.query === "string" ? args.query : "", error: msg });
        return `Pinecone search failed: ${msg}. Ensure the index has integrated embedding (text search) and PINECONE_HOST is set for serverless.`;
      }
    }
    case "generate_document": {
      const jobDescription = typeof args.jobDescription === "string" ? args.jobDescription : "";
      const rawHighlights = args.highlights;
      const highlights = Array.isArray(rawHighlights)
        ? rawHighlights.map((h) => String(h))
        : [String(rawHighlights ?? "")];
      const history = getHistory(sessionId);
      const contextSnippet =
        history.length > 0
          ? history
              .slice(-10)
              .map((e) => `${e.role}: ${e.content}`)
              .join("\n")
          : "No prior chat context.";
      const result = await callOpenRouterChat({
        messages: [
          {
            role: "system",
            content:
              "You are a resume writer. Given a job description and bullet-point highlights from a conversation, produce a short fit-match document in markdown: a brief intro paragraph, then a bullet list aligning the candidate's highlights with the role. Use the chat context below only for tone and extra detail. Output valid markdown only.",
          },
          {
            role: "user",
            content: `Job description:\n${jobDescription}\n\nHighlights:\n${highlights.join("\n")}\n\nRecent chat context:\n${contextSnippet}`,
          },
        ],
      });
      return result.content ?? "";
    }
    default:
      return `Unknown tool: ${toolName}`;
  }
}
