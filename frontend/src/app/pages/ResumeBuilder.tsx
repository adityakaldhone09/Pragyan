import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Download, Sparkles, BriefcaseBusiness, GraduationCap, BadgeCheck, Target, UserRound } from "lucide-react";
import { toast } from "sonner";
import { NeuralBackground } from "../components/NeuralBackground";
import { FloatingParticles } from "../components/FloatingParticles";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { SectionHeader } from "../components/SectionHeader";
import { resumeService } from "../../services/resumeService";
import type { ResumeRecord, ResumeSnapshot } from "@/types/api";

export function ResumeBuilder() {
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadResume() {
      try {
        const data = await resumeService.getResume();
        if (!mounted) return;
        setResume(data);
      } catch (error) {
        if (mounted) {
          toast.error(error instanceof Error ? error.message : "Unable to load resume");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadResume();

    return () => {
      mounted = false;
    };
  }, []);

  const snapshot = useMemo(() => resume?.data || null, [resume]);

  const generate = async () => {
    setGenerating(true);
    try {
      const generated = await resumeService.generateResume(Boolean(resume));
      setResume(generated);
      toast.success("Resume generated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate resume");
    } finally {
      setGenerating(false);
    }
  };

  const copyResume = async () => {
    if (!snapshot) return;
    setCopying(true);
    try {
      const text = buildPlainText(snapshot);
      await navigator.clipboard.writeText(text);
      toast.success("Resume copied to clipboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to copy resume");
    } finally {
      setCopying(false);
    }
  };

  const downloadPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-muted-foreground bg-background">
        Loading resume builder...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-8">
      <NeuralBackground />
      <FloatingParticles count={14} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard glow glowColor="secondary" className="overflow-hidden">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <SectionHeader
                  title="AI Resume Builder"
                  subtitle="Generate an ATS-optimized resume using your profile, GitHub, achievements, and learning history."
                />
                <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                  Pragyan turns your profile into a clean, recruiter-friendly resume that highlights proof of work, skills, and career direction.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <GlowButton variant="primary" onClick={generate} loading={generating}>
                  {resume ? "Regenerate with AI" : "Generate Resume"}
                </GlowButton>
                <GlowButton variant="secondary" onClick={copyResume} loading={copying} disabled={!snapshot}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Resume
                </GlowButton>
                <GlowButton variant="accent" onClick={downloadPdf} disabled={!snapshot}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </GlowButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <GlassCard className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resume status</p>
                <h2 className="text-2xl font-semibold text-foreground">{resume ? `Version ${resume.version}` : "No resume generated yet"}</h2>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Summary</p>
              <p className="mt-2 text-sm leading-7 text-foreground">{snapshot?.summary || "Generate your resume to see an ATS-friendly summary here."}</p>
            </div>

            <InfoPill label="Target Role" value={snapshot?.targetRole || "Not generated yet"} icon={<Target className="h-4 w-4" />} />
            <InfoPill label="Skills" value={`${snapshot?.skills.length || 0} highlighted`} icon={<BadgeCheck className="h-4 w-4" />} />
            <InfoPill label="Projects" value={`${snapshot?.projects.length || 0} featured`} icon={<BriefcaseBusiness className="h-4 w-4" />} />
            <InfoPill label="Achievements" value={`${snapshot?.achievements.length || 0} proofs of progress`} icon={<UserRound className="h-4 w-4" />} />

            <div className="space-y-3">
              <Link to="/learning" className="block">
                <GlowButton variant="secondary" className="w-full">Pull in learning progress</GlowButton>
              </Link>
              <Link to="/profile" className="block">
                <GlowButton variant="accent" className="w-full">Update profile data</GlowButton>
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="space-y-6">
            <ResumePreview snapshot={snapshot} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function ResumePreview({ snapshot }: { snapshot: ResumeSnapshot | null }) {
  if (!snapshot) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
        <GraduationCap className="mx-auto h-12 w-12 text-cyan-200" />
        <p className="mt-4 text-lg font-semibold text-foreground">Your resume preview will appear here</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the generate button to create an ATS-friendly draft from your learning and profile data.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={snapshot.summary}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Professional Summary</p>
          <p className="mt-3 text-sm leading-7 text-foreground">{snapshot.summary}</p>
        </div>

        <section>
          <SectionLabel title="Skills" />
          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.skills.map((skill) => (
              <span key={skill} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-cyan-100">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel title="Projects" />
          <div className="mt-3 space-y-3">
            {snapshot.projects.map((project) => (
              <div key={project.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{project.title}</h3>
                  {project.url ? (
                    <a className="text-xs text-primary hover:text-primary/80" href={project.url} target="_blank" rel="noreferrer">
                      Open link
                    </a>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
                <p className="mt-2 text-sm text-foreground">{project.impact}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.technologies.map((technology) => (
                    <span key={technology} className="rounded-full border border-white/10 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {technology}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel title="Experience" />
          <div className="mt-3 space-y-3">
            {snapshot.experience.map((experience) => (
              <div key={`${experience.title}-${experience.company}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{experience.title}</h3>
                  <span className="text-xs text-muted-foreground">{experience.period}</span>
                </div>
                <p className="text-sm text-cyan-100">{experience.company}</p>
                <p className="mt-2 text-sm text-muted-foreground">{experience.description}</p>
                <ul className="mt-3 space-y-2 text-sm text-foreground">
                  {experience.achievements.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div>
            <SectionLabel title="Education" />
            <div className="mt-3 space-y-3">
              {snapshot.education.map((education) => (
                <div key={`${education.school}-${education.qualification}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-semibold text-foreground">{education.qualification}</h3>
                  <p className="text-sm text-cyan-100">{education.school}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{education.year || "Current or recent"}</p>
                  {education.description ? <p className="mt-2 text-sm text-muted-foreground">{education.description}</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel title="Certifications" />
            <div className="mt-3 space-y-3">
              {snapshot.certifications.map((certification) => (
                <div key={`${certification.title}-${certification.issuer}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{certification.title}</h3>
                    <span className="text-xs text-muted-foreground">{certification.date || ""}</span>
                  </div>
                  <p className="text-sm text-cyan-100">{certification.issuer}</p>
                  {certification.url ? (
                    <a className="mt-2 inline-block text-xs text-primary hover:text-primary/80" href={certification.url} target="_blank" rel="noreferrer">
                      Verify credential
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionLabel title="Achievements" />
          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.achievements.map((achievement) => (
              <span key={achievement} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                {achievement}
              </span>
            ))}
          </div>
        </section>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoPill({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>;
}

function buildPlainText(snapshot: ResumeSnapshot) {
  const lines = [
    `Summary: ${snapshot.summary}`,
    `Skills: ${snapshot.skills.join(', ')}`,
    `Projects: ${snapshot.projects.map((project) => `${project.title} - ${project.impact}`).join(' | ')}`,
    `Experience: ${snapshot.experience.map((experience) => `${experience.title} @ ${experience.company}`).join(' | ')}`,
    `Education: ${snapshot.education.map((education) => `${education.qualification} @ ${education.school}`).join(' | ')}`,
    `Certifications: ${snapshot.certifications.map((certification) => `${certification.title} (${certification.issuer})`).join(' | ')}`,
    `Achievements: ${snapshot.achievements.join(', ')}`,
    `Target role: ${snapshot.targetRole}`,
  ];

  return lines.join('\n');
}
