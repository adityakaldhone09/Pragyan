import { GlassButton } from '../components/GlassButton';
import { GlassCard } from '../components/GlassCard';
import { Icons } from '../components/Icons';

interface NewLandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function NewLanding({ onGetStarted, onLogin }: NewLandingProps) {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Icons.Brain />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Pragyan
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <GlassButton variant="ghost" size="sm" onClick={onLogin}>
              Login
            </GlassButton>
            <GlassButton variant="primary" size="sm" onClick={onGetStarted}>
              Get Started
            </GlassButton>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6 animate-pulse">
            <Icons.Sparkles />
            <span className="text-sm text-gray-300">AI-Powered Career Guidance</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Discover Your Perfect
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Career Path
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Advanced AI analyzes your skills, interests, and personality to recommend
            careers tailored just for you. Get personalized roadmaps and real-time guidance.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
            <GlassButton variant="primary" size="lg" onClick={onGetStarted}>
              <Icons.Rocket />
              <span className="ml-2">Start Free Assessment</span>
            </GlassButton>
            <GlassButton variant="secondary" size="lg">
              <Icons.Lightning />
              <span className="ml-2">Learn More</span>
            </GlassButton>
          </div>

          <GlassCard strong className="p-8 max-w-5xl mx-auto">
            <div className="aspect-video gradient-primary rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent animate-pulse"></div>
              <div className="relative z-10 text-center">
                <div className="text-6xl mb-4 animate-bounce">🎯</div>
                <p className="text-2xl font-semibold text-white">Interactive Career Dashboard</p>
                <p className="text-indigo-200 mt-2">AI-powered insights & personalized roadmaps</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-400">Everything you need for career success</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Icons.Brain />, title: 'Adaptive Assessment', desc: 'Questions that evolve based on your responses for accurate results' },
              { icon: <Icons.Target />, title: 'Smart Matching', desc: 'AI finds careers with 95%+ accuracy matching your profile' },
              { icon: <Icons.Chart />, title: 'Skill Analysis', desc: 'Detailed breakdown of your strengths and growth areas' },
              { icon: <Icons.Book />, title: 'Learning Paths', desc: 'Step-by-step roadmaps customized to your goals' }
            ].map((feature, i) => (
              <GlassCard key={i} hover className="p-6 text-center group">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">How It Works</h2>
            <p className="text-xl text-gray-400">Three simple steps to your dream career</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { num: '01', title: 'Adaptive Assessment', desc: 'Answer intelligent questions that adapt to your responses in real-time', icon: <Icons.Brain /> },
              { num: '02', title: 'AI Analysis', desc: 'Our AI analyzes thousands of data points to find your perfect career matches', icon: <Icons.Sparkles /> },
              { num: '03', title: 'Career Dashboard', desc: 'Get detailed insights, roadmaps, and personalized guidance for each role', icon: <Icons.Target /> }
            ].map((step, i) => (
              <div key={i} className="relative">
                <GlassCard strong className="p-8 h-full">
                  <div className="text-5xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
                    {step.num}
                  </div>
                  <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </GlassCard>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-indigo-500 text-2xl z-10">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard strong className="p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-20"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Transform Your Future?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of students discovering their ideal career path with AI-powered guidance
              </p>
              <GlassButton variant="primary" size="lg" onClick={onGetStarted} className="shadow-2xl">
                <Icons.Rocket />
                <span className="ml-2">Start Your Journey</span>
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </section>

      <footer className="glass-strong border-t border-white/10 px-6 py-8 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-sm">
            © 2026 Pragyan. Powered by AI.
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
