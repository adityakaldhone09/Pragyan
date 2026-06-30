import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { assessmentService } from "@/services/assessmentService";
import { useAuth } from "@/hooks/useAuth";
import type { AssessmentResult } from "@/types/api";
import {
  CheckCircle2, ArrowRight, Brain, Lightbulb, Target, FileSearch
} from "lucide-react";

type Phase = "landing" | "quiz" | "results";

export default function Assessments() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("landing");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["assessment", "questions"],
    queryFn: assessmentService.getQuestions,
    retry: false,
  });

  const submitMutation = useMutation<AssessmentResult, Error, Record<string, string>>({
    mutationFn: (payload) => assessmentService.submitAssessment(payload),
    onSuccess: (data) => {
      setResult(data);
      setSubmissionError(null);
      setPhase("results");
    },
    onError: (error) => {
      setSubmissionError(error.message || "Unable to submit assessment. Please try again.");
    },
  });

  const handleNext = () => {
    if (selected && questions[currentQ]) {
      const questionId = questions[currentQ].id || String(currentQ);
      const nextAnswers = { ...answers, [questionId]: selected };
      setAnswers(nextAnswers);
      setSelected(null);
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        submitMutation.mutate(nextAnswers);
      }
    }
  };

  const currentQuestion = questions[currentQ];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto pb-12 text-center py-12">
        <p className="text-muted-foreground">Loading assessment...</p>
      </div>
    );
  }

  if (phase === "landing") {
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Assessments</h1>
          <p className="text-muted-foreground mt-1">Discover your strengths, skills, and career fit through AI-powered assessments.</p>
        </div>

        <div className="mt-8 bg-card border border-border rounded-[20px] p-10 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1 max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium mb-6">
                <Brain className="w-3 h-3" /> AI-Powered Assessment
              </span>
              <h2 className="text-2xl font-bold text-foreground mb-3">Find the right career path for you</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                Our assessment analyzes your skills, interests, and personality to suggest the best career options for you.
              </p>
              <Button
                className="rounded-xl px-8 py-3 text-base font-medium"
                onClick={() => setPhase("quiz")}
                data-testid="button-start-assessment"
              >
                Start Assessment <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="w-56 h-56 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-100 flex items-center justify-center">
              <Brain className="w-24 h-24 text-primary/60" />
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-bold text-foreground mb-6">How it works?</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: FileSearch, label: "Answer Questions", desc: "Answer a series of questions about your skills, interests, and preferences." },
              { icon: Brain, label: "AI Analysis", desc: "Our AI analyzes your responses and compares them with industry data." },
              { icon: Lightbulb, label: "Get Insights", desc: "Receive detailed insights about your strengths, skills, and career fit." },
              { icon: Target, label: "Career Match", desc: "Get personalized career recommendations that suit you best." },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-sm text-foreground mb-2">{label}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    if (!currentQuestion) {
      return (
        <div className="max-w-3xl mx-auto pb-12 text-center py-12">
          <p className="text-muted-foreground">No questions available</p>
        </div>
      );
    }

    const progress = ((currentQ) / questions.length) * 100;
    const currentAnswer = selected ?? answers[currentQuestion.id || String(currentQ)];

    return (
      <div className="max-w-3xl mx-auto pb-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Assessments</h1>
        </div>

        <div className="mt-6 bg-card border border-border rounded-[20px] p-1 shadow-sm">
          <div className="px-6 pt-5 pb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Question {currentQ + 1} of {questions.length}</span>
          </div>
          <div className="px-6 pb-5">
            <Progress value={progress} className="h-1.5" />
          </div>

          <div className="px-6 py-6 border-t border-border">
            <p className="text-lg font-semibold text-foreground mb-6 leading-snug">{currentQuestion.question}</p>

            <div className="space-y-3">
              {(currentQuestion.options || []).map((opt: string) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSelected(opt);
                    const questionId = currentQuestion.id || String(currentQ);
                    setAnswers((prev) => ({ ...prev, [questionId]: opt }));
                  }}
                  data-testid={`option-${opt.toLowerCase().replace(/\s/g, "-")}`}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3 ${
                    currentAnswer === opt
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-white text-foreground hover:border-primary/40"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    currentAnswer === opt ? "border-primary" : "border-muted-foreground/40"
                  }`}>
                    {currentAnswer === opt && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {submissionError ? (
            <div className="px-6 pb-4 text-sm text-red-600">{submissionError}</div>
          ) : null}

          <div className="px-6 pb-6">
            <Button
              className="w-full rounded-xl py-3 text-base font-medium"
              onClick={handleNext}
              disabled={!selected || submitMutation.isLoading}
              data-testid="button-next-question"
            >
              {(submitMutation.isLoading && currentQ === questions.length - 1) ? "Submitting..." : currentQ === questions.length - 1 ? "Submit Assessment" : "Next Question"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="max-w-3xl mx-auto pb-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Assessments</h1>
        </div>

        <div className="mt-8 bg-card border border-border rounded-[20px] p-10 shadow-sm text-center" data-testid="assessment-complete">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Assessment Complete!</h2>
          <p className="text-muted-foreground mb-8">Your assessment has been successfully analyzed by Pragyan AI.</p>

          <div className="text-left space-y-5 border-t border-border pt-6">
            {[
              { color: "bg-purple-100 text-purple-600", label: "Recommended Path", value: result?.summary?.suggestedCareers?.join(", ") || "Check your dashboard for personalized recommendations" },
              { color: "bg-green-100 text-green-600", label: "Status", value: result?.persisted ? "Assessment recorded and analysis in progress" : "Assessment analysis complete; persistence may be delayed" },
            ].map(({ color, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-foreground">{label}</span>
                  <p className="text-sm mt-0.5 text-muted-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-left">
            {result?.summary?.strengths?.length ? (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Strengths</h3>
                <p className="text-sm text-muted-foreground">{result.summary.strengths.join(', ')}</p>
              </div>
            ) : null}
            {result?.summary?.weaknesses?.length ? (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Growth areas</h3>
                <p className="text-sm text-muted-foreground">{result.summary.weaknesses.join(', ')}</p>
              </div>
            ) : null}
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-border">
            <Button variant="outline" className="flex-1 rounded-xl py-3" onClick={() => {
              setPhase("landing");
              setCurrentQ(0);
              setAnswers({});
              setSelected(null);
              setResult(null);
              setSubmissionError(null);
            }} data-testid="button-retake-assessment">
              Retake Assessment
            </Button>
            <Button className="flex-1 rounded-xl py-3" onClick={() => window.location.href = "/dashboard"} data-testid="button-explore-roadmap">
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
