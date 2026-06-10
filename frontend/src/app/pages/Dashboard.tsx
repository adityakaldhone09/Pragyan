import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  BookOpen,
  CheckCircle2,
  Flame,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  Sparkles,
} from "lucide-react";
import { AnimatedProgress } from "../components/AnimatedProgress";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { NeuralBackground } from "../components/NeuralBackground";
import LevelBoard from '../components/LevelBoard';
import { cn } from "../utils/cn";
import { useAuth } from "@/context/useAuth";
import LevelUpModal from "../components/LevelUpModal";
import { assessmentService } from "../../services/assessmentService";
import { recommendationService } from "../../services/recommendationService";
import { jobsService } from "../../services/jobsService";
import { journeyService } from "../../services/journeyService";
import { xpService } from "../../services/xpService";
import type { JobFeedItem, JourneyDashboardSnapshot, JourneyJobEligibility, XpProgression } from "@/types/api";
import { 
  staggerContainerVariants, 
  staggerItemVariants,
  listVariants,
  listItemVariants,
  slideInLeftVariants,
  slideInRightVariants,
  fadeInVariants
} from "../../utils/animations";

type SidebarItem = {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
};

type NormalizedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  eligible: boolean;
};

type AssessmentSnapshot = {
  analysis?: {
    confidence?: number;
    summary?: {
      confidence?: number;
    };
    ai?: {
      targetLevel?: string;
    };
    enhancements?: {
      targetLevel?: string;
    };
  } | null;
};

type UserLevel = {
  label: "Level 1" | "Level 2";
  reason: string;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Journey", path: "/journey", icon: Route },
  { label: "Learning", path: "/learning-resources", icon: BookOpen },
  { label: "Assessments", path: "/assessment", icon: BadgeCheck },
  { label: "Jobs", path: "/opportunities", icon: Briefcase },
];

function normalizeTextList(values?: string[] | null) {
  return (values || []).filter(Boolean);
}

function computeUserLevel({
  readinessScore,
  completionPercentage,
  assessmentConfidence,
  roadmapLevel,
}: {
  readinessScore: number;
  completionPercentage: number;
  assessmentConfidence: number;
  roadmapLevel?: string | null;
}): UserLevel {
  const strongSignals = [assessmentConfidence >= 70, readinessScore >= 60, completionPercentage >= 35].filter(Boolean).length;
  const roadmapSignals = /intermediate|advanced/i.test(roadmapLevel || "");

  if (roadmapSignals || strongSignals >= 2) {
    return {
      label: "Level 2",
      reason: "AI promoted you using roadmap progress, mock-test confidence, and placement readiness.",
    };
  }

  return {
    label: "Level 1",
    reason: "AI kept you in Level 1 while you build foundations from the roadmap and mock tests.",
  };
}

function SkillStrengthBar({ skill, mastery, delay = 0 }: { skill: string; mastery: number; delay?: number }) {
  return (
    <motion.div
      className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4"
      variants={staggerItemVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      transition={{ ...staggerItemVariants.animate.transition, delay }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{skill}</p>
        <motion.p
          className="text-sm font-semibold text-secondary"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.2 }}
        >
          {mastery}%
        </motion.p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400"
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(8, Math.min(mastery, 100))}%` }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function LevelBadge({ level, title, xp, percent }: { level: number; title?: string | null; xp: number; percent: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Level</p>
      <div className="mt-1 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold">{level}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title || `Level ${level}`}</p>
          <p className="text-xs text-muted-foreground">XP: {xp} · {percent}%</p>
          <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-white/10"><div style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" /></div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  userName,
  targetRole,
  readiness,
  userLevel,
  sidebarWidth,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  userName: string;
  targetRole: string;
  readiness: number;
  userLevel: UserLevel;
  sidebarWidth: string;
}) {
  const location = useLocation();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-[#090b16]/90 shadow-2xl shadow-black/40 backdrop-blur-2xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
        style={{ width: sidebarWidth } as React.CSSProperties}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.15),_transparent_32%)]" />
        <div className="relative z-10 flex h-full flex-col p-4">
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5" />
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Pragyan</p>
                  <h2 className="truncate text-lg font-semibold text-foreground">Career OS</h2>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
            {sidebarItems.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
                    active ? "border-primary/30 bg-primary/10 text-foreground" : "border-transparent bg-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all", active ? "border-primary/25 bg-primary/15 text-primary" : "border-white/10 bg-white/5")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {!collapsed ? <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {mobileOpen ? <button type="button" aria-label="Close sidebar overlay" onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" /> : null}
    </>
  );
}

export function Dashboard() {
  const { user, reloadUser } = useAuth();
  const [topCareer, setTopCareer] = useState<{ career: string; match: number; confidenceLevel?: string; requiredSkills?: string[] } | null>(null);
  const [skillRecommendations, setSkillRecommendations] = useState<Array<{ skill: string; confidence: number; reason: string }>>([]);
  const [jobFeed, setJobFeed] = useState<JobFeedItem[]>([]);
  const [journeySnapshot, setJourneySnapshot] = useState<JourneyDashboardSnapshot | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentSnapshot | null>(null);
  const [xpProgression, setXpProgression] = useState<XpProgression | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [levelUpState, setLevelUpState] = useState<{ open: boolean; previousLevel?: number; newLevel?: number; newTitle?: string | null; xpGained?: number } | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [careerResponse, skillResponse, jobsResponse, journeyResponse, assessmentResponse, xpResponse] = await Promise.allSettled([
        recommendationService.getTopCareer(),
        recommendationService.getSkillRecommendations(),
        jobsService.getJobs(),
        journeyService.getDashboardJourney(),
        assessmentService.getLatestAssessment(),
        xpService.getProgression(),
      ]);

      if (careerResponse.status === "fulfilled") setTopCareer(careerResponse.value);
      if (skillResponse.status === "fulfilled") setSkillRecommendations(skillResponse.value || []);
      if (jobsResponse.status === "fulfilled") setJobFeed(jobsResponse.value.recommendedJobs?.slice(0, 6) || []);
      if (journeyResponse.status === "fulfilled") setJourneySnapshot(journeyResponse.value);
      if (assessmentResponse.status === "fulfilled") setLatestAssessment(assessmentResponse.value as AssessmentSnapshot | null);
      if (xpResponse.status === "fulfilled") setXpProgression(xpResponse.value);
    } catch {
      // keep whatever data we have
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const currentJourney = journeySnapshot?.currentJourney;
  const userName = user?.fullName?.split(" ")[0] || "Explorer";
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

  const targetCareer = currentJourney?.careerTitle || topCareer?.career || "AI Career Track";
  const streak = Number(journeySnapshot?.streak || currentJourney?.streak || user?.streak || 0);
  const currentDay = journeySnapshot?.currentDay || currentJourney?.currentDay || 1;
  const completion = currentJourney?.completionPercentage || 0;
  const readinessScore = journeySnapshot?.placementReadiness?.score || currentJourney?.placementReadiness?.score || topCareer?.match || 0;
  const placementReadiness = journeySnapshot?.placementReadiness || currentJourney?.placementReadiness || null;
  const currentDayData = currentJourney?.roadmapDays?.find((day) => day.dayNumber === currentDay) || currentJourney?.roadmapDays?.[0] || null;
  const todaysMissionTasks = currentJourney?.currentPlan?.tasks || currentDayData?.tasks || [];
  const todaysMissionFocus = currentJourney?.currentPlan?.todayGoal || currentDayData?.focus || "Complete today's roadmap step";
  const todaysMissionTime = currentJourney?.currentPlan?.estimatedMinutes || currentDayData?.estimatedMinutes || 0;
  const skillProgress = currentJourney?.skillProgress || [];
  const weakSkills = normalizeTextList(journeySnapshot?.weakSkills || currentJourney?.weakSkills || placementReadiness?.weakAreas);
  const progressHint = placementReadiness?.recommendedNextStep || currentJourney?.nextAction || "Keep following the active roadmap to improve placement readiness.";
  const missionTheory = currentDayData?.resources?.find((resource) => /w3schools/i.test(`${resource.provider || ""} ${resource.title} ${resource.type || ""}`)) || currentDayData?.resources?.[0] || null;
  const missionVideo = currentDayData?.resources?.find((resource) => /video|youtube/i.test(`${resource.provider || ""} ${resource.title} ${resource.type || ""}`)) || currentDayData?.resources?.[1] || null;
  const assessmentConfidence = Number(latestAssessment?.analysis?.confidence || latestAssessment?.analysis?.summary?.confidence || currentJourney?.topCareerMatch || topCareer?.match || 0);
  const userLevel = computeUserLevel({
    readinessScore: Math.round(readinessScore),
    completionPercentage: Math.round(completion),
    assessmentConfidence,
    roadmapLevel: currentJourney?.currentPlan?.level || currentJourney?.mentorContext?.learningLevel,
  });

  const missionRewards = (() => {
    const map: Record<string, number> = { theory: 0, video: 0, practice: 0, quiz: 0, project: 0 };
    const tasks = currentDayData?.tasks || currentJourney?.roadmapDays?.find((d) => d.dayNumber === currentDay)?.tasks || [];
    for (const t of tasks) {
      const key = (t.type || 'practice').toLowerCase();
      if (map[key] === undefined) map[key] = 0;
      map[key] += Number((t as any).xp || 0);
    }
    return map;
  })();

  const currentXp = xpProgression?.xp ?? journeySnapshot?.xp ?? currentJourney?.xp ?? user?.xp ?? 0;
  const displayLevel = xpProgression?.level || currentJourney?.userLevel || (user?.level ?? undefined) || Math.max(1, Math.floor(Math.sqrt(Math.max(0, currentXp) / 100)) + 1);
  const currentThreshold = xpProgression?.currentThreshold ?? Math.max(0, Math.pow(Math.max(1, displayLevel) - 1, 2) * 100);
  const nextThreshold = xpProgression?.nextThreshold ?? Math.max(currentThreshold + 100, Math.pow(Math.max(1, displayLevel), 2) * 100);
  const xpProgressPercent = xpProgression?.progressPercent ?? Math.round(((currentXp - currentThreshold) / Math.max(1, nextThreshold - currentThreshold)) * 100);

  const topSkillStrengths = useMemo(
    () => [...skillProgress].sort((left, right) => right.mastery - left.mastery).slice(0, 4),
    [skillProgress]
  );

  const normalizedJobs: NormalizedJob[] = useMemo(() => {
    const journeyJobs = (journeySnapshot?.eligibleJobs || currentJourney?.eligibleJobs || []).map((job: JourneyJobEligibility) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      matchScore: job.matchPercentage,
      eligible: job.eligible,
    }));

    const feedJobs = jobFeed.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      matchScore: job.matchScore,
      eligible: true,
    }));

    return [...journeyJobs, ...feedJobs]
      .filter((job, index, list) => list.findIndex((candidate) => candidate.id === job.id) === index)
      .sort((left, right) => right.matchScore - left.matchScore);
  }, [currentJourney?.eligibleJobs, journeySnapshot?.eligibleJobs, jobFeed]);

  const eligibleRoles = normalizedJobs.filter((job) => job.eligible).slice(0, 4);
  const systemRole = targetCareer;
  const roleConfidence = Math.round(Math.max(topCareer?.match || 0, assessmentConfidence, readinessScore));
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <NeuralBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.18),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.14),_transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

      <div className="relative z-10">
        <div className="mx-auto max-w-[1600px] px-4 py-4 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-6">
          <div className="space-y-6">
            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-card/50 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(135deg,_rgba(9,10,17,0.96),_rgba(5,8,18,0.99))]" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="space-y-2 -mt-2">
                  <h1 className="max-w-4xl -mt-1 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{greeting}, {userName} 👋</h1>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
                  <div className="rounded-[1.75rem] border border-white/10 bg-transparent p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Job role focus</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.5rem] border border-cyan-400/20 bg-background/30 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">{systemRole}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{topCareer?.reasons?.[0] || 'This role comes from your assessment results and journey data.'}</p>
                        </div>
                        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-right">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-violet-200">Confidence</p>
                          <p className="text-lg font-semibold text-violet-100">{roleConfidence}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Progress</p>
                    <div className="mt-3 flex items-center justify-center">
                      <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-full border-2 border-white/10 bg-background/50 p-4 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
                        <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white/10" style={{ background: `conic-gradient(rgba(168,85,247,0.95) ${Math.max(0, Math.min(100, completion)) * 3.6}deg, rgba(148,163,184,0.12) 0deg)` }}>
                          <div className="flex h-[160px] w-[160px] flex-col items-center justify-center rounded-full border border-white/10 bg-[#0b1020]/95 text-center">
                            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Complete</p>
                            <p className="mt-1 text-4xl font-bold bg-gradient-to-r from-violet-300 via-cyan-200 to-white bg-clip-text text-transparent">{Math.round(completion)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-3 pt-6">
                  <Link to={`/assistant?prompt=${encodeURIComponent(`Help me with my recommended career role: ${systemRole}. My roadmap focus is: ${todaysMissionFocus}`)}`}><GlowButton variant="secondary" size="lg" glow={false}>Ask AI Mentor</GlowButton></Link>
                </div>
              </div>
            </motion.section>

            {levelUpState?.open ? (
              <LevelUpModal
                open={Boolean(levelUpState?.open)}
                onClose={() => setLevelUpState(null)}
                previousLevel={levelUpState?.previousLevel}
                newLevel={levelUpState?.newLevel}
                newTitle={levelUpState?.newTitle}
                xpGained={levelUpState?.xpGained}
              />
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
              <GlassCard glow glowColor="primary" className="relative overflow-hidden border border-[rgba(139,92,246,0.25)] bg-[rgba(15,23,42,0.65)] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%)]" />
                <div className="relative z-10 space-y-4">
                  <div className="w-full space-y-3 rounded-[1.5rem] border border-[rgba(139,92,246,0.2)] bg-[rgba(2,6,23,0.65)] p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Day {currentDay}</p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">{currentDayData?.title || `What you'll learn today`}</h3>
                    <ul className="mt-3 max-w-xl space-y-2 text-sm text-muted-foreground list-disc list-inside">
                      {(todaysMissionTasks && todaysMissionTasks.length ? todaysMissionTasks : [
                        "Understand the core concept",
                        "Watch the recommended video",
                        "Complete a short practice task"
                      ]).map((task, i) => (
                        <li key={i}>{typeof task === "string" ? task : task.title || task.name || task.description || "Practice the concept"}</li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center gap-3">
                      <Link to="/learning-resources">
                        <GlowButton variant="primary" size="md">Let’s start<ArrowRight className="ml-2 inline h-5 w-5" /></GlowButton>
                      </Link>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard glow glowColor="secondary" className="relative overflow-hidden border-white/10 bg-card/55 p-6 sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_30%)]" />
                <div className="relative z-10 space-y-5">
                  <div><p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Skill strengths</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">What you’re strongest at</h2></div>
                  <div className="space-y-4">
                    {(topSkillStrengths.length ? topSkillStrengths : skillRecommendations.slice(0, 4).map((skill) => ({ skill: skill.skill, mastery: Math.max(45, Math.min(95, Math.round(skill.confidence))) }))).map((skill, idx) => <SkillStrengthBar key={skill.skill} skill={skill.skill} mastery={skill.mastery} delay={idx * 0.05} />)}
                  </div>
                </div>
              </GlassCard>
            </div>

            

            <motion.div
              className="grid gap-6 lg:grid-cols-[1fr_1fr]"
              variants={staggerContainerVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <motion.div variants={staggerItemVariants} initial="initial" whileInView="animate" viewport={{ once: true }}>
                <GlassCard glow glowColor="secondary" className="border-white/10 bg-card/55 p-6 sm:p-8">
                  <div className="space-y-4"><div><p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Placement readiness</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{Math.round(readinessScore)}%</h2></div><AnimatedProgress value={Math.round(readinessScore)} max={100} showLabel /><p className="text-sm text-muted-foreground">{progressHint}</p></div>
                </GlassCard>
              </motion.div>
              <motion.div variants={staggerItemVariants} initial="initial" whileInView="animate" viewport={{ once: true }}>
                <GlassCard glow glowColor="primary" className="border-white/10 bg-card/55 p-6 sm:p-8">
                  <div className="space-y-4"><div><p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Eligible roles</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Jobs you can pursue now</h2></div><motion.div className="space-y-3" variants={listVariants} initial="initial" whileInView="animate" viewport={{ once: true }}>{eligibleRoles.length ? eligibleRoles.map((job, idx) => <motion.div key={job.id} className="rounded-3xl border border-white/10 bg-white/5 p-4" variants={listItemVariants}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-foreground">{job.title}</p><p className="mt-1 text-sm text-muted-foreground">{job.company} · {job.location}</p></div><span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">{job.matchScore}%</span></div></motion.div>) : <p className="text-sm text-muted-foreground">Eligible roles will appear once enough skills are unlocked.</p>}</motion.div></div>
                </GlassCard>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
