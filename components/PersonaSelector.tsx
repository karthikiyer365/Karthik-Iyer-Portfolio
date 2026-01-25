"use client";

import { usePersona } from "@/app/providers";
import { personas } from "@/lib/personas";

export default function PersonaSelector() {
  const { persona, setPersona } = usePersona();

  return (
    <div className="flex border-b border-[#1f1f1f]">
      {personas.map((p) => (
        <button
          key={p.id}
          onClick={() => setPersona(p.id)}
          title={p.description}
          className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
            persona === p.id
              ? "text-[#e5e5e5] border-b-2 border-b-[#3b82f6] bg-[#141414]"
              : "text-[#666666] hover:text-[#a3a3a3] border-b-2 border-b-transparent"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
