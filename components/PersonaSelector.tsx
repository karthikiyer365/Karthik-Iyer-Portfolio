"use client";

import { usePersona } from "@/app/providers";
import { personas } from "@/lib/personas";

export default function PersonaSelector() {
  const { persona, setPersona } = usePersona();

  return (
    <div className="flex border-b border-line-subtle">
      {personas.map((p) => (
        <button
          key={p.id}
          onClick={() => setPersona(p.id)}
          title={p.description}
          className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
            persona === p.id
              ? "text-ink border-b-2 border-b-[#3b82f6] bg-surface-3"
              : "text-ink-muted hover:text-ink-secondary border-b-2 border-b-transparent"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
