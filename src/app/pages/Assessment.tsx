import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Calculator,
  Check,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  Phone,
  Search,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

type Phase = "onboarding" | "discovery" | 1 | 2 | 3 | "done";
type FunnelLevel = "General" | "Specific" | "Specialization" | "Depth";

interface BaselineData {
  name: string;
  contactInfo: string;
  age: string;
  tenthScore: string;
  tenthBoard: string;
  twelfthScore: string;
  twelfthBoard: string;
  currentCourse: string;
  cgpa: string;
  careerPath: string;
  domain: string;
  targetJobRole: string;
  experience: string;
  skills: string;
  hobbies: string;
}

interface ManualQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  skill: string;
  difficulty: "easy" | "medium" | "hard";
}

const DISCOVERY_QUESTIONS = [
  {
    id: "energize",
    question: "What types of activities naturally energize you?",
    type: "multiple",
    options: ["Solving puzzles", "Helping people", "Building things", "Analyzing data", "Leading teams", "Creative writing"],
  },
  {
    id: "drain",
    question: "What types of tasks drain your energy?",
    type: "multiple",
    options: ["Repetitive data entry", "Public speaking", "Isolated coding", "Heavy math", "Customer support", "Routine meetings"],
  },
  {
    id: "interest",
    question: "Which broad area sounds the most interesting right now?",
    type: "single",
    options: ["Technology & Engineering", "Government/Public Policy", "Business", "Social Impact"],
  },
] as const;

const DOMAIN_QUESTIONS: Record<string, ManualQuestion[]> = {
  Cybersecurity: [
    {
      id: "cyber_1",
      question: "Which protocol is used to securely log into a remote server?",
      options: ["HTTP", "FTP", "SSH", "Telnet"],
      correctAnswer: "SSH",
      skill: "networking",
      difficulty: "easy",
    },
    {
      id: "cyber_2",
      question: "What does a firewall primarily do?",
      options: ["Speeds up the internet", "Filters incoming and outgoing traffic", "Stores passwords", "Deletes viruses"],
      correctAnswer: "Filters incoming and outgoing traffic",
      skill: "networking",
      difficulty: "easy",
    },
    {
      id: "cyber_3",
      question: "Which command is used to change file permissions in Linux?",
      options: ["chmod", "chown", "ls", "pwd"],
      correctAnswer: "chmod",
      skill: "linux",
      difficulty: "medium",
    },
  ],
  "MERN Stack": [
    {
      id: "mern_1",
      question: "What is the purpose of useEffect in React?",
      options: ["To create a new component", "To handle side effects", "To style components", "To manage global state"],
      correctAnswer: "To handle side effects",
      skill: "react",
      difficulty: "medium",
    },
    {
      id: "mern_2",
      question: "Which of the following is a NoSQL database?",
      options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"],
      correctAnswer: "MongoDB",
      skill: "mongodb",
      difficulty: "easy",
    },
    {
      id: "mern_3",
      question: "What does Node.js use to handle asynchronous operations?",
      options: ["Multi-threading", "Event Loop", "Sequential execution", "Wait-and-see approach"],
      correctAnswer: "Event Loop",
      skill: "node",
      difficulty: "medium",
    },
  ],
  "Data Science": [
    {
      id: "ds_1",
      question: "Which library is most commonly used for data manipulation in Python?",
      options: ["Matplotlib", "Pandas", "Requests", "Pygame"],
      correctAnswer: "Pandas",
      skill: "python",
      difficulty: "easy",
    },
    {
      id: "ds_2",
      question: "What is overfitting in machine learning?",
      options: ["A model fits training data but performs poorly on unseen data", "A model is too simple", "The dataset is too small", "Training takes too long"],
      correctAnswer: "A model fits training data but performs poorly on unseen data",
      skill: "machine_learning",
      difficulty: "medium",
    },
  ],
  "Still Exploring": [
    {
      id: "general_1",
      question: "Which habit best supports exploring a new career direction?",
      options: ["Testing small projects", "Avoiding feedback", "Only reading theory", "Waiting for perfect certainty"],
      correctAnswer: "Testing small projects",
      skill: "career_exploration",
      difficulty: "easy",
    },
    {
      id: "general_2",
      question: "What is the best first signal that a role may fit you?",
      options: ["Energy during realistic tasks", "A trending job title", "A friend's choice", "A long course list"],
      correctAnswer: "Energy during realistic tasks",
      skill: "self_awareness",
      difficulty: "easy",
    },
  ],
};

const FUNNEL_LEVELS: FunnelLevel[] = ["General", "Specific", "Specialization", "Depth"];

export function Assessment() {
  const [phase, setPhase] = useState<Phase>("onboarding");
  const [formData, setFormData] = useState<BaselineData>({
    name: "",
    contactInfo: "",
    age: "",
    tenthScore: "",
    tenthBoard: "",
    twelfthScore: "",
    twelfthBoard: "",
    currentCourse: "",
    cgpa: "",
    careerPath: "",
    domain: "",
    targetJobRole: "",
    experience: "",
    skills: "",
    hobbies: "",
  });
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [discoveryStep, setDiscoveryStep] = useState(0);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<Record<string, string | string[]>>({});
  const [phase2Answers, setPhase2Answers] = useState<Record<string, string>>({});
  const [phase3LevelIndex, setPhase3LevelIndex] = useState(0);
  const [phase3QuestionCount, setPhase3QuestionCount] = useState(0);

  const domain = formData.domain || formData.careerPath || "Still Exploring";
  const domainQuestions = DOMAIN_QUESTIONS[domain] || DOMAIN_QUESTIONS["MERN Stack"];
  const currentDiscoveryQuestion = DISCOVERY_QUESTIONS[discoveryStep];
  const discoveryCanContinue = useMemo(() => {
    const answer = discoveryAnswers[currentDiscoveryQuestion.id];
    return currentDiscoveryQuestion.type === "single" ? Boolean(answer) : Array.isArray(answer) && answer.length > 0;
  }, [currentDiscoveryQuestion, discoveryAnswers]);
  const currentFunnelLevel = FUNNEL_LEVELS[phase3LevelIndex];

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handlePreparedContinue() {
    if (!formData.careerPath || !formData.domain || !formData.targetJobRole || !formData.experience) return;
    setPhase(2);
  }

  async function handleResumeUpload() {
    setIsParsingResume(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setFormData((current) => ({
      ...current,
      careerPath: current.careerPath || "Software Development",
      domain: current.domain || "MERN Stack",
      targetJobRole: current.targetJobRole || "Frontend Engineer",
      experience: current.experience || "Fresher",
      skills: current.skills || "React, JavaScript, Node.js",
    }));
    setIsParsingResume(false);
    setPhase(1);
  }

  function handleDiscoveryToggle(option: string) {
    const question = currentDiscoveryQuestion;
    if (question.type === "single") {
      setDiscoveryAnswers((current) => ({ ...current, [question.id]: option }));
      return;
    }

    const currentAnswer = (discoveryAnswers[question.id] as string[] | undefined) || [];
    setDiscoveryAnswers((current) => ({
      ...current,
      [question.id]: currentAnswer.includes(option)
        ? currentAnswer.filter((answer) => answer !== option)
        : [...currentAnswer, option],
    }));
  }

  function handleDiscoveryNext() {
    if (discoveryStep < DISCOVERY_QUESTIONS.length - 1) {
      setDiscoveryStep((current) => current + 1);
      return;
    }

    const interest = String(discoveryAnswers.interest || "Still Exploring");
    setFormData((current) => ({
      ...current,
      careerPath: "Still Exploring",
      domain: mapInterestToDomain(interest),
      targetJobRole: interest.includes("Government") ? "Public Sector Aspirant" : "Emerging Career Explorer",
      experience: "Beginner",
      skills: mergeCsv(current.skills, toArray(discoveryAnswers.energize)),
      hobbies: mergeCsv(current.hobbies, [interest]),
    }));
    setPhase(2);
  }

  function handlePhase2Complete() {
    if (domainQuestions.some((question) => !phase2Answers[question.id])) return;
    setPhase(3);
  }

  function handlePhase3Submit() {
    const nextCount = phase3QuestionCount + 1;
    if (phase3LevelIndex === FUNNEL_LEVELS.length - 1 && nextCount >= 2) {
      setPhase("done");
      return;
    }

    if (nextCount >= 2) {
      setPhase3LevelIndex((current) => Math.min(current + 1, FUNNEL_LEVELS.length - 1));
      setPhase3QuestionCount(0);
      return;
    }

    setPhase3QuestionCount(nextCount);
  }

  return (
    <div className="min-h-screen relative overflow-hidden px-6 py-12 pt-32">
      <NeuralBackground />
      <FloatingParticles count={25} />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <BrainCircuit className="h-4 w-4" />
            Pre-Assessment Onboarding
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Pragyan Assessment
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

        <AnimatePresence mode="wait">
          {phase === "onboarding" && (
            <MotionStep key="onboarding">
              <PreAssessmentForm
                formData={formData}
                isParsingResume={isParsingResume}
                onInputChange={handleInputChange}
                onResumeUpload={() => void handleResumeUpload()}
                onPreparedContinue={handlePreparedContinue}
                onExplore={() => setPhase("discovery")}
              />
            </MotionStep>
          )}

          {phase === "discovery" && (
            <MotionStep key="discovery">
              <SkillsDiscovery
                currentStep={discoveryStep}
                answers={discoveryAnswers}
                question={currentDiscoveryQuestion}
                canContinue={discoveryCanContinue}
                onToggle={handleDiscoveryToggle}
                onPrevious={() => (discoveryStep > 0 ? setDiscoveryStep((current) => current - 1) : setPhase("onboarding"))}
                onNext={handleDiscoveryNext}
              />
            </MotionStep>
          )}

          {phase === 1 && (
            <MotionStep key="phase1">
              <Phase1 formData={formData} onInputChange={handleInputChange} onContinue={handlePreparedContinue} />
            </MotionStep>
          )}

          {phase === 2 && (
            <MotionStep key="phase2">
              <Phase2
                domain={domain}
                questions={domainQuestions}
                answers={phase2Answers}
                onAnswer={(id, answer) => setPhase2Answers((current) => ({ ...current, [id]: answer }))}
                onContinue={handlePhase2Complete}
              />
            </MotionStep>
          )}

          {phase === 3 && (
            <MotionStep key="phase3">
              <Phase3
                level={currentFunnelLevel}
                questionCount={phase3QuestionCount}
                domain={domain}
                onSubmit={handlePhase3Submit}
              />
            </MotionStep>
          )}

          {phase === "done" && (
            <MotionStep key="done">
              <PhaseDone domain={domain} answers={phase2Answers} questions={domainQuestions} />
            </MotionStep>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PreAssessmentForm({
  formData,
  isParsingResume,
  onInputChange,
  onResumeUpload,
  onPreparedContinue,
  onExplore,
}: {
  formData: BaselineData;
  isParsingResume: boolean;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onResumeUpload: () => void;
  onPreparedContinue: () => void;
  onExplore: () => void;
}) {
  const canContinue = Boolean(formData.careerPath && formData.domain && formData.targetJobRole && formData.experience);

  return (
    <GlassCard glow className="p-6 md:p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <IconInput icon={User} id="name" name="name" label="Name" placeholder="John Doe" value={formData.name} onChange={onInputChange} />
          <IconInput icon={Phone} id="contactInfo" name="contactInfo" label="Contact info" placeholder="Email or phone" value={formData.contactInfo} onChange={onInputChange} />
          <IconInput icon={Calculator} id="age" name="age" type="number" label="Age" placeholder="21" value={formData.age} onChange={onInputChange} />
          <IconInput icon={GraduationCap} id="careerPath" name="careerPath" label="Career path" placeholder="Software Development" value={formData.careerPath} onChange={onInputChange} />
          <SelectField id="domain" name="domain" label="Domain" value={formData.domain} onChange={onInputChange}>
            <option value="">Select domain</option>
            <option value="MERN Stack">MERN Stack</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Data Science">Data Science</option>
            <option value="Still Exploring">Still Exploring</option>
          </SelectField>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <PlainInput id="tenthScore" name="tenthScore" label="10th score" placeholder="90%" value={formData.tenthScore} onChange={onInputChange} />
            <PlainInput id="tenthBoard" name="tenthBoard" label="10th board" placeholder="CBSE" value={formData.tenthBoard} onChange={onInputChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PlainInput id="twelfthScore" name="twelfthScore" label="12th score" placeholder="85%" value={formData.twelfthScore} onChange={onInputChange} />
            <PlainInput id="twelfthBoard" name="twelfthBoard" label="12th board" placeholder="ISC" value={formData.twelfthBoard} onChange={onInputChange} />
          </div>
          <IconInput icon={BookOpen} id="currentCourse" name="currentCourse" label="Current course" placeholder="B.Tech Computer Science" value={formData.currentCourse} onChange={onInputChange} />
          <PlainInput id="cgpa" name="cgpa" label="CGPA / percentage" placeholder="8.5" value={formData.cgpa} onChange={onInputChange} />
          <PlainInput id="targetJobRole" name="targetJobRole" label="Target job role" placeholder="Frontend Engineer" value={formData.targetJobRole} onChange={onInputChange} />
          <PlainInput id="experience" name="experience" label="Experience" placeholder="Fresher, 2 years" value={formData.experience} onChange={onInputChange} />
        </div>
      </div>

      <div className="mt-8 grid gap-4 border-t border-border/60 pt-6 md:grid-cols-2">
        <div className="rounded-lg border border-dashed border-primary/35 bg-primary/5 p-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Path A: Prepared User</h3>
          <p className="mt-1 text-xs text-muted-foreground">Use resume parsing or continue after filling your baseline.</p>
          <GlowButton variant="primary" onClick={onResumeUpload} disabled={isParsingResume} className="mt-4 w-full">
            {isParsingResume ? "Parsing..." : "Simulate Resume Parse"}
          </GlowButton>
          <GlowButton variant="secondary" onClick={onPreparedContinue} disabled={!canContinue} className="mt-3 w-full">
            Continue to Phase 2
            <ArrowRight className="ml-2 inline h-4 w-4" />
          </GlowButton>
        </div>

        <div className="rounded-lg border border-accent/25 bg-accent/5 p-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Path B: Still Exploring</h3>
          <p className="mt-1 text-xs text-muted-foreground">Answer a short bridge to choose a starting pathway.</p>
          <GlowButton variant="accent" onClick={onExplore} className="mt-4 w-full">
            I am exploring
            <ArrowRight className="ml-2 inline h-4 w-4" />
          </GlowButton>
        </div>
      </div>
    </GlassCard>
  );
}

function SkillsDiscovery({
  currentStep,
  answers,
  question,
  canContinue,
  onToggle,
  onPrevious,
  onNext,
}: {
  currentStep: number;
  answers: Record<string, string | string[]>;
  question: (typeof DISCOVERY_QUESTIONS)[number];
  canContinue: boolean;
  onToggle: (option: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const currentAnswer = answers[question.id];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          Skills Discovery Bridge
        </div>
        <h2 className="text-2xl font-semibold text-foreground">Discover Your Starting Point</h2>
        <p className="mt-1 text-sm text-muted-foreground">Question {currentStep + 1} of {DISCOVERY_QUESTIONS.length}</p>
      </div>
      <GlassCard glow glowColor="primary" className="p-6">
        <div className="mb-6 h-1 overflow-hidden rounded-full bg-border/40">
          <div className="h-full bg-primary transition-all" style={{ width: `${((currentStep + 1) / DISCOVERY_QUESTIONS.length) * 100}%` }} />
        </div>
        <h3 className="text-xl font-semibold leading-tight text-foreground">{question.question}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{question.type === "multiple" ? "Select all that apply" : "Select one option"}</p>
        <div className="mt-6 grid gap-3">
          {question.options.map((option) => {
            const selected = question.type === "single" ? currentAnswer === option : (currentAnswer as string[] | undefined)?.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={`flex min-h-14 w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                  selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/40 text-foreground hover:border-primary/45"
                }`}
              >
                <span>{option}</span>
                {selected ? <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span> : null}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={onPrevious} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <GlowButton variant="primary" onClick={onNext} disabled={!canContinue}>
            {currentStep === DISCOVERY_QUESTIONS.length - 1 ? "Finish Discovery" : "Continue"}
            <ArrowRight className="ml-2 inline h-4 w-4" />
          </GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}

function Phase1({ formData, onInputChange, onContinue }: { formData: BaselineData; onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void; onContinue: () => void }) {
  return (
    <GlassCard glow className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/20 p-2 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Phase 1: Career Identity</h2>
          <p className="text-sm text-muted-foreground">Define your target trajectory.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PlainInput label="Target career path" name="careerPath" placeholder="Software Development" value={formData.careerPath} onChange={onInputChange} />
        <PlainInput label="Domain" name="domain" placeholder="MERN Stack" value={formData.domain} onChange={onInputChange} />
        <PlainInput label="Target job role" name="targetJobRole" placeholder="Frontend Engineer" value={formData.targetJobRole} onChange={onInputChange} />
        <PlainInput label="Experience level" name="experience" placeholder="Fresher" value={formData.experience} onChange={onInputChange} />
      </div>
      <GlowButton onClick={onContinue} className="w-full">
        Continue to Phase 2
        <ArrowRight className="ml-2 inline h-4 w-4" />
      </GlowButton>
    </GlassCard>
  );
}

function Phase2({
  domain,
  questions,
  answers,
  onAnswer,
  onContinue,
}: {
  domain: string;
  questions: ManualQuestion[];
  answers: Record<string, string>;
  onAnswer: (id: string, answer: string) => void;
  onContinue: () => void;
}) {
  const complete = questions.every((question) => answers[question.id]);

  return (
    <GlassCard glow glowColor="secondary" className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-secondary/20 p-2 text-secondary">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Phase 2: Domain Baseline</h2>
          <p className="text-sm text-muted-foreground">Validating core knowledge in {domain}.</p>
        </div>
      </div>
      <div className="space-y-5">
        {questions.map((question) => (
          <div key={question.id} className="rounded-lg border border-border bg-background/50 p-4">
            <p className="font-medium text-foreground">{question.question}</p>
            <div className="mt-3 grid gap-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onAnswer(question.id, option)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                    answers[question.id] === option ? "border-secondary bg-secondary/10 text-secondary" : "border-border bg-card/30 hover:border-secondary/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <GlowButton variant="secondary" onClick={onContinue} disabled={!complete} className="mt-6 w-full">
        Enter Adaptive Assessment
        <ArrowRight className="ml-2 inline h-4 w-4" />
      </GlowButton>
    </GlassCard>
  );
}

function Phase3({ level, questionCount, domain, onSubmit }: { level: FunnelLevel; questionCount: number; domain: string; onSubmit: () => void }) {
  return (
    <GlassCard glow glowColor="accent" className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Phase 3: Adaptive Depth</h2>
          <p className="text-sm text-muted-foreground">Strict funnel level: {level}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FUNNEL_LEVELS.map((funnelLevel) => (
            <span key={funnelLevel} className={`rounded-md px-2.5 py-1 text-xs font-medium ${level === funnelLevel ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
              {funnelLevel}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-accent/15 bg-accent/5 p-6">
        <p className="text-lg font-medium italic">
          How would you approach a {level.toLowerCase()} {domain} challenge when your first solution does not work?
        </p>
      </div>
      <div className="mt-5 grid gap-3">
        {["Break the problem into smaller signals", "Search for a ready-made answer only", "Skip the topic", "Guess and move on"].map((option) => (
          <button key={option} type="button" className="rounded-lg border border-border bg-card/30 p-4 text-left transition hover:border-accent/50 hover:bg-accent/5">
            {option}
          </button>
        ))}
      </div>
      <GlowButton variant="accent" onClick={onSubmit} className="mt-6 w-full">
        Submit Answer {questionCount + 1}/2
      </GlowButton>
    </GlassCard>
  );
}

function PhaseDone({ domain, answers, questions }: { domain: string; answers: Record<string, string>; questions: ManualQuestion[] }) {
  const correct = questions.filter((question) => answers[question.id] === question.correctAnswer).length;
  const weakSkills = questions.filter((question) => answers[question.id] !== question.correctAnswer).map((question) => question.skill);

  return (
    <GlassCard glow className="p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Check className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-bold">Assessment Complete</h2>
      <p className="mt-2 text-muted-foreground">Your {domain} baseline is ready for roadmap generation.</p>
      <div className="mt-6 rounded-lg border border-border bg-background/50 p-4 text-left text-sm">
        <p><span className="font-semibold text-foreground">Phase 2 score:</span> {correct}/{questions.length}</p>
        <p><span className="font-semibold text-foreground">Skill gaps:</span> {weakSkills.join(", ") || "None detected"}</p>
        <p><span className="font-semibold text-foreground">Recommended mode:</span> {correct >= questions.length - 1 ? "Stretch" : "Growth"}</p>
      </div>
    </GlassCard>
  );
}

function MotionStep({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  );
}

function IconInput({ icon: Icon, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</Label>
      <Input {...props} className={`bg-background/50 ${props.className || ""}`} />
    </div>
  );
}

function PlainInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id || props.name}>{label}</Label>
      <Input {...props} className={`bg-background/50 ${props.className || ""}`} />
    </div>
  );
}

function SelectField({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <select {...props} className="rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/40">
        {children}
      </select>
    </label>
  );
}

function mapInterestToDomain(interest: string) {
  if (interest.includes("Technology")) return "MERN Stack";
  if (interest.includes("Government")) return "Still Exploring";
  if (interest.includes("Business")) return "Still Exploring";
  return "Still Exploring";
}

function toArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function mergeCsv(existing: string, additions: string[]) {
  return Array.from(new Set([...existing.split(",").map((item) => item.trim()).filter(Boolean), ...additions])).join(", ");
}

function phaseLabel(phase: Phase) {
  if (phase === "onboarding") return "Baseline data collection";
  if (phase === "discovery") return "Skills discovery bridge";
  if (phase === 1) return "Phase 1: career identity";
  if (phase === 2) return "Phase 2: domain baseline";
  if (phase === 3) return "Phase 3: adaptive depth";
  return "Assessment complete";
}
