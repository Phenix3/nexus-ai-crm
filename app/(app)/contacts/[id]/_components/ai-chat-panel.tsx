"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles, RotateCcw, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AiChatPanelProps {
  contactId: string;
  contactName: string;
}

const QUICK_PROMPTS = [
  "What is the next best action for this contact?",
  "Draft a follow-up email",
  "What are the risks on the associated deal?",
  "How should I prepare for my next meeting?",
];

function getMessageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

function MessageBubble({
  role,
  parts,
}: {
  role: string;
  parts: { type: string; text?: string }[];
}) {
  const isUser = role === "user";
  const content = getMessageText(parts);
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-primary text-white"
            : "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-tl-sm"
        }`}
      >
        {content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < content.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AiChatPanel({ contactId, contactName }: AiChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/chat", body: { contactId } }),
    [contactId]
  );

  const { messages, sendMessage, status, setMessages } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  }

  function handleQuickPrompt(prompt: string) {
    if (isLoading) return;
    sendMessage({ text: prompt });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AI Assistant</h3>
          <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-2 py-0.5">
            GPT-4o mini
          </span>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-600"
            onClick={() => setMessages([])}
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex flex-col items-center justify-center flex-1 text-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40">
                <Sparkles className="h-5 w-5 text-violet-500" />
              </div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                AI assistant for {contactName}
              </p>
              <p className="text-xs text-zinc-400 max-w-[220px]">
                I have full context on this contact. Ask me anything.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-1 gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="text-left rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-400"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                parts={m.parts as { type: string; text?: string }[]}
              />
            ))}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50">
                  <Bot className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2.5 dark:bg-zinc-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 dark:border-zinc-800 shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this contact… (Enter to send)"
            rows={1}
            className="resize-none text-sm min-h-[36px] max-h-[120px] flex-1 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
          />
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={isLoading || !input.trim()}
            onClick={handleSend}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
