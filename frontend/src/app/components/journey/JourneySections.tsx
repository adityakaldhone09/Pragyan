import { useState, type ComponentType } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Brain, Flame, Target, Trophy, Zap } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { AnimatedProgress } from "../AnimatedProgress";
import { GlassCard } from "../GlassCard";
import { GlowButton } from "../GlowButton";
import { SectionHeader } from "../SectionHeader";
import { cn } from "../../utils/cn";
import type { JourneyJobEligibility, JourneyPayload, JourneySkillProgress, MentorMessage, PlacementReadiness } from "@/types/api";

export function LearningProgressRing({ value, xp, streak }: { value: number; xp: number; streak: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative h-36 w-36 rounded-full flex items-center justify-center"
        style={{ background: `conic-gradient(rgba(34,211,238,1) ${clamped * 3.6}deg, rgba(148,163,184,0.14) 0deg)` }}
      >
        <div className="h-28 w-28 rounded-full bg-background/95 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-secondary">{clamped}%</p>
          <p className="text-[11px] text-muted-foreground">Journey progress</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{xp} XP</span>
            <span>{streak} day streak</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JourneyHeader({ journey }: { journey: JourneyPayload }) {
  return (
    <GlassCard glow glowColor="primary" className="relative overflow-hidden border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10" />
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            AI Career Journey
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">{journey.careerTitle}</h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground">
              Your assessment has been converted into a single AI-native journey with daily tasks, job eligibility, and mentor guidance.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoChip label="Duration" value={journey.duration} />
            <InfoChip label="Demand" value={journey.industryDemand} />
            <InfoChip label="Salary" value={journey.salaryRange} />
            <InfoChip label="Day" value={`Day ${journey.currentDay}`} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to={`/journey/${journey.resolvedCareerSlug}`}>
              <GlowButton variant="primary">
                Continue Journey
                <ArrowRight className="ml-2 inline-block h-4 w-4" />
              </GlowButton>
            </Link>
            <Link to="/assistant">
              <GlowButton variant="secondary">Ask Mentor</GlowButton>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <LearningProgressRing value={journey.completionPercentage} xp={journey.xp} streak={journey.streak} />
          <div className="grid gap-3">
            <StatCard icon={Target} label="Placement readiness" value={`${journey.placementReadiness.score}%`} hint={journey.placementReadiness.label} />
            <StatCard icon={Flame} label="Adaptive mode" value={journey.adaptiveMode.toUpperCase()} hint={journey.adaptiveReason} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: ComponentType<{ className?: string }>; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background/35 p-4 backdrop-blur-xl shadow-[0_0_20px_rgba(59,130,246,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{hint}</p>
        </div>
        <Icon className="h-5 w-5 text-secondary" />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-background/35 px-3 py-2 text-left">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

export function SkillRadar({ skills }: { skills: JourneySkillProgress[] }) {
  const chartData = skills.slice(0, 8).map((skill) => ({ skill: skill.skill, score: skill.mastery, fullMark: 100 }));

  return (
    <GlassCard glow glowColor="primary">
      <SectionHeader title="Skill Progress Tracker" subtitle="Mastery, weak points, and completed skills at a glance" className="mb-4" />
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-center">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="rgba(148,163,184,0.2)" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {skills.map((skill) => (
            <div key={skill.skill} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{skill.skill}</p>
                  <p className="text-xs text-muted-foreground">{skill.completed ? 'Completed skill' : skill.weak ? 'Weak skill' : 'In progress'}</p>
                </div>
                <span className="text-sm font-semibold text-secondary">{skill.mastery}%</span>
              </div>
              <div className="mt-3">
                <AnimatedProgress value={skill.mastery} showLabel={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export function AIInsightsCard({ journey, messages, response, loading, prompt, onPromptChange, onSend }: { journey: JourneyPayload; messages: MentorMessage[]; response: string; loading: boolean; prompt: string; onPromptChange: (value: string) => void; onSend: (value: string) => Promise<void> }) {
  const quickPrompts = [
    `Explain Again: ${journey.currentPlan.todayGoal}`,
    `Create Quiz: ${journey.weakSkills[0] || journey.currentPlan.todayGoal}`,
    `Give Revision: ${journey.currentPlan.todayGoal}`,
    `Mock Interview: ${journey.careerTitle}`,
    `Mini Project Idea: ${journey.careerTitle}`,
  ];

  return (
    <GlassCard glow glowColor="secondary" className="h-full">
      <SectionHeader title="AI Mentor" subtitle="Ask doubts, get revision, or request interview prep with full journey context" className="mb-4" />
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
          <div className="flex items-center gap-2 text-secondary">
            <Brain className="h-4 w-4" />
            <span className="text-sm font-medium">Context aware mentor</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Current day: {journey.mentorContext.currentDay} · Weak skills: {journey.weakSkills.slice(0, 3).join(', ') || 'None'} · Level: {journey.mentorContext.mentorLevel}
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Conversation</p>
          <div className="max-h-[240px] space-y-3 overflow-y-auto pr-1">
            {messages.slice(-6).map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-2xl p-3 text-sm",
                  message.role === 'assistant' ? "bg-secondary/10 text-foreground" : "bg-background/40 text-muted-foreground"
                )}
              >
                <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{message.role === 'assistant' ? 'Mentor' : 'You'}</p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            {!messages.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-background/30 p-3 text-sm text-muted-foreground">
                Ask the mentor and the thread will persist here.
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onPromptChange(item)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {item}
            </button>
          ))}
        </div>

        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          rows={4}
          placeholder="Ask the AI mentor anything about this journey..."
          className="w-full rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-primary/40"
        />

        <div className="flex items-center gap-3">
          <GlowButton variant="primary" className="flex-1" disabled={loading || !prompt.trim()} onClick={() => void onSend(prompt)}>
            {loading ? 'Thinking...' : 'Ask Mentor'}
          </GlowButton>
          <Link to="/assistant">
            <GlowButton variant="secondary">Open Assistant</GlowButton>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground min-h-[96px] whitespace-pre-wrap">
          {response || 'Your mentor response will appear here after asking a question.'}
        </div>
      </div>
    </GlassCard>
  );
}

export function EligibleJobsCard({ jobs }: { jobs: JourneyJobEligibility[] }) {
  return (
    <GlassCard glow glowColor="pink">
      <SectionHeader title="Job Eligibility Engine" subtitle="Compare your current skills against active roles and see missing skills instantly" className="mb-4" />
      <div className="space-y-3">
        {jobs.slice(0, 5).map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-xs text-muted-foreground">{job.company} · {job.location}</p>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", job.eligible ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300")}>
                {job.matchPercentage}% match
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
              <p>Missing skills: {job.missingSkills.length ? job.missingSkills.join(', ') : 'None'}</p>
              <p>Salary: {job.salary || 'Dynamic'}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{job.role}</span>
              <a href={job.applyLink} target="_blank" rel="noreferrer" className="text-sm text-primary hover:text-primary/80">
                Open role
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

export function PlacementReadinessWidget({ readiness, nextAction }: { readiness: PlacementReadiness; nextAction: string }) {
  return (
    <GlassCard glow glowColor="accent" className="h-full">
      <SectionHeader title="Placement Readiness" subtitle="A live score built from progress, skill coverage, and eligible jobs" className="mb-4" />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative h-44 w-44 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(rgba(139,92,246,1) ${readiness.score * 3.6}deg, rgba(148,163,184,0.15) 0deg)` }}>
          <div className="h-32 w-32 rounded-full bg-background/95 border border-white/10 flex flex-col items-center justify-center">
            <Trophy className="h-5 w-5 text-primary" />
            <p className="mt-2 text-3xl font-bold">{readiness.score}%</p>
            <p className="text-xs text-muted-foreground">{readiness.label}</p>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 text-left text-sm">
          <SmallStat label="Eligible jobs" value={String(readiness.eligibleJobs)} />
          <SmallStat label="Missing skills" value={String(readiness.missingSkills.length)} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-muted-foreground w-full">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recommended next action</p>
          <p className="mt-2 text-foreground">{nextAction}</p>
        </div>
      </div>
    </GlassCard>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background/35 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export function JourneySectionSummary({ journey }: { journey: JourneyPayload }) {
  return (
    <GlassCard>
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryItem label="Current day" value={`Day ${journey.currentDay}`} />
        <SummaryItem label="XP" value={`${journey.xp}`} />
        <SummaryItem label="Streak" value={`${journey.streak} days`} />
        <SummaryItem label="Next action" value={journey.nextAction} />
      </div>
    </GlassCard>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
