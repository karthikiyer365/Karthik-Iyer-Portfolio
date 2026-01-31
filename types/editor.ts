export interface FileNode {
  name: string;
  type: "folder" | "file";
  path: string;
  children?: FileNode[];

  // NEW (optional)
  table?: "projects" | "exp" | "skillset" | "contact";
  recordId?: string;
}

export interface EditorTab {
  path: string;
  name: string;
}

export interface EditorState {
  openFiles: EditorTab[];
  activeFile: string | null;
  expandedFolders: string[];
}

export type EditorAction =
  | { type: "OPEN_FILE"; payload: { path: string; name: string } }
  | { type: "CLOSE_FILE"; payload: string }
  | { type: "SET_ACTIVE"; payload: string }
  | { type: "TOGGLE_FOLDER"; payload: string }
  | { type: "RESET" };

export type Persona = "recruiter" | "tech-lead" | "executive";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
