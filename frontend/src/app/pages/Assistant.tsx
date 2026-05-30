import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, Send, Sparkles, Brain, Rocket, FileText, MessageSquare, RefreshCw } from "lucide-react";
import { useLocation } from "react-router";
import { NeuralBackground } from "../components/NeuralBackground";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { aiService } from "../../services/aiService";
import { recommendationService } from "../../services/recommendationService";
import type { AssistantChatMessage } from "../../services/aiService";
import { useAuth } from "@/context/useAuth";

const quickPrompts = [
  "Help me plan my next career move",
  "What should I improve first?",
  "Give me resume advice",
  "How should I prepare for interviews?",
];

function renderSimpleMarkdown(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/\*\*(.*?)\*\*/g, "$1"))
    .join("\n");
}

export function Assistant() {
  const { user } = useAuth();
  const location = useLocation();
  const autoPromptHandled = useRef(false);
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    { role: "assistant", content: `Hi ${firstName}, I’m your Pragyan career assistant. Ask me about careers, roadmaps, resumes, or interviews.` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [provider, setProvider] = useState<string>("local");
  const [careerContext, setCareerContext] = useState<string>("Your current assessment is the source of truth.");
  const [roadmapContext, setRoadmapContext] = useState<string>("Awaiting roadmap data.");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadContext() {
      try {
        const [status, topCareer, roadmaps] = await Promise.allSettled([
          aiService.getStatus(),
          recommendationService.getTopCareer(),
          recommendationService.getRoadmapRecommendations(),
        ]);

        if (!mounted) return;

        if (status.status === "fulfilled") {
          setProvider(status.value.provider || "local");
        }

        if (topCareer.status === "fulfilled" && topCareer.value) {
          setCareerContext(`${topCareer.value.career} (${topCareer.value.match}%)`);
        }

        if (roadmaps.status === "fulfilled" && roadmaps.value?.length) {
          setRoadmapContext(roadmaps.value[0].title);
        }
      } catch {
        // keep defaults for local fallback
      }
    }

    void loadContext();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const prompt = new URLSearchParams(location.search).get("prompt");

    if (!prompt || autoPromptHandled.current) {
      return;
    }

    autoPromptHandled.current = true;
    setInput(prompt);
    void sendMessage(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const contextSummary = useMemo(
    () => ({
      career: careerContext,
      roadmap: roadmapContext,
      goal: "AI-guided career planning",
    }),
    [careerContext, roadmapContext]
  );

  const streamAssistantReply = async (fullReply: string) => {
    setMessages((current) => [...current, { role: "assistant", content: "" }]);

    const step = Math.max(1, Math.round(fullReply.length / 80));
    let cursor = 0;

    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        cursor = Math.min(fullReply.length, cursor + step);
        const partial = fullReply.slice(0, cursor);

        setMessages((current) => {
          const next = [...current];
          const idx = next.length - 1;
          if (idx >= 0 && next[idx].role === "assistant") {
            next[idx] = { ...next[idx], content: partial };
          }
          return next;
        });

        if (cursor >= fullReply.length) {
          clearInterval(timer);
          resolve();
        }
      }, 18);
    });
  };

  const sendMessage = async (message: string) => {
    const normalized = message.trim();
    if (!normalized || typing) {
      return;
    }

    setError(null);
    setMessages((current) => [...current, { role: "user", content: normalized }]);
    setInput("");
    setTyping(true);

    try {
      const response = await aiService.chat({
        message: normalized,
        history: messages.slice(-6),
        context: contextSummary,
      });

      setProvider(response.provider || provider);
      await streamAssistantReply(response.reply);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Unable to reach the AI assistant");
      setMessages((current) => [...current, { role: "assistant", content: "I can still help. Try one of the quick prompts or review your roadmap and job matches." }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8 relative z-10">
        <SectionHeader title="AI Career Assistant" subtitle="Chat with Pragyan about careers, learning paths, resumes, and interview prep." />

        <GlassCard glow glowColor="primary" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-4 min-h-[560px] flex flex-col">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Provider</p>
                  <div className="flex items-center gap-2 text-primary mt-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium capitalize">{provider}</span>
                  </div>
                </div>
                <GlowButton variant="secondary" onClick={() => setMessages([{ role: "assistant", content: "I’m your Pragyan career assistant. Ask me about careers, roadmaps, resumes, or interviews." }])}>
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Reset chat
                </GlowButton>
              </div>

              <div className="flex-1 space-y-4 overflow-auto pr-1">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={`${message.role}-${index}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 border ${message.role === "user" ? "bg-primary/10 border-primary/20 text-foreground" : "bg-card/50 border-border text-foreground"}`}>
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                          {message.role === "user" ? "You" : "Pragyan"}
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-6">
                          {renderSimpleMarkdown(message.content)}
                          {typing && message.role === "assistant" && index === messages.length - 1 ? <span className="inline-block w-2 h-4 ml-1 bg-primary/70 animate-pulse align-middle" /> : null}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {typing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="rounded-2xl px-4 py-3 border bg-card/50 border-border text-sm text-muted-foreground flex items-center gap-3">
                      <Bot className="w-4 h-4 text-primary animate-pulse" />
                      Pragyan is typing...
                    </div>
                  </motion.div>
                )}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(input);
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask about careers, roadmaps, resumes, or interviews"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {error && <p className="text-sm text-red-300">{error}</p>}

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="px-3 py-2 text-xs rounded-full border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <GlowButton variant="primary" type="submit" disabled={typing || !input.trim()}>
                    <Send className="w-4 h-4 mr-2 inline" />
                    Send
                  </GlowButton>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <GlassCard glow glowColor="accent" className="space-y-4">
                <div className="flex items-center gap-3">
                  <GradientIconWrapper size="sm" gradient="purple" glow>
                    <Brain className="w-5 h-5 text-white" />
                  </GradientIconWrapper>
                  <div>
                    <h3 className="font-semibold">Context</h3>
                    <p className="text-xs text-muted-foreground">Backend-informed assistant state</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="p-3 rounded-lg bg-card/40 border border-border">
                    <p className="text-xs uppercase tracking-[0.2em] mb-1">Top career</p>
                    <p className="text-foreground">{careerContext}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card/40 border border-border">
                    <p className="text-xs uppercase tracking-[0.2em] mb-1">Roadmap</p>
                    <p className="text-foreground">{roadmapContext}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <GradientIconWrapper size="sm" gradient="cyan" glow>
                      <Rocket className="w-5 h-5 text-white" />
                    </GradientIconWrapper>
                    <h3 className="font-semibold">Suggested prompts</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Ask for a resume review for your top career</li>
                    <li>• Request a 30-day roadmap for your target role</li>
                    <li>• Get interview prep topics for the next stage</li>
                  </ul>
                </div>
              </GlassCard>

              <GlassCard hover>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <GradientIconWrapper size="sm" gradient="blue" glow>
                      <FileText className="w-5 h-5 text-white" />
                    </GradientIconWrapper>
                    <h3 className="font-semibold">Response style</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Responses come from the backend AI provider when available, with a deterministic fallback if the provider is unavailable.
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}