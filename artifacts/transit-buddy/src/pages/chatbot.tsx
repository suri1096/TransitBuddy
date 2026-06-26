import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Sparkles, AlertTriangle } from "lucide-react";
import { sendChatMessage } from "@workspace/api-client-react";
import type { ChatMessage } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { useTour } from "@/lib/tour-context";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
}

const QUICK_QUESTIONS = [
  "What is the Yellow Line?",
  "How do I pay the fare?",
  "What if I miss my stop?",
  "How do I transfer trains?",
  "How do I get to SFO?",
  "Is BART wheelchair accessible?",
];

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function Chatbot() {
  const { userName } = useAuth();
  const { highlightId } = useTour();
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "bot", text: `Hi ${userName}! I'm Buddy 🟢 — your BART companion. I know routes, stations, fares, and what to do if you feel lost. What can I help you with?` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg: Message = { id: Date.now(), from: "user", text: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setTyping(true);

    // Build the conversation history for the model (skip the local greeting at id 0).
    // Keep only the most recent messages to stay well under the API's 40-message limit.
    const apiMessages: ChatMessage[] = history
      .filter(m => !(m.from === "bot" && m.id === 0))
      .slice(-24)
      .map(m => ({
        role: m.from === "bot" ? ("assistant" as const) : ("user" as const),
        content: m.text.slice(0, 2000),
      }));

    try {
      const res = await sendChatMessage({ messages: apiMessages });
      setMessages(prev => [...prev, { id: Date.now() + 1, from: "bot", text: res.reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          from: "bot",
          text: "Sorry, I couldn't reach the assistant just now. Please check your connection and try again in a moment.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div data-tour-id="tour-chat" className={`flex flex-col h-full animate-in fade-in duration-300 ${highlightId === "tour-chat" ? "ring-4 ring-primary/60 ring-offset-2 rounded-2xl" : ""}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border bg-gradient-to-r from-primary/10 to-purple-100/50 dark:from-primary/20 dark:to-purple-900/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Buddy</h1>
            <p className="text-sm text-muted-foreground">Your friendly BART companion</p>
          </div>
          <div className="ml-auto w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-400" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2 items-end ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}
            data-testid={`message-${msg.id}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.from === "bot" ? "bg-primary" : "bg-secondary"}`}>
              {msg.from === "bot" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-secondary-foreground" />}
            </div>
            <div
              className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium shadow-sm whitespace-pre-wrap ${
                msg.from === "bot"
                  ? "bg-card text-card-foreground rounded-bl-sm"
                  : "bg-primary text-primary-foreground rounded-br-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2 items-end">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <Card className="rounded-2xl rounded-bl-sm border-none bg-card shadow-sm">
              <TypingDots />
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Quick questions</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={typing}
              data-testid={`quick-q-${q.slice(0, 10)}`}
              className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pb-24 pt-2 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about BART routes, fares, stations..."
          className="flex-1 h-12 px-4 rounded-2xl border border-border bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="chat-input"
        />
        <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl shrink-0" disabled={!input.trim() || typing} data-testid="chat-send">
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
