import { motion } from "motion/react";
import { Link } from "react-router";
import { Sparkles, Brain, Target, TrendingUp, Trophy, Flame, BookOpen, Briefcase, ArrowRight, Star, Zap, Award, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NeuralBackground } from "../components/NeuralBackground";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { SkillHeatmap } from "../components/SkillHeatmap";
import { AIForecastWidget, PlacementReadinessRing, ReadinessBreakdownCard, SkillRadarPanel, WeeklyMomentumChart } from "../components/dashboard/PlacementIntelligence";
import { useAuth } from "@/context/useAuth";
import { recommendationService } from "../../services/recommendationService";
import { jobsService } from "../../services/jobsService";
import { journeyService } from "../../services/journeyService";
import type { JourneyDashboardSnapshot } from "@/types/api";
import { Skeleton } from "../components/ui/skeleton";

export function Dashboard() {
  const { user } = useAuth();
  const [topCareer, setTopCareer] = useState<{ career: string; match: number; salaryEstimate?: string; confidenceLevel?: string; reasons?: string[] } | null>(null);
  const [skillRecommendations, setSkillRecommendations] = useState<Array<{ skill: string; confidence: number; reason: string }>>([]);
  const [roadmaps, setRoadmaps] = useState<Array<{ id: string; title: string; category: string; level: string; matchScore: number; reason: string; tags: string[] }>>([]);
  const [jobPreview, setJobPreview] = useState<Array<{ id: string; title: string; company: string; location: string; matchScore: number }>>([]);
  const [journeySnapshot, setJourneySnapshot] = useState<JourneyDashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [careerResponse, skillResponse, roadmapResponse, jobsResponse, journeyResponse] = await Promise.allSettled([
          recommendationService.getTopCareer(),
          recommendationService.getSkillRecommendations(),
          recommendationService.getRoadmapRecommendations(),
          jobsService.getJobs(),
          journeyService.getDashboardJourney(),
        ]);

        if (!mounted) return;

        if (careerResponse.status === "fulfilled") {
          setTopCareer(careerResponse.value);
        }

        if (skillResponse.status === "fulfilled") {
          setSkillRecommendations(skillResponse.value || []);
        }

        if (roadmapResponse.status === "fulfilled") {
          setRoadmaps(roadmapResponse.value || []);
        }

        if (jobsResponse.status === "fulfilled") {
          setJobPreview(jobsResponse.value.recommendedJobs?.slice(0, 3) || []);
        }

        if (journeyResponse.status === "fulfilled") {
          setJourneySnapshot(journeyResponse.value);
        }
      } catch {
        // dashboard gracefully falls back to local identity data
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const userName = user?.fullName?.split(" ")[0] || "Explorer";
  const currentTime = new Date().getHours();
  const greeting = currentTime < 12 ? "Good morning" : currentTime < 18 ? "Good afternoon" : "Good evening";

  const roadmapPreview = useMemo(() => roadmaps.slice(0, 3), [roadmaps]);
  const readinessScore = journeySnapshot?.placementReadiness?.score || journeySnapshot?.currentJourney?.placementReadiness?.score || 0;
  const unlockedOpportunities = (journeySnapshot?.eligibleJobs?.filter((job) => job.eligible).length || 0) + jobPreview.length;
  const momentumLabel = useMemo(() => {
    const points = journeySnapshot?.trend || [];
    if (points.length < 2) return "Stable";
    const recent = points.slice(-4).map((p) => p.readinessScore);
    const deltas = recent.slice(1).map((value, i) => value - recent[i]);
    const avg = deltas.length ? deltas.reduce((sum, v) => sum + v, 0) / deltas.length : 0;
    if (avg >= 2) return "Accelerating";
    if (avg >= 0.5) return "Growing";
    if (avg <= -1) return "Cooling";
    return "Stable";
  }, [journeySnapshot]);
  const weakSkillCells = useMemo(
    () =>
      (journeySnapshot?.weakSkills || []).slice(0, 6).map((skill, index) => ({
        label: skill,
        value: Math.max(30, 96 - index * 12),
      })),
    [journeySnapshot]
  );

  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <GlassCard glow glowColor="primary" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">AI Career Intelligence</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {greeting}, {userName}!
                </h1>
                {isLoading ? (
                  <Skeleton className="h-5 w-72" />
                ) : (
                  <p className="text-lg text-muted-foreground">Placement Readiness: {readinessScore}% • {unlockedOpportunities} opportunities unlocked • Momentum {momentumLabel}</p>
                )}
              </div>
              <GradientIconWrapper size="lg" gradient="purple" glow>
                <Brain className="w-12 h-12 text-white" />
              </GradientIconWrapper>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <GlassCard glow glowColor="accent" className="relative overflow-hidden min-h-[200px]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent/30 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 py-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-accent" />
                  <span className="text-sm font-medium text-accent">Ready to Discover?</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Start Your AI Career Assessment
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Unlock personalized career insights powered by adaptive AI assessment, roadmap intelligence, and job recommendations.
                </p>
              </div>
              <Link to="/assessment">
                <GlowButton variant="primary" size="lg" className="whitespace-nowrap">
                  Begin Assessment
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </GlowButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Flame, label: "Learning Streak", value: `${journeySnapshot?.streak || 0} Days`, color: "pink" as const, subtext: "Daily consistency tracker" },
            { icon: Trophy, label: "Top Career Match", value: `${topCareer?.match || 0}%`, color: "purple" as const, subtext: topCareer?.career || "Awaiting assessment" },
            { icon: Target, label: "Active Roadmaps", value: String(roadmaps.length || 0), color: "cyan" as const, subtext: roadmaps[0]?.title || "Dynamic roadmap feed" },
            { icon: Award, label: "Skill Recommendations", value: String(skillRecommendations.length || 0), color: "blue" as const, subtext: skillRecommendations[0]?.skill || "AI-assisted insight" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}>
              <GlassCard hover glow glowColor={stat.color}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    {isLoading ? (
                      <>
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                      </>
                    )}
                  </div>
                  <GradientIconWrapper size="sm" gradient={stat.color}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </GradientIconWrapper>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <GlassCard glow glowColor="secondary" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 via-primary/5 to-accent/10" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm text-secondary">
                  <Target className="w-4 h-4" />
                  Career Operating System
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">Current Journey</h3>
                  <p className="mt-2 text-muted-foreground">
                    {journeySnapshot?.currentJourney?.careerTitle || topCareer?.career || "Your AI journey is ready"}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {journeySnapshot?.nextAction || "Start an assessment to unlock a dynamic journey, daily roadmap, mentor guidance, and job eligibility."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                    Day {journeySnapshot?.currentDay || 1}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                    XP {journeySnapshot?.xp || 0}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                    Streak {journeySnapshot?.streak || 0} days
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                    Readiness {journeySnapshot?.placementReadiness?.score || 0}%
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Weak skills</p>
                  <p className="mt-2 font-medium text-sm">
                    {journeySnapshot?.weakSkills?.slice(0, 3).join(", ") || "Assessment will populate this"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Eligible jobs</p>
                  <p className="mt-2 font-medium text-sm">
                    {journeySnapshot?.eligibleJobs?.[0]?.title || "Eligibility appears after the journey begins"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-background/35 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">AI insight</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {journeySnapshot?.aiInsights?.[0] || "Your dashboard will learn from progress, streaks, and weak skills."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <Link to={`/journey/${journeySnapshot?.currentJourney?.resolvedCareerSlug || "career-journey"}`}>
                  <GlowButton variant="primary">Open Journey</GlowButton>
                </Link>
                <Link to="/opportunities">
                  <GlowButton variant="secondary">View Opportunities</GlowButton>
                </Link>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
            <PlacementReadinessRing
              readiness={journeySnapshot?.placementReadiness || journeySnapshot?.currentJourney?.placementReadiness || null}
              nextAction={journeySnapshot?.nextAction || journeySnapshot?.currentJourney?.nextAction}
            />
            <WeeklyMomentumChart snapshot={journeySnapshot} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.54 }}>
          <AIForecastWidget snapshot={journeySnapshot} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.58 }}>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <ReadinessBreakdownCard
              readiness={journeySnapshot?.placementReadiness || journeySnapshot?.currentJourney?.placementReadiness || null}
              nextAction={journeySnapshot?.nextAction || journeySnapshot?.currentJourney?.nextAction}
            />
            <SkillRadarPanel snapshot={journeySnapshot} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.64 }}>
          <GlassCard glow glowColor="pink" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink/10 via-transparent to-secondary/10" />
            <div className="relative z-10 space-y-4">
              <SectionHeader title="Weak Skill Heatmap" subtitle="Priority gaps ranked by estimated placement impact" />
              <SkillHeatmap data={weakSkillCells.length ? weakSkillCells : [{ label: "Assessment pending", value: 40 }]} columns={2} />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Why it matters</p>
                <p className="mt-2">This turns your weakest skills into a visual priority map instead of a text-only list.</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <GlassCard glow glowColor="primary" className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <GradientIconWrapper size="md" gradient="purple" glow>
                  <TrendingUp className="w-6 h-6 text-white" />
                </GradientIconWrapper>
                <h3 className="text-xl font-semibold">Active Roadmaps</h3>
              </div>

              <div className="space-y-4">
                {roadmapPreview.length ? roadmapPreview.map((roadmap, i) => (
                  <div key={roadmap.id || i} className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{roadmap.title}</h4>
                      <span className="text-sm text-primary font-medium">{roadmap.matchScore}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{roadmap.reason}</p>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" initial={{ width: 0 }} animate={{ width: `${roadmap.matchScore}%` }} transition={{ duration: 1, delay: 0.5 + i * 0.2 }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground">Roadmap suggestions will appear after your assessment.</p>
                )}
              </div>

              <Link to="/roadmap" className="block">
                <GlowButton variant="secondary" className="w-full mt-6" glow={false}>
                  View All Roadmaps
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </GlowButton>
              </Link>
              <Link to="/roadmap-catalog" className="block">
                <GlowButton variant="primary" className="w-full mt-3">
                  Browse Catalog
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </GlowButton>
              </Link>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <GlassCard glow glowColor="secondary" className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <GradientIconWrapper size="md" gradient="cyan" glow>
                  <Target className="w-6 h-6 text-white" />
                </GradientIconWrapper>
                <h3 className="text-xl font-semibold">Top Career Match</h3>
              </div>

              <div className="space-y-4">
                <div className="text-center py-6">
                  <motion.div className="text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>
                    {topCareer?.match || 0}%
                  </motion.div>
                  <p className="text-xl font-semibold mb-1">{topCareer?.career || "Complete Assessment"}</p>
                  <p className="text-sm text-muted-foreground">{topCareer?.reasons?.[0] || "Based on your skills and interests"}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Skills Match", value: topCareer?.requiredSkills?.length ? `${Math.min(100, topCareer.match + 3)}%` : "AI" },
                    { label: "Confidence", value: topCareer?.confidenceLevel || "High" },
                    { label: "Salary", value: topCareer?.salaryEstimate || "Dynamic" },
                    { label: "Growth", value: roadmaps[0]?.level || "High" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 text-center">
                      <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-semibold text-secondary">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/results" className="block">
                <GlowButton variant="secondary" className="w-full mt-6">
                  View Full Analysis
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </GlowButton>
              </Link>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <SectionHeader title="AI Recommendations" subtitle="Personalized suggestions to accelerate your career growth" className="mb-6" />

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: "Skill Focus", description: skillRecommendations[0]?.reason || "Master the next skill on your roadmap", priority: "High", time: skillRecommendations[0]?.skill || "Now" },
              { icon: Briefcase, title: "Job Search", description: jobPreview[0] ? `${jobPreview[0].title} at ${jobPreview[0].company}` : "Review your job matches after assessment", priority: "Medium", time: jobPreview[0]?.location || "This week" },
              { icon: MessageSquare, title: "Ask the Assistant", description: "Get interview, resume, and roadmap help from the AI assistant", priority: "Medium", time: "Anytime" },
            ].map((rec, i) => (
              <GlassCard key={i} hover>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <GradientIconWrapper size="sm" gradient="purple">
                      <rec.icon className="w-5 h-5 text-white" />
                    </GradientIconWrapper>
                    <span className={`text-xs px-2 py-1 rounded-full ${rec.priority === "High" ? "bg-pink/20 text-pink" : "bg-primary/20 text-primary"}`}>{rec.priority} Priority</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">{rec.time}</span>
                    <Link to={rec.title === "Ask the Assistant" ? "/assistant" : rec.title === "Job Search" ? "/jobs" : "/roadmap"} className="text-sm text-primary hover:text-primary/80 font-medium">
                      Start Now →
                    </Link>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}