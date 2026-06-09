import { Pinecone } from "@pinecone-database/pinecone";

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX;
const indexHost = process.env.PINECONE_HOST;
const namespaceEnv = process.env.PINECONE_NAMESPACE;

/** Returns true if Pinecone is configured (API key and index name). */
export function isPineconeConfigured(): boolean {
  return Boolean(apiKey && indexName);
}

let client: Pinecone | null = null;

function getClient(): Pinecone {
  if (!apiKey) throw new Error("PINECONE_API_KEY is not set");
  if (client) return client;
  client = new Pinecone({ apiKey });
  return client;
}

/**
 * Get the index for data operations. Uses PINECONE_INDEX and optional PINECONE_HOST.
 */
function getIndex() {
  const name = indexName;
  if (!name) throw new Error("PINECONE_INDEX is not set");
  const pc = getClient();
  if (indexHost) {
    return pc.index(name, indexHost);
  }
  return pc.index(name);
}

export interface PineconeSearchHit {
  id: string;
  score: number;
  title?: string;
  source?: string;
  content?: string;
  chunk_text?: string;
  [key: string]: unknown;
}

const DEFAULT_TOP_K = 5;

/**
 * Search the Pinecone index by text. Requires an index with integrated embedding.
 * Env: PINECONE_INDEX (required), PINECONE_HOST (required for serverless), PINECONE_NAMESPACE (default: __default__).
 */
export async function queryPineconeByText(
  queryText: string,
  topK: number = DEFAULT_TOP_K
): Promise<PineconeSearchHit[]> {
  if (!indexName) throw new Error("PINECONE_INDEX is not set");
  const ns = (namespaceEnv === undefined || namespaceEnv === "") ? "__default__" : namespaceEnv;
  const index = getIndex();
  const namespace = index.namespace(ns);
  const response = await namespace.searchRecords({
    query: { topK, inputs: { text: queryText } },
  });
  const hits = response?.result?.hits ?? [];
  return hits.map((hit) => {
    const fields = (hit.fields ?? {}) as Record<string, unknown>;
    return {
      id: hit._id,
      score: hit._score,
      title: fields.title as string | undefined,
      source: fields.source as string | undefined,
      content: fields.content as string | undefined,
      chunk_text: fields.chunk_text as string | undefined,
      ...fields,
    };
  });
}
