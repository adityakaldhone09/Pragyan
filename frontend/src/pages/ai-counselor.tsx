import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { aiService, type AIChatMessage, type AICareerRecommendation } from "@/services/aiService";
import { downloadGeneratedNote, inferNoteTopic, isEducationalResponse } from "@/features/notes/noteDownload";
import { notesService, type NoteFormat } from "@/features/notes/notesService";
import { Send, Sparkles, RotateCcw, User, Download } from "lucide-react";

type Role = "ai" | "user";
interface Message { role: Role; text: string; }

const SUGGESTIONS = [
  "What career suits me best?",
  "How do I improve my match score?",
  "What skills should I learn next?",
  "How long will my roadmap take?",
];

const NOTE_FORMATS: Array<{ label: string; value: NoteFormat }> = [
  { label: "PDF", value: "pdf" },
  { label: "MD", value: "markdown" },
  { label: "TXT", value: "text" },
];

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

function getFirstName(fullName?: string | null, email?: string | null) {
  const source = fullName?.trim() || email?.split("@")[0] || "there";
  return source.split(/\s+/)[0];
}

function buildInitialMessage(name: string, topCareer?: AICareerRecommendation) {
  if (topCareer?.career) {
    const score = Number.isFinite(topCareer.score) ? ` with a ${Math.round(topCareer.score)}% match` : "";
    return `Hi ${name}! I'm Pragyan AI, your personal career counselor. I pulled your latest profile and recommendation data from the backend, and your strongest current signal is **${topCareer.career}**${score}.\n\nWhat would you like to explore today?`;
  }

  return `Hi ${name}! I'm Pragyan AI, your personal career counselor. I can use your profile, skills, interests, and recommendations as they become available to guide your career decisions.\n\nWhat would you like to explore today?`;
}

function toApiHistory(items: Message[]): AIChatMessage[] {
  return items.reduce<AIChatMessage[]>((history, message) => {
    const content = message.text.trim();
    if (!content) return history;
    history.push({
      role: message.role === "ai" ? "assistant" : "user",
      content,
    });
    return history;
  }, []);
}

export default function AICounselor() {
  const { user } = useAuth();
  const { data: recommendations = [] } = useQuery({
    queryKey: ["ai", "recommend-careers"],
    queryFn: aiService.getCareerRecommendations,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const topCareer = recommendations[0];
  const userName = getFirstName(user?.fullName, user?.email);
  const initialMessage = useMemo<Message>(() => ({
    role: "ai",
    text: buildInitialMessage(userName, topCareer),
  }), [topCareer, userName]);

  const chatContext = useMemo<Record<string, unknown>>(() => ({
    career: topCareer?.career || user?.careerTrack || user?.currentTitle,
    goal: user?.careerTrack || user?.currentTitle,
    skills: user?.skills || [],
    interests: user?.interests || [],
    skillLevel: user?.skillLevel,
    experience: user?.experience,
    education: user?.education || user?.currentCourse,
    recommendations: recommendations.slice(0, 3),
  }), [recommendations, topCareer, user]);

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [noteMenuFor, setNoteMenuFor] = useState<number | null>(null);
  const [downloadingNote, setDownloadingNote] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(prev => {
      const hasUserMessage = prev.some(message => message.role === "user");
      return hasUserMessage ? prev : [initialMessage];
    });
  }, [initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    const history = toApiHistory(messages);
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    try {
      const response = await aiService.chat(text.trim(), history, chatContext);
      const aiReply: Message = { role: "ai", text: response.reply };
      setMessages(prev => [...prev, aiReply]);
    } catch (error) {
      const aiReply: Message = {
        role: "ai",
        text: error instanceof Error ? error.message : "Pragyan AI is unavailable right now. Please try again.",
      };
      setMessages(prev => [...prev, aiReply]);
    } finally {
      setTyping(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const reset = () => {
    setMessages([initialMessage]);
    setInput("");
    setTyping(false);
    setNoteMenuFor(null);
    setDownloadingNote(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const downloadNotes = async (message: Message, index: number, format: NoteFormat) => {
    const key = `${index}-${format}`;
    setDownloadingNote(key);
    try {
      const note = await notesService.generate({
        topic: inferNoteTopic(message.text),
        responseText: message.text,
        format,
        source: "ai-counselor",
        sourceMessageId: `message-${index}`,
      });
      downloadGeneratedNote(note);
      setNoteMenuFor(null);
    } finally {
      setDownloadingNote(null);
    }
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

      <div className="flex-1 bg-card border border-border rounded-[20px] flex flex-col overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Pragyan AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="text-xs text-muted-foreground">Online - Career Counselor</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.map((msg, idx) => {
            const canDownloadNotes = msg.role === "ai" && isEducationalResponse(msg.text);

            return (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              data-testid={`message-${idx}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "ai" ? "bg-primary" : "bg-orange-500"
              }`}>
                {msg.role === "ai"
                  ? <Sparkles className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-white" />
                }
              </div>
              <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                <div className={`w-full px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "ai"
                    ? "bg-muted text-foreground rounded-tl-none"
                    : "bg-primary text-white rounded-tr-none"
                }`}>
                  {formatText(msg.text)}
                </div>

                {canDownloadNotes && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNoteMenuFor(current => current === idx ? null : idx)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      data-testid={`button-download-notes-${idx}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Notes
                    </button>

                    {noteMenuFor === idx && (
                      <div className="flex items-center gap-1">
                        {NOTE_FORMATS.map(format => {
                          const key = `${idx}-${format.value}`;
                          return (
                            <button
                              key={format.value}
                              type="button"
                              onClick={() => void downloadNotes(msg, idx, format.value)}
                              disabled={downloadingNote !== null}
                              className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 disabled:opacity-60"
                              data-testid={`download-notes-${format.value}-${idx}`}
                            >
                              {downloadingNote === key ? "..." : format.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
          })}

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

        {messages.length <= 1 && (
          <div className="px-6 pb-4 flex flex-wrap gap-2 flex-shrink-0">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium hover:bg-primary/20 transition-colors"
                data-testid={`suggestion-${s.toLowerCase().replace(/\s/g, '-')}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

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
            onClick={() => void send(input)}
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
