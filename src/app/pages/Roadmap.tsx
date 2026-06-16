import { motion } from "motion/react";
import { useState } from "react";
import { CheckCircle, Circle, Lock, BookOpen, Code, Award, Clock, TrendingUp, Star, Play } from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { GradientIconWrapper } from "../components/GradientIconWrapper";
import { AnimatedProgress } from "../components/AnimatedProgress";

const roadmapData = {
  title: "AI Engineer Learning Path",
  description: "Your personalized roadmap to becoming an AI Engineer",
  progress: 42,
  totalDuration: "6-8 months",
  milestones: [
    {
      id: 1,
      title: "Foundations of AI",
      status: "completed" as const,
      duration: "4 weeks",
      modules: [
        { name: "Introduction to Machine Learning", completed: true },
        { name: "Python for AI", completed: true },
        { name: "Mathematics for ML", completed: true },
        { name: "Data Preprocessing", completed: true }
      ]
    },
    {
      id: 2,
      title: "Deep Learning Fundamentals",
      status: "in-progress" as const,
      duration: "6 weeks",
      modules: [
        { name: "Neural Networks Basics", completed: true },
        { name: "CNNs & Image Recognition", completed: true },
        { name: "RNNs & NLP", completed: false },
        { name: "Transfer Learning", completed: false }
      ]
    },
    {
      id: 3,
      title: "Advanced AI Techniques",
      status: "locked" as const,
      duration: "8 weeks",
      modules: [
        { name: "Reinforcement Learning", completed: false },
        { name: "GANs & Generative Models", completed: false },
        { name: "Transformer Architecture", completed: false },
        { name: "Model Optimization", completed: false }
      ]
    },
    {
      id: 4,
      title: "AI Engineering & Deployment",
      status: "locked" as const,
      duration: "6 weeks",
      modules: [
        { name: "MLOps Fundamentals", completed: false },
        { name: "Model Deployment", completed: false },
        { name: "Scaling AI Systems", completed: false },
        { name: "Production Best Practices", completed: false }
      ]
    }
  ]
};

export function Roadmap() {
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(1);

  return (
    <div className="min-h-screen relative pb-20 pt-20">
      <NeuralBackground />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard glow glowColor="primary" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Learning Roadmap</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">{roadmapData.title}</h1>
                  <p className="text-muted-foreground">{roadmapData.description}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {roadmapData.progress}%
                  </div>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                  <Clock className="w-5 h-5 text-secondary mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Total Duration</p>
                  <p className="font-semibold">{roadmapData.totalDuration}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                  <BookOpen className="w-5 h-5 text-accent mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Modules</p>
                  <p className="font-semibold">
                    {roadmapData.milestones.reduce((acc, m) => acc + m.modules.length, 0)} Total
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-pink/10 to-transparent border border-pink/20">
                  <Award className="w-5 h-5 text-pink mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Milestones</p>
                  <p className="font-semibold">{roadmapData.milestones.length} Phases</p>
                </div>
              </div>

              <AnimatedProgress value={roadmapData.progress} showLabel={false} />
            </div>
          </GlassCard>
        </motion.div>

        <SectionHeader
          title="Learning Journey"
          subtitle="Follow your personalized path with AI-guided milestones"
        />

        {/* Timeline */}
        <div className="space-y-6">
          {roadmapData.milestones.map((milestone, index) => {
            const isSelected = selectedMilestone === index;
            const Icon =
              milestone.status === "completed"
                ? CheckCircle
                : milestone.status === "in-progress"
                ? Circle
                : Lock;

            const iconColor =
              milestone.status === "completed"
                ? "text-secondary"
                : milestone.status === "in-progress"
                ? "text-primary"
                : "text-muted-foreground";

            const borderColor =
              milestone.status === "completed"
                ? "border-secondary/30"
                : milestone.status === "in-progress"
                ? "border-primary/30"
                : "border-border";

            const glowColor =
              milestone.status === "completed"
                ? ("secondary" as const)
                : milestone.status === "in-progress"
                ? ("primary" as const)
                : ("accent" as const);

            return (
              <motion.div
                key={milestone.id}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Timeline Line */}
                {index < roadmapData.milestones.length - 1 && (
                  <div
                    className={`absolute left-6 top-20 w-0.5 h-full ${
                      milestone.status === "completed" ? "bg-secondary/30" : "bg-border"
                    }`}
                  />
                )}

                <GlassCard
                  hover={milestone.status !== "locked"}
                  glow={milestone.status !== "locked"}
                  glowColor={glowColor}
                  className={`border-2 ${borderColor} cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-primary/50" : ""
                  }`}
                  onClick={() =>
                    milestone.status !== "locked" && setSelectedMilestone(index)
                  }
                >
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-full border-2 ${borderColor} flex items-center justify-center ${
                          milestone.status !== "locked" ? "bg-card/80" : "bg-muted/20"
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                      </div>
                      {milestone.status === "completed" && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <CheckCircle className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-semibold mb-1">{milestone.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {milestone.duration}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                milestone.status === "completed"
                                  ? "bg-secondary/20 text-secondary"
                                  : milestone.status === "in-progress"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-muted/20 text-muted-foreground"
                              }`}
                            >
                              {milestone.status === "completed"
                                ? "Completed"
                                : milestone.status === "in-progress"
                                ? "In Progress"
                                : "Locked"}
                            </span>
                          </div>
                        </div>
                        {milestone.status !== "locked" && (
                          <GradientIconWrapper
                            size="sm"
                            gradient={
                              milestone.status === "completed" ? "cyan" : "purple"
                            }
                            glow
                          >
                            <BookOpen className="w-5 h-5 text-white" />
                          </GradientIconWrapper>
                        )}
                      </div>

                      {/* Modules */}
                      {isSelected && (
                        <motion.div
                          className="space-y-2 mt-4"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {milestone.modules.map((module) => (
                            <div
                              key={module.name}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                module.completed
                                  ? "bg-secondary/10 border border-secondary/20"
                                  : milestone.status === "in-progress"
                                  ? "bg-primary/5 border border-primary/10"
                                  : "bg-muted/5 border border-border"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {module.completed ? (
                                  <CheckCircle className="w-5 h-5 text-secondary" />
                                ) : milestone.status === "in-progress" ? (
                                  <Circle className="w-5 h-5 text-primary" />
                                ) : (
                                  <Lock className="w-5 h-5 text-muted-foreground" />
                                )}
                                <span
                                  className={
                                    module.completed || milestone.status === "in-progress"
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {module.name}
                                </span>
                              </div>
                              {!module.completed && milestone.status === "in-progress" && (
                                <button type="button" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1">
                                  <Play className="w-4 h-4" />
                                  Start
                                </button>
                              )}
                            </div>
                          ))}

                          {milestone.status === "in-progress" && (
                            <GlowButton variant="primary" className="w-full mt-4">
                              Continue Learning
                            </GlowButton>
                          )}
                          {milestone.status === "completed" && (
                            <div className="flex items-center justify-center gap-2 p-3 bg-secondary/10 rounded-lg border border-secondary/20 mt-4">
                              <Star className="w-5 h-5 text-secondary" />
                              <span className="text-secondary font-medium">Milestone Completed!</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* AI Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <GlassCard glow glowColor="accent">
            <div className="flex items-start gap-4">
              <GradientIconWrapper size="md" gradient="blue" glow>
                <Code className="w-6 h-6 text-white" />
              </GradientIconWrapper>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">AI Learning Suggestion</h3>
                <p className="text-muted-foreground mb-4">
                  Based on your progress, we recommend focusing on RNNs & NLP next. This module
                  builds directly on your current skills and is critical for your AI Engineer
                  career path. Estimated completion: 2 weeks at your current pace.
                </p>
                <GlowButton variant="accent">
                  Start RNNs & NLP Module
                </GlowButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
