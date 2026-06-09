import type { ChatHistoryEntry } from "./types";

const store = new Map<string, ChatHistoryEntry[]>();

export function addMessage(sessionId: string, entry: ChatHistoryEntry): void {
  const h = store.get(sessionId) ?? [];
  h.push(entry);
  store.set(sessionId, h);
}

export function getHistory(sessionId: string): ChatHistoryEntry[] {
  return store.get(sessionId) ?? [];
}

export function getRelevantHistory(sessionId: string, query: string): string[] {
  const h = store.get(sessionId) ?? [];
  const kw = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const fmt = (e: ChatHistoryEntry) => `${e.role}: ${e.content}`;
  if (!kw.length) return h.map(fmt).slice(-10);
  const out = h.filter((e) => kw.some((k) => e.content.toLowerCase().includes(k))).map(fmt);
  return out.length ? out : h.map(fmt).slice(-5);
}

export function clearSession(sessionId: string): void {
  store.delete(sessionId);
}
