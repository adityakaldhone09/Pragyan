import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PHASE4_RESULT_STORAGE_KEY, saveLastAccessedPhase } from "@/utils/assessmentProgress";
import { ApiError } from "@/services/apiClient";
import {
  assessmentService,
  type Phase4Question,
} from "@/services/assessmentService";
import {
  Code2, CheckCircle2, ArrowRight, AlertCircle, Zap,
  Sparkles, Brain, Target, TrendingUp, BookOpen,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "loading" | "quiz" | "submitting" | "results";

const TOTAL_PHASES = 7;
const MIN_QUESTIONS = 6;

const QUESTION_TYPE_COLORS: Record<Phase4Question["questionType"], string> = {
  MCQ: "bg-blue-100 text-blue-700",
  Scenario: "bg-purple-100 text-purple-700",
  Conceptual: "bg-green-100 text-green-700",
  Practical: "bg-amber-100 text-amber-700",
  Experience: "bg-pink-100 text-pink-700",
};

const DIFFICULTY_COLORS: Record<Phase4Question["difficulty"], string> = {
  Foundation: "bg-green-100 text-green-700 border-green-200",
  Intermediate: "bg-blue-100 text-blue-700 border-blue-200",
  Advanced: "bg-orange-100 text-orange-700 border-orange-200",
  Expert: "bg-red-100 text-red-700 border-red-200",
};

interface ResultsSummary {
  resultId: string;
  sessionId: string;
  confidence: number;
  summary: {
    domainReadiness: Record<string, number>;
    technicalStrengths: string[];
    technicalWeaknesses: string[];
    knowledgeGaps: string[];
    skillScores: Record<string, number>;
  };
}

// ── Helper Components ─────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 my-4 overflow-x-auto">
      <pre className="text-sm text-slate-100 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function QuestionTypeBadge({ type }: { type: Phase4Question["questionType"] }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${QUESTION_TYPE_COLORS[type]}`}>
      {type}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Phase4Question["difficulty"] }) {
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${DIFFICULTY_COLORS[difficulty]}`}>
      {difficulty}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AssessmentPhase4() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, reloadUser } = useAuth();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Phase4Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [progress, setProgress] = useState({ answered: 0, totalRelevant: MIN_QUESTIONS });
  const [result, setResult] = useState<ResultsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasoningToast, setReasoningToast] = useState<string | null>(null);

  // ── Start Phase 4 ─────────────────────────────────────────────────────────
  useEffect(() => {
    saveLastAccessedPhase(4);
    
    assessmentService.startPhase4()
      .then((data) => {
        setSessionId(data.sessionId);
        setCurrentQuestion(data.question);
        setConfidence(data.confidence ?? 0);
        if (data.progress) setProgress(data.progress);
        setPhase("quiz");
        setError(null);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to start technical assessment";
        const status = err instanceof ApiError ? err.status : undefined;

        if (status === 400 || message.includes("Phase 2") || message.includes("domains")) {
          toast({ 
            title: "Complete Phase 2 first", 
            description: "Please finish the earlier assessment phases before starting the technical assessment.", 
            variant: "destructive" 
          });
          navigate("/assessment/phase-2");
        } else {
          setError(message);
          setPhase("quiz");
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit Phase 4 ────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: (sid: string) => assessmentService.submitPhase4Assessment(sid),
    onSuccess: async (data) => {
      setError(null);
      try {
        localStorage.setItem(PHASE4_RESULT_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem("pragyan_assessment_phase", "4");
      } catch { /* ignore */ }
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ["assessment"] });

      if (data.nextPhaseRoute) {
        setResult(data);
        setPhase("submitting");
        setTimeout(() => navigate(data.nextPhaseRoute!), 600);
        return;
      }

      setResult(data);
      setPhase("results");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to submit assessment");
      setPhase("quiz");
    },
  });

  // ── Answer Question ───────────────────────────────────────────────────────
  const answerMutation = useMutation({
    mutationFn: ({ qid, answer }: { qid: string; answer: string }) =>
      assessmentService.answerPhase4Question(sessionId!, qid, answer),
    onSuccess: (data) => {
      setConfidence(data.confidence ?? 0);
      if (data.progress) setProgress(data.progress);
      if (data.reasoningToast) setReasoningToast(data.reasoningToast);
      setError(null);

      setTimeout(() => setReasoningToast(null), 4000);

      if (data.shouldSubmit || !data.nextQuestion) {
        setPhase("submitting");
        submitMutation.mutate(sessionId!);
      } else {
        setCurrentQuestion(data.nextQuestion!);
        setSelectedAnswer(null);
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to record answer");
    },
  });

  const handleAnswer = () => {
    if (!sessionId || !currentQuestion || !selectedAnswer) return;
    answerMutation.mutate({ qid: currentQuestion.questionId, answer: selectedAnswer });
  };

  const isBusy = answerMutation.isPending || submitMutation.isPending || phase === "submitting";
  const confidencePct = Math.round((confidence ?? 0) * 100);
  const progressPct = progress.totalRelevant > 0
    ? Math.round((progress.answered / progress.totalRelevant) * 100)
    : 0;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="max-w-3xl mx-auto pb-12 py-24 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Code2 className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Loading Technical Assessment…</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Preparing domain-specific questions based on your interests and cognitive profile.
        </p>
        <Progress value={30} className="w-64 h-2 animate-pulse" />
      </div>
    );
  }

  // ── Submitting ────────────────────────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div className="max-w-3xl mx-auto pb-12 py-24 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Analyzing Technical Competency…</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Identifying strengths, weaknesses, and knowledge gaps across your selected domains.
        </p>
        <Progress value={100} className="w-64 h-2 animate-pulse" />
      </div>
    );
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    return (
      <div className="max-w-4xl mx-auto pb-16 px-4">
        {/* Phase indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 4 of {TOTAL_PHASES} — Technical Assessment
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Confidence:</span>
                <span className={`font-bold ${
                  confidencePct >= 80 ? "text-green-600" :
                  confidencePct >= 60 ? "text-blue-600" :
                  confidencePct >= 40 ? "text-amber-600" : "text-orange-600"
                }`}>{confidencePct}%</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="text-xs text-muted-foreground">
                {progress.answered} / ~{progress.totalRelevant}
              </div>
            </div>
          </div>
          <Progress value={progressPct} className="h-2 mb-1" />
          <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/40 to-primary transition-[width] duration-500"
                style={{ width: `${confidencePct}%` }}
              />
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Code2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Technical Assessment</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Domain-specific questions that adapt to your technical level
          </p>
        </div>

        {/* Reasoning toast */}
        {reasoningToast && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">{reasoningToast}</p>
          </div>
        )}

        {/* Error */}
        {(error || !currentQuestion) && (
          <div className="bg-card border border-border rounded-[20px] p-8 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              {error || "Unable to load questions"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              This may happen if Phase 2 wasn't completed or there was a technical issue.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="rounded-xl" onClick={() => navigate("/assessment/phase-2")}>
                Go to Phase 2
              </Button>
              <Button className="rounded-xl" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Question card */}
        {currentQuestion && !error && (
          <div className="bg-card border border-border rounded-[20px] shadow-sm overflow-hidden">
            {/* Header bar */}
            <div className="px-6 pt-5 pb-3 bg-slate-50 border-b border-border">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {progress.answered + 1}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <QuestionTypeBadge type={currentQuestion.questionType} />
                  <DifficultyBadge difficulty={currentQuestion.difficulty} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    {currentQuestion.domain}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentQuestion.topic}
                  </span>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="px-6 py-6">
              <p className="text-lg font-semibold text-foreground leading-relaxed mb-6">
                {currentQuestion.questionText}
              </p>

              {/* Code snippet */}
              {currentQuestion.codeSnippet && (
                <CodeBlock code={currentQuestion.codeSnippet} />
              )}

              {/* Options */}
              <div className="space-y-3 mt-6">
                {currentQuestion.options.map((opt) => {
                  const active = selectedAnswer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => !isBusy && setSelectedAnswer(opt)}
                      disabled={isBusy}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm transition-all flex items-start gap-3 ${
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        active ? "border-primary bg-primary" : "border-muted-foreground/40"
                      }`}>
                        {active && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action */}
            <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-border">
              <Button
                className="w-full rounded-xl py-3 text-base font-medium"
                onClick={handleAnswer}
                disabled={!selectedAnswer || isBusy}
              >
                {answerMutation.isPending ? (
                  <>Processing Answer…</>
                ) : (
                  <>
                    Submit Answer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    const domainEntries = Object.entries(result.summary.domainReadiness);
    const topDomain = domainEntries.length > 0
      ? domainEntries.reduce((a, b) => (b[1] > a[1] ? b : a))
      : null;

    return (
      <div className="max-w-4xl mx-auto pb-12 px-4">
        {/* Phase indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 4 of {TOTAL_PHASES} — Complete
            </span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-8">
          Technical Assessment Results
        </h1>

        {/* Completion banner */}
        <div className="bg-gradient-to-br from-primary/5 to-blue-50 border-2 border-primary/20 rounded-[20px] p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Phase 4 Complete!</h2>
          <p className="text-muted-foreground mb-1">
            Technical Confidence:{" "}
            <span className="font-bold text-primary text-lg">{confidencePct}%</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {progress.answered} technical questions completed across {domainEntries.length} domains
          </p>
        </div>

        {/* Domain Readiness */}
        {domainEntries.length > 0 && (
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Domain Readiness
            </h3>
            <div className="space-y-4">
              {domainEntries.map(([domain, score]) => (
                <div key={domain}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{domain}</span>
                    <span className={`text-sm font-bold ${
                      score >= 80 ? "text-green-600" :
                      score >= 60 ? "text-blue-600" :
                      score >= 40 ? "text-amber-600" : "text-orange-600"
                    }`}>{score}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        score >= 80 ? "bg-green-500" :
                        score >= 60 ? "bg-blue-500" :
                        score >= 40 ? "bg-amber-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths + Weaknesses */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {result.summary.technicalStrengths.length > 0 && (
            <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                Technical Strengths
              </h3>
              <ul className="space-y-2">
                {result.summary.technicalStrengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.summary.technicalWeaknesses.length > 0 && (
            <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-600" />
                Growth Areas
              </h3>
              <ul className="space-y-2">
                {result.summary.technicalWeaknesses.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Knowledge Gaps */}
        {result.summary.knowledgeGaps.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              Focus Areas for Phase 5
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              These concepts will be covered in specialized training:
            </p>
            <div className="flex flex-wrap gap-2">
              {result.summary.knowledgeGaps.map((gap) => (
                <span key={gap} className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-medium rounded-lg">
                  {gap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 rounded-xl py-3"
            onClick={() => window.location.reload()}>
            Retake Assessment
          </Button>
          <Button className="flex-1 rounded-xl py-3" onClick={() => navigate("/assessment/phase-5")}>
            Continue to Phase 5
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
