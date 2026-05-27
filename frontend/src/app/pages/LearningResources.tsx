import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, CheckCircle2, Filter, Flame, RefreshCw, Search, Sparkles, Target, TimerReset } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { GlowButton } from '../components/GlowButton';
import { SectionHeader } from '../components/SectionHeader';
import { NeuralBackground } from '../components/NeuralBackground';
import { useAuth } from '@/context/useAuth';
import { roadmapService } from '../../services/roadmapService';
import { learningResourceService } from '../../services/learningResourceService';
import type { LearningResourceDayGroup, LearningResourceHistoryItem, LearningResourceItem, LearningResourceRecommendation, RoadmapSummary } from '../../types/api';

function formatResourceType(value: string) {
  return value
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function LearningResources() {
  const { user, reloadUser } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('');
  const [recommendation, setRecommendation] = useState<LearningResourceRecommendation | null>(null);
  const [history, setHistory] = useState<LearningResourceHistoryItem[]>([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);
  const [loadingResources, setLoadingResources] = useState(false);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadRoadmaps() {
      try {
        setLoadingRoadmaps(true);
        setError(null);

        const collected: RoadmapSummary[] = [];
        let page = 1;
        const pageSize = 100;

        while (true) {
          const response = await roadmapService.getAllRoadmaps({ page, limit: pageSize });
          const batch = response.data || [];
          collected.push(...batch);

          if (!batch.length || response.pagination.page >= response.pagination.totalPages) {
            break;
          }

          page += 1;
        }

        if (!mounted) return;

        setRoadmaps(collected);
        setSelectedRoadmapId((current) => current || collected[0]?.id || '');
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load roadmaps');
        }
      } finally {
        if (mounted) {
          setLoadingRoadmaps(false);
        }
      }
    }

    void loadRoadmaps();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRoadmapId) return;

    let mounted = true;

    async function loadResources() {
      try {
        setLoadingResources(true);
        setError(null);

        const resourceResponse = await learningResourceService.getPersonalizedResources(selectedRoadmapId);
        const historyResponse = await learningResourceService.getHistory(selectedRoadmapId);

        if (!mounted) return;

        setRecommendation(resourceResponse);
        setHistory(historyResponse);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load learning resources');
        }
      } finally {
        if (mounted) {
          setLoadingResources(false);
        }
      }
    }

    void loadResources();

    return () => {
      mounted = false;
    };
  }, [selectedRoadmapId]);

  const roadmapMap = useMemo(() => new Map(roadmaps.map((roadmap) => [roadmap.id || '', roadmap])), [roadmaps]);
  const selectedRoadmap = selectedRoadmapId ? roadmapMap.get(selectedRoadmapId) : undefined;

  const completedResourceIds = useMemo(() => new Set(history.filter((entry) => entry.completed).map((entry) => entry.resourceId)), [history]);

  const nextResource = useMemo(
    () => recommendation?.resources.find((resource) => !completedResourceIds.has(resource.id)) || null,
    [completedResourceIds, recommendation?.resources]
  );

  const filteredDays = useMemo(() => {
    const days = recommendation?.days || [];
    const normalizedQuery = query.trim().toLowerCase();

    return days
      .map((day) => ({
        ...day,
        resources: day.resources.filter((resource) => {
          const matchesType = filterType === 'all' || resource.resourceType === filterType;
          const matchesQuery = !normalizedQuery || [resource.title, resource.description, resource.topic, resource.skill, resource.provider, ...(resource.tags || [])]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery));

          return matchesType && matchesQuery;
        }),
      }))
      .filter((day) => day.resources.length > 0);
  }, [filterType, query, recommendation?.days]);

  const totals = useMemo(() => {
    const resources = recommendation?.resources || [];
    const visibleResources = filteredDays.flatMap((day) => day.resources);
    const completedVisible = visibleResources.filter((resource) => completedResourceIds.has(resource.id)).length;

    return {
      total: resources.length,
      visible: visibleResources.length,
      completed: completedVisible,
      progress: visibleResources.length ? Math.round((completedVisible / visibleResources.length) * 100) : 0,
      completedDays: filteredDays.filter((day) => day.completedCount === day.totalCount && day.totalCount > 0).length,
    };
  }, [completedResourceIds, filteredDays, recommendation?.resources]);

  async function toggleCompletion(resource: LearningResourceItem, completed: boolean) {
    try {
      setSavingIds((current) => ({ ...current, [resource.id]: true }));
      let quizScore: number | undefined;

      if (completed && String(resource.resourceType || '').toLowerCase() === 'quiz') {
        const rawScore = window.prompt(`Enter your quiz score for "${resource.title}" (0-100). Leave blank to skip.`);
        if (rawScore !== null && rawScore.trim()) {
          const parsedScore = Number(rawScore);
          if (Number.isFinite(parsedScore)) {
            quizScore = Math.max(0, Math.min(100, Math.round(parsedScore)));
          }
        }
      }

      const updated = await learningResourceService.saveHistory({
        resourceId: resource.id,
        roadmapId: recommendation?.roadmap.id || selectedRoadmapId,
        completed,
        progressPercent: completed ? 100 : 0,
        quizScore,
        source: 'resource-dashboard',
      });

      setHistory((current) => {
        const remaining = current.filter((entry) => entry.resourceId !== updated.resourceId);
        return [updated, ...remaining];
      });

      void reloadUser();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save learning progress');
    } finally {
      setSavingIds((current) => {
        const next = { ...current };
        delete next[resource.id];
        return next;
      });
    }
  }

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
                    <span className="text-sm font-medium">Learning Resources</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold">Day-wise resource cards for every roadmap skill</h1>
                  <p className="text-muted-foreground text-lg">
                    Watch videos, read docs, practice, build projects, and track completions with persisted learning history.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 min-w-[300px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Resources</p>
                    <p className="text-3xl font-bold text-primary">{totals.total}</p>
                    <p className="text-sm text-muted-foreground">Generated for roadmap</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Progress</p>
                    <p className="text-3xl font-bold text-secondary">{totals.progress}%</p>
                    <p className="text-sm text-muted-foreground">Visible items completed</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Streak</p>
                    <p className="text-3xl font-bold text-pink-400 flex items-center gap-2">
                      <Flame className="w-7 h-7" />
                      {user?.streak || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Learning days in a row</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.7fr_0.7fr]">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/30 px-4 py-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="Search by topic, skill, provider, or title"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/30 px-4 py-3">
                  <Filter className="w-5 h-5 text-muted-foreground" />
                  <select
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                  >
                    <option value="all">All resource types</option>
                    <option value="youtube">YouTube</option>
                    <option value="documentation">Official docs</option>
                    <option value="practice">Practice websites</option>
                    <option value="article">Articles</option>
                    <option value="mini-project">Mini projects</option>
                    <option value="certification">Certifications</option>
                  </select>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/30 px-4 py-3">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  <select
                    value={selectedRoadmapId}
                    onChange={(event) => setSelectedRoadmapId(event.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                    disabled={loadingRoadmaps}
                  >
                    {roadmaps.map((roadmap) => (
                      <option key={roadmap.id} value={roadmap.id}>
                        {roadmap.title}
                      </option>
                    ))}
                  </select>
                </label>
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

        {selectedRoadmap ? (
          <GlassCard glow glowColor="secondary" className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Selected roadmap</p>
                <h2 className="text-2xl font-semibold mt-2">{selectedRoadmap.title}</h2>
                <p className="text-muted-foreground mt-1">{selectedRoadmap.description}</p>
                <p className="text-sm text-secondary mt-2">
                  Personalized for {recommendation?.profile?.careerGoal || user?.experience || 'your current goal'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 min-w-[280px]">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Days</p>
                  <p className="text-xl font-semibold">{recommendation?.days.length || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Topics</p>
                  <p className="text-xl font-semibold">{recommendation?.totalTopics || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Done</p>
                  <p className="text-xl font-semibold">{totals.completed}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">AI layer</p>
                <p className="font-medium text-sm">{recommendation?.ai.summary || 'AI-ranked resource order.'}</p>
                <p className="text-xs text-muted-foreground mt-2">Provider: {recommendation?.ai.provider || 'local'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Completion</p>
                <p className="font-medium text-sm">{totals.completed} of {totals.visible} visible resources completed</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Focused days</p>
                <p className="font-medium text-sm">{totals.completedDays} fully completed day blocks</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Scale</p>
                <p className="font-medium text-sm">Supports 200+ roadmap categories and 5000+ topic slots through generation.</p>
              </div>
            </div>

            {nextResource ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Continue learning</p>
                  <h3 className="text-lg font-semibold mt-1">Resume with {nextResource.title}</h3>
                  <p className="text-sm text-muted-foreground">Next up: {nextResource.topic} via {nextResource.provider}</p>
                </div>
                <GlowButton variant="primary" onClick={() => window.open(nextResource.url, '_blank', 'noreferrer')}>
                  Continue learning
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </GlowButton>
              </div>
            ) : null}
          </GlassCard>
        ) : null}

        <SectionHeader title="Day-wise Resource Cards" subtitle="Track videos, docs, practice, articles, mini-projects, and certifications day by day." />

        {loadingRoadmaps || loadingResources ? (
          <GlassCard className="text-center py-16">
            <RefreshCw className="w-10 h-10 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading learning resources...</p>
          </GlassCard>
        ) : filteredDays.length ? (
          <div className="space-y-6">
            {filteredDays.map((day: LearningResourceDayGroup, index) => (
              <motion.div
                key={day.dayNumber}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
              >
                <GlassCard hover glow glowColor={index % 2 === 0 ? 'primary' : 'secondary'} className="space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Day {day.dayNumber}</p>
                      <h3 className="text-2xl font-semibold mt-2">{day.focus}</h3>
                      <p className="text-muted-foreground mt-1">{day.completedCount} of {day.totalCount} resources completed</p>
                    </div>
                    <div className="w-full lg:max-w-xs">
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${day.progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-right">{day.progress}% complete</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {day.resources.map((resource) => {
                      const completed = completedResourceIds.has(resource.id);
                      const isSaving = Boolean(savingIds[resource.id]);

                      return (
                        <div key={resource.id} className={`rounded-2xl border p-4 transition-all ${completed ? 'border-secondary/40 bg-secondary/10' : 'border-white/10 bg-background/30'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{formatResourceType(resource.resourceType)}</p>
                              <h4 className="mt-2 text-lg font-semibold">{resource.title}</h4>
                            </div>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                              <input
                                type="checkbox"
                                checked={completed}
                                onChange={(event) => void toggleCompletion(resource, event.target.checked)}
                                disabled={isSaving}
                                className="h-4 w-4 rounded border-white/20 bg-transparent"
                              />
                              {completed ? 'Completed' : 'Mark done'}
                            </label>
                          </div>

                          <p className="mt-3 text-sm text-muted-foreground">{resource.description}</p>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs text-muted-foreground mb-1">Provider</p>
                              <p className="font-medium">{resource.provider}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs text-muted-foreground mb-1">Time</p>
                              <p className="font-medium flex items-center gap-2"><TimerReset className="w-4 h-4 text-secondary" />{resource.estimatedMinutes || 0} mins</p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">{resource.difficulty}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">{resource.skill}</span>
                            {resource.isOfficial ? (
                              <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs text-secondary">Official</span>
                            ) : null}
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-2"
                            >
                              Open resource
                              <ArrowRight className="w-4 h-4" />
                            </a>
                            {completed ? <CheckCircle2 className="w-5 h-5 text-secondary" /> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassCard className="text-center py-16 space-y-4">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">No learning resources found</h3>
            <p className="text-muted-foreground">Try a different roadmap, search term, or resource type.</p>
            <GlowButton variant="primary" onClick={() => {
              setQuery('');
              setFilterType('all');
            }}>
              Reset filters
            </GlowButton>
          </GlassCard>
        )}
      </div>
    </div>
  );
}