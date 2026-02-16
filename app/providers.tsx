"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useState,
} from "react";
import { EditorState, EditorAction, FileNode, Persona } from "@/types/editor";
import { editorReducer, initialEditorState } from "@/lib/editorState";

/* =========================
   Editor Context
========================= */

interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  openFile: (path: string, name: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  toggleFolder: (folder: string) => void;
  resetEditor: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  const openFile = (path: string, name: string) =>
    dispatch({ type: "OPEN_FILE", payload: { path, name } });

  const closeFile = (path: string) =>
    dispatch({ type: "CLOSE_FILE", payload: path });

  const setActiveFile = (path: string) =>
    dispatch({ type: "SET_ACTIVE", payload: path });

  const toggleFolder = (folder: string) =>
    dispatch({ type: "TOGGLE_FOLDER", payload: folder });

  const resetEditor = () => dispatch({ type: "RESET" });

  return (
    <EditorContext.Provider
      value={{
        state,
        dispatch,
        openFile,
        closeFile,
        setActiveFile,
        toggleFolder,
        resetEditor,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used within EditorProvider");
  return context;
}

/* =========================
   Persona Context
========================= */

interface PersonaContextType {
  persona: Persona;
  setPersona: (persona: Persona) => void;
}

const PersonaContext = createContext<PersonaContextType | null>(null);

function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>("tech-lead");
  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context)
    throw new Error("usePersona must be used within PersonaProvider");
  return context;
}

/* =========================
   Content Context
========================= */

interface ContentContextType {
  fileTree: FileNode[];
  fileContents: Record<string, string>;
  getContent: (path: string) => string;
}

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({
  fileTree,
  fileContents,
  children,
}: {
  fileTree: FileNode[];
  fileContents: Record<string, string>;
  children: ReactNode;
}) {
  const getContent = (path: string) =>
    fileContents[path] ?? `// File not found: ${path}`;

  return (
    <ContentContext.Provider value={{ fileTree, fileContents, getContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context)
    throw new Error("useContent must be used within ContentProvider");
  return context;
}

/* =========================
   ROOT PROVIDER
========================= */

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <EditorProvider>
      <PersonaProvider>{children}</PersonaProvider>
    </EditorProvider>
  );
}
