import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, RotateCcw, User } from "lucide-react";

type Role = "ai" | "user";
interface Message { role: Role; text: string; }

const SUGGESTIONS = [
  "What career suits me best?",
  "How do I improve my match score?",
  "What skills should I learn next?",
  "How long to become a Data Scientist?",
];

const RESPONSES: Record<string, string> = {
  default: "That's a great question! Based on your profile, I recommend focusing on your current roadmap. Completing Phase 2 will significantly boost your career match score. Is there a specific area you'd like guidance on?",
  "what career suits me best": "Based on your assessment results and skill profile, **Data Scientist** is your top match at **92%**. Your strengths in React, TypeScript, and SQL are strong foundations. Pairing those with Python and Machine Learning — which you're already building — makes this a natural fit. Government tech roles are in high demand right now, which aligns well with your career track.",
  "how do i improve my match score": "Your current match score is **87%** — impressive! To push it higher:\n\n1. **Complete Data Visualization** (currently 60% — finish this first)\n2. **Fill your SQL skill gap** — the SQL Tutorial is already in your Resources\n3. **Add a capstone project** to your profile — real projects boost match scores by up to 10%\n4. **Complete the remaining assessment** to give Pragyan AI more data to work with.\n\nYou could realistically hit **95%+** within 6 weeks.",
  "what skills should i learn next": "Based on your skill gap analysis, here's your priority order:\n\n1. **Data Visualization** — you're already 60% through; finish this first\n2. **SQL Advanced Queries** — your biggest gap vs. the Data Scientist role\n3. **Machine Learning Fundamentals** — unlocks once you complete Phase 2\n4. **Feature Engineering** — high-priority missing skill for your target role\n\nI've mapped all of these to resources in your library — check the Resources page!",
  "how long to become a data scientist": "At your current pace, here's a realistic timeline:\n\n- **Phase 1** (Foundations): Already complete!\n- **Phase 2** (Data Science Core): ~4 more weeks\n- **Phase 3** (Advanced ML): ~7 weeks\n- **Phase 4** (Specialization): ~9 weeks\n\nTotal remaining: approximately **20 weeks** (~5 months) to be job-ready as a Data Scientist. Staying consistent with 1–2 hours daily will keep you on track. You're doing great — don't stop now!",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const key of Object.keys(RESPONSES)) {
    if (key !== "default" && lower.includes(key)) return RESPONSES[key];
  }
  return RESPONSES["default"];
}

function formatText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={`${i > 0 && line.startsWith(" ") ? "pl-4" : ""} ${i < lines.length - 1 ? "mb-1" : ""}`}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    );
  });
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "ai",
    text: "Hi Sanika! I'm Pragyan AI, your personal career counselor. I've analyzed your profile, assessment results, and skill gaps. I'm here to guide you toward your goal of becoming a Data Scientist.\n\nWhat would you like to explore today?",
  },
];

export default function AICounselor() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const aiReply: Message = { role: "ai", text: getResponse(text) };
      setMessages(prev => [...prev, aiReply]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setTyping(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">AI Counselor</h1>
          <p className="text-muted-foreground mt-1">Get personalized career guidance powered by Pragyan AI.</p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          data-testid="button-reset-chat"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New Chat
        </button>
      </div>

      {/* Chat window */}
      <div className="flex-1 bg-card border border-border rounded-[20px] flex flex-col overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Pragyan AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="text-xs text-muted-foreground">Online · Career Counselor</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              data-testid={`message-${idx}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "ai" ? "bg-primary" : "bg-orange-500"
              }`}>
                {msg.role === "ai"
                  ? <Sparkles className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-white" />
                }
              </div>
              {/* Bubble */}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "ai"
                  ? "bg-muted text-foreground rounded-tl-none"
                  : "bg-primary text-white rounded-tr-none"
              }`}>
                {formatText(msg.text)}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4 flex flex-wrap gap-2 flex-shrink-0">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium hover:bg-primary/20 transition-colors"
                data-testid={`suggestion-${s.toLowerCase().replace(/\s/g, '-')}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-6 pb-6 pt-3 border-t border-border flex-shrink-0 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Pragyan AI anything about your career..."
            className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            data-testid="input-chat"
          />
          <Button
            onClick={() => send(input)}
            disabled={!input.trim() || typing}
            className="rounded-xl w-11 h-11 p-0 flex items-center justify-center flex-shrink-0"
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
