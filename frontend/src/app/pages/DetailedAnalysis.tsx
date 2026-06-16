import { motion } from "motion/react";
import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  CheckCircle,
  AlertCircle,
  Star,
} from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { AnimatedProgress } from "../components/AnimatedProgress";
import { assessmentService } from "../../services/assessmentService";
import { recommendationService } from "../../services/recommendationService";
import type { AssessmentMatch, AssessmentSubmissionResult, RoadmapSummary } from "../../types/api";

type AnalysisSkill = {
  skill: string;
  current: number;
  required: number;
  gap: number;
};

const ringRadius = 72;
const ringCircumference = 2 * Math.PI * ringRadius;

function ScoreRing({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const offset = ringCircumference - (clamped / 100) * ringCircumference;

  return (
    <div className="relative h-52 w-52 mx-auto">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="analysis-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={ringRadius} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="14" />
        <motion.circle
          cx="100"
          cy="100"
          r={ringRadius}
          fill="none"
          stroke="url(#analysis-ring-gradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={ringCircumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: ringCircumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {clamped}%
        </motion.span>
        <span className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function scoreToBars(score: number) {
  return [score - 8, score - 2, score + 4].map((value) => Math.max(20, Math.min(100, value)));
}

export function DetailedAnalysis() {
  const [submissionResult, setSubmissionResult] = useState<AssessmentSubmissionResult | null>(null);
  const [topCareer, setTopCareer] = useState<AssessmentMatch | null>(null);
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);

        const [latestAssessment, topCareerResponse, roadmapResponse] = await Promise.allSettled([
          assessmentService.getLatestAssessment(),
          recommendationService.getTopCareer(),
          recommendationService.getRoadmapRecommendations(),
        ]);

        if (!mounted) return;

        if (latestAssessment.status === "fulfilled" && latestAssessment.value?.analysis) {
          setSubmissionResult({
            persisted: null,
            combinedMatches: null,
            summary: {
              suggestedCareers: latestAssessment.value.analysis.suggestedCareers || [],
              scores: latestAssessment.value.analysis.scores || {},
              strengths: latestAssessment.value.analysis.strengths || [],
              weaknesses: latestAssessment.value.analysis.weaknesses || [],
            },
            enhancements: latestAssessment.value.analysis.enhancements,
          });
        }

        if (topCareerResponse.status === "fulfilled") {
          setTopCareer(topCareerResponse.value);
        }

        if (roadmapResponse.status === "fulfilled") {
          setRoadmaps(roadmapResponse.value || []);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load analysis");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadAnalysis();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = submissionResult?.summary;
  const topCareerLabel = topCareer?.career || summary?.suggestedCareers?.[0] || "Career Match";
  const deterministicScore = topCareer?.match || (summary?.scores ? Math.max(...Object.values(summary.scores)) : 0);
  const enhancements = submissionResult?.enhancements;

  const analysis = useMemo(() => {
    const strengths = summary?.strengths?.length ? summary.strengths : ["Strategic thinking", "Learning agility", "Execution discipline"];
    const weaknesses = summary?.weaknesses?.length ? summary.weaknesses : ["Specialization depth", "Portfolio differentiation", "Interview storytelling"];

    const skillBreakdown: AnalysisSkill[] = [
      { skill: "Problem Solving", current: Math.max(deterministicScore - 2, 68), required: 86, gap: Math.max(0, 86 - Math.max(deterministicScore - 2, 68)) },
      { skill: "Technical Depth", current: Math.max(deterministicScore - 6, 62), required: 84, gap: Math.max(0, 84 - Math.max(deterministicScore - 6, 62)) },
      { skill: "Communication", current: 78, required: 82, gap: 4 },
      { skill: "Leadership", current: weaknesses.some((item) => item.toLowerCase().includes("lead")) ? 66 : 74, required: 80, gap: 0 },
      { skill: "Adaptability", current: 84, required: 80, gap: 0 },
    ];

    return {
      strengths,
      weaknesses,
      skillBreakdown,
      personality: ["Analytical", "Growth-oriented", "Adaptive"],
      learningPaths: enhancements?.nextActions || ["Build a focused portfolio", "Deepen one technical specialty", "Practice story-driven interviews"],
      roadmapAlignment: roadmaps.slice(0, 3).map((roadmap) => roadmap.title),
      overview: enhancements?.summary || "This analysis blends deterministic assessment scoring with AI-assisted explanation layers so the next move is clear and actionable.",
      confidenceBars: scoreToBars(Math.max(deterministicScore, topCareer?.confidenceLevel === "high" ? 92 : topCareer?.confidenceLevel === "medium" ? 78 : 66)),
    };
  }, [deterministicScore, enhancements?.nextActions, enhancements?.summary, roadmaps, summary?.strengths, summary?.weaknesses, topCareer?.confidenceLevel]);

  if (loading && !topCareer) {
    return (
      <div className="min-h-screen relative pb-20 pt-20">
        <NeuralBackground />
        <FloatingParticles count={24} />
        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <GlassCard glow glowColor="primary" className="py-16 text-center">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Assembling your intelligence report...</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error && !topCareer) {
    return (
      <div className="min-h-screen relative pb-20 pt-20">
        <NeuralBackground />
        <div className="max-w-3xl mx-auto px-6 py-24 relative z-10">
          <GlassCard glow glowColor="primary" className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">Analysis unavailable</h1>
            <p className="text-muted-foreground">{error}</p>
            <GlowButton variant="primary" onClick={() => window.location.reload()}>
              Retry loading
            </GlowButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />
      <FloatingParticles count={24} />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10 relative z-10">
        <Link to="/results">
          <motion.button type="button" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" whileHover={{ x: -5 }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </motion.button>
        </Link>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <GlassCard glow glowColor="primary" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/25 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary">Detailed Career Intelligence</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-bold">{topCareerLabel}</h1>
                  <p className="text-xl text-muted-foreground max-w-2xl">{topCareer?.reasons?.[0] || "AI-assisted explanation of your career potential"}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{deterministicScore}%</div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Deterministic match</p>
                    <p className="text-xs text-accent">AI-assisted explanation layered on top</p>
                  </div>
                </div>

                <p className="text-muted-foreground max-w-2xl leading-relaxed">{analysis.overview}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                  {[
                    { icon: Brain, label: "Personality", value: analysis.personality.join(" · ") },
                    { icon: Target, label: "Top signal", value: topCareer?.salaryEstimate || "AI-assisted insight" },
                    { icon: TrendingUp, label: "Roadmap fit", value: analysis.roadmapAlignment[0] || "Exploration ready" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/60 bg-background/30 backdrop-blur-sm p-4">
                      <item.icon className="w-5 h-5 text-primary mb-2" />
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-sm text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <GlassCard className="relative overflow-hidden bg-card/60 border border-border/60">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-accent/10" />
                <div className="relative z-10 space-y-6 py-8">
                  <ScoreRing value={deterministicScore} label="AI intelligence score" />
                  <div className="space-y-2 px-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium capitalize">{topCareer?.confidenceLevel || "high"}</span>
                    </div>
                    <div className="space-y-2">
                      {analysis.confidenceBars.map((value, barIndex) => (
                        <div key={`confidence-bar-${value}`} className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-secondary via-primary to-accent" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, delay: 0.15 * barIndex }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
          <SectionHeader title="Personality & Direction" subtitle="How your assessment translated into career signals" className="mb-6" />
          <div className="grid gap-6 md:grid-cols-3">
            <GlassCard glow glowColor="accent" className="space-y-3">
              <div className="flex items-center gap-3">
                <GradientIconWrapper size="sm" gradient="purple" glow>
                  <Brain className="w-5 h-5 text-white" />
                </GradientIconWrapper>
                <h3 className="font-semibold">Personality</h3>
              </div>
              <p className="text-sm text-muted-foreground">{analysis.personality.join(", ")}</p>
            </GlassCard>

            <GlassCard glow glowColor="secondary" className="space-y-3">
              <div className="flex items-center gap-3">
                <GradientIconWrapper size="sm" gradient="blue" glow>
                  <Star className="w-5 h-5 text-white" />
                </GradientIconWrapper>
                <h3 className="font-semibold">Strength bias</h3>
              </div>
              <p className="text-sm text-muted-foreground">{analysis.strengths[0]}</p>
            </GlassCard>

            <GlassCard glow glowColor="primary" className="space-y-3">
              <div className="flex items-center gap-3">
                <GradientIconWrapper size="sm" gradient="cyan" glow>
                  <AlertCircle className="w-5 h-5 text-white" />
                </GradientIconWrapper>
                <h3 className="font-semibold">Growth bias</h3>
              </div>
              <p className="text-sm text-muted-foreground">{analysis.weaknesses[0]}</p>
            </GlassCard>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
          <SectionHeader title="Skill Gaps" subtitle="What is missing from the target role and where to invest next" className="mb-6" />
          <GlassCard glow glowColor="primary">
            <div className="space-y-5">
              {analysis.skillBreakdown.map((skill, index) => (
                <motion.div key={skill.skill} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">{skill.skill}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Current <span className="text-foreground">{skill.current}%</span></span>
                      <span className="text-muted-foreground">Required <span className="text-foreground">{skill.required}%</span></span>
                      {skill.gap > 0 ? <span className="text-accent">Gap {skill.gap}%</span> : <span className="text-secondary flex items-center gap-1"><CheckCircle className="w-4 h-4" />Met</span>}
                    </div>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full" initial={{ width: 0 }} animate={{ width: `${skill.current}%` }} transition={{ duration: 1, delay: 0.2 + index * 0.08 }} />
                    <div className="absolute inset-y-0 h-full border-r-2 border-dashed border-accent" style={{ left: `${skill.required}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}>
            <SectionHeader title="Growth Recommendations" subtitle="AI-assisted actions to close the gap faster" className="mb-6" />
            <GlassCard glow glowColor="accent" className="space-y-3">
              {analysis.learningPaths.map((path, index) => (
                <div key={path} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/30 p-4">
                  <div className="mt-1 h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">{index + 1}</div>
                  <div>
                    <p className="font-medium">{path}</p>
                    <p className="text-sm text-muted-foreground">Suggested by the latest assessment and roadmap context.</p>
                  </div>
                </div>
              ))}
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}>
            <SectionHeader title="Roadmap Alignment" subtitle="How the next path maps to your existing learning plan" className="mb-6" />
            <GlassCard glow glowColor="primary" className="space-y-4">
              {analysis.roadmapAlignment.length ? (
                analysis.roadmapAlignment.map((roadmap) => (
                  <div key={roadmap} className="rounded-2xl border border-border/60 bg-background/30 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{roadmap}</p>
                      <p className="text-sm text-muted-foreground">Aligned to your current result profile</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No roadmap data was returned yet. Run the assessment again to populate this view.</p>
              )}
            </GlassCard>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.55 }}>
          <GlassCard glow glowColor="primary">
            <div className="flex items-start gap-4">
              <GradientIconWrapper size="md" gradient="purple" glow>
                <Sparkles className="w-6 h-6 text-white" />
              </GradientIconWrapper>
              <div className="flex-1 space-y-3">
                <h3 className="text-xl font-semibold">AI-assisted explanation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {enhancements?.summary || topCareer?.reasons?.[0] || "This explanation blends deterministic assessment data with AI-assisted guidance so the next step is both explainable and actionable."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(analysis.learningPaths || []).map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm border border-primary/30">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.65 }}>
          <Link to="/roadmap">
            <GlowButton variant="primary" size="lg">
              Explore Roadmap
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </GlowButton>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.75 }}>
          <SectionHeader title="Progress Snapshot" subtitle="Lightweight guide to your current state" className="mb-6" />
          <GlassCard glow glowColor="accent">
            <div className="space-y-4">
              <AnimatedProgress value={Math.max(deterministicScore, 70)} showLabel />
              <div className="grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/60 bg-background/30 p-4">Next focus: {analysis.learningPaths[0]}</div>
                <div className="rounded-2xl border border-border/60 bg-background/30 p-4">Top strength: {analysis.strengths[0]}</div>
                <div className="rounded-2xl border border-border/60 bg-background/30 p-4">Roadmap signal: {analysis.roadmapAlignment[0] || "Waiting for plan"}</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}