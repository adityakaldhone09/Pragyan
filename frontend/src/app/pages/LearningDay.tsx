import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, CheckCircle2, Rocket, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { learningService } from "../../services/learningService";
import { generateQuiz, evaluateQuiz } from "../../services/quizService";
import type { DailyLearningSnapshot, QuizGenerationResponse, QuizResponseChoice, QuizEvaluationResponse } from "@/types/api";

export function LearningDay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<DailyLearningSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quiz, setQuiz] = useState<QuizGenerationResponse | null>(null);
  const [responses, setResponses] = useState<string[]>([]);
  const [result, setResult] = useState<QuizEvaluationResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDay() {
      if (!id) return;
      try {
        const data = await learningService.getDay(id);
        if (!mounted) return;
        setSnapshot(data);
        setResponses([]);
        setQuiz(null);
        setResult(null);
      } catch (error) {
        if (mounted) {
          toast.error(error instanceof Error ? error.message : "Unable to load learning day");
          navigate("/learning", { replace: true });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDay();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const currentDay = snapshot?.today || null;
  const canStartQuiz = Boolean(currentDay?.completed);

  const questionCards = useMemo(() => quiz?.questions || [], [quiz]);

  const refreshDay = async () => {
    if (!id) return;
    const data = await learningService.getDay(id);
    setSnapshot(data);
  };

  const completeTask = async () => {
    if (!snapshot) return;
    setSavingTask(true);
    try {
      await learningService.complete({ roadmapId: snapshot.roadmapId, dayNumber: snapshot.today.dayNumber });
      await refreshDay();
      toast.success("Task completed. Quiz unlocked and XP awarded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to mark the task complete");
    } finally {
      setSavingTask(false);
    }
  };

  const startQuiz = async () => {
    if (!snapshot) return;
    setStartingQuiz(true);
    setResult(null);
    try {
      const generated = await generateQuiz({
        roadmapId: snapshot.roadmapId,
        dayNumber: snapshot.today.dayNumber,
        topic: snapshot.today.topic,
      });
      setQuiz(generated);
      setResponses(Array.from({ length: generated.questions.length }, () => ""));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start the quiz");
    } finally {
      setStartingQuiz(false);
    }
  };

  const submitQuizFlow = async () => {
    if (!snapshot || !quiz) return;
    setSubmittingQuiz(true);
    try {
      const payload: QuizResponseChoice[] = quiz.questions.map((question, index) => ({
        questionId: question.id,
        question: question.question,
        selectedAnswer: responses[index] || "",
        options: question.options,
      }));

      const evaluated = await evaluateQuiz({
        roadmapId: snapshot.roadmapId,
        dayNumber: snapshot.today.dayNumber,
        topic: snapshot.today.topic,
        questions: quiz.questions,
        responses: payload,
      });

      setResult(evaluated);
      toast.success(`Quiz scored ${evaluated.percentage}%`);
      await refreshDay();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-muted-foreground bg-background">
        Loading today's learning day...
      </div>
    );
  }

  if (!snapshot || !currentDay) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background px-6 py-10">
        <NeuralBackground />
        <FloatingParticles count={12} />
        <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <GlassCard glow glowColor="primary" className="w-full text-center">
            <SectionHeader title="Learning day not found" subtitle="Return to your learning dashboard and select an active day." />
            <div className="mt-6">
              <Link to="/learning">
                <GlowButton variant="primary">Back to learning</GlowButton>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-8">
      <NeuralBackground />
      <FloatingParticles count={14} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/learning" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to learning
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-2 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4" />
            Day {currentDay.dayNumber}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard glow glowColor="primary" className="overflow-hidden">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <SectionHeader
                  title={currentDay.topic}
                  subtitle={`${snapshot.roadmapTitle} - ${snapshot.careerTitle}`}
                />
                <p className="mt-4 text-sm text-muted-foreground">{currentDay.overview}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="XP" value={`${currentDay.xpReward}`} icon={<Zap className="h-4 w-4 text-cyan-200" />} />
                <StatCard label="Quiz" value={currentDay.quizUnlocked ? "Unlocked" : "Locked"} icon={<Target className="h-4 w-4 text-cyan-200" />} />
                <StatCard label="Task" value={currentDay.completed ? "Done" : "Open"} icon={<CheckCircle2 className="h-4 w-4 text-cyan-200" />} />
                <StatCard label="Streak" value={`${snapshot.streak}`} icon={<Trophy className="h-4 w-4 text-amber-300" />} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Topic overview</p>
                <h2 className="text-2xl font-semibold text-foreground">What you are learning today</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
                {currentDay.streakReward} streak reward
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">{currentDay.task}</p>

            <div className="flex flex-wrap gap-3">
              <GlowButton variant="primary" onClick={completeTask} loading={savingTask} disabled={currentDay.completed}>
                {currentDay.completed ? "Task completed" : "Complete Task"}
              </GlowButton>
              <GlowButton variant="secondary" onClick={startQuiz} loading={startingQuiz} disabled={!canStartQuiz || !currentDay.quizUnlocked}>
                Start Quiz
              </GlowButton>
              <Link to="/resume-builder">
                <GlowButton variant="accent">Generate Resume</GlowButton>
              </Link>
            </div>

            <div className="space-y-3">
              {currentDay.resources.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-primary/30 hover:bg-primary/10"
                >
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <Rocket className="h-4 w-4 text-cyan-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">{resource.provider} - {resource.estimatedMinutes} min</p>
                    <p className="mt-1 text-xs text-muted-foreground">{resource.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Quiz</p>
                <h2 className="text-2xl font-semibold text-foreground">AI generated daily quiz</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
                {quiz ? `${quiz.questions.length} questions` : "Ready when you are"}
              </div>
            </div>

            {!quiz ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Complete the learning task, then start the quiz to check your retention and get AI feedback.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questionCards.map((question, index) => (
                  <div key={question.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{question.question}</p>
                        <div className="mt-3 grid gap-2">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={`${question.id}-${optionIndex}`}
                              className={[
                                "flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition-colors",
                                responses[index] === option
                                  ? "border-primary/30 bg-primary/10 text-foreground"
                                  : "border-white/10 bg-background/40 text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-foreground",
                              ].join(" ")}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                checked={responses[index] === option}
                                onChange={() =>
                                  setResponses((current) => {
                                    const next = [...current];
                                    next[index] = option;
                                    return next;
                                  })
                                }
                              />
                              <span className="min-w-0 flex-1">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <GlowButton variant="primary" onClick={submitQuizFlow} loading={submittingQuiz} className="w-full">
                  Submit Quiz
                </GlowButton>
              </div>
            )}

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="rounded-3xl border border-secondary/20 bg-secondary/10 p-5"
                >
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Quiz result</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{result.percentage}%</p>
                  <p className="mt-2 text-sm text-muted-foreground">{result.improvementSuggestion}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.weakTopics.map((topic) => (
                      <span key={topic} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                        {topic}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: import("react").ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
