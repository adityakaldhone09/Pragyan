import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Brain, Check, ChevronLeft, Sparkles } from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { AIThinkingLoader } from "../components/AIThinkingLoader";
import { AnimatedProgress } from "../components/AnimatedProgress";
import { assessmentService } from "../../services/assessmentService";
import type { AssessmentQuestion } from "../../types/api";

export function Assessment() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionHistory, setQuestionHistory] = useState<AssessmentQuestion[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [progress, setProgress] = useState({ answered: 0, totalRelevant: 6 });
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startAdaptiveAssessment() {
      try {
        setIsLoading(true);
        setError(null);
        setSubmissionError(null);
        const started = await assessmentService.startAssessment();
        if (mounted) {
          setSessionId(started.sessionId);
          setCurrentQuestion(started.question);
          setQuestionHistory([started.question]);
          setConfidence(Math.round((started.confidence || 0) * 100));
          setProgress(started.progress || { answered: 0, totalRelevant: 6 });
        }
      } catch {
        if (mounted) {
          setError("Unable to load assessment right now. Please try again.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void startAdaptiveAssessment();
    return () => {
      mounted = false;
    };
  }, []);

  const currentProgress =
    progress.totalRelevant > 0 ? Math.min(100, Math.round((progress.answered / progress.totalRelevant) * 100)) : 0;

  async function handleNext() {
    if (!sessionId || !currentQuestion || !selectedAnswer) {
      return;
    }

    setIsThinking(true);
    setSubmissionError(null);

    try {
      const response = await assessmentService.answerAssessment({
        sessionId,
        questionId: currentQuestion.id,
        answer: selectedAnswer,
      });

      const nextAnswers = { ...answers, [currentQuestion.id]: selectedAnswer };
      setAnswers(nextAnswers);

      setConfidence(Math.round((response.confidence || 0) * 100));
      if (response.progress) {
        setProgress(response.progress);
      }

      if (response.shouldSubmit || !response.nextQuestion) {
        const submitted = await assessmentService.submitAdaptiveAssessment(sessionId);
        setResultId(submitted.resultId);

        const summary = submitted.summary;
        const topMatch = summary?.topMatch || submitted.topMatches?.[0] || null;

        const llmRecommendation = await assessmentService.getLLMCareerRecommendation({
          interests: summary?.suggestedCareers || submitted.topMatches?.map((match) => match.career) || [],
          strengths: summary?.strengths || [],
          weaknesses: summary?.weaknesses || [],
          skills: topMatch?.skillGaps || [],
          quizScore: submitted.confidence || summary?.confidence || confidence || 70,
          learningHours: 2,
        });

        navigate('/results', {
          state: {
            adaptiveResult: submitted,
            llmRecommendation,
          },
        });

        return;
      }
      setCurrentQuestion(response.nextQuestion);
      setQuestionHistory((history) => [...history, response.nextQuestion as AssessmentQuestion]);
      setSelectedAnswer(null);
    } catch {
      setSubmissionError('Unable to save this answer right now. Please retry.');
    } finally {
      setIsThinking(false);
    }
  }

  function handlePrevious() {
    if (questionHistory.length <= 1) {
      return;
    }

    const previous = questionHistory[questionHistory.length - 2];
    setQuestionHistory((history) => history.slice(0, -1));
    setCurrentQuestion(previous);
    setSelectedAnswer(answers[previous.id] || null);
  }

  async function retryLoadQuestions() {
    setIsLoading(true);
    setError(null);
    try {
      const started = await assessmentService.startAssessment();
      setSessionId(started.sessionId);
      setCurrentQuestion(started.question);
      setQuestionHistory([started.question]);
      setSelectedAnswer(null);
      setAnswers({});
      setConfidence(Math.round((started.confidence || 0) * 100));
      setProgress(started.progress || { answered: 0, totalRelevant: 6 });
      setResultId(null);
    } catch {
      setError("Unable to load assessment right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12 pt-32">
        <NeuralBackground />
        <FloatingParticles count={25} />
        <div className="relative z-10 max-w-md w-full">
          <GlassCard glow glowColor="primary" className="py-16">
            <AIThinkingLoader message="Loading adaptive assessment..." size="lg" />
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12 pt-32">
        <NeuralBackground />
        <FloatingParticles count={25} />
        <div className="relative z-10 max-w-xl w-full">
          <GlassCard glow glowColor="primary" className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Assessment unavailable</h1>
            <p className="text-muted-foreground">{error}</p>
            <GlowButton variant="primary" onClick={() => void retryLoadQuestions()}>
              Retry loading
            </GlowButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12 pt-32">
      <NeuralBackground />
      <FloatingParticles count={25} />

      <div className="max-w-4xl mx-auto w-full z-10 space-y-6">
        <motion.div className="text-center space-y-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">{currentQuestion.category || 'Adaptive Assessment'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            AI Career Assessment Engine
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dynamic questioning is active. Only relevant branches are being explored in real time.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <GlassCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assessment Progress</span>
                <span className="font-medium">
                  {progress.answered} / {progress.totalRelevant}
                </span>
              </div>
              <AnimatedProgress value={currentProgress} max={100} showLabel={false} />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
                  <p className="text-muted-foreground">Session Confidence</p>
                  <p className="text-xl font-semibold text-primary">{confidence}%</p>
                </div>
                <div className="rounded-lg border border-accent/20 bg-accent/10 px-3 py-2">
                  <p className="text-muted-foreground">Session ID</p>
                  <p className="truncate text-xs font-semibold text-accent">{sessionId || '-'}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <AnimatePresence mode="wait">
          {isThinking ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <GlassCard glow glowColor="primary" className="py-16">
                <AIThinkingLoader message="Analyzing answer confidence and selecting the next question..." size="lg" />
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35 }}
            >
              <GlassCard glow glowColor="accent" className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl" />

                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-accent mb-3">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-medium">Adaptive Decision Question</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold">{currentQuestion.question}</h2>
                    {currentQuestion.type && <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">{currentQuestion.type}</p>}
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = selectedAnswer === option;
                      return (
                        <motion.button type="button"
                          key={option}
                          onClick={() => setSelectedAnswer(option)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 bg-card/30 hover:bg-card/50"
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.985 }}
                        >
                          <div className="relative flex items-center justify-between gap-4">
                            <span className="font-medium leading-relaxed">{option}</span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {submissionError && (
                    <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      <p>{submissionError}</p>
                      <GlowButton variant="secondary" onClick={() => void handleNext()}>
                        Retry save
                      </GlowButton>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 gap-4">
                    <button type="button"
                      onClick={() => handlePrevious()}
                      disabled={questionHistory.length <= 1}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <GlowButton variant="primary" onClick={() => void handleNext()} disabled={!selectedAnswer}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </GlowButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Adaptive confidence updates after every answer. Latest result: {resultId || 'pending'}
        </motion.p>
      </div>
    </div>
  );
}
