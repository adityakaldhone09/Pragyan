import { motion } from "motion/react";
import { Link } from "react-router";
import {
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Trophy,
  Flame,
  BookOpen,
  Briefcase,
  ArrowRight,
  Star,
  Zap,
  Award
} from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { AnimatedProgress } from "../components/AnimatedProgress";

export function Dashboard() {
  const userName = "Alex";
  const currentTime = new Date().getHours();
  const greeting =
    currentTime < 12
      ? "Good morning"
      : currentTime < 18
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* AI Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard glow glowColor="primary" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">AI Career Intelligence</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {greeting}, {userName}!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Your AI-powered career journey continues
                </p>
              </div>
              <GradientIconWrapper size="lg" gradient="purple" glow>
                <Brain className="w-12 h-12 text-white" />
              </GradientIconWrapper>
            </div>
          </GlassCard>
        </motion.div>

        {/* Main Assessment CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GlassCard glow glowColor="accent" className="relative overflow-hidden min-h-[200px]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent/30 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 py-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-accent" />
                  <span className="text-sm font-medium text-accent">Ready to Discover?</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Start Your AI Career Assessment
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Unlock personalized career insights powered by advanced AI. Take our adaptive
                  assessment to discover your ideal career path.
                </p>
              </div>
              <Link to="/assessment">
                <GlowButton variant="primary" size="lg" className="whitespace-nowrap">
                  Begin Assessment
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </GlowButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              icon: Flame,
              label: "Learning Streak",
              value: "12 Days",
              color: "pink" as const,
              subtext: "+2 from last week"
            },
            {
              icon: Trophy,
              label: "Total XP",
              value: "2,450",
              color: "purple" as const,
              subtext: "Top 15% this month"
            },
            {
              icon: Target,
              label: "Career Match",
              value: "92%",
              color: "cyan" as const,
              subtext: "AI Engineer"
            },
            {
              icon: Award,
              label: "Achievements",
              value: "8/12",
              color: "blue" as const,
              subtext: "4 more to unlock"
            }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
            >
              <GlassCard hover glow glowColor={stat.color}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                  </div>
                  <GradientIconWrapper size="sm" gradient={stat.color}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </GradientIconWrapper>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Roadmap Progress */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GlassCard glow glowColor="primary" className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <GradientIconWrapper size="md" gradient="purple" glow>
                  <TrendingUp className="w-6 h-6 text-white" />
                </GradientIconWrapper>
                <h3 className="text-xl font-semibold">Active Roadmaps</h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Full Stack Development",
                    progress: 65,
                    skills: "React, Node.js, MongoDB"
                  },
                  {
                    title: "AI & Machine Learning",
                    progress: 42,
                    skills: "Python, TensorFlow, Neural Networks"
                  },
                  {
                    title: "Cloud Architecture",
                    progress: 28,
                    skills: "AWS, Docker, Kubernetes"
                  }
                ].map((roadmap, i) => (
                  <div
                    key={roadmap.title}
                    className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{roadmap.title}</h4>
                      <span className="text-sm text-primary font-medium">
                        {roadmap.progress}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{roadmap.skills}</p>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${roadmap.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/roadmap" className="block">
                <GlowButton variant="secondary" className="w-full mt-6" glow={false}>
                  View All Roadmaps
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </GlowButton>
              </Link>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GlassCard glow glowColor="secondary" className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <GradientIconWrapper size="md" gradient="cyan" glow>
                  <Target className="w-6 h-6 text-white" />
                </GradientIconWrapper>
                <h3 className="text-xl font-semibold">Top Career Match</h3>
              </div>

              <div className="space-y-4">
                <div className="text-center py-6">
                  <motion.div
                    className="text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    92%
                  </motion.div>
                  <p className="text-xl font-semibold mb-1">AI Engineer</p>
                  <p className="text-sm text-muted-foreground">
                    Based on your skills and interests
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Skills Match", value: "95%" },
                    { label: "Interest Fit", value: "89%" },
                    { label: "Salary Range", value: "$120K+" },
                    { label: "Job Growth", value: "High" }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-lg bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 text-center"
                    >
                      <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-semibold text-secondary">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/results" className="block">
                <GlowButton variant="secondary" className="w-full mt-6">
                  View Full Analysis
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </GlowButton>
              </Link>
            </GlassCard>
          </motion.div>
        </div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <SectionHeader
            title="AI Recommendations"
            subtitle="Personalized suggestions to accelerate your career growth"
            className="mb-6"
          />

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Learn React Hooks",
                description: "Master modern React patterns to enhance your development skills",
                priority: "High",
                time: "2-3 weeks"
              },
              {
                icon: Briefcase,
                title: "Apply to Tech Lead Roles",
                description: "Your profile matches 15 senior positions in your area",
                priority: "Medium",
                time: "This week"
              },
              {
                icon: Star,
                title: "Complete Cloud Certification",
                description: "AWS certification aligns with your career goals",
                priority: "Medium",
                time: "1 month"
              }
            ].map((rec) => (
              <GlassCard key={rec.title} hover>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <GradientIconWrapper size="sm" gradient="purple">
                      <rec.icon className="w-5 h-5 text-white" />
                    </GradientIconWrapper>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        rec.priority === "High"
                          ? "bg-pink/20 text-pink"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {rec.priority} Priority
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">{rec.time}</span>
                    <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium">
                      Start Now →
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>

        {/* Progress Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <GlassCard glow glowColor="accent">
            <div className="flex items-center gap-3 mb-6">
              <GradientIconWrapper size="md" gradient="blue" glow>
                <TrendingUp className="w-6 h-6 text-white" />
              </GradientIconWrapper>
              <h3 className="text-xl font-semibold">This Week's Progress</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Skills Learned</span>
                    <span className="text-sm font-medium">5/7</span>
                  </div>
                  <AnimatedProgress value={5} max={7} showLabel={false} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Roadmap Milestones</span>
                    <span className="text-sm font-medium">3/5</span>
                  </div>
                  <AnimatedProgress value={3} max={5} showLabel={false} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Learning Hours</span>
                    <span className="text-sm font-medium">12/15</span>
                  </div>
                  <AnimatedProgress value={12} max={15} showLabel={false} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Projects Completed</span>
                    <span className="text-sm font-medium">2/3</span>
                  </div>
                  <AnimatedProgress value={2} max={3} showLabel={false} />
                </div>
              </div>

              <div className="flex flex-col justify-center items-center text-center p-4 rounded-lg bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                <div className="text-4xl font-bold text-accent mb-1">85%</div>
                <p className="text-sm text-muted-foreground">Weekly Goal Achievement</p>
                <p className="text-xs text-accent mt-2">🎉 Great progress!</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
