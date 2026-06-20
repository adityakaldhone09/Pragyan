import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronDown, Map, RefreshCw } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuth } from "@/context/useAuth";
import { GlassCard } from "../GlassCard";
import { SectionHeader } from "../SectionHeader";

interface RoadmapTask {
  title: string;
  description: string;
  estimatedMinutes: number;
}

interface RoadmapTopic {
  title: string;
  tasks: RoadmapTask[];
}

interface RoadmapModule {
  title: string;
  topics: RoadmapTopic[];
}

interface AssessmentRoadmap {
  id: string;
  userId: string;
  domain: string;
  recommendedRole: string;
  skillGaps: string[];
  track: {
    title: string;
    modules: RoadmapModule[];
  };
  dailyPlan?: {
    mode: "Recovery" | "Growth" | "Stretch";
    date: string;
    tasks: RoadmapTask[];
  } | null;
  updatedAt: string;
}

export function AssessmentRoadmapFallback() {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<AssessmentRoadmap | null>(null);
  const [loading, setLoading] = useState(Boolean(user?.id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadRoadmap() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<AssessmentRoadmap>(`/roadmap/${encodeURIComponent(user.id)}`);
        if (mounted) setRoadmap(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load your assessment roadmap");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadRoadmap();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen relative pt-24 pb-16">
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <GlassCard>
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-44 rounded bg-white/10" />
              <div className="h-9 w-72 rounded bg-white/10" />
              <div className="grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-24 rounded-lg bg-white/10" />
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen relative pt-24 pb-16">
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <GlassCard glow glowColor="primary">
            <SectionHeader
              title="Career Journey unavailable"
              subtitle={error || "Complete the hybrid assessment to generate your personalized roadmap."}
            />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/assessment">
                <button className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground">
                  Start Assessment
                </button>
              </Link>
              <Link to="/dashboard">
                <button className="rounded-lg border border-white/10 px-5 py-3 font-medium text-foreground">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-24 pb-16">
      <div className="relative z-10 max-w-5xl mx-auto px-6 space-y-6">
        <GlassCard glow glowColor="primary">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-primary">
                <Map className="h-4 w-4" />
                Assessment roadmap
              </div>
              <h1 className="mt-3 text-3xl font-semibold">{roadmap.recommendedRole}</h1>
              <p className="mt-2 text-sm text-muted-foreground capitalize">{roadmap.domain}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              Updated {new Date(roadmap.updatedAt).toLocaleDateString()}
            </div>
          </div>

          {roadmap.skillGaps.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {roadmap.skillGaps.map((gap) => (
                <span key={gap} className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs text-secondary">
                  {gap}
                </span>
              ))}
            </div>
          ) : null}
        </GlassCard>

        {roadmap.dailyPlan ? (
          <GlassCard>
            <SectionHeader title="Today's Plan" subtitle={`${roadmap.dailyPlan.mode} mode`} className="mb-4" />
            <div className="grid gap-3 md:grid-cols-3">
              {roadmap.dailyPlan.tasks.map((task, index) => (
                <TaskCard key={`${task.title}-${index}`} task={task} index={index} />
              ))}
            </div>
          </GlassCard>
        ) : null}

        <GlassCard>
          <SectionHeader title={roadmap.track.title} subtitle="Modules, topics, and daily tasks" className="mb-4" />
          <div className="space-y-3">
            {roadmap.track.modules.map((module, index) => (
              <ModulePanel key={`${module.title}-${index}`} module={module} index={index} />
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ModulePanel({ module, index }: { module: RoadmapModule; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <span className="font-medium">{module.title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="border-t border-white/10 px-4 py-3 space-y-3">
          {module.topics.map((topic) => (
            <div key={topic.title}>
              <p className="text-sm font-medium text-secondary">{topic.title}</p>
              <div className="mt-2 grid gap-2">
                {topic.tasks.map((task, taskIndex) => (
                  <TaskCard key={`${topic.title}-${task.title}-${taskIndex}`} task={task} index={taskIndex} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TaskCard({ task, index, compact = false }: { task: RoadmapTask; index: number; compact?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-background/35 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {index + 1}
        </span>
        <div>
          <p className="text-sm font-medium">{task.title}</p>
          <p className={`${compact ? "mt-1" : "mt-2"} text-xs leading-5 text-muted-foreground`}>{task.description}</p>
          <p className="mt-2 text-xs text-secondary">{task.estimatedMinutes} min</p>
        </div>
      </div>
    </div>
  );
}
