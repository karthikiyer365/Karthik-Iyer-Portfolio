import type { Persona } from "@/types/editor";

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  // Persona active when the turn happened — lets the agent spot a mid-chat switch.
  persona?: Persona;
}
