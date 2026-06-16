import React, { useEffect, useReducer } from 'react';
import { getTodayQuiz, submitQuiz } from '../../services/quizService';

type QuizState = {
  loading: boolean;
  quiz: any | null;
  answers: number[];
};

type QuizAction =
  | { type: 'load_start' }
  | { type: 'load_success'; quiz: any; answers: number[] }
  | { type: 'select_answer'; index: number; value: number }
  | { type: 'load_empty' }
  | { type: 'load_done' };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'load_start':
      return { ...state, loading: true };
    case 'load_success':
      return { loading: false, quiz: action.quiz, answers: action.answers };
    case 'select_answer':
      return {
        ...state,
        answers: state.answers.map((value, index) => (index === action.index ? action.value : value)),
      };
    case 'load_empty':
      return { loading: false, quiz: null, answers: [] };
    case 'load_done':
      return { ...state, loading: false };
    default:
      return state;
  }
}

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
  const [{ loading, quiz, answers }, dispatch] = useReducer(quizReducer, {
    loading: false,
    quiz: null,
    answers: [],
  });
  const [submitting, setSubmitting] = React.useState(false);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    dispatch({ type: 'load_start' });

    void getTodayQuiz(roadmapId)
      .then((data) => {
        if (!mounted) return;
        if (data) {
          dispatch({
            type: 'load_success',
            quiz: data,
            answers: (data?.questions || []).map(() => -1),
          });
        } else {
          dispatch({ type: 'load_empty' });
        }
      })
      .catch(() => {
        if (mounted) dispatch({ type: 'load_empty' });
      });

    return () => {
      mounted = false;
    };
  }, [open, roadmapId]);

  if (!open) return null;

  const handleChoose = (qIdx: number, optionIdx: number) => {
    dispatch({ type: 'select_answer', index: qIdx, value: optionIdx });
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
    } catch {
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
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground">Close</button>
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
          <button type="button" disabled={submitting} onClick={onClose} className="rounded-md border px-3 py-2">Cancel</button>
          <button type="button" disabled={submitting || !quiz} onClick={handleSubmit} className="rounded-md bg-primary px-4 py-2 text-white">Submit</button>
        </div>
      </div>
    </div>
  );
}
