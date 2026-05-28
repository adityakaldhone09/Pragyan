import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { JourneyHeader, DayTimeline, SkillRadar, AIInsightsCard, EligibleJobsCard, PlacementReadinessWidget, JourneySectionSummary } from "../components/journey/JourneySections";
import { SectionHeader } from "../components/SectionHeader";
import { journeyService } from "../../services/journeyService";
import { mentorService } from "../../services/mentorService";
import type { JourneyDashboardSnapshot, JourneyPayload, MentorMessage } from "@/types/api";

export function Journey() {
  const { careerSlug } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<JourneyPayload | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [mentorPrompt, setMentorPrompt] = useState("");
  const [mentorReply, setMentorReply] = useState("");
  const [mentorMessages, setMentorMessages] = useState<MentorMessage[]>([]);
  const [mentorConversationId, setMentorConversationId] = useState<string | null>(null);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadJourney() {
      setPageLoading(true);
      try {
        if (careerSlug) {
          const response = await journeyService.getJourney(careerSlug);
          if (!mounted) return;
          const payload = response as JourneyPayload;
          setJourney(payload);
          setSelectedDay(payload.currentDay || 1);
          if (payload.resolvedCareerSlug && payload.resolvedCareerSlug !== careerSlug) {
            navigate(`/journey/${payload.resolvedCareerSlug}`, { replace: true });
          }
        } else {
          const dashboard = (await journeyService.getDashboardJourney()) as JourneyDashboardSnapshot;
          if (!mounted) return;
          if (dashboard.currentJourney?.resolvedCareerSlug) {
            navigate(`/journey/${dashboard.currentJourney.resolvedCareerSlug}`, { replace: true });
            return;
          }
          setJourney(dashboard.currentJourney);
          setSelectedDay(dashboard.currentJourney?.currentDay || 1);
        }
      } catch {
        if (mounted) {
          setJourney(null);
        }
      } finally {
        if (mounted) {
          setPageLoading(false);
        }
      }
    }

    void loadJourney();

    return () => {
      mounted = false;
    };
  }, [careerSlug, navigate]);

  const selectedLearningDay = useMemo(
    () => journey?.roadmapDays.find((day) => day.dayNumber === selectedDay) || journey?.roadmapDays[0] || null,
    [journey, selectedDay]
  );

  useEffect(() => {
    let mounted = true;

    async function loadMentorConversation() {
      if (!journey) {
        setMentorMessages([]);
        setMentorConversationId(null);
        setMentorReply("");
        return;
      }

      try {
        const conversation = await mentorService.startConversation({
          journeyId: journey.roadmapId || undefined,
          title: `${journey.careerTitle} Mentor`,
          context: {
            career: journey.careerTitle,
            roadmap: journey.roadmapTitle,
            currentDay: journey.mentorContext.currentDay,
            weakSkills: journey.weakSkills,
            completedSkills: journey.completedSkills,
            adaptiveMode: journey.adaptiveMode,
            currentGoal: selectedLearningDay?.focus || journey.currentPlan.todayGoal,
            placementReadiness: journey.placementReadiness.score,
            learningStyle: journey.mentorContext.learningLevel,
          },
        });

        if (!mounted) return;
        setMentorConversationId(conversation.conversationId);
        setMentorMessages(conversation.messages);
        setMentorReply(conversation.messages.filter((message) => message.role === 'assistant').slice(-1)[0]?.content || "");
      } catch {
        if (mounted) {
          setMentorMessages([]);
          setMentorConversationId(null);
          setMentorReply("");
        }
      }
    }

    void loadMentorConversation();

    return () => {
      mounted = false;
    };
  }, [journey, selectedLearningDay]);

  async function handleAskMentor(prompt: string) {
    if (!journey || !prompt.trim()) {
      return;
    }

    setMentorLoading(true);
    try {
      const context = {
        career: journey.careerTitle,
        roadmap: journey.roadmapTitle,
        currentDay: journey.mentorContext.currentDay,
        weakSkills: journey.weakSkills,
        completedSkills: journey.completedSkills,
        adaptiveMode: journey.adaptiveMode,
        currentGoal: selectedLearningDay?.focus || journey.currentPlan.todayGoal,
        placementReadiness: journey.placementReadiness.score,
        learningStyle: journey.mentorContext.learningLevel,
      };

      const response = await mentorService.chat({
        conversationId: mentorConversationId || undefined,
        journeyId: journey.roadmapId || undefined,
        message: prompt,
        context,
      });

      setMentorReply(response.reply);
      setMentorConversationId(response.conversationId);
      setMentorMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-user`,
          role: 'user',
          content: prompt,
          createdAt: new Date().toISOString(),
          contextSnapshot: context,
        },
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: response.reply,
          createdAt: new Date().toISOString(),
          contextSnapshot: context,
        },
      ]);
    } catch (error) {
      setMentorReply(error instanceof Error ? error.message : "Mentor request failed");
    } finally {
      setMentorLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-muted-foreground bg-background">
        Loading your career journey...
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen relative pt-24 pb-16">
        <NeuralBackground />
        <FloatingParticles count={18} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <GlassCard glow glowColor="primary">
            <SectionHeader title="Career Journey unavailable" subtitle="Complete an assessment or refresh your recommendations to generate a journey." />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/assessment">
                <button className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground">Start Assessment</button>
              </Link>
              <Link to="/dashboard">
                <button className="rounded-lg border border-white/10 px-5 py-3 font-medium text-foreground">Go to Dashboard</button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />
      <FloatingParticles count={24} />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <JourneyHeader journey={journey} />
        </motion.div>

        <JourneySectionSummary journey={journey} />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] items-start">
          <DayTimeline days={journey.roadmapDays} currentDay={journey.currentDay} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          <div className="grid gap-6">
            <PlacementReadinessWidget readiness={journey.placementReadiness} nextAction={journey.nextAction} />
            <GlassCard glow glowColor="accent">
              <SectionHeader title="Adaptive Learning" subtitle="Recovery, growth, or stretch mode based on your streak and pace" className="mb-4" />
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{journey.adaptiveReason}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{journey.adaptiveMode.toUpperCase()}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">{journey.currentPlan.estimatedMinutes} min today</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">{journey.currentPlan.xpReward} XP today</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today&apos;s goal</p>
                  <p className="mt-2 text-foreground">{journey.currentPlan.todayGoal}</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        <SkillRadar skills={journey.skillProgress} />

        <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr] items-start">
          <AIInsightsCard
            journey={journey}
            messages={mentorMessages}
            response={mentorReply}
            loading={mentorLoading}
            prompt={mentorPrompt}
            onPromptChange={setMentorPrompt}
            onSend={handleAskMentor}
          />
          <EligibleJobsCard jobs={journey.eligibleJobs} />
        </div>

        <GlassCard>
          <SectionHeader title="Current Day Snapshot" subtitle="The exact tasks the user should focus on next" className="mb-4" />
          {selectedLearningDay ? (
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] items-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-muted-foreground">{selectedLearningDay.focus}</p>
                <h3 className="mt-2 text-2xl font-semibold">{selectedLearningDay.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{selectedLearningDay.topics.join(' · ')}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedLearningDay.tasks.map((task) => (
                    <span key={task.id} className="rounded-full border border-white/10 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                      {task.title}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                {selectedLearningDay.resources.length ? selectedLearningDay.resources.map((resource) => (
                  <div key={`${resource.title}-${resource.url || resource.provider || 'resource'}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">{resource.provider || resource.type || 'Learning resource'}</p>
                    {resource.url ? (
                      <a href={resource.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary">
                        Open resource
                      </a>
                    ) : null}
                  </div>
                )) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                    Resource links will appear here once the roadmap catalog is expanded for this journey.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}
