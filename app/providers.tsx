"use client";

import React, { createContext, useContext, useReducer, ReactNode, useState } from "react";
import { EditorState, EditorAction, Persona } from "@/types/editor";
import { editorReducer, initialEditorState } from "@/lib/editorState";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/server/trpc/react";
import { httpLink } from "@trpc/client";

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

  const resetEditor = () =>
    dispatch({ type: "RESET" });

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
  if (!context) {
    throw new Error("useEditor must be used within EditorProvider");
  }
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
  if (!context) {
    throw new Error("usePersona must be used within PersonaProvider");
  }
  return context;
}

/* =========================
   ROOT PROVIDER (ONLY ONE)
========================= */

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpLink({
          url: "/api/trpc",
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <EditorProvider>
          <PersonaProvider>{children}</PersonaProvider>
        </EditorProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
