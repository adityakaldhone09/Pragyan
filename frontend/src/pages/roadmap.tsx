import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Circle, Lock, ChevronRight,
  BookOpen, Code2, BarChart2, Cpu, Globe,
  TrendingUp, Sparkles, ArrowRight, Clock, Flame
} from "lucide-react";

const phases = [
  {
    id: 1,
    title: "Day 1: Foundations",
    subtitle: "Core programming and data skills",
    status: "completed",
    progress: 100,
    steps: [
      { id: 1, title: "Python Basics", duration: "Day 1", status: "completed", icon: Code2 },
      { id: 2, title: "SQL Fundamentals", duration: "Day 2", status: "completed", icon: BookOpen },
      { id: 3, title: "Statistics Basics", duration: "Day 3", status: "completed", icon: BarChart2 },
    ],
  },
  {
    id: 2,
    title: "Day 2: Data Science Core",
    subtitle: "Analysis, visualization, and ML basics",
    status: "in-progress",
    progress: 40,
    steps: [
      { id: 4, title: "Data Analysis with Pandas", duration: "Day 4", status: "completed", icon: BarChart2 },
      { id: 5, title: "Data Visualization", duration: "Day 5", status: "in-progress", icon: BarChart2 },
      { id: 6, title: "Machine Learning Fundamentals", duration: "Day 6", status: "locked", icon: Cpu },
    ],
  },
  {
    id: 3,
    title: "Day 3: Advanced ML",
    subtitle: "Deep learning, model deployment",
    status: "locked",
    progress: 0,
    steps: [
      { id: 7, title: "Deep Learning with TensorFlow", duration: "Day 7", status: "locked", icon: Cpu },
      { id: 8, title: "Feature Engineering", duration: "Day 8", status: "locked", icon: Code2 },
      { id: 9, title: "Model Deployment", duration: "Day 9", status: "locked", icon: Globe },
    ],
  },
  {
    id: 4,
    title: "Day 4: Specialization",
    subtitle: "Government tech & AI applications",
    status: "locked",
    progress: 0,
    steps: [
      { id: 10, title: "Cloud Technologies (AWS/Azure)", duration: "Day 10", status: "locked", icon: Globe },
      { id: 11, title: "AI in Government Systems", duration: "Day 11", status: "locked", icon: TrendingUp },
      { id: 12, title: "Capstone Project", duration: "Day 12", status: "locked", icon: Flame },
    ],
  },
];

const statusColors = {
  completed: {
    ring: "bg-green-50 border-green-200",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700",
    icon: "text-green-500",
    stepBg: "bg-green-50 border-green-200",
  },
  "in-progress": {
    ring: "bg-primary/5 border-primary/20",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
    icon: "text-primary",
    stepBg: "bg-primary/5 border-primary/20",
  },
  locked: {
    ring: "bg-muted border-border",
    dot: "bg-muted-foreground/40",
    badge: "bg-muted text-muted-foreground",
    icon: "text-muted-foreground/50",
    stepBg: "bg-muted/50 border-border",
  },
};

const statusLabel: Record<string, string> = {
  completed: "Completed",
  "in-progress": "In Progress",
  locked: "Locked",
};

function StepIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === "in-progress") return <Circle className="w-5 h-5 text-primary fill-primary/20" />;
  return <Lock className="w-4 h-4 text-muted-foreground/50" />;
}

export default function Roadmap() {
  const totalSteps = phases.flatMap(p => p.steps).length;
  const completedSteps = phases.flatMap(p => p.steps).filter(s => s.status === "completed").length;
  const overallPct = Math.round((completedSteps / totalSteps) * 100);

  const currentPhase = phases.find(p => p.status === "in-progress");
  const currentStep = phases.flatMap(p => p.steps).find(s => s.status === "in-progress");

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Roadmap</h1>
        <p className="text-muted-foreground mt-1">Your personalized path to becoming a Data Scientist.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm flex flex-col items-center text-center">
          <CircularProgress
            value={completedSteps}
            max={totalSteps}
            size={72}
            strokeWidth={7}
            valueFormatter={(v, m) => `${v}/${m}`}
          />
          <p className="text-sm font-semibold text-foreground mt-3">Steps Done</p>
          <p className="text-xs text-muted-foreground">of {totalSteps} total</p>
        </div>
        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm flex flex-col items-center text-center">
          <CircularProgress
            value={overallPct}
            size={72}
            strokeWidth={7}
          />
          <p className="text-sm font-semibold text-foreground mt-3">Overall Progress</p>
          <p className="text-xs text-muted-foreground">Keep going!</p>
        </div>
        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm flex flex-col items-center text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center">
            <span className="text-xl font-bold text-amber-600">P{currentPhase?.id ?? 2}</span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-3">Current Phase</p>
          <p className="text-xs text-muted-foreground truncate max-w-full px-2">Data Science Core</p>
        </div>
        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm flex flex-col items-center text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center">
            <span className="text-xl font-bold text-green-600">{totalSteps - completedSteps}</span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-3">Steps Left</p>
          <p className="text-xs text-muted-foreground">to target role</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main timeline */}
        <div className="col-span-2 space-y-4">
          {phases.map((phase, phaseIdx) => {
            const colors = statusColors[phase.status as keyof typeof statusColors];
            return (
              <div key={phase.id} className="relative">
                {/* Connector line */}
                {phaseIdx < phases.length - 1 && (
                  <div className="absolute left-6 top-full w-0.5 h-4 bg-border z-10" />
                )}

                <div className={`bg-card border rounded-[20px] p-6 shadow-sm ${colors.ring}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground">{phase.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${colors.badge}`}>
                            {statusLabel[phase.status]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{phase.subtitle}</p>
                      </div>
                    </div>
                    {phase.status !== "locked" && (
                      <span className="text-sm font-bold text-foreground flex-shrink-0">{phase.progress}%</span>
                    )}
                  </div>

                  {phase.status !== "locked" && (
                    <div className="mb-4">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${phase.status === "completed" ? "bg-green-500" : "bg-primary"}`}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {phase.steps.map((step) => {
                      const stepColors = statusColors[step.status as keyof typeof statusColors];
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${stepColors.stepBg} ${
                            step.status === "locked" ? "opacity-60" : ""
                          }`}
                          data-testid={`step-${step.id}`}
                        >
                          <StepIcon status={step.status} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${step.status === "locked" ? "text-muted-foreground" : "text-foreground"}`}>
                              {step.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            {step.duration}
                          </div>
                          {step.status === "in-progress" && (
                            <Button size="sm" className="rounded-xl text-xs px-3 py-1 h-7 flex-shrink-0">
                              Continue
                            </Button>
                          )}
                          {step.status === "completed" && (
                            <span className="text-xs text-green-600 font-medium flex-shrink-0">Done</span>
                          )}
                          {step.status === "locked" && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Currently working on */}
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Currently Working On</h3>
            {currentStep && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{currentStep.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Phase 2 of 4</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">60%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: "60%" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Button className="w-full mt-4 rounded-xl" data-testid="button-continue-step">
              Continue Learning <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Next milestone */}
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Next Milestone</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Complete Phase 2</p>
                <p className="text-xs text-muted-foreground">2 steps remaining</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Circle className="w-3.5 h-3.5 text-primary fill-primary/20" />
                <span className="text-foreground">Data Visualization — in progress</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">ML Fundamentals — locked</span>
              </div>
            </div>
          </div>

          {/* AI suggestion */}
          <div className="bg-primary text-primary-foreground rounded-[20px] p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />
            <Sparkles className="w-7 h-7 text-white/80 mb-3" />
            <p className="font-bold mb-2">AI Tip</p>
            <p className="text-sm text-primary-foreground/85 leading-relaxed">
              Completing Data Visualization will unlock Machine Learning. Stay consistent — 1 hour a day keeps you on track.
            </p>
          </div>

          {/* Target role */}
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Target Role</p>
            <h4 className="font-bold text-foreground text-base">Data Scientist</h4>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">Government Track</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Match Score</span>
              <span className="font-bold text-primary">87%</span>
            </div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: "87%" }} />
            </div>
            <p className="text-xs text-green-600 font-medium mt-2">+12% since last month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
