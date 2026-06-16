import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Brain, Check, ArrowRight, Sparkles } from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { AIThinkingLoader } from "../components/AIThinkingLoader";
import { AnimatedProgress } from "../components/AnimatedProgress";

const categories = [
  "Interests & Passions",
  "Skills & Abilities",
  "Work Style Preferences",
  "Values & Goals",
  "Personality Traits"
];

const sampleQuestions = [
  {
    category: "Interests & Passions",
    question: "Which activities energize you the most?",
    options: [
      "Solving complex technical problems",
      "Creating and designing new things",
      "Leading and organizing teams",
      "Analyzing data and finding patterns"
    ]
  },
  {
    category: "Skills & Abilities",
    question: "What are you naturally good at?",
    options: [
      "Logical thinking and problem-solving",
      "Creative expression and innovation",
      "Communication and collaboration",
      "Strategic planning and execution"
    ]
  },
  {
    category: "Work Style Preferences",
    question: "How do you prefer to work?",
    options: [
      "Independently with deep focus",
      "In collaborative team environments",
      "With flexible schedules and autonomy",
      "In structured, organized settings"
    ]
  }
];

export function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(0);

  const totalQuestions = sampleQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleAnswer = (optionIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: optionIndex });
  };

  const handleNext = () => {
    if (selectedAnswers[currentQuestion] !== undefined) {
      setIsThinking(true);

      setTimeout(() => {
        setIsThinking(false);
        if (currentQuestion < totalQuestions - 1) {
          setCurrentQuestion(currentQuestion + 1);
          if ((currentQuestion + 1) % 5 === 0 && currentCategory < categories.length - 1) {
            setCurrentCategory(currentCategory + 1);
          }
        } else {
          console.log("Assessment complete!");
        }
      }, 2000);
    }
  };

  const question = sampleQuestions[currentQuestion];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12 pt-32">
      <NeuralBackground />
      <FloatingParticles count={25} />

      <div className="max-w-4xl mx-auto w-full z-10 space-y-6">
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              {categories[currentCategory]}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            AI Career Assessment
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Answer thoughtfully - our AI adapts questions based on your responses
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
              </div>
              <AnimatedProgress value={progress} max={100} showLabel={false} />

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {categories.map((cat, i) => (
                  <div
                    key={cat}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      i === currentCategory
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : i < currentCategory
                        ? "bg-secondary/20 text-secondary border border-secondary/30"
                        : "bg-muted/20 text-muted-foreground border border-border"
                    }`}
                  >
                    {i < currentCategory && <Check className="w-3 h-3 inline mr-1" />}
                    {cat}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* AI Thinking State */}
        <AnimatePresence mode="wait">
          {isThinking ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard glow glowColor="primary" className="py-16">
                <AIThinkingLoader
                  message={
                    currentQuestion % 3 === 0
                      ? "Analyzing your interests..."
                      : currentQuestion % 3 === 1
                      ? "Matching personality patterns..."
                      : "Generating career pathways..."
                  }
                  size="lg"
                />
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key={`question-${currentQuestion}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <GlassCard glow glowColor="accent" className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl" />

                <div className="relative z-10 space-y-6">
                  {/* Question */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-accent mb-3">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-medium">AI-Adaptive Question</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold">
                      {question.question}
                    </h2>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {question.options.map((option, i) => {
                      const isSelected = selectedAnswers[currentQuestion] === i;
                      return (
                        <motion.button type="button"
                          key={option}
                          onClick={() => handleAnswer(i)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 bg-card/30 hover:bg-card/50"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isSelected && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              transition={{ duration: 0.6 }}
                            />
                          )}
                          <div className="relative flex items-center justify-between">
                            <span className="font-medium">{option}</span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4">
                    <button type="button"
                      onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                      disabled={currentQuestion === 0}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Previous
                    </button>
                    <GlowButton
                      variant="primary"
                      onClick={handleNext}
                      disabled={selectedAnswers[currentQuestion] === undefined}
                    >
                      {currentQuestion === totalQuestions - 1 ? "Complete" : "Next"}
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </GlowButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Text */}
        <motion.p
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your responses are analyzed in real-time by our AI to provide the most accurate career matches
        </motion.p>
      </div>
    </div>
  );
}
