"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { EditorState, EditorAction, Persona } from "@/types/editor";
import { editorReducer, initialEditorState } from "@/lib/editorState";

interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  openFile: (path: string, name: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  toggleFolder: (folder: string) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  const openFile = (path: string, name: string) => {
    dispatch({ type: "OPEN_FILE", payload: { path, name } });
  };

  const closeFile = (path: string) => {
    dispatch({ type: "CLOSE_FILE", payload: path });
  };

  const setActiveFile = (path: string) => {
    dispatch({ type: "SET_ACTIVE", payload: path });
  };

  const toggleFolder = (folder: string) => {
    dispatch({ type: "TOGGLE_FOLDER", payload: folder });
  };

  return (
    <EditorContext.Provider
      value={{
        state,
        dispatch,
        openFile,
        closeFile,
        setActiveFile,
        toggleFolder,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}

// Persona context
interface PersonaContextType {
  persona: Persona;
  setPersona: (persona: Persona) => void;
}

const PersonaContext = createContext<PersonaContextType | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = React.useState<Persona>("tech-lead");

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
}

// Combined providers
export function Providers({ children }: { children: ReactNode }) {
  return (
    <EditorProvider>
      <PersonaProvider>{children}</PersonaProvider>
    </EditorProvider>
  );
}
