"use client";

import { useState, useRef, useEffect } from "react";
import { usePersona } from "@/app/providers";
import { getPersonaResponse, personas } from "@/lib/personas";
import { ChatMessage, Persona } from "@/types/editor";
const TYPING_SPEED = 20; // ms per character


const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Welcome to my portfolio. I can answer questions about my skills, projects, and experience. Select a persona below to change the response style.",
  },
];

export default function ChatPanel() {
  const { persona, setPersona } = usePersona();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
  
    // Stop any existing typing (safety net)
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
  
    const fullResponse = getPersonaResponse(persona, input);
    const assistantId = (Date.now() + 1).toString();
  
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
  
    // Push messages
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsTyping(true);
  
    let index = 0;
  
    typingIntervalRef.current = setInterval(() => {
      index++;
  
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: fullResponse.slice(0, index) }
            : msg
        )
      );
  
      if (index >= fullResponse.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTyping(false);
      }
    }, TYPING_SPEED);
  };
  
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col w-80 h-full bg-[#1e1e1e] border-l border-[#1f1f1f] shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between h-9 px-3 border-b border-[#1f1f1f] shrink-0">
        <span className="text-xs font-medium text-[#a3a3a3]">Ask about my work</span>
        <button
          onClick={() => setMessages(initialMessages)}
          className="p-1 text-[#666666] hover:text-[#a3a3a3] transition-colors"
          title="Reset Chat"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-1 space-y-2 typed-messages">
      {messages.map((msg) => (
  <div key={msg.id}>
    {msg.role === "user" ? (
      /* User message: full-width grey bar */
      <div className="w-full max-h-20 text-white text-sm leading-relaxed px-4 py-2 bg-[#3C3C3C] rounded-xl border border-[#3a3a3a] ]">
        {msg.content.slice(0, 80)}
      </div>
    ) : (
      /* Assistant message: plain text, no box */
      <div className="text-sm leading-relaxed text-white px-1">
        {msg.content}
      </div>
    )}
  </div>
))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Floating with shadow */}
      <div className="p-3 shrink-0">
        <div 
          className="bg-[#3C3C3C] rounded-xl border border-[#3a3a3a] ]"
        >
          {/* Textarea */}
          <div className="px-2 pt-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="questions "
              rows={2}
              className="w-full bg-transparent text-sm text-[#e5e5e5] placeholder-[#555555] resize-none focus:outline-none"
            />
          </div>

          {/* Bottom row - Dropdown and Send button */}
          <div className="flex items-center justify-between px-3 pb-3">
            {/* Persona Dropdown */}
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as Persona)}
              className="px-3 py-1.5 bg-[#2a2a2a] text-[#a3a3a3] text-xs rounded-full border-none cursor-pointer focus:outline-none hover:bg-[#333333] transition-colors appearance-none pr-7"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px',
              }}
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Send Button - Light grey circle with arrow */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full bg-[#4a4a4a] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#5a5a5a] transition-colors"
              title="Send"
            >
              <svg 
                className="w-4 h-4" 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <path
                  d="M12 19V5M12 5l-6 6M12 5l6 6"
                  stroke="#1e1e1e"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
