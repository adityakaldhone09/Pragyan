import { useState, useEffect } from 'react';
import { GlassButton } from '../components/GlassButton';
import { GlassCard } from '../components/GlassCard';
import { AnimatedProgress } from '../components/AnimatedProgress';
import { Icons } from '../components/Icons';

interface AdaptiveAssessmentProps {
  onComplete: (answers: Record<string, any>) => void;
  onBack: () => void;
}

interface Question {
  id: string;
  type: 'mcq' | 'scenario' | 'interest';
  question: string;
  options: string[];
  category: string;
}

const baseQuestions: Question[] = [
  {
    id: 'q1',
    type: 'interest',
    question: 'What excites you the most?',
    options: ['Solving complex problems', 'Creating visual designs', 'Helping people', 'Analyzing data'],
    category: 'general'
  },
  {
    id: 'q2',
    type: 'mcq',
    question: 'Which environment do you thrive in?',
    options: ['Structured and organized', 'Creative and flexible', 'Fast-paced and dynamic', 'Collaborative teams'],
    category: 'general'
  },
  {
    id: 'q3',
    type: 'scenario',
    question: 'Your team faces a critical deadline. What do you do?',
    options: [
      'Create a detailed plan and execute',
      'Brainstorm creative solutions',
      'Rally the team and delegate',
      'Analyze bottlenecks and optimize'
    ],
    category: 'general'
  }
];

const techQuestions: Question[] = [
  {
    id: 'tech1',
    type: 'interest',
    question: 'Which tech domain interests you most?',
    options: ['Artificial Intelligence', 'Web Development', 'Cybersecurity', 'Data Science'],
    category: 'tech'
  },
  {
    id: 'tech2',
    type: 'mcq',
    question: 'How comfortable are you with coding?',
    options: ['Expert - I build complex systems', 'Intermediate - I can build apps', 'Beginner - I know basics', 'New - I want to learn'],
    category: 'tech'
  },
  {
    id: 'tech3',
    type: 'scenario',
    question: 'You discover a critical bug in production. What do you do?',
    options: [
      'Debug systematically using logs',
      'Roll back to stable version immediately',
      'Collaborate with team for quick fix',
      'Implement monitoring to prevent future issues'
    ],
    category: 'tech'
  }
];

const creativeQuestions: Question[] = [
  {
    id: 'creative1',
    type: 'interest',
    question: 'Which creative field appeals to you?',
    options: ['UI/UX Design', 'Content Creation', 'Brand Strategy', 'Product Design'],
    category: 'creative'
  },
  {
    id: 'creative2',
    type: 'mcq',
    question: 'What drives your creative process?',
    options: ['User needs and feedback', 'Artistic expression', 'Business goals', 'Innovation and trends'],
    category: 'creative'
  }
];

const businessQuestions: Question[] = [
  {
    id: 'business1',
    type: 'interest',
    question: 'Which business aspect interests you?',
    options: ['Strategy & Planning', 'Sales & Marketing', 'Operations & Logistics', 'Finance & Analytics'],
    category: 'business'
  },
  {
    id: 'business2',
    type: 'scenario',
    question: 'Your product is losing market share. What do you do?',
    options: [
      'Conduct market research and pivot',
      'Aggressive marketing campaign',
      'Improve product quality',
      'Reduce costs and optimize'
    ],
    category: 'business'
  }
];

export function AdaptiveAssessment({ onComplete, onBack }: AdaptiveAssessmentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(baseQuestions);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [userInterests, setUserInterests] = useState<Set<string>>(new Set());

  const handleAnswer = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    const selectedOption = currentQ.options[optionIndex];

    const newAnswers = {
      ...answers,
      [currentQ.id]: { question: currentQ.question, answer: selectedOption, type: currentQ.type }
    };
    setAnswers(newAnswers);

    if (currentIndex === 0) {
      if (optionIndex === 0) {
        setUserInterests(prev => new Set([...prev, 'tech']));
        setQuestions([...baseQuestions, ...techQuestions]);
      } else if (optionIndex === 1) {
        setUserInterests(prev => new Set([...prev, 'creative']));
        setQuestions([...baseQuestions, ...creativeQuestions]);
      } else if (optionIndex === 3) {
        setUserInterests(prev => new Set([...prev, 'data']));
        setQuestions([...baseQuestions, ...techQuestions.slice(0, 2)]);
      }
    }

    if (currentIndex === 1 && optionIndex === 2) {
      setQuestions(prev => [...prev, ...businessQuestions]);
    }

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      setTimeout(() => onComplete(newAnswers), 500);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="glass-strong border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Icons.Brain />
            </div>
            <h1 className="text-xl font-bold text-white">Pragyan Assessment</h1>
          </div>
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            Exit
          </button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <Icons.Sparkles />
                <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  AI Adaptive
                </span>
              </div>
            </div>
            <AnimatedProgress value={progress} color="primary" />
            <p className="mt-2 text-xs text-gray-500">Questions adapt based on your responses</p>
          </div>

          <GlassCard strong className="p-8 md:p-12 transform transition-all duration-500">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6">
                <span className="text-xs font-semibold text-indigo-400">
                  {currentQuestion.type === 'mcq' ? '📝 Multiple Choice' :
                   currentQuestion.type === 'scenario' ? '🎯 Scenario' : '💡 Interest'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full group"
                >
                  <div className="glass hover:glass-strong border border-white/10 hover:border-indigo-500/50 rounded-xl p-5 transition-all duration-300 text-left transform hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 group-hover:border-indigo-500 flex items-center justify-center transition-colors">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <span className="text-white group-hover:text-indigo-300 transition-colors flex-1">
                        {option}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>

          {currentIndex > 0 && (
            <div className="mt-6 text-center">
              <GlassButton
                variant="ghost"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              >
                ← Previous Question
              </GlassButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
