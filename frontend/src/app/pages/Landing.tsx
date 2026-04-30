import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function Landing({ onGetStarted, onLogin }: LandingProps) {
  const features = [
    {
      icon: '🎯',
      title: 'AI-Powered Assessments',
      description: 'Take scientifically-backed assessments to discover careers that match your unique skills and personality.'
    },
    {
      icon: '📊',
      title: 'Personalized Roadmaps',
      description: 'Get step-by-step learning paths tailored to your career goals with trackable milestones.'
    },
    {
      icon: '💡',
      title: 'Smart Insights',
      description: 'Receive AI-driven recommendations to optimize your profile and accelerate your career growth.'
    },
    {
      icon: '🎓',
      title: 'Skill Tracking',
      description: 'Build a comprehensive profile showcasing your education, experience, and projects in one place.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Take the Assessment',
      description: 'Answer questions about your interests, skills, and goals in just 5 minutes.'
    },
    {
      number: '2',
      title: 'Get Your Matches',
      description: 'Discover top career paths with detailed match percentages and explanations.'
    },
    {
      number: '3',
      title: 'Follow Your Roadmap',
      description: 'Start learning with personalized roadmaps designed for your target career.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#2563EB]">Pragyan</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onLogin}>
              Login
            </Button>
            <Button variant="primary" size="sm" onClick={onGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-semibold text-[#0F172A] mb-6 leading-tight">
            Discover Your Perfect<br />Career Path with AI
          </h1>
          <p className="text-lg md:text-xl text-[#475569] mb-10 max-w-3xl mx-auto">
            AI-powered career guidance platform that helps students find their ideal career,
            build skills, and achieve their professional goals.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button variant="primary" size="lg" onClick={onGetStarted}>
              Start Free Assessment
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
          <div className="mt-16">
            <Card className="p-8 max-w-4xl mx-auto shadow-xl">
              <div className="aspect-video bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-xl">Career Assessment Preview</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-[#475569]">
              Comprehensive tools and insights to guide your career journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} hover className="p-6 text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#475569] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#0F172A] mb-4">
              How It Works
            </h2>
            <p className="text-lg text-[#475569]">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="p-8 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-2xl font-semibold mx-auto mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-[#0F172A] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[#475569] leading-relaxed">
                    {step.description}
                  </p>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-[#CBD5E1] text-3xl">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-gradient-to-br from-[#2563EB] to-[#3B82F6]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Ready to Find Your Perfect Career?
          </h2>
          <p className="text-lg mb-8 text-white/90">
            Join thousands of students who have discovered their ideal career path with Pragyan.
            Start your free assessment today.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={onGetStarted}
            className="bg-white text-[#2563EB] hover:bg-gray-50"
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      <footer className="bg-white border-t border-[#E2E8F0] px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[#475569] text-sm">
              © 2026 Pragyan. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-[#475569]">
              <a href="#" className="hover:text-[#2563EB] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#2563EB] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#2563EB] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
