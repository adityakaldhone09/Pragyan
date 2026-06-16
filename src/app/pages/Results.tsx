import { motion } from "motion/react";
import { Link } from "react-router";
import { Trophy, TrendingUp, Target, Sparkles, Star, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

const careerMatches = [
  {
    title: "AI Engineer",
    match: 92,
    salary: "$120K - $180K",
    growth: "Very High",
    description: "Design and develop AI systems and machine learning models"
  },
  {
    title: "Data Scientist",
    match: 88,
    salary: "$110K - $160K",
    growth: "High",
    description: "Analyze complex data sets to drive business decisions"
  },
  {
    title: "ML Researcher",
    match: 85,
    salary: "$130K - $200K",
    growth: "High",
    description: "Conduct research to advance machine learning capabilities"
  }
];

const skillsData = [
  { skill: "Problem Solving", score: 95, fullMark: 100 },
  { skill: "Technical Skills", score: 88, fullMark: 100 },
  { skill: "Creativity", score: 82, fullMark: 100 },
  { skill: "Leadership", score: 75, fullMark: 100 },
  { skill: "Communication", score: 85, fullMark: 100 },
  { skill: "Analytical Thinking", score: 92, fullMark: 100 }
];

const strengths = [
  "Advanced problem-solving abilities",
  "Strong technical foundation",
  "Excellent analytical thinking",
  "Quick learner with adaptability"
];

const gaps = [
  "Leadership experience in team settings",
  "Public speaking and presentation skills",
  "Project management fundamentals"
];

export function Results() {
  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />
      <FloatingParticles count={30} />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 relative z-10">
        {/* Hero Section */}
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Assessment Complete</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Your Career Path
            </span>
            <br />
            <span className="text-foreground">Revealed</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Based on your responses, our AI has identified your ideal career matches
            and created a personalized growth roadmap
          </p>
        </motion.div>

        {/* Top Career Match - Cinematic Reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <GlassCard glow glowColor="primary" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 text-center py-12 space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
              >
                <GradientIconWrapper size="lg" gradient="purple" glow className="mx-auto">
                  <Target className="w-12 h-12 text-white" />
                </GradientIconWrapper>
              </motion.div>

              <div className="space-y-2">
                <p className="text-muted-foreground">Your Top Career Match</p>
                <h2 className="text-4xl md:text-5xl font-bold">{careerMatches[0].title}</h2>
              </div>

              <motion.div
                className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                {careerMatches[0].match}%
              </motion.div>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {careerMatches[0].description}
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-6">
                <div className="p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                  <p className="text-sm text-muted-foreground mb-1">Salary Range</p>
                  <p className="font-semibold text-secondary">{careerMatches[0].salary}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Job Growth</p>
                  <p className="font-semibold text-accent">{careerMatches[0].growth}</p>
                </div>
              </div>

              <Link to="/analysis">
                <GlowButton variant="primary" size="lg">
                  View Detailed Analysis
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </GlowButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        {/* Skills Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <SectionHeader
            title="Your Skill Profile"
            subtitle="AI-analyzed strengths based on your assessment responses"
            className="mb-6"
          />

          <GlassCard glow glowColor="accent">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillsData}>
                    <PolarGrid stroke="rgba(139, 92, 246, 0.2)" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar
                      name="Your Skills"
                      dataKey="score"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    Key Strengths
                  </h3>
                  <ul className="space-y-2">
                    {strengths.map((strength, i) => (
                      <motion.li
                        key={strength}
                        className="flex items-start gap-2 text-muted-foreground"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                      >
                        <Star className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                        <span>{strength}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-accent" />
                    Growth Opportunities
                  </h3>
                  <ul className="space-y-2">
                    {gaps.map((gap, i) => (
                      <motion.li
                        key={gap}
                        className="flex items-start gap-2 text-muted-foreground"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + i * 0.1 }}
                      >
                        <TrendingUp className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                        <span>{gap}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Other Career Matches */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <SectionHeader
            title="Alternative Career Paths"
            subtitle="Other careers that match your profile"
            className="mb-6"
          />

          <div className="grid md:grid-cols-2 gap-6">
            {careerMatches.slice(1).map((career, i) => (
              <motion.div
                key={career.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <GlassCard hover glow glowColor={i === 0 ? "secondary" : "pink"}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold mb-2">{career.title}</h3>
                        <p className="text-sm text-muted-foreground">{career.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {career.match}%
                        </div>
                        <div className="text-xs text-muted-foreground">Match</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                        <p className="text-xs text-muted-foreground mb-1">Salary</p>
                        <p className="text-sm font-semibold">{career.salary}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                        <p className="text-xs text-muted-foreground mb-1">Growth</p>
                        <p className="text-sm font-semibold">{career.growth}</p>
                      </div>
                    </div>

                    <button type="button" className="w-full py-2 text-sm text-primary hover:text-primary/80 font-medium text-left">
                      View Roadmap →
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <GlassCard glow glowColor="primary">
            <div className="flex items-start gap-4">
              <GradientIconWrapper size="md" gradient="purple" glow>
                <Sparkles className="w-6 h-6 text-white" />
              </GradientIconWrapper>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">AI Career Insights</h3>
                <p className="text-muted-foreground mb-4">
                  Your assessment reveals a strong aptitude for technical problem-solving
                  combined with analytical thinking. You thrive in environments that
                  challenge your intellect and allow for continuous learning. The AI
                  Engineering path aligns perfectly with your profile, offering both
                  technical depth and innovation opportunities.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Technical Aptitude", "Growth Mindset", "Analytical Thinker", "Problem Solver"].map(
                    (tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm border border-primary/30"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Link to="/roadmap">
            <GlowButton variant="primary" size="lg">
              Start Your Learning Roadmap
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </GlowButton>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
