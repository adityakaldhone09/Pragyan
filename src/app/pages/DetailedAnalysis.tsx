import { motion } from "motion/react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  Zap,
  Target,
  CheckCircle,
  Star,
  Building2,
  Code,
  Brain,
  BarChart3,
  Award
} from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { AnimatedProgress } from "../components/AnimatedProgress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";

const careerData = {
  title: "AI Engineer",
  matchScore: 92,
  tagline: "Design and develop intelligent systems that shape the future",
  overview:
    "As an AI Engineer, you'll be at the forefront of technological innovation, building intelligent systems that solve complex problems. You'll work with cutting-edge machine learning frameworks, develop neural networks, and deploy AI solutions that impact millions of users.",
  skillBreakdown: [
    { skill: "Python Programming", current: 85, required: 90, gap: 5 },
    { skill: "Machine Learning", current: 78, required: 85, gap: 7 },
    { skill: "Deep Learning", current: 72, required: 80, gap: 8 },
    { skill: "Data Analysis", current: 88, required: 85, gap: 0 },
    { skill: "Cloud Computing", current: 65, required: 75, gap: 10 },
    { skill: "MLOps", current: 55, required: 70, gap: 15 }
  ],
  salaryProgression: [
    { year: "Entry", salary: 95 },
    { year: "2-3 yrs", salary: 125 },
    { year: "4-5 yrs", salary: 155 },
    { year: "6-8 yrs", salary: 185 },
    { year: "Senior", salary: 220 }
  ],
  jobGrowth: [
    { year: "2024", jobs: 100 },
    { year: "2025", jobs: 145 },
    { year: "2026", jobs: 195 },
    { year: "2027", jobs: 255 },
    { year: "2028", jobs: 325 }
  ],
  dailyResponsibilities: [
    "Design and implement machine learning models",
    "Optimize AI algorithms for production environments",
    "Collaborate with data scientists and engineers",
    "Deploy and monitor AI systems at scale",
    "Research and prototype new AI techniques",
    "Conduct code reviews and mentor junior engineers"
  ],
  requiredQualifications: [
    "Bachelor's degree in Computer Science or related field",
    "Strong programming skills in Python and/or C++",
    "Experience with TensorFlow, PyTorch, or similar frameworks",
    "Understanding of ML algorithms and neural networks",
    "Knowledge of software engineering best practices",
    "Portfolio of AI projects or research publications"
  ],
  careerPath: [
    { level: "Junior AI Engineer", years: "0-2", salary: "$90K-$120K" },
    { level: "AI Engineer", years: "2-4", salary: "$120K-$160K" },
    { level: "Senior AI Engineer", years: "4-7", salary: "$160K-$200K" },
    { level: "Lead AI Engineer", years: "7-10", salary: "$200K-$250K" },
    { level: "Principal AI Engineer", years: "10+", salary: "$250K-$350K+" }
  ],
  cultureFit: {
    innovation: 95,
    collaboration: 85,
    autonomy: 80,
    workLifeBalance: 75,
    growth: 90,
    impact: 92
  },
  topCompanies: [
    { name: "Google DeepMind", type: "Big Tech", hiring: "Active" },
    { name: "Cohere", type: "AI Lab", hiring: "Active" },
    { name: "Meta AI", type: "Big Tech", hiring: "Active" },
    { name: "Tesla", type: "Automotive", hiring: "Limited" },
    { name: "Anthropic", type: "AI Safety", hiring: "Active" }
  ]
};

export function DetailedAnalysis() {
  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />
      <FloatingParticles count={25} />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 relative z-10">
        {/* Back Button */}
        <Link to="/results">
          <motion.button type="button"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </motion.button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard glow glowColor="primary" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary">Detailed Career Analysis</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">{careerData.title}</h1>
                <p className="text-xl text-muted-foreground">{careerData.tagline}</p>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {careerData.matchScore}%
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Career Match</p>
                    <p className="text-xs text-accent">AI Confidence: Very High</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: DollarSign, label: "Avg Salary", value: "$155K", color: "secondary" as const },
                  { icon: TrendingUp, label: "Job Growth", value: "+225%", color: "accent" as const },
                  { icon: Users, label: "Open Roles", value: "12,500+", color: "pink" as const },
                  { icon: Award, label: "Career Level", value: "Mid-Senior", color: "purple" as const }
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <div className={`p-4 rounded-lg bg-gradient-to-br from-${stat.color}/10 to-transparent border border-${stat.color}/20`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color} mb-2`} />
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-lg font-bold text-${stat.color}`}>{stat.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Career Overview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SectionHeader title="Career Overview" className="mb-6" />
          <GlassCard glow glowColor="accent">
            <div className="flex items-start gap-4">
              <GradientIconWrapper size="md" gradient="blue" glow>
                <Brain className="w-6 h-6 text-white" />
              </GradientIconWrapper>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {careerData.overview}
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Skill Gap Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <SectionHeader
            title="Skill Gap Analysis"
            subtitle="Detailed breakdown of your current skills vs. industry requirements"
            className="mb-6"
          />
          <GlassCard glow glowColor="primary">
            <div className="space-y-6">
              {careerData.skillBreakdown.map((skill, i) => (
                <motion.div
                  key={skill.skill}
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.skill}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Current: <span className="text-foreground">{skill.current}%</span>
                      </span>
                      <span className="text-muted-foreground">
                        Required: <span className="text-foreground">{skill.required}%</span>
                      </span>
                      {skill.gap > 0 ? (
                        <span className="text-accent">Gap: {skill.gap}%</span>
                      ) : (
                        <span className="text-secondary flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Met
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.current}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    />
                    <div
                      className="absolute inset-y-0 h-full border-r-2 border-dashed border-accent"
                      style={{ left: `${skill.required}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Salary & Growth Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <SectionHeader title="Salary Progression" className="mb-6" />
            <GlassCard glow glowColor="secondary">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={careerData.salaryProgression}>
                    <defs>
                      <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="year" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                        borderRadius: "8px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="salary"
                      stroke="#06b6d4"
                      fillOpacity={1}
                      fill="url(#salaryGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Expected salary in thousands (K) based on experience level
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <SectionHeader title="Job Market Growth" className="mb-6" />
            <GlassCard glow glowColor="accent">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={careerData.jobGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="year" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                        borderRadius: "8px"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="jobs"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Projected job openings growth (indexed to 2024 = 100)
              </p>
            </GlassCard>
          </motion.div>
        </div>

        {/* Daily Responsibilities & Qualifications */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <SectionHeader title="Day-to-Day Responsibilities" className="mb-6" />
            <GlassCard glow glowColor="primary">
              <div className="space-y-3">
                {careerData.dailyResponsibilities.map((task, i) => (
                  <motion.div
                    key={task}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{task}</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <SectionHeader title="Required Qualifications" className="mb-6" />
            <GlassCard glow glowColor="secondary">
              <div className="space-y-3">
                {careerData.requiredQualifications.map((qual, i) => (
                  <motion.div
                    key={qual}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-secondary/5 to-transparent border border-secondary/10"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <GraduationCap className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{qual}</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Career Progression Path */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <SectionHeader
            title="Career Progression Path"
            subtitle="Your potential journey from entry to leadership"
            className="mb-6"
          />
          <GlassCard glow glowColor="accent">
            <div className="space-y-4">
              {careerData.careerPath.map((level, i) => (
                <motion.div
                  key={level.level}
                  className="relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                >
                  {i < careerData.careerPath.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-full bg-gradient-to-b from-primary to-transparent" />
                  )}
                  <div className="flex items-center gap-6 p-4 rounded-lg bg-gradient-to-r from-accent/5 to-transparent border border-accent/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold z-10">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-1">{level.level}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {level.years}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {level.salary}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Culture Fit Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <SectionHeader
            title="Company Culture Fit"
            subtitle="How well you align with typical AI engineering environments"
            className="mb-6"
          />
          <GlassCard glow glowColor="pink">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { label: "Innovation Focus", value: careerData.cultureFit.innovation, icon: Zap },
                { label: "Collaboration", value: careerData.cultureFit.collaboration, icon: Users },
                { label: "Autonomy", value: careerData.cultureFit.autonomy, icon: Target },
                { label: "Work-Life Balance", value: careerData.cultureFit.workLifeBalance, icon: Heart },
                { label: "Growth Opportunities", value: careerData.cultureFit.growth, icon: TrendingUp },
                { label: "Impact & Influence", value: careerData.cultureFit.impact, icon: Star }
              ].map((item, i) => (
                <div key={item.label} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-pink" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Match Score</span>
                      <span className="text-pink font-semibold">{item.value}%</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-pink rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 1 + i * 0.1 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Top Hiring Companies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <SectionHeader
            title="Top Companies Hiring"
            subtitle="Leading organizations actively seeking AI Engineers"
            className="mb-6"
          />
          <div className="grid md:grid-cols-3 gap-6">
            {careerData.topCompanies.map((company, i) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
              >
                <GlassCard hover glow glowColor="secondary">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <GradientIconWrapper size="sm" gradient="cyan">
                          <Building2 className="w-5 h-5 text-white" />
                        </GradientIconWrapper>
                        <div>
                          <h4 className="font-semibold">{company.name}</h4>
                          <p className="text-xs text-muted-foreground">{company.type}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          company.hiring === "Active"
                            ? "bg-secondary/20 text-secondary"
                            : "bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        {company.hiring}
                      </span>
                    </div>
                    <button type="button" className="w-full py-2 text-sm text-secondary hover:text-secondary/80 font-medium">
                      View Open Positions →
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          <GlassCard glow glowColor="primary">
            <div className="flex items-start gap-4">
              <GradientIconWrapper size="md" gradient="purple" glow>
                <Sparkles className="w-6 h-6 text-white" />
              </GradientIconWrapper>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3">AI Career Recommendation</h3>
                <p className="text-muted-foreground mb-6">
                  Based on this comprehensive analysis, AI Engineering is an excellent career match
                  for you. Your current skills provide a strong foundation, and the identified gaps
                  are easily bridgeable through our personalized learning roadmaps. The career offers
                  exceptional growth potential, competitive compensation, and aligns perfectly with
                  your interests in innovation and problem-solving.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/roadmap">
                    <GlowButton variant="primary">
                      Start Learning Roadmap
                    </GlowButton>
                  </Link>
                  <GlowButton variant="secondary" glow={false}>
                    Explore Job Opportunities
                  </GlowButton>
                  <GlowButton variant="accent" glow={false}>
                    Connect with Mentors
                  </GlowButton>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
