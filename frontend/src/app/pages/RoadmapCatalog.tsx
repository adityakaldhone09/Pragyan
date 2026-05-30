import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, BookOpen, Filter, Layers3, Search, Sparkles, Target, TimerReset } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { NeuralBackground } from "../components/NeuralBackground";
import { roadmapService } from "../../services/roadmapService";
import type { RoadmapSummary } from "../../types/api";

const DIFFICULTY_OPTIONS = ["all", "beginner", "intermediate", "advanced", "expert"] as const;
const DOMAIN_OPTIONS = [
  "all",
  "Technology",
  "Programming",
  "AI/ML",
  "Cybersecurity",
  "Cloud",
  "Government Exams",
  "Finance",
  "Creative Careers",
  "Management",
] as const;

type DifficultyFilter = (typeof DIFFICULTY_OPTIONS)[number];
type DomainFilter = (typeof DOMAIN_OPTIONS)[number];

function formatDifficulty(value?: string) {
  if (!value) return "All levels";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getRoadmapDomain(roadmap: RoadmapSummary) {
  return roadmap.careerPath || roadmap.category || "Technology";
}

export function RoadmapCatalog() {
  const [allRoadmaps, setAllRoadmaps] = useState<RoadmapSummary[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<DomainFilter>("all");
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const pageSize = 100;

    async function loadCatalog() {
      try {
        setLoading(true);
        setError(null);

        const categoryPromise = roadmapService.getCategories();
        const roadmapPages: RoadmapSummary[] = [];
        let page = 1;

        while (true) {
          const resp = await roadmapService.getAllRoadmaps({ page, limit: pageSize }) as any;
          // apiPaginatedRequest now returns PaginatedResponse<T>
          const batch = Array.isArray(resp) ? resp : resp.data;
          const pagination = resp.pagination;

          roadmapPages.push(...(batch || []));

          if (!batch || batch.length < pageSize || (pagination && page >= (pagination.totalPages || 0))) {
            break;
          }

          page += 1;
        }

        const [categoryResponse] = await Promise.allSettled([categoryPromise]);

        if (!mounted) return;

        if (categoryResponse.status === "fulfilled") {
          setCategories(categoryResponse.value || []);
        }

        if (mounted) {
          setAllRoadmaps(roadmapPages);
          setRoadmaps(roadmapPages);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load roadmap catalog");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setRoadmaps(allRoadmaps);
      return;
    }

    let mounted = true;
    const timeout = window.setTimeout(async () => {
      try {
        const results = await roadmapService.searchRoadmaps(normalizedQuery);
        if (mounted) {
          setRoadmaps(results || []);
        }
      } catch {
        if (mounted) {
          setRoadmaps(allRoadmaps);
        }
      }
    }, 220);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [allRoadmaps, query]);

  const filteredRoadmaps = useMemo(() => {
    return roadmaps.filter((roadmap) => {
      const roadmapDomain = getRoadmapDomain(roadmap);
      const matchesDomain = domain === "all" || roadmapDomain === domain;
      const matchesCategory = category === "all" || roadmap.category === category;
      const matchesDifficulty = difficulty === "all" || roadmap.level === difficulty;

      return matchesDomain && matchesCategory && matchesDifficulty;
    });
  }, [category, difficulty, domain, roadmaps]);

  const featuredRoadmaps = filteredRoadmaps.slice(0, 12);

  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <GlassCard glow glowColor="primary" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">Roadmap Catalog</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold">Explore 200+ learning paths across Pragyan</h1>
                  <p className="text-muted-foreground text-lg">
                    Search the full catalog by domain, category, difficulty, or keyword to find the roadmap that fits your current goal.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 min-w-[260px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Total</p>
                    <p className="text-3xl font-bold text-primary">{roadmaps.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Seeded roadmaps</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Visible</p>
                    <p className="text-3xl font-bold text-secondary">{featuredRoadmaps.length}</p>
                    <p className="text-sm text-muted-foreground">Matching filters</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr_0.8fr]">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/30 px-4 py-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="Search roadmap..."
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/30 px-4 py-3">
                  <Filter className="w-5 h-5 text-muted-foreground" />
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/30 px-4 py-3">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}
                    className="w-full bg-transparent outline-none text-sm"
                  >
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{formatDifficulty(option)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {DOMAIN_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDomain(option)}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${domain === option ? "border-primary/40 bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:border-primary/20 hover:text-foreground"}`}
                  >
                    {option === "all" ? "All Domains" : option}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {error ? (
          <GlassCard glow glowColor="accent" className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <GlowButton variant="primary" onClick={() => window.location.reload()}>
              Retry loading
            </GlowButton>
          </GlassCard>
        ) : null}

        <SectionHeader title="Catalog Results" subtitle="Browse seeded roadmap entries from the backend catalog" />

        {loading ? (
          <GlassCard className="text-center py-16">
            <p className="text-muted-foreground">Loading roadmap catalog...</p>
          </GlassCard>
        ) : featuredRoadmaps.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredRoadmaps.map((roadmap, index) => (
              <motion.div
                key={roadmap.id || `${roadmap.title}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.03 }}
              >
                <GlassCard hover glow glowColor={index % 2 === 0 ? "primary" : "secondary"} className="h-full">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="text-4xl mb-3">{roadmap.icon || "📚"}</div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{roadmap.category || "Roadmap"}</p>
                      <h3 className="text-xl font-semibold mt-1">{roadmap.title}</h3>
                    </div>
                    <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {formatDifficulty(roadmap.level)}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{roadmap.description}</p>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-muted-foreground text-xs mb-1">Duration</p>
                      <p className="font-medium flex items-center gap-2"><TimerReset className="w-4 h-4 text-secondary" />{roadmap.duration || "Flexible"}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-muted-foreground text-xs mb-1">Hours</p>
                      <p className="font-medium flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />{roadmap.estimatedHours || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Required skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(roadmap.tags || []).slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {roadmap.learningStructure?.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Daily topics</p>
                        <div className="flex flex-wrap gap-2">
                          {roadmap.learningStructure.slice(0, 3).map((day) => (
                            <span key={`${roadmap.id || roadmap.title}-${day.day}`} className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
                              Day {day.day}: {day.focus}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Milestones</p>
                      <div className="flex flex-wrap gap-2">
                        {(roadmap.milestones || []).slice(0, 3).map((milestone, milestoneIndex) => (
                          <span key={`${roadmap.id || roadmap.title}-${milestoneIndex}`} className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs text-secondary">
                            {milestone.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{getRoadmapDomain(roadmap)} • {roadmap.requiredSkills?.length || roadmap.tags?.length || 0} skill tags</span>
                    <GlowButton variant="secondary" size="sm" className="whitespace-nowrap">
                      Open roadmap
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </GlowButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassCard className="text-center py-16 space-y-4">
            <Layers3 className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">No roadmaps found</h3>
            <p className="text-muted-foreground">Try a different search term or reset the filters.</p>
            <GlowButton variant="primary" onClick={() => {
              setQuery("");
              setCategory("all");
              setDifficulty("all");
            }}>
              Reset filters
            </GlowButton>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
