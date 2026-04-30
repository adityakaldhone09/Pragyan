import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Icons } from '../components/Icons';

interface AIAnalysisProps {
  onComplete: () => void;
}

export function AIAnalysis({ onComplete }: AIAnalysisProps) {
  const [stage, setStage] = useState(0);

  const stages = [
    { text: 'Analyzing your responses...', icon: '🧠' },
    { text: 'Identifying your strengths...', icon: '💪' },
    { text: 'Matching career profiles...', icon: '🎯' },
    { text: 'Generating personalized insights...', icon: '✨' },
    { text: 'Creating your roadmap...', icon: '🗺️' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => onComplete(), 1000);
          return prev;
        }
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        <GlassCard strong className="p-12">
          <div className="mb-8">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 gradient-primary rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-0 gradient-primary rounded-full animate-pulse"></div>
              <div className="relative w-full h-full gradient-primary rounded-full flex items-center justify-center text-5xl">
                {stages[stage].icon}
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              AI Analysis in Progress
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              {stages[stage].text}
            </p>

            <div className="space-y-3 max-w-md mx-auto">
              {stages.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                    i <= stage ? 'glass-strong border-indigo-500/50' : 'glass border-white/5'
                  }`}
                >
                  <div className={`text-2xl transition-all duration-500 ${
                    i === stage ? 'scale-125' : i < stage ? 'opacity-50' : 'opacity-30'
                  }`}>
                    {s.icon}
                  </div>
                  <span className={`text-sm transition-all duration-500 ${
                    i <= stage ? 'text-white' : 'text-gray-600'
                  }`}>
                    {s.text}
                  </span>
                  {i < stage && (
                    <div className="ml-auto">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 glass rounded-xl p-4">
            <p className="text-sm text-gray-400">
              <Icons.Sparkles />
              <span className="ml-2">Analyzing {Object.keys(stages).length} dimensions of your profile...</span>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
