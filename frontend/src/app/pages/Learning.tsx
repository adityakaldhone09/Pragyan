import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, BookOpen, CheckCircle2, Flame, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { AnimatedProgress } from "../components/AnimatedProgress";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { learningService } from "../../services/learningService";
import type { DailyLearningSnapshot } from "@/types/api";

export function Learning() {
  const [snapshot, setSnapshot] = useState<DailyLearningSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    let mounted = true;

    async function loadLearning() {
      try {
        const data = await learningService.getToday();
        if (!mounted) return;
        setSnapshot(data);
        setSelectedDay(data.currentDay || data.today.dayNumber);
      } catch (error) {
        if (mounted) {
          toast.error(error instanceof Error ? error.message : "Unable to load daily learning");
          setSnapshot(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadLearning();

    return () => {
      mounted = false;
    };
  }, []);

  const currentDay = useMemo(
    () => snapshot?.days.find((day) => day.dayNumber === selectedDay) || snapshot?.today || null,
    [snapshot, selectedDay]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-muted-foreground bg-background">
        Loading your learning journey...
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background px-6 py-10">
        <NeuralBackground />
        <FloatingParticles count={12} />
        <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <GlassCard glow glowColor="primary" className="w-full text-center">
            <SectionHeader
              title="No active learning journey"
              subtitle="Complete your assessment or roadmap setup to unlock the daily learning system."
            />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/journey">
                <GlowButton variant="primary">Open Journey</GlowButton>
              </Link>
              <Link to="/roadmap">
                <GlowButton variant="secondary">Browse Roadmaps</GlowButton>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-8">
      <NeuralBackground />
      <FloatingParticles count={16} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard glow glowColor="primary" className="overflow-hidden">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <SectionHeader
                  title={snapshot.roadmapTitle}
                  subtitle={`Daily learning journey for ${snapshot.careerTitle}`}
                />
                <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                  Follow a Duolingo-style path with one topic, one practical task, and one quiz per day. The plan keeps you focused on small wins that compound into career momentum.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">XP</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{snapshot.xp}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Streak</p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-foreground">
                    <Flame className="h-5 w-5 text-orange-400" />
                    {snapshot.streak}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Day</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{snapshot.currentDay}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Roadmap</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{snapshot.totalDays}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <h2 className="text-2xl font-semibold text-foreground">Your daily momentum</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-2 text-sm text-cyan-100">
                <Sparkles className="h-4 w-4" />
                {snapshot.progress.quizUnlocked ? "Quiz unlocked" : "Complete today's task to unlock quiz"}
              </div>
            </div>

            <AnimatedProgress value={snapshot.progress.progressPercentage} />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current lesson</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{snapshot.today.topic}</p>
                <p className="mt-1 text-sm text-muted-foreground">{snapshot.today.overview}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Task XP</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{snapshot.today.xpReward} XP</p>
                <p className="mt-1 text-sm text-muted-foreground">Earned when you finish the daily task.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quiz</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {snapshot.progress.quizUnlocked ? "Ready" : "Locked"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Unlocks after today's practice task.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={`/learning/day/${snapshot.today.dayNumber}`}>
                <GlowButton variant="primary">
                  Open today's lesson
                  <ArrowRight className="ml-2 h-4 w-4" />
                </GlowButton>
              </Link>
              <Link to="/resume-builder">
                <GlowButton variant="secondary">Build resume from progress</GlowButton>
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Focus today</p>
                <h2 className="text-xl font-semibold text-foreground">{currentDay?.topic}</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white">
                <Target className="h-5 w-5" />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{currentDay?.overview}</p>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Task</p>
              <p className="mt-2 text-sm text-foreground">{currentDay?.task}</p>
            </div>

            <div className="space-y-3">
              {currentDay?.resources.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-primary/30 hover:bg-primary/10"
                >
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <BookOpen className="h-4 w-4 text-cyan-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">{resource.provider} - {resource.estimatedMinutes} min</p>
                  </div>
                </a>
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Day cards</p>
              <h2 className="text-2xl font-semibold text-foreground">Your roadmap progression</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4 text-amber-300" />
              Complete a day to unlock the next one
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.days.map((day, index) => (
              <motion.div
                key={day.dayNumber}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
              >
                <Link to={`/learning/day/${day.dayNumber}`} className="block h-full">
                  <div
                    className={[
                      "h-full rounded-3xl border p-4 transition-all",
                      day.dayNumber === snapshot.currentDay
                        ? "border-primary/40 bg-primary/10 shadow-[0_0_30px_rgba(139,92,246,0.18)]"
                        : day.completed
                          ? "border-secondary/25 bg-secondary/10"
                          : "border-white/10 bg-white/5 hover:border-primary/25 hover:bg-primary/10",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Day {day.dayNumber}</p>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">{day.topic}</h3>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        {day.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <CircleDotIcon />}
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{day.overview}</p>

                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{day.xpReward} XP</span>
                      <span>{day.resources.length} resources</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function CircleDotIcon() {
  return <div className="h-3 w-3 rounded-full bg-gradient-to-br from-primary to-secondary" />;
}
