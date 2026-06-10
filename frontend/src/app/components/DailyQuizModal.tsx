import React, { useEffect, useState } from 'react';
import { getTodayQuiz, submitQuiz } from '../../services/quizService';

export default function DailyQuizModal({
  open,
  onClose,
  roadmapId,
  dayNumber,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  roadmapId?: string;
  dayNumber?: number;
  onResult?: (res: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<any | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    void getTodayQuiz(roadmapId)
      .then((data) => {
        if (!mounted) return;
        setQuiz(data || null);
        setAnswers((data?.questions || []).map(() => -1));
      })
      .catch(() => {
        if (!mounted) return;
        setQuiz(null);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [open, roadmapId]);

  if (!open) return null;

  const handleChoose = (qIdx: number, optionIdx: number) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIdx] = optionIdx;
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!quiz) return onClose();
    setSubmitting(true);
    try {
      const payload = {
        quizId: quiz.id,
        answers,
        roadmapId,
        dayNumber,
      };
      const res = await submitQuiz(payload);
      await onResult?.(res);
    } catch (err) {
      // ignore, just close
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl overflow-auto rounded-2xl bg-card/90 p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold">Today's Quiz</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground">Close</button>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !quiz ? (
            <p className="text-sm text-muted-foreground">No quiz available for today.</p>
          ) : (
            quiz.questions.map((q: any, qi: number) => (
              <div key={qi} className="mb-4 rounded-md border border-white/5 p-3">
                <p className="font-medium">{qi + 1}. {q.prompt}</p>
                <div className="mt-2 grid gap-2">
                  {(q.options || []).map((opt: string, oi: number) => (
                    <label key={oi} className="flex items-center gap-3">
                      <input type="radio" name={`q-${qi}`} checked={answers[qi] === oi} onChange={() => handleChoose(qi, oi)} />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button disabled={submitting} onClick={onClose} className="rounded-md border px-3 py-2">Cancel</button>
          <button disabled={submitting || !quiz} onClick={handleSubmit} className="rounded-md bg-primary px-4 py-2 text-white">Submit</button>
        </div>
      </div>
    </div>
  );
}
