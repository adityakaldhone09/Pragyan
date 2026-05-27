import { motion } from "motion/react";
import { Link, useLocation } from "react-router";
import { ArrowRight, Brain, Sparkles, Target, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { assessmentService } from "../../services/assessmentService";
import type { AdaptiveCareerMatch, AdaptiveSubmitResponse } from "../../types/api";

type LocationState = {
  adaptiveResult?: AdaptiveSubmitResponse;
};

const TRAIT_LABELS = [
  { key: "analytical", label: "Analytical" },
  { key: "logic", label: "Logic" },
  { key: "coding", label: "Coding" },
  { key: "communication", label: "Communication" },
  { key: "leadership", label: "Leadership" },
  { key: "creativity", label: "Creativity" },
];

function deriveRadarData(summary: AdaptiveSubmitResponse["summary"]) {
  const strengths = new Set((summary?.strengths || []).map((item) => item.toLowerCase()));
  const weaknesses = new Set((summary?.weaknesses || []).map((item) => item.toLowerCase()));

  return TRAIT_LABELS.map((trait) => {
    const high = strengths.has(trait.key) ? 90 : 0;
    const low = weaknesses.has(trait.key) ? 35 : 0;
    const baseline = 58;
    const score = Math.max(20, Math.min(95, high || low || baseline));
    return { skill: trait.label, score, fullMark: 100 };
  });
}

export function Results() {
  const location = useLocation();
  const { adaptiveResult } = (location.state || {}) as LocationState;
  const [result, setResult] = useState<AdaptiveSubmitResponse | null>(adaptiveResult || null);

  useEffect(() => {
    let mounted = true;

    async function loadFallbackResult() {
      if (adaptiveResult?.resultId) {
        return;
      }

      try {
        const latest = await assessmentService.getLatestAssessment();
        const analysis = latest?.analysis as any;
        if (!mounted || !analysis?.summary) {
          return;
        }

        const mapped: AdaptiveSubmitResponse = {
          resultId: latest?.id || "latest",
          sessionId: analysis?.sessionId || "persisted-session",
          confidence: analysis?.summary?.confidence || 70,
          topMatches: (analysis?.rankedMatches || []).slice(0, 3),
          allMatches: analysis?.rankedMatches || [],
          summary: analysis.summary,
        } as AdaptiveSubmitResponse;
        setResult(mapped);
      } catch {
        // keep empty state
      }
    }

    void loadFallbackResult();
    return () => {
      mounted = false;
    };
  }, [adaptiveResult]);

  const topMatch = result?.summary?.topMatch || result?.topMatches?.[0] || null;
  const secondary = result?.summary?.secondaryMatches || result?.topMatches?.slice(1) || [];
  const radarData = useMemo(() => deriveRadarData(result?.summary as AdaptiveSubmitResponse["summary"]), [result?.summary]);
  const confidence = Math.max(0, Math.min(100, Number(result?.confidence || result?.summary?.confidence || 0)));

  const skillHeatmap = useMemo(() => {
    const source = (topMatch?.skillGaps || []).slice(0, 6);
    if (!source.length) {
      return ["Problem Solving", "System Design", "Communication", "Execution", "Leadership", "Domain Insight"];
    }
    return source;
  }, [topMatch]);

  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />
      <FloatingParticles count={30} />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 relative z-10">
        <motion.div className="text-center space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Adaptive Career Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Assessment Results Dashboard
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Deterministic matching engine finalized your career fit, and AI generated explanation layers and roadmap guidance.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <GlassCard glow glowColor="primary" className="lg:col-span-2">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Top Match</p>
                <h2 className="text-3xl font-semibold">{topMatch?.career || "No result yet"}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Match</p>
                <p className="text-5xl font-bold text-primary">{topMatch?.match || 0}%</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-3">
                <p className="text-xs text-muted-foreground">Salary Projection</p>
                <p className="font-semibold">{topMatch?.salaryRange || "Market aligned"}</p>
              </div>
              <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
                <p className="text-xs text-muted-foreground">Demand Forecast</p>
                <p className="font-semibold">{topMatch?.demandForecast || 0}%</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">Growth Rate</p>
                <p className="font-semibold">{topMatch?.growthRate || 0}%</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {(topMatch?.reasons || ["Complete an assessment to unlock personalized explanations."]).map((reason) => (
                <p key={reason} className="text-sm text-muted-foreground">- {reason}</p>
              ))}
            </div>
          </GlassCard>

          <GlassCard glow glowColor="accent">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold">Confidence Meter</h3>
            </div>
            <div className="flex items-center justify-center py-6">
              <motion.div
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.8 }}
                className="h-44 w-44 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(rgba(34,211,238,1) ${confidence * 3.6}deg, rgba(148,163,184,0.2) 0deg)`,
                }}
              >
                <div className="h-32 w-32 rounded-full bg-background/95 border border-border flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-accent">{confidence}%</p>
                  <p className="text-xs text-muted-foreground">Engine confidence</p>
                </div>
              </motion.div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Confidence = answered relevant questions / total relevant questions.
            </p>
          </GlassCard>
        </div>

        <GlassCard glow glowColor="secondary">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-secondary">Assessment → AI Match → Suggested Career → Roadmap</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Your recommended learning path is ready</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                  The assessment locked your strongest career match, AI summarized the best-fit direction, and the roadmap page turns that into a daily execution plan.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">1. Assessment complete</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">2. AI match generated</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">3. Suggested career: {topMatch?.career || result?.summary?.suggestedCareers?.[0] || "Next best path"}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">4. Start the roadmap</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background/40 p-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recommended roadmap</p>
                <p className="mt-2 text-xl font-semibold">{topMatch?.career || "Personalized career path"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topMatch?.reasons?.[0] || "The roadmap adapts to your strengths, gaps, and preferred learning style."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-muted-foreground">Best match</p>
                  <p className="mt-1 font-semibold text-secondary">{topMatch?.match || 0}%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="mt-1 font-semibold text-primary">{confidence}%</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link to="/roadmap">
                  <GlowButton variant="primary" className="w-full">
                    Start AI Roadmap
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </GlowButton>
                </Link>
                <Link to="/roadmap-catalog">
                  <GlowButton variant="secondary" className="w-full">
                    Browse all roadmaps
                  </GlowButton>
                </Link>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid lg:grid-cols-2 gap-6">
          <GlassCard glow glowColor="secondary">
            <SectionHeader title="Radar Profile" subtitle="Trait strengths synthesized from adaptive answers" className="mb-4" />
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.25)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard glow glowColor="pink">
            <SectionHeader title="Skill Heatmap" subtitle="Priority skill gaps to close" className="mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {skillHeatmap.map((skill, index) => {
                const intensity = Math.max(18, 90 - index * 12);
                return (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="rounded-lg border border-border p-3"
                    style={{ background: `linear-gradient(135deg, rgba(16,185,129,${intensity / 100}), rgba(15,23,42,0.35))` }}
                  >
                    <p className="text-sm font-medium">{skill}</p>
                    <p className="text-xs text-muted-foreground">Priority score: {intensity}%</p>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <SectionHeader title="Secondary Matches" subtitle="Alternative career opportunities with high relevance" className="mb-4" />
          <div className="grid md:grid-cols-2 gap-4">
            {secondary.length ? secondary.map((match: AdaptiveCareerMatch) => (
              <div key={match.career} className="rounded-lg border border-border bg-card/40 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">{match.career}</h4>
                  <span className="text-2xl font-bold text-secondary">{match.match}%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{match.category}</p>
                <p className="text-sm text-muted-foreground mt-3">{match.reasons?.[0] || "Matched on adaptive profile signals."}</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No secondary matches yet. Run a full assessment cycle.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard glow glowColor="primary">
          <SectionHeader title="Learning Roadmap and AI Insights" subtitle="Personalized weekly execution plan" className="mb-4" />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {Object.entries(result?.summary?.learningRoadmap || {}).map(([week, items]) => (
                <div key={week} className="rounded-lg border border-border bg-card/30 p-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{week}</p>
                  {(items || []).map((item) => (
                    <p key={item} className="text-sm text-muted-foreground mt-1">- {item}</p>
                  ))}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-accent" />
                <p className="font-semibold">AI Insights</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {result?.ai?.summary || "AI explanation mode is active: recommendations are deterministic, while AI adds report narratives, skill-gap guidance, and interview preparation plans."}
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="flex flex-wrap items-center gap-3 justify-center">
          <Link to="/analysis">
            <GlowButton variant="secondary">
              Detailed Analysis
              <TrendingUp className="w-4 h-4 ml-2 inline" />
            </GlowButton>
          </Link>
          <Link to="/roadmap">
            <GlowButton variant="primary">
              Start Learning Roadmap
              <ArrowRight className="w-4 h-4 ml-2 inline" />
            </GlowButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
