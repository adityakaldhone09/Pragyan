import { useState } from 'react';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

interface AssessmentProps {
  onComplete: () => void;
  onBack: () => void;
}

const questions = [
  {
    id: 1,
    question: 'What type of work environment do you thrive in?',
    options: [
      'Structured with clear guidelines',
      'Creative and flexible',
      'Fast-paced and dynamic',
      'Collaborative team settings'
    ]
  },
  {
    id: 2,
    question: 'Which activity sounds most engaging to you?',
    options: [
      'Solving complex problems',
      'Creating visual designs',
      'Analyzing data patterns',
      'Helping others succeed'
    ]
  },
  {
    id: 3,
    question: 'What motivates you most in your career?',
    options: [
      'Making a positive impact',
      'Financial stability',
      'Creative expression',
      'Continuous learning'
    ]
  },
  {
    id: 4,
    question: 'How do you prefer to work on projects?',
    options: [
      'Independently with full autonomy',
      'In a small focused team',
      'Leading a large team',
      'Supporting others as needed'
    ]
  },
  {
    id: 5,
    question: 'Which skill would you most like to develop?',
    options: [
      'Technical programming',
      'Strategic planning',
      'Creative design',
      'Data analysis'
    ]
  }
];

export function Assessment({ onComplete, onBack }: AssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = { ...answers, [currentQuestion]: optionIndex };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 200);
    } else {
      setTimeout(() => onComplete(), 500);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#2563EB]">Pragyan</h1>
          <button onClick={onBack} className="text-[#475569] hover:text-[#0F172A]">
            Exit
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#475569]">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm font-semibold text-[#2563EB]">
                {Math.round(progress)}%
              </span>
            </div>
            <ProgressBar value={progress} />
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-[#E2E8F0] p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0F172A] mb-8">
              {questions[currentQuestion].question}
            </h2>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full text-left p-5 rounded-lg border-2 transition-all ${
                    answers[currentQuestion] === index
                      ? 'border-[#2563EB] bg-[#EFF6FF]'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion] === index
                        ? 'border-[#2563EB] bg-[#2563EB]'
                        : 'border-[#CBD5E1]'
                    }`}>
                      {answers[currentQuestion] === index && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-[#0F172A]">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {currentQuestion > 0 && (
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                ← Previous Question
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
