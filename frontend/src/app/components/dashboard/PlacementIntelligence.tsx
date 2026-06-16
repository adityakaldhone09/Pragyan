import { useMemo, type ComponentType, useEffect, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Brain, Sparkles, Target, TrendingUp, Trophy } from "lucide-react";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { AnimatedProgress } from "../AnimatedProgress";
import { GlassCard } from "../GlassCard";
import { SectionHeader } from "../SectionHeader";
import { cn } from "../../utils/cn";
import type { JourneyDashboardSnapshot, PlacementReadiness } from "@/types/api";

type SkillRadarPoint = {
  skill: string;
  score: number;
  explanation: string;
};

type WeeklyMomentumPoint = {
  label: string;
  xp: number;
  studyMinutes: number;
  completion: number;
  readiness: number;
  xpScore: number;
  studyScore: number;
};

type ForecastPoint = {
  label: string;
  projected: number;
  target: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSkillName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreFromKeywords(skills: string[], keywords: string[]) {
  if (!skills.length || !keywords.length) return 0;
  const normalized = skills.map(normalizeSkillName);
  const matches = normalized.filter((skill) => keywords.some((keyword) => skill.includes(keyword))).length;
  return Math.round((matches / Math.max(1, keywords.length)) * 100);
}

function buildSkillRadarData(snapshot: JourneyDashboardSnapshot | null): SkillRadarPoint[] {
  const journey = snapshot?.currentJourney;
  const skillProgress = journey?.skillProgress || [];
  const completedSkills = journey?.completedSkills || [];
  const weakSkills = snapshot?.weakSkills || journey?.weakSkills || [];
  const readiness = journey?.placementReadiness || snapshot?.placementReadiness || null;
  const completion = journey?.completionPercentage ?? 0;
  const streak = snapshot?.streak ?? journey?.streak ?? 0;
  const jobFit = readiness?.eligibleJobs ? Math.min(100, readiness.eligibleJobs * 20) : 0;
  const strongSkillCount = skillProgress.filter((skill) => skill.completed || skill.mastery >= 70).length;
  const projectSignals = journey?.currentPlan?.tasks?.filter((task) => task.type === "project").length ?? 0;
  const quizSignals = journey?.currentPlan?.tasks?.filter((task) => task.type === "quiz").length ?? 0;
  const mentorSignals = (snapshot?.aiInsights?.length || 0) + (snapshot?.nextAction ? 1 : 0);

  const frontendScore = clamp(
    Math.round(
      (scoreFromKeywords(completedSkills, ["frontend", "react", "ui", "css", "tailwind", "javascript"]) * 0.5) +
      (scoreFromKeywords(skillProgress.map((skill) => skill.skill), ["frontend", "react", "ui", "css", "tailwind"]) * 0.3) +
      (completion * 0.2)
    ),
    0,
    100
  );

  const backendScore = clamp(
    Math.round(
      (scoreFromKeywords(completedSkills, ["backend", "api", "node", "database", "mongo", "sql"]) * 0.5) +
      (scoreFromKeywords(skillProgress.map((skill) => skill.skill), ["backend", "api", "node", "database", "sql"]) * 0.3) +
      (jobFit * 0.2)
    ),
    0,
    100
  );

  const problemSolvingScore = clamp(
    Math.round((completion * 0.34) + (streak * 5) + (strongSkillCount * 3) - (weakSkills.some((skill) => normalizeSkillName(skill).includes("dsa")) ? 10 : 0)),
    0,
    100
  );

  const aiMlScore = clamp(
    Math.round(
      (scoreFromKeywords(completedSkills, ["ai", "machine learning", "ml", "data science", "tensorflow", "python"]) * 0.45) +
      (scoreFromKeywords(skillProgress.map((skill) => skill.skill), ["ai", "ml", "data science", "python"]) * 0.35) +
      (mentorSignals * 4)
    ),
    0,
    100
  );

  const communicationScore = clamp(
    Math.round(
      (scoreFromKeywords(completedSkills, ["communication", "presentation", "writing", "interview", "english"]) * 0.5) +
      (mentorSignals * 7) +
      (streak * 2)
    ),
    0,
    100
  );

  const systemDesignScore = clamp(
    Math.round(
      (scoreFromKeywords(completedSkills, ["system design", "architecture", "scalability", "backend", "distributed"]) * 0.45) +
      (jobFit * 0.3) +
      (completion * 0.25)
    ),
    0,
    100
  );

  const projectsScore = clamp(
    Math.round(
      (projectSignals * 16) +
      (scoreFromKeywords(completedSkills, ["project", "build", "deployment", "portfolio"]) * 0.35) +
      (completion * 0.15)
    ),
    0,
    100
  );

  return [
    {
      skill: "Frontend",
      score: frontendScore,
      explanation: frontendScore >= 75 ? "Strong React + UI consistency" : frontendScore >= 50 ? "Good UI signals, but needs more applied frontend work" : "Needs more React, CSS, and UI project practice",
    },
    {
      skill: "Backend",
      score: backendScore,
      explanation: backendScore >= 75 ? "Backend and API signals are solid" : backendScore >= 50 ? "Some backend exposure, but API and database practice should increase" : "Needs more API, database, and server-side practice",
    },
    {
      skill: "Problem Solving",
      score: problemSolvingScore,
      explanation: problemSolvingScore >= 75 ? "Good momentum and execution discipline" : problemSolvingScore >= 50 ? "Improving, but consistency and debugging depth can grow" : "Needs more DSA, practice loops, and challenge solving",
    },
    {
      skill: "AI/ML",
      score: aiMlScore,
      explanation: aiMlScore >= 75 ? "AI/ML signals are strong relative to the current journey" : aiMlScore >= 50 ? "Some AI-related exposure is visible, but more hands-on work will help" : "Needs more AI/ML projects and learning",
    },
    {
      skill: "Communication",
      score: communicationScore,
      explanation: communicationScore >= 75 ? "Mentor usage and consistency suggest strong communication habits" : communicationScore >= 50 ? "Good engagement, but interview and explanation practice will help" : "Needs more interview practice and written articulation",
    },
    {
      skill: "System Design",
      score: systemDesignScore,
      explanation: systemDesignScore >= 75 ? "Architecture and scale thinking are becoming visible" : systemDesignScore >= 50 ? "Early system design signals are present, but still developing" : "Needs stronger architecture, tradeoff, and scalability practice",
    },
    {
      skill: "Projects",
      score: projectsScore,
      explanation: projectsScore >= 75 ? "Project execution is a clear strength" : projectsScore >= 50 ? "Project work is present, but portfolio depth can improve" : "Needs more shipped projects and portfolio artifacts",
    },
  ];
}

function RadarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: SkillRadarPoint }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-background/95 px-4 py-3 shadow-2xl backdrop-blur-xl max-w-[260px]">
      <p className="text-sm font-semibold text-foreground">{point.skill}</p>
      <p className="mt-1 text-2xl font-bold text-secondary">{point.score}%</p>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{point.explanation}</p>
    </div>
  );
}

function buildWeeklyMomentumSeries(snapshot: JourneyDashboardSnapshot | null): WeeklyMomentumPoint[] {
  if (snapshot?.trend?.length) {
    const basePoints = snapshot.trend.map((point) => ({
      label: format(parseISO(point.date), "EEE"),
      xp: point.xp,
      studyMinutes: Math.round(point.studyHours * 60),
      completion: clamp(Math.round(point.completedTasks * 18), 0, 100),
      readiness: clamp(Math.round(point.readinessScore), 0, 100),
      xpScore: 0,
      studyScore: 0,
    }));
    const maxXp = Math.max(...basePoints.map((item) => item.xp), 1);
    const maxStudy = Math.max(...basePoints.map((item) => item.studyMinutes), 1);
    return basePoints.map((point) => ({
      ...point,
      xpScore: Math.round((point.xp / maxXp) * 100),
      studyScore: Math.round((point.studyMinutes / maxStudy) * 100),
    }));
  }

  const currentJourney = snapshot?.currentJourney;
  const readiness = currentJourney?.placementReadiness?.score ?? snapshot?.placementReadiness?.score ?? 0;
  const completion = currentJourney?.completionPercentage ?? 0;
  const xp = currentJourney?.xp ?? snapshot?.xp ?? 0;
  const streak = snapshot?.streak ?? currentJourney?.streak ?? 0;
  const eligibleJobs = snapshot?.eligibleJobs?.filter((job) => job.eligible).length ?? currentJourney?.eligibleJobs?.filter((job) => job.eligible).length ?? 0;
  const weakSkills = snapshot?.weakSkills?.length ?? currentJourney?.weakSkills?.length ?? 0;

  const startDate = subDays(new Date(), 6);
  const baseStudyMinutes = Math.max(25, Math.round(38 + streak * 4 + completion * 0.3 + weakSkills * 5));
  const baseXp = Math.max(40, Math.round((xp || 0) * 0.28 + completion * 2.5 + readiness * 1.6));

  return Array.from({ length: 7 }, (_, index) => {
    const dayDate = subDays(startDate, -index);
    const momentum = index / 6;
    const completionValue = clamp(Math.round(completion - 14 + momentum * 18 + weakSkills * 0.8), 0, 100);
    const readinessValue = clamp(Math.round(readiness - 18 + momentum * 22 + eligibleJobs * 2 + streak * 1.2), 0, 100);
    const xpValue = Math.max(15, Math.round(baseXp * (0.55 + momentum * 0.25) + index * (8 + streak)));
    const studyMinutes = Math.max(15, Math.round(baseStudyMinutes * (0.6 + momentum * 0.35) + index * (3 + weakSkills)));

    return {
      label: format(dayDate, "EEE"),
      xp: xpValue,
      studyMinutes,
      completion: completionValue,
      readiness: readinessValue,
      xpScore: 0,
      studyScore: 0,
    };
  }).map((point, index, points) => {
    const maxXp = Math.max(...points.map((item) => item.xp), 1);
    const maxStudy = Math.max(...points.map((item) => item.studyMinutes), 1);
    return {
      ...point,
      xpScore: Math.round((point.xp / maxXp) * 100),
      studyScore: Math.round((point.studyMinutes / maxStudy) * 100),
    };
  });
}

function buildForecastData(snapshot: JourneyDashboardSnapshot | null) {
  const trend = snapshot?.trend ?? [];
  const currentReadiness = snapshot?.placementReadiness?.score ?? snapshot?.currentJourney?.placementReadiness?.score ?? 0;
  const currentXp = snapshot?.xp ?? snapshot?.currentJourney?.xp ?? 0;
  const currentStreak = snapshot?.streak ?? snapshot?.currentJourney?.streak ?? 0;

  const readinessHistory = trend.slice(-5).map((point) => point.readinessScore);
  const deltas = readinessHistory.slice(1).map((value, index) => value - readinessHistory[index]);
  const averageDelta = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : 0;
  const momentum = clamp(averageDelta * 0.78 + currentStreak * 0.36 + currentXp / 260, -8, 14);
  const consistencyRisk = averageDelta < 0 || currentStreak < 3 || (trend.length >= 2 && trend[trend.length - 1].studyHours < trend[trend.length - 2].studyHours);

  const horizon: ForecastPoint[] = Array.from({ length: 14 }, (_, index) => {
    const dayNumber = index + 1;
    const projected = clamp(Math.round(currentReadiness + momentum * dayNumber), 0, 100);
    const target = clamp(Math.round(currentReadiness + (momentum * dayNumber * 0.82) + 6), 0, 100);

    return {
      label: dayNumber === 1 ? "Tomorrow" : `${dayNumber}d`,
      projected,
      target,
    };
  });

  const target85Point = horizon.find((point) => point.projected >= 85);

  return {
    horizon,
    momentum,
    consistencyRisk,
    readinessAt14Days: horizon[horizon.length - 1]?.projected ?? currentReadiness,
    daysTo85: target85Point ? Number(target85Point.label.replace(/\D/g, "")) : null,
  };
}

function StatPill({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-lg font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <Icon className="h-4 w-4 text-secondary" />
      </div>
    </div>
  );
}

import { intelligenceService } from '@/services/intelligenceService';

function PlacementForecastChips({ snapshot }: { snapshot: JourneyDashboardSnapshot | null }) {
  const [payload, setPayload] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    intelligenceService
      .getForecastSignals()
      .then((res) => {
        if (mounted) setPayload(res);
      })
      .catch(() => {
        if (mounted) setPayload(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Loading…</div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-background/35 p-3 text-sm text-muted-foreground">No intelligence available</div>
    );
  }

  const placement = payload.placementProbability || {};
  const opp = payload.opportunityForecast || {};
  const risk = payload.consistencyRisk || {};
  const momentum = (payload.momentumSignals && payload.momentumSignals[0]) || null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Placement Probability</p>
            <p className="mt-1 text-lg font-semibold">{placement.probability ?? '—'}%</p>
            <p className="mt-1 text-xs text-muted-foreground">{placement.explanation ?? ''}</p>
          </div>
          <div className="text-xs text-muted-foreground text-right">{placement.confidence}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">New Opportunities</p>
            <p className="mt-1 text-lg font-semibold">{opp.expectedJobs ? `+${opp.expectedJobs}` : '0'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{opp.note ?? ''}</p>
          </div>
          <div className="text-xs text-muted-foreground text-right">{opp.timelineDays ?? ''}d</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Consistency Risk</p>
            <p className="mt-1 text-lg font-semibold">{risk.score ?? '—'}%</p>
            <p className="mt-1 text-xs text-muted-foreground">{risk.reason ?? ''}</p>
          </div>
          <div className="text-xs text-muted-foreground text-right">{risk.risk ?? ''}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Skill Momentum</p>
            <p className="mt-1 text-lg font-semibold">{momentum ? `${momentum.score}%` : '—'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{momentum?.explanation ?? ''}</p>
          </div>
          <div className="text-xs text-muted-foreground text-right">{momentum?.momentum ?? ''}</div>
        </div>
      </div>
    </div>
  );
}

export function PlacementReadinessRing({ readiness, nextAction, className }: { readiness: PlacementReadiness | null; nextAction?: string; className?: string }) {
  const score = readiness?.score ?? 0;
  const label = readiness?.label ?? "Placement readiness";
  const strengths = readiness?.strengths?.slice(0, 3) ?? readiness?.completedSkills?.slice(0, 3) ?? [];
  const weakAreas = readiness?.weakAreas?.slice(0, 3) ?? readiness?.missingSkills?.slice(0, 3) ?? [];
  const fillAngle = Math.max(0, Math.min(100, score)) * 3.6;

  return (
    <GlassCard glow glowColor="accent" className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.16),transparent_30%)]" />
      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs text-secondary">
              <Sparkles className="h-3.5 w-3.5" />
              Placement Intelligence
            </div>
            <h3 className="mt-3 text-2xl font-semibold">Placement Readiness</h3>
            <p className="mt-1 text-sm text-muted-foreground">Explainable score built from roadmap progress, skills, consistency, and eligible jobs.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-background/40 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Status</p>
            <p className="mt-1 text-sm font-semibold text-secondary">{label}</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto flex w-full max-w-[280px] flex-col items-center"
          >
            <div
              className="relative flex h-[240px] w-[240px] items-center justify-center rounded-full p-4"
              style={{ background: `conic-gradient(rgba(34,211,238,0.95) ${fillAngle}deg, rgba(148,163,184,0.14) 0deg)` }}
            >
              <div className="absolute inset-5 rounded-full bg-background/95 border border-white/10 shadow-[0_0_50px_rgba(34,211,238,0.1)]" />
              <div className="relative z-10 flex h-[170px] w-[170px] flex-col items-center justify-center rounded-full border border-white/10 bg-background/90 text-center backdrop-blur-xl">
                <Trophy className="h-6 w-6 text-secondary" />
                <motion.p className="mt-2 text-5xl font-bold text-transparent bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                  {score}%
                </motion.p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">Ready to place</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{readiness?.eligibleJobs ?? 0} eligible roles</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{readiness?.completedSkills?.length ?? 0} completed skills</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{readiness?.missingSkills?.length ?? 0} gaps</span>
            </div>
          </motion.div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatPill label="Momentum" value={`${readiness?.factors?.[2]?.score ?? Math.round(score * 0.7)}%`} hint="Daily consistency and streak health" icon={TrendingUp} />
              <StatPill label="Skill coverage" value={`${readiness?.factors?.[1]?.score ?? Math.round(score * 0.8)}%`} hint="How much of the roadmap is already covered" icon={Target} />
              <StatPill label="Job fit" value={`${readiness?.factors?.[5]?.score ?? Math.min(100, readiness?.eligibleJobs ? readiness.eligibleJobs * 20 : 0)}%`} hint="Current role eligibility signal" icon={ArrowRight} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">What this means</p>
              <p className="mt-2 text-sm text-muted-foreground">{nextAction || readiness?.recommendedNextStep || "Keep following the journey to strengthen your placement signal."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Strengths</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {strengths.length ? strengths.map((item) => (
                    <span key={item} className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">{item}</span>
                  )) : <span className="text-sm text-muted-foreground">No strengths captured yet</span>}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Weak areas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {weakAreas.length ? weakAreas.map((item) => (
                    <span key={item} className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-300">{item}</span>
                  )) : <span className="text-sm text-muted-foreground">No gaps detected</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function ReadinessBreakdownCard({ readiness, nextAction, className }: { readiness: PlacementReadiness | null; nextAction?: string; className?: string }) {
  const factors = readiness?.factors ?? [];

  return (
    <GlassCard glow glowColor="primary" className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <div className="relative z-10 space-y-5">
        <SectionHeader title="Readiness Breakdown" subtitle="Why the score moves and what to fix next" />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recommended next step</p>
            <p className="mt-2 text-sm text-foreground">{readiness?.recommendedNextStep || nextAction || "Keep building toward the next milestone."}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Primary label</p>
            <p className="mt-2 text-sm text-secondary">{readiness?.label || "Placement readiness"}</p>
          </div>
        </div>

        {factors.length ? (
          <div className="space-y-3">
            {factors.map((factor) => (
              <div key={factor.label} className="rounded-2xl border border-white/10 bg-background/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{factor.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{factor.note}</p>
                  </div>
                  <span className="text-sm font-semibold text-secondary">{factor.score}%</span>
                </div>
                <div className="mt-3">
                  <AnimatedProgress value={factor.score} showLabel={false} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-background/35 p-4 text-sm text-muted-foreground">
            Factor breakdown will appear after the journey snapshot is loaded.
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function WeeklyMomentumChart({ snapshot, className }: { snapshot: JourneyDashboardSnapshot | null; className?: string }) {
  const data = useMemo(() => buildWeeklyMomentumSeries(snapshot), [snapshot]);
  const latest = data[data.length - 1];

  return (
    <GlassCard glow glowColor="secondary" className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.15),transparent_30%)]" />
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              Weekly Momentum
            </div>
            <h3 className="mt-3 text-2xl font-semibold">7-Day Intelligence Chart</h3>
            <p className="mt-1 text-sm text-muted-foreground">Estimated from your current snapshot until the trend API is introduced.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-background/40 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Latest</p>
            <p className="mt-1 text-sm font-semibold text-secondary">{latest.readiness}% readiness</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatPill label="XP growth" value={`${latest.xp}`} hint="Estimated momentum from your current cycle" icon={Sparkles} />
          <StatPill label="Study time" value={`${latest.studyMinutes} min`} hint="Derived from streak, gaps, and progress" icon={Brain} />
          <StatPill label="Completion" value={`${latest.completion}%`} hint="Roadmap completion trajectory" icon={Target} />
          <StatPill label="Readiness" value={`${latest.readiness}%`} hint="Placement score trend" icon={Trophy} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div className="h-[320px] rounded-3xl border border-white/10 bg-background/35 p-3">
            <ChartContainer
              config={{
                readiness: { label: "Readiness", color: "#22d3ee" },
                completion: { label: "Completion", color: "#7c3aed" },
                xpScore: { label: "XP growth", color: "#10b981" },
                studyScore: { label: "Study time", color: "#f59e0b" },
              }}
            >
              <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="readinessFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="completionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip content={<ChartTooltipContent indicator="line" />} />
                <Area type="monotone" dataKey="readiness" stroke="#22d3ee" strokeWidth={2} fill="url(#readinessFill)" dot={false} />
                <Area type="monotone" dataKey="completion" stroke="#7c3aed" strokeWidth={2} fill="url(#completionFill)" dot={false} />
                <Line type="monotone" dataKey="xpScore" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="6 4" />
                <Line type="monotone" dataKey="studyScore" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="6 4" />
              </AreaChart>
            </ChartContainer>
          </div>

          <div className="grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Momentum note</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This chart is intentionally estimated from your live snapshot so the dashboard feels intelligent now, even before trend persistence ships.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current signal</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{snapshot?.nextAction || "Complete the next journey task to raise your signal."}</p>
              <p className="mt-2 text-sm text-muted-foreground">Readiness, weak skills, and job eligibility are being blended into one placement narrative.</p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function AIForecastWidget({ snapshot, className }: { snapshot: JourneyDashboardSnapshot | null; className?: string }) {
  const forecast = useMemo(() => buildForecastData(snapshot), [snapshot]);
  const currentReadiness = snapshot?.placementReadiness?.score ?? snapshot?.currentJourney?.placementReadiness?.score ?? 0;
  const eligibleJobCount = snapshot?.eligibleJobs?.filter((job) => job.eligible).length ?? snapshot?.currentJourney?.eligibleJobs?.filter((job) => job.eligible).length ?? 0;
  const summary = forecast.consistencyRisk
    ? "Your consistency dropped this week. A short recovery loop will stabilize growth."
    : forecast.daysTo85
      ? `At your current pace, you may reach 85% placement readiness in ${forecast.daysTo85} days.`
      : "At your current pace, readiness is improving, but more momentum is needed to reach 85%.";

  return (
    <GlassCard glow glowColor="primary" className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.16),transparent_32%)]" />
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              <Brain className="h-3.5 w-3.5" />
              AI Forecast
            </div>
            <h3 className="mt-3 text-2xl font-semibold">Readiness Projection</h3>
            <p className="mt-1 text-sm text-muted-foreground">Explainable heuristic forecast built from your real trend history.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-background/40 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Signal</p>
            <p className="mt-1 text-sm font-semibold text-secondary">{forecast.momentum >= 0 ? `+${forecast.momentum.toFixed(1)}` : forecast.momentum.toFixed(1)} / day</p>
            <p className="text-xs text-muted-foreground">Projected growth</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatPill label="Current" value={`${currentReadiness}%`} hint="Live placement readiness" icon={Target} />
          <StatPill label="14-day projection" value={`${forecast.readinessAt14Days}%`} hint="Estimated readiness if pace holds" icon={TrendingUp} />
          <StatPill label="To 85%" value={forecast.daysTo85 ? `${forecast.daysTo85} days` : "Not yet visible"} hint="Threshold timeline" icon={Sparkles} />
          <StatPill label="Eligible roles" value={`${eligibleJobCount}`} hint="Current accessible opportunities" icon={Trophy} />
        </div>

        <div className="mt-3">
          <PlacementForecastChips snapshot={snapshot} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div className="h-[320px] rounded-3xl border border-white/10 bg-background/35 p-3">
            <ChartContainer
              config={{
                projected: { label: "Projected", color: "#22d3ee" },
                target: { label: "Target", color: "#10b981" },
              }}
            >
              <LineChart data={forecast.horizon} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip content={<ChartTooltipContent indicator="line" />} />
                <Line type="monotone" dataKey="projected" stroke="#22d3ee" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ChartContainer>
          </div>

          <div className="space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Forecast summary</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{summary}</p>
              <p className="mt-2 text-sm text-muted-foreground">This stays lightweight and explainable now, while leaving room for deeper ML later.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Risk note</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {forecast.consistencyRisk
                  ? "Consistency is softening. A recovery loop could stabilize growth and protect placement momentum."
                  : "Consistency is healthy enough for predictive growth to stay believable."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function SkillRadarPanel({ snapshot, className }: { snapshot: JourneyDashboardSnapshot | null; className?: string }) {
  const data = useMemo(() => buildSkillRadarData(snapshot), [snapshot]);
  const strongest = [...data].sort((a, b) => b.score - a.score)[0];

  return (
    <GlassCard glow glowColor="accent" className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.16),transparent_32%)]" />
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs text-secondary">
              <Target className="h-3.5 w-3.5" />
              Skill Intelligence
            </div>
            <h3 className="mt-3 text-2xl font-semibold">Skill Radar</h3>
            <p className="mt-1 text-sm text-muted-foreground">Hover each axis to see why the score looks the way it does.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-background/40 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Top signal</p>
            <p className="mt-1 text-sm font-semibold text-secondary">{strongest.skill}</p>
            <p className="text-xs text-muted-foreground">{strongest.score}%</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div className="h-[360px] rounded-3xl border border-white/10 bg-background/35 p-3">
            <ChartContainer
              config={{
                skill: { label: "Skill" },
              }}
            >
              <RadarChart data={data} margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                <defs>
                  <linearGradient id="radarSkillFill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="rgba(148,163,184,0.16)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={<RadarTooltip />} />
                <Radar dataKey="score" stroke="#22d3ee" strokeWidth={2.5} fill="url(#radarSkillFill)" fillOpacity={0.55} dot={{ r: 4, fill: "#fff" }} activeDot={{ r: 6 }} />
              </RadarChart>
            </ChartContainer>
          </div>

          <div className="space-y-3">
            {data.map((item, index) => (
              <motion.div
                key={item.skill}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.skill}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.explanation}</p>
                  </div>
                  <span className="text-sm font-semibold text-secondary">{item.score}%</span>
                </div>
                <div className="mt-3">
                  <AnimatedProgress value={item.score} showLabel={false} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
