import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { AnimatedProgress } from '../components/AnimatedProgress';
import { Icons } from '../components/Icons';

interface CareerMatchesProps {
  onSelectCareer: (careerId: string) => void;
  onBack: () => void;
  onProfile?: () => void;
}

const careers = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    match: 94,
    tags: ['High Demand', 'Tech', 'Problem Solving'],
    salary: '$80k - $150k',
    growth: '+22%',
    icon: '💻',
    reason: 'Your strong analytical thinking, love for problem-solving, and interest in technology make this an excellent fit. You demonstrated high logical reasoning and a systematic approach to challenges.'
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    match: 89,
    tags: ['AI/ML', 'Analytics', 'High Growth'],
    salary: '$90k - $160k',
    growth: '+31%',
    icon: '📊',
    reason: 'Your analytical skills and interest in patterns align perfectly with data science. You showed strong quantitative reasoning and curiosity about how systems work.'
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    match: 82,
    tags: ['Leadership', 'Strategy', 'Cross-functional'],
    salary: '$100k - $180k',
    growth: '+19%',
    icon: '🎯',
    reason: 'Your strategic thinking and collaborative nature make you ideal for product management. You balance technical understanding with user empathy.'
  }
];

export function CareerMatches({ onSelectCareer, onBack, onProfile }: CareerMatchesProps) {
  return (
    <div className="min-h-screen">
      <nav className="glass-strong border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Icons.Brain />
            </div>
            <h1 className="text-xl font-bold text-white">Your Career Matches</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onProfile} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
              <Icons.User />
              <span>Profile</span>
            </button>
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-4">
            <Icons.Sparkles />
            <span className="text-sm text-indigo-400 font-medium">AI-Powered Analysis</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3">
            Your Top Career Matches
          </h2>
          <p className="text-xl text-gray-400">
            Based on your assessment, here are careers that align with your unique profile
          </p>
        </div>

        <div className="space-y-6">
          {careers.map((career, index) => (
            <GlassCard key={career.id} strong className="p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer group" onClick={() => onSelectCareer(career.id)}>
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  {career.icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-white">{career.title}</h3>
                        {index === 0 && (
                          <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-semibold">
                            ⭐ Best Match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {career.tags.map((tag, i) => (
                          <span key={i} className="px-3 py-1 glass rounded-full text-xs text-gray-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {career.match}%
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>

                  <AnimatedProgress value={career.match} color="primary" className="mb-6" />

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Icons.Sparkles />
                      <h4 className="font-semibold text-white">Why This Fits You</h4>
                    </div>
                    <p className="text-gray-400 leading-relaxed">{career.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="glass rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">Salary Range</div>
                      <div className="text-lg font-semibold text-white">{career.salary}</div>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">Job Growth</div>
                      <div className="text-lg font-semibold text-green-400">{career.growth}</div>
                    </div>
                  </div>

                  <GlassButton variant="primary" onClick={() => onSelectCareer(career.id)}>
                    View Detailed Dashboard →
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard strong className="mt-8 p-6 text-center">
          <h3 className="font-semibold text-white mb-2">Want Even More Personalized Results?</h3>
          <p className="text-gray-400 mb-4">Complete your profile to unlock additional career recommendations</p>
          <GlassButton variant="secondary">Complete Your Profile</GlassButton>
        </GlassCard>
      </div>
    </div>
  );
}
