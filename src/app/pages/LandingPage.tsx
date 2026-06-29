import { motion } from "motion/react";
import { Link } from "react-router";
import { Sparkles, Brain, TrendingUp, Target, Rocket, Users, Star, ChevronRight } from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";

export function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <NeuralBackground />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <FloatingParticles count={30} />

        <div className="max-w-6xl mx-auto text-center space-y-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Career Intelligence</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Your AI Career
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Intelligence System
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover your ideal career path through adaptive AI assessments,
            intelligent roadmaps, and personalized career guidance.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/assessment">
              <GlowButton variant="primary" size="lg">
                Start AI Career Assessment
                <ChevronRight className="w-5 h-5 ml-2 inline" />
              </GlowButton>
            </Link>
            <Link to="/dashboard">
              <GlowButton variant="secondary" size="lg" glow={false}>
                Explore Career Domains
              </GlowButton>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { value: "50K+", label: "Career Matches" },
              { value: "98%", label: "Accuracy Rate" },
              { value: "200+", label: "Career Paths" }
            ].map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto space-y-12">
          <SectionHeader
            title="Powered by Advanced AI"
            subtitle="Experience the future of career guidance with our intelligent platform"
          />

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "Adaptive Assessments",
                description: "AI-driven questions that adapt to your responses in real-time",
                gradient: "purple" as const
              },
              {
                icon: TrendingUp,
                title: "Smart Roadmaps",
                description: "Personalized learning paths tailored to your career goals",
                gradient: "cyan" as const
              },
              {
                icon: Target,
                title: "Career Matching",
                description: "Find your perfect career with AI-powered matching algorithms",
                gradient: "pink" as const
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard hover glow glowColor={feature.gradient}>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <GradientIconWrapper size="lg" gradient={feature.gradient} glow>
                      <feature.icon className="w-10 h-10 text-white" />
                    </GradientIconWrapper>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto space-y-12">
          <SectionHeader
            title="Your Career Intelligence Dashboard"
            subtitle="Everything you need to plan and achieve your dream career"
          />

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <GlassCard glow glowColor="primary" className="h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <GradientIconWrapper size="md" gradient="purple" glow>
                      <Rocket className="w-6 h-6 text-white" />
                    </GradientIconWrapper>
                    <h3 className="text-2xl font-semibold">Personalized Roadmaps</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Get step-by-step guidance tailored to your unique career path,
                    with milestones, skills to learn, and real-time progress tracking.
                  </p>
                  <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Current Progress</span>
                      <span className="text-sm font-medium text-primary">65%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[65%] bg-gradient-to-r from-primary to-secondary rounded-full" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <GlassCard glow glowColor="secondary" className="h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <GradientIconWrapper size="md" gradient="cyan" glow>
                      <Target className="w-6 h-6 text-white" />
                    </GradientIconWrapper>
                    <h3 className="text-2xl font-semibold">Career Recommendations</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Discover careers that match your skills, interests, and personality
                    with AI-powered confidence scores and detailed insights.
                  </p>
                  <div className="space-y-2">
                    {[
                      { career: "AI Engineer", match: 95 },
                      { career: "Data Scientist", match: 88 },
                      { career: "ML Researcher", match: 82 }
                    ].map((item) => (
                      <div
                        key={item.career}
                        className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/20"
                      >
                        <span className="text-sm">{item.career}</span>
                        <span className="text-sm font-medium text-secondary">{item.match}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto space-y-12">
          <SectionHeader
            title="Trusted by Future Leaders"
            subtitle="See what our users say about their career transformation"
          />

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen",
                role: "Software Engineer",
                content: "Pragyan helped me discover my passion for AI. The roadmaps were incredibly detailed and personalized."
              },
              {
                name: "Marcus Rodriguez",
                role: "Data Scientist",
                content: "The AI assessment was surprisingly accurate. It matched me with careers I never considered but absolutely love."
              },
              {
                name: "Aisha Patel",
                role: "Product Manager",
                content: "This platform transformed my career journey. The insights were actionable and the guidance was spot-on."
              }
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard hover className="h-full">
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Domains Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto space-y-12">
          <SectionHeader
            title="Explore Career Domains"
            subtitle="From technology to healthcare, discover your perfect career match"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Technology", "Healthcare", "Business", "Creative Arts",
              "Engineering", "Education", "Finance", "Marketing"
            ].map((domain, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <GlassCard hover className="text-center py-6 cursor-pointer">
                  <p className="font-medium">{domain}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <GlassCard glow glowColor="primary" className="text-center py-12">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Ready to Transform Your Career?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Start your AI-powered career journey today and unlock your true potential
                </p>
                <Link to="/assessment">
                  <GlowButton variant="primary" size="lg">
                    Start AI Assessment Now
                    <ChevronRight className="w-5 h-5 ml-2 inline" />
                  </GlowButton>
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-12 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Pragyan
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-powered career intelligence platform for the next generation of professionals.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Features</li>
                <li>Assessment</li>
                <li>Roadmaps</li>
                <li>Pricing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Privacy</li>
                <li>Terms</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 Pragyan. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
