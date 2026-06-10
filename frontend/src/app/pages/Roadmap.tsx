import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { CheckCircle, Circle, Lock, BookOpen, Code, Award, Clock, TrendingUp, Star, Play, ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { AnimatedProgress } from "../components/AnimatedProgress";
import { roadmapService } from "../../services/roadmapService";
import { recommendationService } from "../../services/recommendationService";
import type { RoadmapDomainSection, RoadmapLearningDay, RoadmapSummary } from "../../types/api";

type RoadmapProgressState = {
  completedTasks: string[];
  completedDays: string[];
  progressPercentage: number;
  currentDay: number;
};

function getTaskKey(roadmapId: string, dayNumber: number, taskIndex: number) {
  return `${roadmapId}:day-${dayNumber}:task-${taskIndex}`;
}

function formatEstimatedTime(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "Flexible";
  }

  if (minutes < 60) {
    return `~${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `~${hours}h ${remainder}m` : `~${hours}h`;
}

export function Roadmap() {
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [roadmapList, setRoadmapList] = useState<RoadmapSummary[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapSummary | null>(null);
  const [roadmapSections, setRoadmapSections] = useState<RoadmapDomainSection[]>([]);
  const [roadmapProgress, setRoadmapProgress] = useState<RoadmapProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string>("Based on your progress, we recommend focusing on the next milestone.");

  useEffect(() => {
    let mounted = true;

    async function loadRoadmaps() {
      try {
        setLoading(true);
        setError(null);

        const [categoryResponse, roadmapResponse, recommendedResponse, sectionResponse] = await Promise.allSettled([
          roadmapService.getCategories(),
          roadmapService.getAllRoadmaps({ limit: 8 }),
          recommendationService.getRoadmapRecommendations(),
          recommendationService.getRoadmapSections(),
        ]);

        if (!mounted) return;

        if (categoryResponse.status === "fulfilled") {
          setCategories(categoryResponse.value || []);
          setSelectedCategory((current) => current || categoryResponse.value?.[0] || null);
        }

        if (roadmapResponse.status === "fulfilled") {
          setRoadmapList(roadmapResponse.value.data || []);
          setSelectedRoadmap(roadmapResponse.value.data?.[0] || null);
        }

        if (recommendedResponse.status === "fulfilled" && recommendedResponse.value?.[0]?.reason) {
          setAiSuggestion(recommendedResponse.value[0].reason);
        }

        if (sectionResponse?.status === "fulfilled") {
          setRoadmapSections(sectionResponse.value || []);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load roadmaps");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadRoadmaps();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    let active = true;

    async function loadCategoryRoadmaps() {
      try {
        const response = await roadmapService.getRoadmapsByCategory(selectedCategory, 1, 8);
        if (active) {
          setRoadmapList(response.data || []);
          setSelectedRoadmap(response.data?.[0] || null);
        }
      } catch {
        // keep existing list when category lookup fails
      }
    }

    void loadCategoryRoadmaps();

    return () => {
      active = false;
    };
  }, [selectedCategory]);

  useEffect(() => {
    let active = true;

    async function loadSelectedRoadmap() {
      if (!selectedRoadmap?.id) {
        return;
      }

      try {
        const detail = await roadmapService.getRoadmap(String(selectedRoadmap.id));
        if (active) {
          setSelectedRoadmap(detail);
        }
      } catch {
        // keep the summary payload if detail loading fails
      }
    }

    void loadSelectedRoadmap();

    return () => {
      active = false;
    };
  }, [selectedRoadmap?.id]);

  useEffect(() => {
    let active = true;

    async function loadRoadmapProgress() {
      if (!selectedRoadmap?.id) {
        setRoadmapProgress(null);
        return;
      }

      try {
        const progress = await roadmapService.getProgress(selectedRoadmap.id);
        if (!active) {
          return;
        }

        const nextProgress: RoadmapProgressState = {
          completedTasks: Array.isArray((progress as any)?.completedTasks) ? (progress as any).completedTasks : [],
          completedDays: Array.isArray((progress as any)?.completedDays) ? (progress as any).completedDays : [],
          progressPercentage: typeof (progress as any)?.progressPercentage === "number" ? (progress as any).progressPercentage : 0,
          currentDay: typeof (progress as any)?.currentDay === "number" ? (progress as any).currentDay : 1,
        };

        setRoadmapProgress(nextProgress);
      } catch {
        if (active) {
          setRoadmapProgress({ completedTasks: [], completedDays: [], progressPercentage: 0, currentDay: 1 });
        }
      }
    }

    void loadRoadmapProgress();

    return () => {
      active = false;
    };
  }, [selectedRoadmap?.id]);

  const handleSectionSelect = (section: RoadmapDomainSection) => {
    if (section.roadmaps.length) {
      setSelectedRoadmap(section.roadmaps[0]);
    }
  };

  const roadmapData = useMemo(() => {
    const roadmap = selectedRoadmap;
    const milestones = roadmap?.milestones || [];
    const learningStructure = roadmap?.learningStructure || [];
    const progressPercentage = roadmapProgress?.progressPercentage ?? roadmap?.progress ?? 42;
    return {
      title: roadmap?.title || "Learning Roadmap",
      description: roadmap?.description || "Your personalized roadmap to career growth",
      progress: progressPercentage,
      totalDuration: roadmap?.duration || "6-8 months",
      milestones,
      learningStructure,
      totalTasks: learningStructure.reduce((total, day) => total + (day.tasks?.length || 0), 0),
      completedTasks: roadmapProgress?.completedTasks?.length || 0,
      completedDays: roadmapProgress?.completedDays?.length || 0,
    };
  }, [roadmapProgress, selectedRoadmap]);

  const toggleTaskCompletion = async (day: RoadmapLearningDay, taskIndex: number) => {
    if (!selectedRoadmap?.id) {
      return;
    }

    const roadmapId = selectedRoadmap.id;
    const taskKey = getTaskKey(roadmapId, day.day, taskIndex);
    const progress = roadmapProgress || { completedTasks: [], completedDays: [], progressPercentage: 0, currentDay: 1 };
    const hasTask = progress.completedTasks.includes(taskKey);
    const totalTasks = Math.max(1, roadmapData.totalTasks || 1);

    const nextCompletedTasks = hasTask
      ? progress.completedTasks.filter((item) => item !== taskKey)
      : Array.from(new Set([...progress.completedTasks, taskKey]));

    const nextCompletedDays = selectedLearningDays
      .filter((roadmapDay) => {
        const dayTasks = roadmapDay.tasks || [];
        if (!dayTasks.length) {
          return false;
        }

        const dayKeys = dayTasks.map((_, index) => getTaskKey(roadmapId, roadmapDay.day, index));
        return dayKeys.every((item) => nextCompletedTasks.includes(item));
      })
      .map((roadmapDay) => `day-${roadmapDay.day}`);

    const nextProgress: RoadmapProgressState = {
      completedTasks: nextCompletedTasks,
      completedDays: nextCompletedDays,
      progressPercentage: Math.min(100, Math.round((nextCompletedTasks.length / totalTasks) * 100)),
      currentDay: Math.min(selectedLearningDays.length || 1, nextCompletedDays.length + 1),
    };

    setRoadmapProgress(nextProgress);
    setSavingProgress(true);

    try {
      await roadmapService.saveProgress({
        roadmapId,
        completedTasks: nextProgress.completedTasks,
        completedDays: nextProgress.completedDays,
        progressPercentage: nextProgress.progressPercentage,
        currentDay: nextProgress.currentDay,
      });
    } catch {
      // keep the optimistic UI state if the background save fails
    } finally {
      setSavingProgress(false);
    }
  };

  const selectedLearningDays = roadmapData.learningStructure;
  const nextLearningDay = selectedLearningDays.find((day) => day.day >= (roadmapProgress?.currentDay || 1)) || selectedLearningDays[0] || null;

  if (loading && !roadmapList.length) {
    return (
      <div className="min-h-screen relative pb-20 pt-20">
        <NeuralBackground />
        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <GlassCard glow glowColor="primary" className="py-16 text-center">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading personalized roadmaps...</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error && !roadmapList.length) {
    return (
      <div className="min-h-screen relative pb-20 pt-20">
        <NeuralBackground />
        <div className="max-w-3xl mx-auto px-6 py-24 relative z-10">
          <GlassCard glow glowColor="primary" className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">Roadmaps unavailable</h1>
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

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <GlassCard glow glowColor="primary" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Learning Roadmap</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">{roadmapData.title}</h1>
                  <p className="text-muted-foreground">{roadmapData.description}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {roadmapData.progress}%
                  </div>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                  <Clock className="w-5 h-5 text-secondary mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Total Duration</p>
                  <p className="font-semibold">{roadmapData.totalDuration}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                  <BookOpen className="w-5 h-5 text-accent mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Modules</p>
                  <p className="font-semibold">{roadmapData.milestones.reduce((acc, milestone) => acc + (milestone.modules?.length || 0), 0)} Total</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-pink/10 to-transparent border border-pink/20">
                  <Award className="w-5 h-5 text-pink mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Milestones</p>
                  <p className="font-semibold">{roadmapData.milestones.length} Phases</p>
                </div>
              </div>

              <AnimatedProgress value={roadmapData.progress} showLabel={false} />
            </div>
          </GlassCard>
        </motion.div>

        {roadmapSections.length ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.03 }}>
            <GlassCard glow glowColor="secondary" className="relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <SectionHeader title="AI Career Domains" subtitle="Sections built from the roadmap database and organized by the AI layer." />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {roadmapSections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleSectionSelect(section)}
                      className="group text-left rounded-2xl border border-white/10 bg-background/30 p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{section.category || "Domain"}</p>
                          <h3 className="mt-1 text-xl font-semibold text-foreground">{section.title}</h3>
                        </div>
                        <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          Priority {section.priority}
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-muted-foreground">{section.summary}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {section.focusPoints.slice(0, 3).map((focus) => (
                          <span key={focus} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                            {focus}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 space-y-2">
                        {section.roadmaps.slice(0, 2).map((roadmap) => (
                          <div key={roadmap.id} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-foreground">{roadmap.title}</span>
                              <span className="text-xs text-primary">{roadmap.level || "All levels"}</span>
                            </div>
                          </div>
                        ))}
                        {section.roadmaps.length > 2 ? (
                          <p className="text-xs text-muted-foreground">+{section.roadmaps.length - 2} more roadmaps in this domain</p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <SectionHeader title="Learning Journey" subtitle="Follow your personalized path with AI-guided milestones" className="mb-6" />

            {selectedLearningDays.length ? (
              <div className="mb-8">
                <GlassCard glow glowColor="secondary" className="space-y-6">
                  <SectionHeader
                    title="Daily Topics"
                    subtitle="Track each day with task checkboxes, resource links, XP, and estimated time."
                  />

                  <div className="grid gap-4">
                    {selectedLearningDays.map((day) => {
                      const dayTaskKeys = day.tasks.map((_, index) => getTaskKey(selectedRoadmap?.id || "roadmap", day.day, index));
                      const completedCount = dayTaskKeys.filter((key) => roadmapProgress?.completedTasks.includes(key)).length;
                      const dayProgress = day.tasks.length ? Math.round((completedCount / day.tasks.length) * 100) : 0;
                      const dayResources = day.resources || [];
                      const estimatedMinutes = dayResources.reduce((total, resource) => total + (resource.estimatedMinutes || 0), 0) || day.tasks.length * 20;
                      const dayComplete = day.tasks.length > 0 && completedCount === day.tasks.length;

                      return (
                        <GlassCard key={day.day} className="border border-white/10 bg-background/30">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                  Day {day.day}
                                </span>
                                <span className="text-sm text-muted-foreground">{day.focus}</span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                                  {formatEstimatedTime(estimatedMinutes)}
                                </span>
                                <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs text-secondary">
                                  {day.xp} XP
                                </span>
                              </div>
                              <h3 className="text-xl font-semibold">{day.dailyTopics?.[0] || day.deliverable}</h3>
                              <p className="text-sm text-muted-foreground">{day.deliverable}</p>
                            </div>
                            <div className="flex flex-col items-start gap-2 xl:items-end">
                              <div className="text-2xl font-bold text-primary">{dayProgress}%</div>
                              <div className="h-2 w-44 overflow-hidden rounded-full bg-white/5">
                                <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${dayProgress}%` }} />
                              </div>
                              <p className="text-xs text-muted-foreground">{completedCount} of {day.tasks.length} tasks complete</p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="space-y-3">
                              {day.tasks.map((task, taskIndex) => {
                                const taskKey = dayTaskKeys[taskIndex];
                                const checked = roadmapProgress?.completedTasks.includes(taskKey) || false;

                                return (
                                  <label
                                    key={taskKey}
                                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${checked ? "border-secondary/30 bg-secondary/10" : "border-white/10 bg-white/5 hover:border-primary/20"} ${savingProgress ? "opacity-80" : ""}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => void toggleTaskCompletion(day, taskIndex)}
                                      className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                                    />
                                    <span className={checked ? "text-foreground line-through decoration-secondary/60" : "text-foreground"}>
                                      {task}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>

                            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Daily Topics</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(day.dailyTopics || []).map((topic) => (
                                    <span key={topic} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resources</p>
                                <div className="mt-2 space-y-2">
                                  {day.resources?.map((resource) => (
                                    <a
                                      key={resource.url}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition-all hover:border-primary/20 hover:bg-primary/10"
                                    >
                                      <span>
                                        {resource.title}
                                        <span className="ml-2 text-xs text-muted-foreground">{resource.provider}</span>
                                      </span>
                                      <span className="text-xs text-primary">{resource.estimatedMinutes ? `${resource.estimatedMinutes}m` : resource.type}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>

                              {dayComplete ? (
                                <div className="rounded-xl border border-secondary/20 bg-secondary/10 px-3 py-2 text-sm text-secondary">
                                  Day completed. Move to the next learning block.
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </GlassCard>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-2 rounded-full text-sm border transition-all ${selectedCategory === null ? "bg-primary/20 text-primary border-primary/40" : "bg-card/40 text-muted-foreground border-border"}`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-2 rounded-full text-sm border transition-all ${selectedCategory === category ? "bg-primary/20 text-primary border-primary/40" : "bg-card/40 text-muted-foreground border-border"}`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {roadmapData.milestones.map((milestone: any, index) => {
                const isSelected = selectedMilestone === index;
                const status = milestone.status || (index === 0 ? "completed" : index === 1 ? "in-progress" : "locked");
                const Icon = status === "completed" ? CheckCircle : status === "in-progress" ? Circle : Lock;

                const iconColor = status === "completed" ? "text-secondary" : status === "in-progress" ? "text-primary" : "text-muted-foreground";
                const borderColor = status === "completed" ? "border-secondary/30" : status === "in-progress" ? "border-primary/30" : "border-border";

                return (
                  <motion.div
                    key={milestone.id || index}
                    className="relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    {index < roadmapData.milestones.length - 1 && <div className={`absolute left-6 top-20 w-0.5 h-full ${status === "completed" ? "bg-secondary/30" : "bg-border"}`} />}

                    <GlassCard
                      hover={status !== "locked"}
                      glow={status !== "locked"}
                      glowColor={status === "completed" ? "secondary" : status === "in-progress" ? "primary" : "accent"}
                      className={`border-2 ${borderColor} cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary/50" : ""}`}
                      onClick={() => status !== "locked" && setSelectedMilestone(index)}
                    >
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full border-2 ${borderColor} flex items-center justify-center ${status !== "locked" ? "bg-card/80" : "bg-muted/20"}`}>
                            <Icon className={`w-6 h-6 ${iconColor}`} />
                          </div>
                          {status === "completed" && (
                            <motion.div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <CheckCircle className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-semibold mb-1">{milestone.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {milestone.duration || "Flexible timeline"}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${status === "completed" ? "bg-secondary/20 text-secondary" : status === "in-progress" ? "bg-primary/20 text-primary" : "bg-muted/20 text-muted-foreground"}`}>
                                  {status === "completed" ? "Completed" : status === "in-progress" ? "In Progress" : "Locked"}
                                </span>
                              </div>
                            </div>
                            {status !== "locked" && (
                              <GradientIconWrapper size="sm" gradient={status === "completed" ? "cyan" : "purple"} glow>
                                <BookOpen className="w-5 h-5 text-white" />
                              </GradientIconWrapper>
                            )}
                          </div>

                          <AnimatePresence>
                            {isSelected && (
                              <motion.div className="space-y-2 mt-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                {(milestone.modules || []).map((module: any, moduleIndex: number) => (
                                  <div key={moduleIndex} className={`flex items-center justify-between p-3 rounded-lg ${module.completed ? "bg-secondary/10 border border-secondary/20" : status === "in-progress" ? "bg-primary/5 border border-primary/10" : "bg-muted/5 border border-border"}`}>
                                    <div className="flex items-center gap-3">
                                      {module.completed ? <CheckCircle className="w-5 h-5 text-secondary" /> : status === "in-progress" ? <Circle className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                                      <span className={module.completed || status === "in-progress" ? "text-foreground" : "text-muted-foreground"}>{module.name || module.title || module.id || "Module"}</span>
                                    </div>
                                    {!module.completed && status === "in-progress" && (
                                      <button className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1">
                                        <Play className="w-4 h-4" />
                                        Start
                                      </button>
                                    )}
                                  </div>
                                ))}

                                {status === "in-progress" && (
                                  <GlowButton variant="primary" className="w-full mt-4">
                                    Continue Learning
                                  </GlowButton>
                                )}
                                {status === "completed" && (
                                  <div className="flex items-center justify-center gap-2 p-3 bg-secondary/10 rounded-lg border border-secondary/20 mt-4">
                                    <Star className="w-5 h-5 text-secondary" />
                                    <span className="text-secondary font-medium">Milestone Completed!</span>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <GlassCard glow glowColor="accent" className="h-fit">
              <div className="flex items-start gap-4">
                <GradientIconWrapper size="md" gradient="blue" glow>
                  <Code className="w-6 h-6 text-white" />
                </GradientIconWrapper>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI Learning Suggestion</h3>
                    <p className="text-muted-foreground">{aiSuggestion}</p>
                  </div>
                  <GlowButton variant="accent" className="w-full">
                    Continue this roadmap
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </GlowButton>
                </div>
              </div>
            </GlassCard>

            <GlassCard glow glowColor="primary" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
                  <p className="text-3xl font-bold text-primary">{roadmapData.progress}%</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{roadmapData.completedTasks} tasks complete</p>
                  <p>{roadmapData.completedDays} days complete</p>
                </div>
              </div>

              <AnimatedProgress value={roadmapData.progress} showLabel={false} />

              {nextLearningDay ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Next up</p>
                  <p className="mt-2 font-semibold">Day {nextLearningDay.day}: {nextLearningDay.focus}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{nextLearningDay.deliverable}</p>
                </div>
              ) : null}
            </GlassCard>

              <Link to="/roadmap-catalog" className="block">
                <GlowButton variant="primary" className="w-full">
                  Open Full Catalog
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </GlowButton>
              </Link>

            <SectionHeader title="Available Roadmaps" subtitle="Switch between domains without leaving the platform" />
            <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
              {roadmapList.map((roadmap) => (
                <button
                  key={roadmap.id}
                  onClick={() => setSelectedRoadmap(roadmap)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedRoadmap?.id === roadmap.id ? "bg-primary/10 border-primary/30" : "bg-card/40 border-border hover:border-primary/20"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{roadmap.category || "Roadmap"}</div>
                      <h4 className="font-semibold mt-1">{roadmap.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{roadmap.description}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 mt-1 transition-transform ${selectedRoadmap?.id === roadmap.id ? "rotate-180" : ""}`} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{roadmap.level || "All levels"}</span>
                    <span>{roadmap.tags?.slice(0, 3).join(" • ") || "AI-assisted"}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}