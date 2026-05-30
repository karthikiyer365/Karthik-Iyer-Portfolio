"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePersona } from "@/app/providers";
import { personas } from "@/lib/personas";
import { ChatMessage, Persona } from "@/types/editor";

const TYPING_SPEED = 20;
const THINKING_WORD_SPEED = 80;

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Welcome to my portfolio. I can answer questions about my skills, projects, and experience. Select a persona below to change the response style.",
  },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

export default function ChatPanel() {
  const { persona, setPersona } = usePersona();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const thinkingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const sessionIdRef = useRef<string>(generateId());

  const [currentState, setCurrentState] = useState<string[]>([]);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [thinkingWordIndex, setThinkingWordIndex] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const lastThinkingStep = currentState[currentState.length - 1] ?? "";
  const lastStepWords = lastThinkingStep.trim()
    ? lastThinkingStep.trim().split(/\s+/)
    : [];
  const lastStepWordCountRef = useRef(0);
  lastStepWordCountRef.current = lastStepWords.length;
  const displayedLastStep =
    thinkingWordIndex >= lastStepWords.length
      ? lastThinkingStep
      : lastStepWords.slice(0, thinkingWordIndex).join(" ");

  useEffect(() => {
    if (currentState.length === 0) return;
    setThinkingWordIndex(0);
  }, [currentState.length]);

  const thinkingStepCountRef = useRef(0);
  useEffect(() => {
    if (currentState.length === 0) {
      thinkingStepCountRef.current = 0;
      return;
    }
    if (lastStepWords.length === 0) return;
    const hasNewStep = currentState.length > thinkingStepCountRef.current;
    thinkingStepCountRef.current = currentState.length;
    if (!hasNewStep && thinkingWordIndex >= lastStepWords.length) return;
    thinkingIntervalRef.current = setInterval(() => {
      setThinkingWordIndex((prev) => {
        const target = lastStepWordCountRef.current;
        if (prev + 1 >= target) {
          if (thinkingIntervalRef.current) {
            clearInterval(thinkingIntervalRef.current);
            thinkingIntervalRef.current = null;
          }
          return target;
        }
        return prev + 1;
      });
    }, THINKING_WORD_SPEED);
    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
        thinkingIntervalRef.current = null;
      }
    };
  }, [currentState.length, lastThinkingStep]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }

    setCurrentState([]);
    setThinkingExpanded(true);
    setThinkingWordIndex(0);

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
    };
    const assistantId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    const messageToSend = input.trim();
    setInput("");
    setIsTyping(true);

    let gotDone = false;
    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          persona,
          message: messageToSend,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const data = JSON.parse(trimmed) as {
              type: string;
              step?: string;
              response?: string;
            };
            if (data.type === "thinking" && typeof data.step === "string") {
              const step = data.step;
              setCurrentState((prev) => [...prev, step]);
            } else if (
              data.type === "done" &&
              typeof data.response === "string"
            ) {
              gotDone = true;
              setThinkingExpanded(false);
              const fullResponse = data.response;
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
              break;
            }
          } catch {
            // skip malformed lines
          }
        }
      }
      if (!gotDone) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: "Sorry, something went wrong. Please try again.",
                }
              : msg
          )
        );
        setIsTyping(false);
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: "Sorry, something went wrong. Please try again.",
              }
            : msg
        )
      );
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    fetch("/api/chat/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionIdRef.current }),
    }).catch(() => {});
    sessionIdRef.current = generateId();
    setMessages(initialMessages);
    setCurrentState([]);
  };

  return (
    <div className="flex flex-col w-80 h-full bg-[#1e1e1e] border-l border-[#1f1f1f] shrink-0 overflow-hidden">
      <div className="flex items-center justify-between h-9 px-3 border-b border-[#1f1f1f] shrink-0">
        <span className="text-xs font-medium text-[#a3a3a3]">
          Ask about my work
        </span>
        <button
          onClick={handleReset}
          className="p-1 text-[#666666] hover:text-[#a3a3a3] transition-colors"
          title="Reset Chat"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1 space-y-2 typed-messages">
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="w-full max-h-20 text-white text-sm leading-relaxed px-4 py-2 bg-[#3C3C3C] rounded-xl border border-[#3a3a3a]">
                {msg.content.slice(0, 80)}
              </div>
            ) : (
              <>
                {idx === messages.length - 1 && currentState.length > 0 && (
                  <div className="mb-1.5 px-1">
                    <div
                      className="flex items-center gap-1 cursor-pointer select-none"
                      onClick={() => setThinkingExpanded((v) => !v)}
                    >
                      <svg
                        className={`w-3 h-3 text-[#666] transition-transform ${thinkingExpanded ? "rotate-90" : ""}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span className="text-[10px] text-[#666] font-mono truncate max-w-[260px]">
                        {displayedLastStep}
                        {isTyping && (
                          <span className="inline-block w-1 h-2.5 bg-[#666] ml-0.5 animate-pulse" />
                        )}
                      </span>
                    </div>
                    {thinkingExpanded && (
                      <div className="mt-1 ml-4 space-y-0.5 max-h-32 overflow-y-auto">
                        {currentState.slice(0, -1).map((step, i) => (
                          <div
                            key={i}
                            className="text-[10px] text-[#555] font-mono truncate"
                          >
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="text-sm leading-relaxed text-white px-1">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 mb-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 mb-2">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-1 last:mb-0">{children}</li>
                    ),
                    code: ({ children }) => (
                      <code className="bg-[#2a2a2a] px-1 py-0.5 rounded text-xs">
                        {children}
                      </code>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-blue-300 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 shrink-0">
        <div className="bg-[#3C3C3C] rounded-xl border border-[#3a3a3a]">
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
          <div className="flex items-center justify-between px-3 pb-3">
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as Persona)}
              className="px-3 py-1.5 bg-[#2a2a2a] text-[#a3a3a3] text-xs rounded-full border-none cursor-pointer focus:outline-none hover:bg-[#333333] transition-colors appearance-none pr-7"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "12px",
              }}
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full bg-[#4a4a4a] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#5a5a5a] transition-colors"
              title="Send"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
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
