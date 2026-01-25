"use client";

import { useState, useRef, useEffect } from "react";
import { usePersona } from "@/app/providers";
import PersonaSelector from "./PersonaSelector";
import { getPersonaResponse } from "@/lib/personas";
import { ChatMessage } from "@/types/editor";

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Welcome to my portfolio. I can answer questions about my skills, projects, and experience. The response style adapts based on the persona you select above.",
  },
];

export default function ChatPanel() {
  const { persona } = usePersona();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const response = getPersonaResponse(persona, input);
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col w-80 h-full bg-[#141414] border-l border-[#1f1f1f] shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between h-9 px-3 border-b border-[#1f1f1f] shrink-0">
        <span className="text-xs font-medium text-[#a3a3a3]">Ask about my work</span>
        <button
          onClick={() => setMessages(initialMessages)}
          className="p-1 text-[#666666] hover:text-[#a3a3a3] transition-colors"
          title="New Chat"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Persona Selector */}
      <PersonaSelector />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] px-3 py-2 rounded text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1f1f1f] text-[#a3a3a3]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#1f1f1f] shrink-0">
        <div className="flex items-end gap-2 bg-[#0a0a0a] rounded border border-[#1f1f1f] focus-within:border-[#3b82f6]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about skills, projects, experience..."
            rows={2}
            className="flex-1 px-3 py-2 bg-transparent text-sm text-[#e5e5e5] placeholder-[#444444] resize-none focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 m-1 rounded bg-[#3b82f6] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#2563eb] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[#444444] text-center">
          Enter to send
        </p>
      </div>
    </div>
  );
}
