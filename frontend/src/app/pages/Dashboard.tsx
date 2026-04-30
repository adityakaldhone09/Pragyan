import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { AnimatedProgress } from '../components/AnimatedProgress';
import { Icons } from '../components/Icons';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';

type AssessmentAnswers = Record<string, any>;

const marketPulseData = [
  { month: 'Jan', demand: 58, salary: 52 },
  { month: 'Feb', demand: 61, salary: 54 },
  { month: 'Mar', demand: 66, salary: 57 },
  { month: 'Apr', demand: 71, salary: 61 },
  { month: 'May', demand: 75, salary: 64 },
  { month: 'Jun', demand: 79, salary: 68 },
  { month: 'Jul', demand: 83, salary: 72 },
];

const trendingCareers = [
  {
    name: 'AI Product Analyst',
    demand: 96,
    growth: '+28%',
    salary: '₹14-24 LPA',
    tag: 'Hot in Bengaluru',
  },
  {
    name: 'Full Stack Engineer',
    demand: 91,
    growth: '+21%',
    salary: '₹12-22 LPA',
    tag: 'Startup favorite',
  },
  {
    name: 'Data Scientist',
    demand: 88,
    growth: '+19%',
    salary: '₹16-30 LPA',
    tag: 'High signal',
  },
  {
    name: 'Growth Marketer',
    demand: 84,
    growth: '+16%',
    salary: '₹10-18 LPA',
    tag: 'Scaling fast',
  },
];

const fastestGrowingSectors = [
  { sector: 'AI & Automation', growth: 92, openings: '14.8k roles' },
  { sector: 'FinTech', growth: 84, openings: '11.2k roles' },
  { sector: 'SaaS', growth: 79, openings: '9.6k roles' },
  { sector: 'Healthcare Tech', growth: 73, openings: '8.1k roles' },
];

const mostDemandedSkills = [
  { skill: 'JavaScript / TypeScript', demand: 96, trend: '+11%' },
  { skill: 'AI Prompting & LLMs', demand: 91, trend: '+18%' },
  { skill: 'Data Analysis', demand: 88, trend: '+9%' },
  { skill: 'Cloud / AWS', demand: 84, trend: '+13%' },
];

const hiringAlerts = [
  {
    company: 'CRED',
    role: 'Associate Product Analyst',
    note: 'Remote-first, India-wide applications open now.',
  },
  {
    company: 'Zoho',
    role: 'Full Stack Developer',
    note: 'Hiring across Chennai, Coimbatore, and remote cohorts.',
  },
  {
    company: 'Navi',
    role: 'Data Analyst',
    note: 'Fast-track interviews for candidates with SQL and dashboards.',
  },
];

const chartConfig = {
  demand: {
    label: 'Hiring demand',
    color: 'hsl(234 89% 66%)',
  },
  salary: {
    label: 'Salary growth',
    color: 'hsl(186 90% 56%)',
  },
};

interface DashboardProps {
  userName: string;
  assessmentAnswers?: AssessmentAnswers;
  onViewMatches: () => void;
  onViewProfile: () => void;
  onRetakeAssessment: () => void;
}

function buildMarketSuggestions(userName: string, assessmentAnswers?: AssessmentAnswers) {
  const answersText = Object.values(assessmentAnswers || {})
    .map((answer) => {
      if (typeof answer === 'string') {
        return answer;
      }

      if (answer && typeof answer === 'object') {
        return [answer.question, answer.answer, answer.type].filter(Boolean).join(' ');
      }

      return '';
    })
    .join(' ')
    .toLowerCase();

  const profileText = `${userName} ${answersText}`;
  const suggestions = [];

  if (/data|analytics|statistics|sql|dashboard/.test(profileText)) {
    suggestions.push({
      title: 'Lean into data-heavy roles',
      body: 'You are a strong fit for analytics, product insights, and BI workflows. Add SQL, dashboarding, and experimentation projects to your profile.',
    });
  }

  if (/tech|coding|developer|javascript|react|ai|machine learning/.test(profileText)) {
    suggestions.push({
      title: 'Target AI-enabled product teams',
      body: 'Your profile aligns with startup roles blending product thinking and engineering. Focus on TypeScript, APIs, and LLM tooling.',
    });
  }

  if (/creative|design|ui|ux|brand|content/.test(profileText)) {
    suggestions.push({
      title: 'Track design-led growth markets',
      body: 'Creative roles are hiring faster in product design, motion systems, and brand storytelling. Build a portfolio with measurable outcomes.',
    });
  }

  if (/business|strategy|marketing|sales|operations/.test(profileText)) {
    suggestions.push({
      title: 'Watch operations and growth roles',
      body: 'Business-facing teams are prioritizing analysts who can move between strategy, funnel metrics, and go-to-market execution.',
    });
  }

  if (!suggestions.length) {
    suggestions.push(
      {
        title: 'Keep a balanced job radar',
        body: 'Your profile is still broad enough to explore tech, product, and analytics tracks. Watch startup hiring patterns and choose one track to deepen.',
      },
      {
        title: 'Strengthen a marketable skill loop',
        body: 'Pair one core skill with one execution skill, such as TypeScript plus analytics or design plus research, to stand out faster.',
      }
    );
  }

  return suggestions.slice(0, 3);
}

export function Dashboard({
  userName,
  assessmentAnswers,
  onViewMatches,
  onViewProfile,
  onRetakeAssessment,
}: DashboardProps) {
  const [livePulse, setLivePulse] = useState(82);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse((currentPulse) => {
        const nextPulse = currentPulse + (Math.random() > 0.5 ? 2 : -2);
        return Math.max(68, Math.min(97, nextPulse));
      });
      setActiveAlertIndex((currentIndex) => (currentIndex + 1) % hiringAlerts.length);
      setLastUpdated(new Date());
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const marketSuggestions = useMemo(
    () => buildMarketSuggestions(userName, assessmentAnswers),
    [assessmentAnswers, userName]
  );

  const updatedLabel = lastUpdated.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen">
      <nav className="glass-strong border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Icons.Brain />
            </div>
            <h1 className="text-xl font-bold text-white">Pragyan</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onViewProfile} className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform">
              {userName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{userName}</span>! 👋
          </h2>
          <p className="text-xl text-gray-400">Here's your career guidance dashboard</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <GlassCard strong className="p-6 lg:col-span-2 relative overflow-hidden border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.22),transparent_28%)]"></div>
            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-cyan-400/20 text-xs font-semibold text-cyan-200 uppercase tracking-[0.22em] mb-4">
                    <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse"></span>
                    Top job trends
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">Hot roles hiring right now</h3>
                  <p className="text-slate-300 max-w-xl">
                    Live India hiring signals, fastest growing sectors, and the skills companies are paying for today.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-3xl">
                  📈
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Live pulse</div>
                  <div className="text-2xl font-bold text-cyan-300">{livePulse}%</div>
                  <div className="text-xs text-gray-400 mt-1">Updated {updatedLabel}</div>
                </div>
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Trending careers</div>
                  <div className="text-2xl font-bold text-white">4 roles</div>
                  <div className="text-xs text-gray-400 mt-1">Above 84% demand</div>
                </div>
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Salary momentum</div>
                  <div className="text-2xl font-bold text-emerald-300">+22%</div>
                  <div className="text-xs text-gray-400 mt-1">Top roles this quarter</div>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {trendingCareers.slice(0, 3).map((career) => (
                  <div key={career.name} className="glass rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <div className="text-white font-semibold">{career.name}</div>
                        <div className="text-xs text-gray-400">{career.salary}</div>
                      </div>
                      <span className="text-xs font-semibold text-cyan-200 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                        {career.tag}
                      </span>
                    </div>
                    <AnimatedProgress value={career.demand} color="secondary" />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <GlassButton variant="secondary" className="bg-white/15 hover:bg-white/25" onClick={onViewMatches}>
                  Explore matches
                </GlassButton>
                <span className="px-3 py-2 rounded-full glass border border-white/10 text-sm text-slate-200">
                  India hiring radar
                </span>
                <span className="px-3 py-2 rounded-full glass border border-white/10 text-sm text-slate-200">
                  AI-backed suggestions
                </span>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard strong className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Hiring Alerts
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">Live openings matching current market demand</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Live
                </span>
              </div>

              <div className="space-y-3">
                {hiringAlerts.map((alert, index) => (
                  <div
                    key={alert.company}
                    className={`rounded-2xl p-4 border transition-all duration-300 ${
                      index === activeAlertIndex
                        ? 'bg-white/10 border-emerald-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="text-white font-medium">{alert.company}</div>
                      {index === activeAlertIndex && (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">Now hiring</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-200">{alert.role}</div>
                    <div className="text-xs text-gray-500 mt-1">{alert.note}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard strong className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Icons.Target />
                  Quick Stat
                </div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-2xl font-bold text-indigo-300">94%</div>
                  <div className="text-xs text-gray-400 mt-1">Top Match Score</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-2xl font-bold text-emerald-300">72%</div>
                  <div className="text-xs text-gray-400 mt-1">Profile Complete</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassCard hover strong className="p-6 cursor-pointer group" onClick={onViewProfile}>
            <div className="w-12 h-12 gradient-secondary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icons.User />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Profile</h3>
            <p className="text-gray-400 mb-4">Manage your skills, education, and preferences</p>
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Completion</span>
                <span className="text-indigo-400 font-semibold">72%</span>
              </div>
              <AnimatedProgress value={72} color="secondary" />
            </div>
            <GlassButton variant="ghost" size="sm" className="w-full">View Profile →</GlassButton>
          </GlassCard>

          <GlassCard hover strong className="p-6 cursor-pointer group" onClick={onRetakeAssessment}>
            <div className="w-12 h-12 gradient-accent rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icons.Brain />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Retake Assessment</h3>
            <p className="text-gray-400 mb-4">Update your career matches with a new assessment</p>
            <div className="glass rounded-xl p-3 mb-4">
              <div className="text-xs text-gray-400">Last taken: Today</div>
            </div>
            <GlassButton variant="ghost" size="sm" className="w-full">Start Now →</GlassButton>
          </GlassCard>

          <GlassCard hover strong className="p-6 cursor-pointer group">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icons.Book />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Learning Paths</h3>
            <p className="text-gray-400 mb-4">Personalized roadmaps for your target careers</p>
            <div className="glass rounded-xl p-3 mb-4">
              <div className="text-xs text-gray-400">3 roadmaps available</div>
            </div>
            <GlassButton variant="ghost" size="sm" className="w-full">Explore →</GlassButton>
          </GlassCard>
        </div>

        <GlassCard strong className="mt-6 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.16),transparent_28%)]"></div>
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-cyan-400/20 text-xs font-semibold text-cyan-200 uppercase tracking-[0.22em] mb-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse"></span>
                  Top job trends
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">Current Job Trends in India</h3>
                <p className="text-gray-300 mt-1">Trending careers, fast-growing sectors, in-demand skills, and live hiring alerts.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold uppercase tracking-[0.18em]">
                Live now
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Live pulse</div>
                    <div className="text-2xl font-bold text-cyan-300">{livePulse}%</div>
                    <div className="text-xs text-gray-400 mt-1">Updated {updatedLabel}</div>
                  </div>
                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Trending careers</div>
                    <div className="text-2xl font-bold text-white">4 roles</div>
                    <div className="text-xs text-gray-400 mt-1">Above 84% demand</div>
                  </div>
                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Salary momentum</div>
                    <div className="text-2xl font-bold text-emerald-300">+22%</div>
                    <div className="text-xs text-gray-400 mt-1">Top roles this quarter</div>
                  </div>
                </div>

                <ChartContainer config={chartConfig} className="h-[260px] w-full">
                  <AreaChart data={marketPulseData} margin={{ left: 4, right: 20, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-demand)" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="var(--color-demand)" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="salaryFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-salary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-salary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} stroke="rgba(255,255,255,0.45)" />
                    <YAxis tickLine={false} axisLine={false} tickMargin={12} width={34} stroke="rgba(255,255,255,0.45)" />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Area type="monotone" dataKey="demand" stroke="var(--color-demand)" fill="url(#demandFill)" strokeWidth={3} />
                    <Area type="monotone" dataKey="salary" stroke="var(--color-salary)" fill="url(#salaryFill)" strokeWidth={3} />
                  </AreaChart>
                </ChartContainer>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {marketSuggestions.slice(0, 2).map((suggestion, index) => (
                    <div key={suggestion.title} className="glass rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{suggestion.title}</div>
                          <div className="text-xs text-gray-400">Personalized for you</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 leading-6">{suggestion.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="xl:col-span-5 space-y-5">
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Icons.Target />
                        Trending careers in India
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">Roles with the strongest hiring momentum this week</p>
                    </div>
                    <span className="text-xs font-semibold text-cyan-200 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                      Hot
                    </span>
                  </div>
                  <div className="space-y-3">
                    {trendingCareers.slice(0, 3).map((career) => (
                      <div key={career.name} className="glass rounded-2xl p-3 border border-white/10">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="text-white font-medium">{career.name}</div>
                            <div className="text-xs text-gray-400">{career.salary}</div>
                          </div>
                          <span className="text-[11px] font-semibold text-cyan-200 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-full">
                            {career.tag}
                          </span>
                        </div>
                        <AnimatedProgress value={career.demand} color="secondary" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Icons.Lightning />
                      <h4 className="font-semibold text-white">Fastest growing sectors</h4>
                    </div>
                    <div className="space-y-3">
                      {fastestGrowingSectors.slice(0, 2).map((sector) => (
                        <div key={sector.sector}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{sector.sector}</span>
                            <span className="text-emerald-300">+{sector.growth}%</span>
                          </div>
                          <AnimatedProgress value={sector.growth} color="accent" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Icons.Book />
                      <h4 className="font-semibold text-white">Most demanded skills</h4>
                    </div>
                    <div className="space-y-3">
                      {mostDemandedSkills.slice(0, 2).map((skill) => (
                        <div key={skill.skill}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{skill.skill}</span>
                            <span className="text-cyan-300">{skill.trend}</span>
                          </div>
                          <AnimatedProgress value={skill.demand} color="primary" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-strong rounded-2xl p-4 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Hiring alerts
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-emerald-300">Live</span>
                  </div>
                  <div className="space-y-2">
                    {hiringAlerts.map((alert, index) => (
                      <div
                        key={alert.company}
                        className={`rounded-xl p-3 border transition-all duration-300 ${
                          index === activeAlertIndex
                            ? 'bg-white/10 border-emerald-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="text-white font-medium">{alert.company}</div>
                          {index === activeAlertIndex && (
                            <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">Now hiring</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-300">{alert.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
