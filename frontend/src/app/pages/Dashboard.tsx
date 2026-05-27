import { motion } from "motion/react";
import { Link } from "react-router";
import { Sparkles, Brain, Target, TrendingUp, Trophy, Flame, BookOpen, Briefcase, ArrowRight, Star, Zap, Award, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NeuralBackground } from "../components/NeuralBackground";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { AnimatedProgress } from "../components/AnimatedProgress";
import { useAuth } from "../../context/AuthContext";
import { recommendationService } from "../../services/recommendationService";
import { jobsService } from "../../services/jobsService";

export function Dashboard() {
  const { user } = useAuth();
  const [topCareer, setTopCareer] = useState<{ career: string; match: number; salaryEstimate?: string; confidenceLevel?: string; reasons?: string[] } | null>(null);
  const [skillRecommendations, setSkillRecommendations] = useState<Array<{ skill: string; confidence: number; reason: string }>>([]);
  const [roadmaps, setRoadmaps] = useState<Array<{ id: string; title: string; category: string; level: string; matchScore: number; reason: string; tags: string[] }>>([]);
  const [jobPreview, setJobPreview] = useState<Array<{ id: string; title: string; company: string; location: string; matchScore: number }>>([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const [careerResponse, skillResponse, roadmapResponse, jobsResponse] = await Promise.allSettled([
          recommendationService.getTopCareer(),
          recommendationService.getSkillRecommendations(),
          recommendationService.getRoadmapRecommendations(),
          jobsService.getJobs(),
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
      } catch {
        // dashboard gracefully falls back to local identity data
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
                <p className="text-lg text-muted-foreground">Your AI-powered career journey continues</p>
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
            { icon: Flame, label: "Learning Streak", value: "12 Days", color: "pink" as const, subtext: "+2 from last week" },
            { icon: Trophy, label: "Top Career Match", value: `${topCareer?.match || 0}%`, color: "purple" as const, subtext: topCareer?.career || "Awaiting assessment" },
            { icon: Target, label: "Active Roadmaps", value: String(roadmaps.length || 0), color: "cyan" as const, subtext: roadmaps[0]?.title || "Dynamic roadmap feed" },
            { icon: Award, label: "Skill Recommendations", value: String(skillRecommendations.length || 0), color: "blue" as const, subtext: skillRecommendations[0]?.skill || "AI-assisted insight" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}>
              <GlassCard hover glow glowColor={stat.color}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                  </div>
                  <GradientIconWrapper size="sm" gradient={stat.color}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </GradientIconWrapper>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <GlassCard glow glowColor="accent">
            <div className="flex items-center gap-3 mb-6">
              <GradientIconWrapper size="md" gradient="blue" glow>
                <TrendingUp className="w-6 h-6 text-white" />
              </GradientIconWrapper>
              <h3 className="text-xl font-semibold">This Week's Progress</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Skill Recommendations</span>
                    <span className="text-sm font-medium">{skillRecommendations.length}/6</span>
                  </div>
                  <AnimatedProgress value={skillRecommendations.length} max={6} showLabel={false} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Roadmap Suggestions</span>
                    <span className="text-sm font-medium">{roadmaps.length}/5</span>
                  </div>
                  <AnimatedProgress value={Math.min(roadmaps.length, 5)} max={5} showLabel={false} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Job Matches</span>
                    <span className="text-sm font-medium">{jobPreview.length}/3</span>
                  </div>
                  <AnimatedProgress value={jobPreview.length} max={3} showLabel={false} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Career Match</span>
                    <span className="text-sm font-medium">{topCareer?.match || 0}%</span>
                  </div>
                  <AnimatedProgress value={topCareer?.match || 0} max={100} showLabel={false} />
                </div>
              </div>

              <div className="flex flex-col justify-center items-center text-center p-4 rounded-lg bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                <div className="text-4xl font-bold text-accent mb-1">{topCareer?.match || 0}%</div>
                <p className="text-sm text-muted-foreground">Weekly Goal Achievement</p>
                <p className="text-xs text-accent mt-2">{topCareer?.confidenceLevel ? "AI-assisted insight ready" : "Complete your assessment"}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}