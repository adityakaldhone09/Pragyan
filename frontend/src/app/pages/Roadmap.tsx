import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { CheckCircle, Circle, Lock, BookOpen, Code, Award, Clock, TrendingUp, Star, Play, ArrowRight, ChevronDown, Sparkles, Trophy, Flame, Zap } from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { AnimatedProgress } from "../components/AnimatedProgress";
import { roadmapService } from "../../services/roadmapService";
import { recommendationService } from "../../services/recommendationService";
import { useAuth } from "@/context/useAuth";
import { aiService } from "../../services/aiService";
import type { RoadmapDomainSection, RoadmapLearningDay, RoadmapLearningResource, RoadmapProject, RoadmapSummary, SmartDailyPlanTask } from "../../types/api";

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

type ResourceSlot = "docs" | "video" | "practice" | "quiz" | "project";

const resourceSlotPriority: ResourceSlot[] = ["docs", "video", "practice", "quiz", "project"];

function normalizeText(value?: string | null) {
  return String(value || "").toLowerCase();
}

function getResourceSlot(resource: RoadmapLearningResource): ResourceSlot {
  const haystack = normalizeText([resource.title, resource.provider, resource.type, resource.url].join(" "));

  if (/(official|docs?|documentation|w3schools|roadmap\.sh|owasp|portswigger|linux journey|ubuntu)/i.test(haystack)) {
    return "docs";
  }

  if (/(quiz|mcq|test|assessment|exercise|certification)/i.test(haystack)) {
    return "quiz";
  }

  if (/(practice|project|build|lab|hackthebox|tryhackme|over the wire|leetcode)/i.test(haystack)) {
    return "practice";
  }

  if (/(coursera|udemy|freecodecamp|youtube|video|hitesh|fireship|net ninja|programming with mosh|code with harry)/i.test(haystack)) {
    return "video";
  }

  return "project";
}

function getSlotMeta(slot: ResourceSlot) {
  switch (slot) {
    case "docs":
      return { label: "W3Schools Reading", icon: "📘", fallback: "W3Schools reading guide", action: "Read now" };
    case "video":
      return { label: "Video", icon: "🎥", fallback: "freeCodeCamp or trusted YouTube video", action: "Watch video" };
    case "practice":
      return { label: "Practice", icon: "🛠", fallback: "Build a short hands-on exercise", action: "Practice" };
    case "quiz":
      return { label: "Quiz", icon: "🧠", fallback: "5 MCQs to check retention", action: "Take quiz" };
    case "project":
    default:
      return { label: "Project", icon: "🚀", fallback: "Mini project to apply the topic", action: "Start project" };
  }
}

function buildStructuredResourceCards(day: RoadmapLearningDay) {
  const grouped = new Map<ResourceSlot, RoadmapLearningResource[]>();

  for (const slot of resourceSlotPriority) {
    grouped.set(slot, []);
  }

  (day.resources || []).forEach((resource) => {
    const slot = getResourceSlot(resource);
    grouped.get(slot)?.push(resource);
  });

  return resourceSlotPriority.map((slot) => {
    const meta = getSlotMeta(slot);
    const resource = grouped.get(slot)?.[0];

    return {
      slot,
      ...meta,
      title: resource?.title || meta.fallback,
      provider: resource?.provider,
      url: resource?.url,
      estimatedMinutes: resource?.estimatedMinutes || (slot === "quiz" ? 10 : slot === "project" ? 45 : 25),
      description: resource?.description || meta.fallback,
    };
  });
}

type MentorLevel = "Beginner" | "Intermediate" | "Advanced";

function pickMentorLevel(roadmap?: RoadmapSummary | null): MentorLevel {
  const normalized = String(roadmap?.level || roadmap?.difficulty || "").toLowerCase();

  if (normalized.includes("advanced") || normalized.includes("expert")) {
    return "Advanced";
  }

  if (normalized.includes("intermediate") || normalized.includes("mid")) {
    return "Intermediate";
  }

  return "Beginner";
}

export function Roadmap() {
  const { user } = useAuth();
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
  const [mentorQuestion, setMentorQuestion] = useState("");
  const [mentorReply, setMentorReply] = useState<string>("");
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorLevel, setMentorLevel] = useState<MentorLevel>("Beginner");
  const [mentorTopic, setMentorTopic] = useState<string>("");
  const mentorPanelRef = useRef<HTMLDivElement | null>(null);
  const [availableMinutes, setAvailableMinutes] = useState(120);
  const [dailyPlan, setDailyPlan] = useState<SmartDailyPlanResponse | null>(null);
  const [dailyPlanLoading, setDailyPlanLoading] = useState(false);

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
  const mentorTopicOptions = useMemo(() => {
    const topics = new Set<string>();

    selectedLearningDays.slice(0, 4).forEach((day) => {
      (day.dailyTopics || []).slice(0, 3).forEach((topic) => topics.add(topic));
      if (day.focus) topics.add(day.focus);
    });

    return Array.from(topics).slice(0, 8);
  }, [selectedLearningDays]);

  useEffect(() => {
    setMentorLevel(pickMentorLevel(selectedRoadmap));
    setMentorTopic(selectedLearningDays[0]?.dailyTopics?.[0] || selectedLearningDays[0]?.focus || selectedRoadmap?.title || "");
  }, [selectedLearningDays, selectedRoadmap]);

  useEffect(() => {
    const streak = Number(user?.streak || 0);
    const completedDays = Number(roadmapProgress?.completedDays?.length || 0);
    const missedDays = Math.max(0, (roadmapProgress?.currentDay || 1) - 1 - completedDays);

    if (streak >= 14) {
      setAvailableMinutes(180);
    } else if (streak >= 7) {
      setAvailableMinutes(150);
    } else if (missedDays > 0) {
      setAvailableMinutes(90);
    } else {
      setAvailableMinutes(120);
    }
  }, [roadmapProgress?.completedDays?.length, roadmapProgress?.currentDay, user?.streak]);

  useEffect(() => {
    let active = true;

    async function loadDailyPlan() {
      if (!selectedRoadmap?.id || !selectedLearningDays.length) {
        setDailyPlan(null);
        return;
      }

      const currentDay = selectedLearningDays.find((day) => day.day >= (roadmapProgress?.currentDay || 1)) || selectedLearningDays[0];
      const missedDays = Math.max(0, (roadmapProgress?.currentDay || 1) - 1 - (roadmapProgress?.completedDays?.length || 0));

      setDailyPlanLoading(true);

      try {
        const plan = await aiService.generateDailyPlan({
          roadmapTitle: selectedRoadmap.title,
          roadmapCategory: selectedRoadmap.category,
          currentDay: roadmapProgress?.currentDay || currentDay?.day || 1,
          completedTopics: selectedLearningDays
            .filter((day) => roadmapProgress?.completedDays?.includes(`day-${day.day}`))
            .flatMap((day) => day.dailyTopics || [])
            .slice(0, 20),
          weakSkills: selectedRoadmap.requiredSkills?.slice(0, 8) || [],
          level: mentorLevel,
          availableTime: availableMinutes,
          missedDays,
          streak: Number(user?.streak || 0),
          currentFocus: currentDay?.focus || selectedRoadmap.title,
          currentTopics: currentDay?.dailyTopics || [],
        });

        if (active) {
          setDailyPlan(plan);
        }
      } catch {
        if (active) {
          setDailyPlan({
            todayGoal: currentDay?.dailyTopics?.[0] || currentDay?.focus || selectedRoadmap.title,
            estimatedMinutes: availableMinutes,
            tasks: [
              { type: 'learn', title: currentDay?.dailyTopics?.[0] || currentDay?.focus || selectedRoadmap.title, minutes: 25 },
              { type: 'practice', title: 'Build a small hands-on exercise', minutes: 35 },
              { type: 'quiz', title: 'Quick self-check quiz', minutes: 10 },
              { type: 'revision', title: 'Review yesterday’s concepts', minutes: 15 },
            ],
            xpReward: 65,
            level: mentorLevel,
            rationale: 'Fallback plan used because the AI planner is unavailable.',
          });
        }
      } finally {
        if (active) {
          setDailyPlanLoading(false);
        }
      }
    }

    void loadDailyPlan();

    return () => {
      active = false;
    };
  }, [availableMinutes, mentorLevel, roadmapProgress?.completedDays, roadmapProgress?.currentDay, selectedLearningDays, selectedRoadmap, user?.streak]);
  const achievements = [
    { icon: Flame, label: "7 Day Streak", earned: (user?.streak || 0) >= 7, hint: `${user?.streak || 0} day streak` },
    { icon: Zap, label: "First 100 XP", earned: (user?.xp || 0) >= 100, hint: `${user?.xp || 0} XP total` },
    { icon: BookOpen, label: "10 Topics Completed", earned: roadmapData.completedDays >= 10, hint: `${roadmapData.completedDays} days complete` },
    { icon: Trophy, label: "First Project Built", earned: roadmapData.completedTasks >= 1, hint: `${roadmapData.completedTasks} tasks completed` },
  ];

  async function askMentor(promptOverride?: string, day?: RoadmapLearningDay) {
    if (!selectedRoadmap?.id) {
      return;
    }

    const currentDay = day || nextLearningDay || selectedLearningDays[0] || null;
    const topic = promptOverride || mentorQuestion || mentorTopic || currentDay?.dailyTopics?.[0] || currentDay?.focus || selectedRoadmap.title;
    const question = promptOverride || mentorQuestion || `Explain ${topic} like I'm ${mentorLevel.toLowerCase()}`;

    setMentorLoading(true);
    setMentorReply("");

    try {
      const response = await aiService.chat({
        message: question,
        context: {
          roadmap: selectedRoadmap.title,
          roadmapTitle: selectedRoadmap.title,
          mentorLevel,
          mentorDay: currentDay ? `Day ${currentDay.day}` : undefined,
          mentorTopic: topic,
          goal: selectedRoadmap.careerPath || selectedRoadmap.category || selectedRoadmap.title,
          completedTopics: (roadmapProgress?.completedDays || []).slice(0, 20),
          weakSkills: selectedRoadmap.requiredSkills?.slice(0, 8) || [],
        },
      });

      setMentorReply(response.reply);
      mentorPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setMentorReply(error instanceof Error ? error.message : "Unable to get an AI mentor reply right now.");
    } finally {
      setMentorLoading(false);
    }
  }

  const planTaskGroups = useMemo(() => {
    const groups: Record<string, SmartDailyPlanTask[]> = {};
    (dailyPlan?.tasks || []).forEach((task) => {
      const key = task.type.toLowerCase();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
    });
    return groups;
  }, [dailyPlan]);

  const unlockedProject = useMemo<RoadmapProject | null>(() => {
    if (!selectedRoadmap?.projects?.length) {
      return null;
    }

    const availableTime = dailyPlan?.estimatedMinutes || availableMinutes;
    return selectedRoadmap.projects.find((project) => project.estimatedMinutes <= availableTime) || selectedRoadmap.projects[0] || null;
  }, [availableMinutes, dailyPlan?.estimatedMinutes, selectedRoadmap]);

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

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">XP</p>
                  <p className="text-2xl font-bold text-primary">{user?.xp || 0}</p>
                  <p className="text-sm text-muted-foreground">Total learning points</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Streak</p>
                  <p className="text-2xl font-bold text-secondary">{user?.streak || 0}</p>
                  <p className="text-sm text-muted-foreground">Consecutive active days</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Achievement</p>
                  <p className="text-2xl font-bold text-pink-400">{(user?.streak || 0) >= 3 ? "Daily Explorer" : "Starter"}</p>
                  <p className="text-sm text-muted-foreground">Unlocked by regular progress</p>
                </div>
              </div>

              <AnimatedProgress value={roadmapData.progress} showLabel={false} />
            </div>
          </GlassCard>
        </motion.div>

          <GlassCard glow glowColor="secondary" className="relative overflow-hidden border border-secondary/20 bg-gradient-to-br from-secondary/10 via-background/80 to-primary/10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
                    <Sparkles className="h-4 w-4" />
                    Your Smart Daily Plan
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today&apos;s Goal</p>
                    <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-foreground">
                      {dailyPlanLoading ? 'Building your plan...' : dailyPlan?.todayGoal || nextLearningDay?.dailyTopics?.[0] || nextLearningDay?.focus || roadmapData.title}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      {dailyPlan?.rationale || 'The plan adapts to your roadmap, streak, weak skills, and available time.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
                      Estimated Time: {formatEstimatedTime(dailyPlan?.estimatedMinutes || availableMinutes)}
                    </span>
                    <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-xs text-secondary">
                      XP Reward: +{dailyPlan?.xpReward || 65} XP
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
                      Level: {mentorLevel}
                    </span>
                    {dailyPlan?.adaptiveMode ? (
                      <span className={`rounded-full border px-3 py-1.5 text-xs ${dailyPlan.adaptiveMode === 'stretch' ? 'border-primary/30 bg-primary/15 text-primary' : dailyPlan.adaptiveMode === 'recovery' ? 'border-secondary/30 bg-secondary/15 text-secondary' : 'border-white/10 bg-white/5 text-muted-foreground'}`}>
                        Adaptive Mode: {dailyPlan.adaptiveMode}
                      </span>
                    ) : null}
                  </div>
                  {dailyPlan?.adaptiveReason ? <p className="text-xs text-muted-foreground max-w-2xl">{dailyPlan.adaptiveReason}</p> : null}
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4 lg:w-[320px]">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Available Time</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                    {[90, 120, 150, 180].map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => setAvailableMinutes(minutes)}
                        className={`rounded-xl border px-3 py-2 text-sm transition-all ${availableMinutes === minutes ? 'border-primary/40 bg-primary/20 text-primary' : 'border-white/10 bg-white/5 text-muted-foreground hover:border-primary/20 hover:text-foreground'}`}
                      >
                        {formatEstimatedTime(minutes)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">The planner uses this budget to shape your day.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {['learn', 'practice', 'quiz', 'revision'].map((type) => (
                  <div key={type} className="rounded-2xl border border-white/10 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{type}</p>
                    <div className="mt-3 space-y-3">
                      {(planTaskGroups[type] || []).map((task, index) => (
                        <div key={`${type}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{task.minutes} min</p>
                          {task.details ? <p className="mt-2 text-xs text-muted-foreground/80">{task.details}</p> : null}
                        </div>
                      ))}
                      {!planTaskGroups[type]?.length ? (
                        <p className="text-xs text-muted-foreground">Waiting for plan generation.</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {planTaskGroups.project?.length || unlockedProject ? (
                <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background/70 to-secondary/15 p-5 shadow-lg shadow-primary/10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        <Trophy className="h-3.5 w-3.5" />
                        Mini Project Unlocked
                      </div>
                      <h3 className="text-2xl font-semibold text-foreground">
                        {planTaskGroups.project?.[0]?.title || unlockedProject?.title || 'Build something today'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Learn → Build → Unlock. This is the outcome-driven step that turns the roadmap into a portfolio signal.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
                        Estimated Time: {formatEstimatedTime((planTaskGroups.project?.[0]?.minutes || unlockedProject?.estimatedMinutes || 45))}
                      </span>
                      <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-xs text-secondary">
                        Reward: +{unlockedProject?.xpReward || dailyPlan?.xpReward || 120} XP
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
                        {unlockedProject?.difficulty || 'beginner'} tier
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Skills Used</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(unlockedProject?.skillsUsed || selectedRoadmap?.requiredSkills || []).slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-full border border-white/10 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Unlock After</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(unlockedProject?.unlockAfterTopics || selectedLearningDays[0]?.dailyTopics || []).slice(0, 4).map((topic) => (
                          <span key={topic} className="rounded-full border border-white/10 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Portfolio Signal</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Finish this project to unlock a stronger badge, better momentum, and a resume-worthy artifact.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </GlassCard>

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
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMentorTopic(day.dailyTopics?.[0] || day.focus || day.deliverable);
                                    void askMentor(`Explain ${day.dailyTopics?.[0] || day.focus || day.deliverable} like I'm ${mentorLevel.toLowerCase()}`, day);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:border-primary/40 hover:bg-primary/15"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Ask AI Mentor
                                </button>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
                                  Level: {mentorLevel}
                                </span>
                              </div>
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
                                  <div className="mt-2 grid gap-2">
                                    {buildStructuredResourceCards(day).map((resource) => (
                                      <div key={`${day.day}-${resource.slot}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                              <span>{resource.icon}</span>
                                              <span>{resource.label}</span>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">{resource.title}</p>
                                            {resource.provider ? <p className="mt-1 text-xs text-muted-foreground">{resource.provider}</p> : null}
                                          </div>
                                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                                            {resource.estimatedMinutes ? `${resource.estimatedMinutes}m` : "45m"}
                                          </span>
                                        </div>
                                        {resource.url ? (
                                          <a href={resource.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-secondary hover:text-secondary/80">
                                            {resource.action} →
                                          </a>
                                        ) : null}
                                      </div>
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

            <GlassCard glow glowColor="primary" className="space-y-4" ref={mentorPanelRef as any}>
              <div className="flex items-start gap-4">
                <GradientIconWrapper size="sm" gradient="pink" glow>
                  <Sparkles className="w-5 h-5 text-white" />
                </GradientIconWrapper>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold">Ask AI Mentor</h3>
                    <p className="text-sm text-muted-foreground">
                      Get an explanation tuned to your roadmap level with analogy, code, mini quiz, and a practice task.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(["Beginner", "Intermediate", "Advanced"] as MentorLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setMentorLevel(level)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${mentorLevel === level ? "border-primary/40 bg-primary/20 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:border-primary/20 hover:text-foreground"}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {mentorTopicOptions.length ? mentorTopicOptions.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setMentorTopic(topic)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-all ${mentorTopic === topic ? "border-secondary/40 bg-secondary/15 text-secondary" : "border-white/10 bg-white/5 text-muted-foreground hover:border-secondary/20 hover:text-foreground"}`}
                      >
                        {topic}
                      </button>
                    )) : null}
                  </div>

                  <textarea
                    value={mentorQuestion}
                    onChange={(event) => setMentorQuestion(event.target.value)}
                    placeholder={`Ask about ${mentorTopic || selectedRoadmap?.title || "this roadmap"}...`}
                    className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-background/60 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40"
                  />

                  <div className="flex flex-wrap gap-2">
                    {[
                      `Explain ${mentorTopic || "this topic"} like I'm a ${mentorLevel.toLowerCase()}`,
                      `Give me a mini quiz on ${mentorTopic || "this topic"}`,
                      `What should I practice next after ${mentorTopic || "this topic"}?`,
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setMentorQuestion(sample)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/20 hover:text-foreground"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>

                  <GlowButton variant="primary" className="w-full" onClick={() => void askMentor()}>
                    {mentorLoading ? "Thinking..." : "Ask AI Mentor"}
                    <ArrowRight className="ml-2 inline h-4 w-4" />
                  </GlowButton>

                  {mentorReply ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
                      {mentorReply}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                      Ask a question to get a level-aware answer with analogy, example, quiz, and practice task.
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard glow glowColor="secondary" className="space-y-4">
              <div className="flex items-center gap-3">
                <GradientIconWrapper size="sm" gradient="purple" glow>
                  <Trophy className="w-5 h-5 text-white" />
                </GradientIconWrapper>
                <div>
                  <h3 className="text-xl font-semibold">Achievements</h3>
                  <p className="text-sm text-muted-foreground">Retention milestones powered by your progress.</p>
                </div>
              </div>

              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.label} className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${achievement.earned ? "border-secondary/20 bg-secondary/10" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${achievement.earned ? "bg-secondary/20 text-secondary" : "bg-muted/20 text-muted-foreground"}`}>
                        <achievement.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{achievement.label}</p>
                        <p className="text-xs text-muted-foreground">{achievement.hint}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${achievement.earned ? "bg-secondary/15 text-secondary" : "bg-white/5 text-muted-foreground"}`}>
                      {achievement.earned ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                ))}
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