export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
