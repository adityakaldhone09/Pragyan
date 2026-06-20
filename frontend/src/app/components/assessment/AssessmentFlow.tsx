import { useMemo, useState } from "react";
import type React from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  Check,
  ChevronLeft,
  FileText,
  GraduationCap,
  Loader2,
  Phone,
  Search,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router";
import { assessmentService } from "@/services/assessmentService";
import type {
  HybridAssessmentQuestion,
  HybridCareerTrack,
  HybridDomainAnswer,
  HybridDomainQuestion,
  HybridFunnelLevel,
  HybridStateMachineResponse,
  HybridUserAssessmentAnswerInput,
  HybridUserProfile,
} from "@/services/assessmentService";
import { useAuth } from "@/context/useAuth";
import { cn } from "@/app/utils/cn";
import { GlassCard } from "@/app/components/GlassCard";
import { GlowButton } from "@/app/components/GlowButton";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

const FUNNEL_LEVELS: HybridFunnelLevel[] = ["General", "Specific", "Specialization", "Depth"];
const CAREER_TRACKS: HybridCareerTrack[] = ["Government Job", "Private Job"];
const EXPERIENCE_OPTIONS: HybridUserProfile["experience"][] = ["beginner", "intermediate", "advanced"];
const DOMAIN_OPTIONS = [
  { value: "mern-stack", label: "MERN Stack" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "data-science", label: "Data Science" },
  { value: "civil-services", label: "Civil Services / Govt Exams" },
  { value: "business", label: "Business / Entrepreneurship" },
  { value: "general", label: "Still Exploring" },
];
const MAX_QUESTIONS = 20;

type Phase = "gateway" | "onboarding" | "discovery" | 2 | 3 | "done";

type BaselineFormData = {
  name: string;
  contactInfo: string;
  age: string;
  tenthScore: string;
  tenthBoard: string;
  twelfthScore: string;
  twelfthBoard: string;
  currentCourse: string;
  cgpa: string;
  role: string;
  domain: string;
  careerTrack: HybridCareerTrack | "";
  experience: HybridUserProfile["experience"];
  hobbies: string;
  interests: string;
  currentSkills: string;
};

const DISCOVERY_QUESTIONS = [
  {
    id: "energize",
    question: "What types of activities naturally energize you?",
    type: "multiple",
    options: [
      "Solving complex puzzles",
      "Helping people directly",
      "Building and creating things",
      "Analyzing data and finding patterns",
      "Leading and managing teams",
      "Creative writing or artistic expression",
      "Learning new technologies",
      "Mentoring others",
      "Public speaking and presenting",
      "Organizing and planning events",
    ],
  },
  {
    id: "drain",
    question: "What types of tasks drain your energy?",
    type: "multiple",
    options: [
      "Repetitive data entry or administrative tasks",
      "Extensive public speaking or networking",
      "Isolated coding or deep technical work",
      "Heavy mathematical calculations",
      "Customer support or conflict resolution",
      "Routine meetings with little outcome",
      "Strictly following established procedures",
      "Unstructured problem-solving",
      "Working under tight deadlines consistently",
      "Managing multiple projects simultaneously",
    ],
  },
  {
    id: "interest",
    question: "Which broad area sounds the most interesting right now?",
    type: "single",
    options: [
      "Technology & Engineering",
      "Government/Public Policy & Law",
      "Business & Finance",
      "Social Impact & Non-profit",
      "Healthcare & Medicine",
      "Arts, Culture & Design",
      "Education & Research",
      "Skilled Trades & Manufacturing",
    ],
  },
] as const;

export default function AssessmentFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateProfile, reloadUser } = useAuth();
  const [phase, setPhase] = useState<Phase>(() => phaseFromPath(location.pathname));
  const [formData, setFormData] = useState<BaselineFormData>(() => ({
    name: user?.fullName || "",
    contactInfo: user?.phone || user?.email || "",
    age: user?.age ? String(user.age) : "",
    tenthScore: user?.tenthScore || "",
    tenthBoard: user?.tenthBoard || "",
    twelfthScore: user?.twelfthScore || "",
    twelfthBoard: user?.twelfthBoard || "",
    currentCourse: user?.currentCourse || user?.education || "",
    cgpa: user?.cgpa || "",
    role: user?.currentTitle || user?.role || "Student",
    domain: user?.interests?.[0] || "",
    careerTrack: CAREER_TRACKS.includes(user?.careerTrack as HybridCareerTrack) ? (user?.careerTrack as HybridCareerTrack) : "",
    experience: normalizeExperience(user?.experience),
    hobbies: "",
    interests: (user?.interests || []).join(", "),
    currentSkills: (user?.skills || []).join(", "),
  }));
  const [profile, setProfile] = useState<HybridUserProfile | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [parseConfidence, setParseConfidence] = useState<number | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const [discoveryStep, setDiscoveryStep] = useState(0);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<Record<string, string | string[]>>({});

  const [domainQuestions, setDomainQuestions] = useState<HybridDomainQuestion[]>([]);
  const [domainAnswers, setDomainAnswers] = useState<Record<string, number>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentFunnelLevel, setCurrentFunnelLevel] = useState<HybridFunnelLevel>("General");
  const [currentQuestion, setCurrentQuestion] = useState<HybridAssessmentQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isLoadingTurn, setIsLoadingTurn] = useState(false);
  const [finalSummary, setFinalSummary] = useState<HybridStateMachineResponse["finalSummary"] | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);

  const currentDiscoveryQuestion = DISCOVERY_QUESTIONS[discoveryStep];
  const discoveryCanContinue = useMemo(() => {
    const answer = discoveryAnswers[currentDiscoveryQuestion.id];
    return currentDiscoveryQuestion.type === "single" ? Boolean(answer) : Array.isArray(answer) && answer.length > 0;
  }, [currentDiscoveryQuestion, discoveryAnswers]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleResumeUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeFileName(file.name);
    setIsParsingResume(true);

    try {
      const resumeText = await extractResumeText(file);
      const parsed = await assessmentService.parseHybridResume(resumeText);
      const inferredDomain = inferDomain(parsed.Skills, parsed.Experience);

      setFormData((current) => ({
        ...current,
        contactInfo: parsed.ContactInfo || current.contactInfo,
        currentCourse: parsed.Education || current.currentCourse,
        role: inferRole(parsed.Experience, current.role),
        domain: current.domain || inferredDomain,
        experience: inferExperience(parsed.Experience),
        currentSkills: mergeCsv(current.currentSkills, parsed.Skills),
      }));
      setParseConfidence(parsed.confidence ?? null);
      toast.success(`Resume parsed${parsed.confidence ? ` with ${Math.round(parsed.confidence * 100)}% confidence` : ""}.`);
      setPhase("onboarding");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not parse resume. Fill the baseline manually.");
    } finally {
      setIsParsingResume(false);
      event.target.value = "";
    }
  }

  async function handlePreparedContinue() {
    const nextProfile = buildProfile(formData, user?.id || "anonymous");
    if (!validateBaseline(nextProfile)) return;
    await startPhase2(nextProfile, true);
  }

  function handleDiscoveryToggle(option: string) {
    const question = currentDiscoveryQuestion;
    if (question.type === "single") {
      setDiscoveryAnswers((current) => ({ ...current, [question.id]: option }));
      return;
    }

    const selected = (discoveryAnswers[question.id] as string[] | undefined) || [];
    setDiscoveryAnswers((current) => ({
      ...current,
      [question.id]: selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    }));
  }

  async function handleDiscoveryNext() {
    if (discoveryStep < DISCOVERY_QUESTIONS.length - 1) {
      setDiscoveryStep((current) => current + 1);
      return;
    }

    const interest = String(discoveryAnswers.interest || "Still Exploring");
    const discoveredProfile = buildProfile(
      {
        ...formData,
        domain: mapInterestToDomain(interest),
        careerTrack: interest.includes("Government") ? "Government Job" : formData.careerTrack || "Private Job",
        interests: mergeCsv(formData.interests, [interest, ...toArray(discoveryAnswers.energize)]),
        currentSkills: mergeCsv(formData.currentSkills, toArray(discoveryAnswers.energize)),
        role: formData.role || "Student",
      },
      user?.id || "anonymous",
      {
        careerSubPath: "Still Exploring",
        domainExperience: `Energized by ${toArray(discoveryAnswers.energize).join(", ") || "exploration"}; drained by ${toArray(discoveryAnswers.drain).join(", ") || "unclear tasks"}`,
      }
    );

    await startPhase2(discoveredProfile, true);
  }

  async function startPhase2(nextProfile: HybridUserProfile, persistBaseline: boolean) {
    setLoadingQuestions(true);
    setIsPreparing(true);

    try {
      setProfile(nextProfile);
      if (persistBaseline && user?.id) {
        await updateProfile({
          fullName: formData.name || user.fullName,
          age: formData.age ? Number(formData.age) : undefined,
          phone: formData.contactInfo && !formData.contactInfo.includes("@") ? formData.contactInfo : undefined,
          education: formData.currentCourse || undefined,
          currentTitle: nextProfile.role,
          careerTrack: nextProfile.careerTrack,
          skills: nextProfile.currentSkills,
          interests: nextProfile.interests,
          experience: nextProfile.domainExperience || nextProfile.experience,
          tenthBoard: formData.tenthBoard || undefined,
          tenthScore: formData.tenthScore || undefined,
          twelfthBoard: formData.twelfthBoard || undefined,
          twelfthScore: formData.twelfthScore || undefined,
          currentCourse: formData.currentCourse || undefined,
          cgpa: formData.cgpa || undefined,
        });
        void reloadUser();
      }

      await assessmentService.saveHybridAnswers(buildPhase1Answers(user?.id || "authenticated-user", nextProfile));
      const data = await assessmentService.getHybridDomainQuestions(nextProfile.domain || "general");
      setDomainQuestions(data.questions);
      setDomainAnswers({});
      setPhase(2);
    } catch (error) {
      console.error(error);
      toast.error("Failed to prepare your assessment.");
    } finally {
      setLoadingQuestions(false);
      setIsPreparing(false);
    }
  }

  async function goToPhase3() {
    if (!profile) {
      toast.error("Complete the baseline first.");
      return;
    }

    const unanswered = domainQuestions.filter((question) => !domainAnswers[question.skill]);
    if (unanswered.length) {
      toast.error("Rate every skill before starting the adaptive assessment.");
      return;
    }

    setIsLoadingTurn(true);
    try {
      const answers: HybridDomainAnswer[] = domainQuestions.map((question) => ({
        skill: question.skill,
        rating: domainAnswers[question.skill],
      }));
      await assessmentService.saveHybridAnswers(
        buildPhase2Answers(user?.id || "authenticated-user", domainQuestions, domainAnswers)
      );
      const result = await assessmentService.startHybridAssessment({
        userId: user?.id || "anonymous",
        profile,
        domainAnswers: answers,
      });

      setSessionId(result.sessionId);
      setCurrentFunnelLevel(result.response.currentFunnelLevel);
      setCurrentQuestion(result.response.nextQuestion ?? null);
      setQuestionNumber(1);
      setPhase(3);
      toast(result.response.reasoningToast);
    } catch (error) {
      console.error(error);
      toast.error("Failed to start the adaptive assessment.");
    } finally {
      setIsLoadingTurn(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!sessionId || !selectedAnswer) {
      toast.error("Select or enter an answer first.");
      return;
    }

    setIsLoadingTurn(true);
    try {
      const { response } = await assessmentService.submitHybridAnswer(sessionId, selectedAnswer);
      setCurrentFunnelLevel(response.currentFunnelLevel);
      setSelectedAnswer("");
      toast(response.reasoningToast);

      if (response.isCompleted) {
        setCurrentQuestion(null);
        setFinalSummary(response.finalSummary ?? null);
        setPhase("done");
        return;
      }

      setCurrentQuestion(response.nextQuestion ?? null);
      setQuestionNumber((current) => Math.min(current + 1, MAX_QUESTIONS));
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit your answer.");
    } finally {
      setIsLoadingTurn(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-12 pt-24">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Brain className="h-4 w-4" />
            Pre-Assessment Onboarding
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Pragyan Assessment</h1>
            <p className="mt-1 text-sm text-muted-foreground">{phaseLabel(phase)}</p>
          </div>
        </header>

        {phase === "gateway" && (
          <AssessmentGateway
            isParsingResume={isParsingResume}
            onResumeUpload={handleResumeUpload}
            onManualStart={() => setPhase("onboarding")}
            onExplore={() => setPhase("discovery")}
          />
        )}

        {phase === "onboarding" && (
          <PreAssessmentForm
            formData={formData}
            isParsingResume={isParsingResume}
            isPreparing={isPreparing || loadingQuestions}
            resumeFileName={resumeFileName}
            parseConfidence={parseConfidence}
            onInputChange={handleInputChange}
            onResumeUpload={handleResumeUpload}
            onPreparedContinue={() => void handlePreparedContinue()}
            onExplore={() => setPhase("discovery")}
          />
        )}

        {phase === "discovery" && (
          <SkillsDiscovery
            currentStep={discoveryStep}
            answers={discoveryAnswers}
            question={currentDiscoveryQuestion}
            canContinue={discoveryCanContinue}
            onToggle={handleDiscoveryToggle}
            onPrevious={() => (discoveryStep > 0 ? setDiscoveryStep((current) => current - 1) : setPhase("onboarding"))}
            onNext={() => void handleDiscoveryNext()}
            loading={isPreparing || loadingQuestions}
          />
        )}

        {phase === 2 && (
          <AssessmentPanel>
            <Phase2
              questions={domainQuestions}
              answers={domainAnswers}
              onRatingChange={(skill, rating) => setDomainAnswers((current) => ({ ...current, [skill]: rating }))}
              onContinue={() => void goToPhase3()}
              loading={isLoadingTurn}
              onBack={() => setPhase("onboarding")}
            />
          </AssessmentPanel>
        )}

        {phase === 3 && (
          <AssessmentPanel>
            <Phase3
              currentFunnelLevel={currentFunnelLevel}
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={setSelectedAnswer}
              onSubmit={() => void handleSubmitAnswer()}
              loading={isLoadingTurn}
              questionNumber={questionNumber}
            />
          </AssessmentPanel>
        )}

        {phase === "done" && (
          <AssessmentPanel>
            <PhaseDone finalSummary={finalSummary} onOpenRoadmap={() => navigate("/journey")} />
          </AssessmentPanel>
        )}
      </div>
    </div>
  );
}

function AssessmentGateway({
  isParsingResume,
  onResumeUpload,
  onManualStart,
  onExplore,
}: {
  isParsingResume: boolean;
  onResumeUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onManualStart: () => void;
  onExplore: () => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <GlassCard glow glowColor="primary" className="flex flex-col p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">I have a resume</h2>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">
          Upload a text, markdown, or CSV resume and Pragyan will pre-fill your baseline before the assessment starts.
        </p>
        <input
          id="gateway-resume-upload"
          type="file"
          className="hidden"
          accept=".txt,.md,.csv"
          onChange={onResumeUpload}
          disabled={isParsingResume}
        />
        <label htmlFor="gateway-resume-upload" className="mt-6 block">
          <GlowButton variant="primary" className="w-full pointer-events-none" disabled={isParsingResume}>
            {isParsingResume ? "Parsing resume..." : "Upload Resume"}
          </GlowButton>
        </label>
        <button
          type="button"
          onClick={onManualStart}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <FileText className="h-4 w-4" />
          Fill baseline manually
        </button>
      </GlassCard>

      <GlassCard glow glowColor="accent" className="flex flex-col p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Search className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">I am still exploring</h2>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">
          Start with basic academic details, then use a short discovery bridge to map your first pathway.
        </p>
        <GlowButton variant="accent" onClick={onExplore} className="mt-6 w-full">
          Start Exploring
          <ArrowRight className="ml-2 h-4 w-4" />
        </GlowButton>
      </GlassCard>
    </div>
  );
}

function PreAssessmentForm({
  formData,
  isParsingResume,
  isPreparing,
  resumeFileName,
  parseConfidence,
  onInputChange,
  onResumeUpload,
  onPreparedContinue,
  onExplore,
}: {
  formData: BaselineFormData;
  isParsingResume: boolean;
  isPreparing: boolean;
  resumeFileName: string | null;
  parseConfidence: number | null;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onResumeUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPreparedContinue: () => void;
  onExplore: () => void;
}) {
  return (
    <GlassCard glow className="p-6 md:p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <IconInput icon={User} id="name" name="name" label="Name" placeholder="John Doe" value={formData.name} onChange={onInputChange} />
          <IconInput icon={Phone} id="contactInfo" name="contactInfo" label="Contact info" placeholder="Email or phone" value={formData.contactInfo} onChange={onInputChange} />
          <IconInput icon={Calculator} id="age" name="age" label="Age" type="number" placeholder="21" value={formData.age} onChange={onInputChange} />
          <IconInput icon={GraduationCap} id="role" name="role" label="Current role" placeholder="Student, Software Engineer" value={formData.role} onChange={onInputChange} />
          <SelectField id="domain" name="domain" label="Career path" value={formData.domain} onChange={onInputChange}>
            <option value="">Select a path</option>
            {DOMAIN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </SelectField>
          <SelectField id="careerTrack" name="careerTrack" label="Career track" value={formData.careerTrack} onChange={onInputChange}>
            <option value="">Select a track</option>
            {CAREER_TRACKS.map((track) => <option key={track} value={track}>{track}</option>)}
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
          <SelectField id="experience" name="experience" label="Experience level" value={formData.experience} onChange={onInputChange}>
            {EXPERIENCE_OPTIONS.map((level) => <option key={level} value={level}>{titleCase(level)}</option>)}
          </SelectField>
          <PlainInput id="currentSkills" name="currentSkills" label="Current skills" placeholder="React, Excel, writing" value={formData.currentSkills} onChange={onInputChange} />
          <PlainInput id="interests" name="interests" label="Interests" placeholder="AI, policy, startups" value={formData.interests} onChange={onInputChange} />
        </div>
      </div>

      <div className="mt-8 grid gap-4 border-t border-border/60 pt-6 md:grid-cols-2">
        <div className="rounded-lg border border-dashed border-primary/35 bg-primary/5 p-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isParsingResume ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </div>
          <h3 className="font-semibold text-foreground">Path A: Prepared User</h3>
          <p className="mt-1 text-xs text-muted-foreground">Upload a text resume or continue with the baseline you entered.</p>
          <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            {isParsingResume ? "Parsing..." : "Upload Resume"}
            <input type="file" accept=".txt,.md,.csv" className="hidden" onChange={onResumeUpload} disabled={isParsingResume} />
          </label>
          {resumeFileName ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {resumeFileName}
              {parseConfidence !== null ? <span className="ml-2 text-emerald-400">{Math.round(parseConfidence * 100)}% confidence</span> : null}
            </p>
          ) : null}
          <GlowButton variant="primary" onClick={onPreparedContinue} disabled={isPreparing || isParsingResume} className="mt-4 w-full">
            {isPreparing ? "Preparing..." : "Continue to Skill Estimation"}
            {!isPreparing ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </GlowButton>
        </div>

        <div className="rounded-lg border border-accent/25 bg-accent/5 p-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Path B: Still Exploring</h3>
          <p className="mt-1 text-xs text-muted-foreground">Use a short discovery bridge to choose a starting pathway.</p>
          <GlowButton variant="accent" onClick={onExplore} className="mt-4 w-full">
            I am exploring
            <ArrowRight className="ml-2 h-4 w-4" />
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
  loading,
}: {
  currentStep: number;
  answers: Record<string, string | string[]>;
  question: (typeof DISCOVERY_QUESTIONS)[number];
  canContinue: boolean;
  onToggle: (option: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  loading: boolean;
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
                className={cn(
                  "flex min-h-14 w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left text-sm font-medium transition",
                  selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/40 text-foreground hover:border-primary/45"
                )}
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
          <GlowButton variant="primary" onClick={onNext} disabled={!canContinue || loading}>
            {loading ? "Preparing..." : currentStep === DISCOVERY_QUESTIONS.length - 1 ? "Finish Discovery" : "Continue"}
            {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}

function AssessmentPanel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-lg border border-white/10 bg-card/70 p-6 shadow-xl shadow-black/20 backdrop-blur">{children}</section>;
}

function Phase2({
  questions,
  answers,
  onRatingChange,
  onContinue,
  loading,
  onBack,
}: {
  questions: HybridDomainQuestion[];
  answers: Record<string, number>;
  onRatingChange: (skill: string, rating: number) => void;
  onContinue: () => void;
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Skill Estimation</h2>
        <p className="mt-1 text-sm text-muted-foreground">Rate each skill from 1 for beginner to 5 for expert.</p>
      </div>
      <div className="space-y-5">
        {questions.map((question) => (
          <div key={question.id} className="space-y-3 rounded-lg border border-border bg-background/55 p-4">
            <p className="text-sm font-medium text-foreground">{question.question}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => onRatingChange(question.skill, rating)}
                  className={cn(
                    "h-10 w-10 rounded-md border text-sm font-semibold transition",
                    answers[question.skill] === rating
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/60"
                  )}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground">Back</button>
        <PrimaryButton onClick={onContinue} disabled={loading}>{loading ? "Starting assessment..." : "Begin Adaptive Assessment"}</PrimaryButton>
      </div>
    </div>
  );
}

function Phase3({
  currentFunnelLevel,
  question,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  loading,
  questionNumber,
}: {
  currentFunnelLevel: HybridFunnelLevel;
  question: HybridAssessmentQuestion | null;
  selectedAnswer: string;
  onSelectAnswer: (answer: string) => void;
  onSubmit: () => void;
  loading: boolean;
  questionNumber: number;
}) {
  return (
    <div className="space-y-6">
      <FunnelBreadcrumb currentLevel={currentFunnelLevel} topic={question?.topic} />
      <p className="text-right text-xs text-muted-foreground">Question {questionNumber} of {MAX_QUESTIONS}</p>
      {question ? (
        <div className="rounded-lg border border-border bg-background/70 p-5">
          <p className="mb-1 text-xs font-semibold uppercase text-primary">{question.topic}</p>
          <h2 className="mb-4 text-lg font-semibold leading-relaxed text-foreground">{question.questionText}</h2>
          {question.options?.length ? (
            <div className="space-y-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelectAnswer(option)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-3 text-left text-sm transition",
                    selectedAnswer === option ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card/40 text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <span>{option}</span>
                  {selectedAnswer === option ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={selectedAnswer}
              onChange={(event) => onSelectAnswer(event.target.value)}
              rows={4}
              placeholder="Type your answer..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          )}
        </div>
      ) : null}
      <PrimaryButton onClick={onSubmit} disabled={loading || !question}>{loading ? "Evaluating..." : "Submit Answer"}</PrimaryButton>
    </div>
  );
}

function FunnelBreadcrumb({ currentLevel, topic }: { currentLevel: HybridFunnelLevel; topic?: string }) {
  const currentIndex = FUNNEL_LEVELS.indexOf(currentLevel);
  return (
    <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {FUNNEL_LEVELS.map((level, index) => (
          <span
            key={level}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium",
              index === currentIndex ? "bg-primary text-primary-foreground" : index < currentIndex ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {level}
          </span>
        ))}
      </div>
      {topic ? <p className="mt-2 text-xs text-muted-foreground">Currently probing: <span className="text-foreground">{topic}</span></p> : null}
    </div>
  );
}

function PhaseDone({ finalSummary, onOpenRoadmap }: { finalSummary: HybridStateMachineResponse["finalSummary"] | null; onOpenRoadmap: () => void }) {
  const strengths = finalSummary?.strengths || [];
  const weakTopics = finalSummary?.skillGaps || finalSummary?.weakTopics || [];
  const requiredJobSkills = finalSummary?.requiredJobSkills || [];

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
        <Check className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">Assessment Complete</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your recommendation, roadmap, daily plan, and mentor context have been generated.</p>
      </div>
      {finalSummary ? (
        <div className="grid gap-3 rounded-lg border border-border bg-background/70 p-4 text-left text-sm">
          <SummaryRow label="Recommended path" value={finalSummary.recommendedRole || "-"} />
          <SummaryRow label="Strengths" value={strengths.join(", ") || "-"} />
          <SummaryRow label="Skill gaps" value={weakTopics.join(", ") || "-"} />
          <SummaryRow label="Required skills" value={requiredJobSkills.join(", ") || "-"} />
          <SummaryRow label="Realized strengths" value={finalSummary.realizedStrengths?.join(", ") || "-"} />
          <SummaryRow label="Unrealized strengths" value={finalSummary.unrealizedStrengths?.join(", ") || "-"} />
          <SummaryRow label="Learned but draining" value={finalSummary.learnedSkills?.join(", ") || "-"} />
          <SummaryRow label="Weaknesses" value={finalSummary.weaknesses?.join(", ") || "-"} />
          <SummaryRow label="Job availability" value={finalSummary.jobAvailabilityInsight || "-"} />
          <SummaryRow label="Recommended mode" value={finalSummary.recommendedMode} />
        </div>
      ) : null}
      <GlowButton variant="primary" onClick={onOpenRoadmap}>Open Journey</GlowButton>
    </div>
  );
}

function IconInput({ icon: Icon, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</Label>
      <Input {...props} className={cn("bg-background/50", props.className)} />
    </div>
  );
}

function PlainInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{label}</Label>
      <Input {...props} className={cn("bg-background/50", props.className)} />
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

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
      {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <p><span className="font-semibold text-foreground">{label}:</span> <span className="text-muted-foreground">{value}</span></p>;
}

function buildProfile(data: BaselineFormData, userId: string, overrides: Partial<HybridUserProfile> = {}): HybridUserProfile {
  const domain = data.domain || overrides.domain || "general";
  const currentSkills = splitCsv(data.currentSkills);
  const interests = splitCsv(data.interests);
  const education = [data.currentCourse, data.cgpa ? `CGPA/Percentage: ${data.cgpa}` : ""].filter(Boolean).join(" | ");

  return {
    userId,
    role: data.role || "Student",
    domain,
    experience: data.experience || "beginner",
    age: data.age ? Number(data.age) : undefined,
    education,
    careerTrack: data.careerTrack || "Private Job",
    hobbies: splitCsv(data.hobbies),
    interests,
    contactInfo: data.contactInfo,
    tenthGrade: [data.tenthScore, data.tenthBoard].filter(Boolean).join(" - "),
    twelfthGrade: [data.twelfthScore, data.twelfthBoard].filter(Boolean).join(" - "),
    highestQualification: data.currentCourse || education,
    targetRole: data.role || "Student",
    domainExperience: data.experience,
    currentSkills,
    careerPath: domain,
    careerSubPath: "",
    ...overrides,
  };
}

function buildPhase1Answers(userId: string, profile: HybridUserProfile): HybridUserAssessmentAnswerInput[] {
  return [
    answer(userId, "What is your academic baseline?", "Academic Baseline", [profile.tenthGrade || "", profile.twelfthGrade || "", profile.highestQualification || ""].filter(Boolean)),
    answer(userId, "What is your primary career track?", "Career Track", profile.careerTrack ? [profile.careerTrack] : []),
    answer(userId, "What is your current role or target role?", "Current Role", [profile.role]),
    answer(userId, "What career path are you considering?", "Career Path", [profile.careerPath || profile.domain]),
    answer(userId, "What is your overall experience level?", "Experience Level", [profile.experience]),
    answer(userId, "Which hobbies and interests describe you?", "Hobbies and Interests", [...(profile.hobbies || []), ...(profile.interests || [])], "MULTIPLE_CHOICE"),
    answer(userId, "Which skills do you currently have?", "Baseline Skills", profile.currentSkills || [], "MULTIPLE_CHOICE"),
  ];
}

function answer(userId: string, questionText: string, topic: string, selectedAnswer: string[], questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" = "SINGLE_CHOICE"): HybridUserAssessmentAnswerInput {
  return {
    userId,
    phase: 1,
    questionText,
    questionType,
    topic,
    options: selectedAnswer,
    selectedAnswer,
  };
}

function buildPhase2Answers(userId: string, questions: HybridDomainQuestion[], answers: Record<string, number>): HybridUserAssessmentAnswerInput[] {
  return questions.map((question) => ({
    userId,
    phase: 2,
    questionId: question.id,
    questionText: question.question,
    questionType: "SINGLE_CHOICE",
    topic: question.skill,
    options: ["1", "2", "3", "4", "5"],
    selectedAnswer: [String(answers[question.skill])],
  }));
}

function validateBaseline(profile: HybridUserProfile) {
  if (!profile.role || !profile.domain) {
    toast.error("Fill in your role and career path before continuing.");
    return false;
  }
  if (!profile.careerTrack) {
    toast.error("Select your career track before continuing.");
    return false;
  }
  return true;
}

async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && !["txt", "md", "csv"].includes(extension)) {
    throw new Error("Resume auto-parse currently supports text, markdown, or CSV files.");
  }

  const text = await file.text();
  if (!text.trim()) throw new Error("The selected resume file is empty.");
  return text;
}

function splitCsv(value?: string): string[] {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function mergeCsv(existing: string, additions: string[]) {
  return Array.from(new Set([...splitCsv(existing), ...additions.map((item) => item.trim()).filter(Boolean)])).join(", ");
}

function toArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function normalizeExperience(value?: string | null): HybridUserProfile["experience"] {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("advanced") || normalized.includes("senior")) return "advanced";
  if (normalized.includes("intermediate") || normalized.includes("mid")) return "intermediate";
  return "beginner";
}

function inferExperience(value?: string): HybridUserProfile["experience"] {
  return normalizeExperience(value);
}

function inferDomain(skills: string[] = [], experience = "") {
  const text = `${skills.join(" ")} ${experience}`.toLowerCase();
  if (/(security|network|linux|soc|penetration|cyber)/.test(text)) return "cybersecurity";
  if (/(data|python|machine learning|ml|analytics|sql)/.test(text)) return "data-science";
  if (/(react|node|mongo|express|javascript|typescript|frontend|backend)/.test(text)) return "mern-stack";
  if (/(policy|civil|upsc|government|public)/.test(text)) return "civil-services";
  if (/(business|sales|marketing|startup|entrepreneur)/.test(text)) return "business";
  return "general";
}

function inferRole(experience: string, fallback: string) {
  const firstLine = experience.split(/\r?\n|\.|;/).map((item) => item.trim()).find(Boolean);
  return firstLine && firstLine.length <= 80 ? firstLine : fallback || "Student";
}

function mapInterestToDomain(interest: string) {
  if (interest.includes("Government")) return "civil-services";
  if (interest.includes("Business")) return "business";
  if (interest.includes("Healthcare")) return "general";
  if (interest.includes("Arts")) return "general";
  if (interest.includes("Education")) return "general";
  if (interest.includes("Skilled")) return "general";
  if (interest.includes("Social")) return "general";
  return "general";
}

function phaseLabel(phase: Phase) {
  if (phase === "gateway") return "Gateway onboarding";
  if (phase === "onboarding") return "Baseline data collection";
  if (phase === "discovery") return "Skills discovery bridge";
  if (phase === 2) return "Phase 2 of 3";
  if (phase === 3) return "Phase 3 of 3";
  return "Phase 3 complete";
}

function phaseFromPath(pathname: string): Phase {
  if (pathname.endsWith("/form")) return "onboarding";
  if (pathname.endsWith("/discover")) return "discovery";
  return "gateway";
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
