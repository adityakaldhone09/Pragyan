import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Award,
  BadgeCheck,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronRight,
  Code2,
  Edit3,
  Github,
  Globe,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "../components/GlassCard";
import { SectionHeader } from "../components/SectionHeader";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "@/context/useAuth";
import { authService } from "@/services/authService";
import type {
  Certification,
  GitHubRepositorySummary,
  PortfolioProject,
  ProfileBuilderSnapshot,
} from "@/types/api";

function getInitials(name?: string) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected image"));
    reader.readAsDataURL(file);
  });
}

function joinList(items?: string[] | null) {
  return (items || []).join(", ");
}

function splitList(value: string) {
  return value
    .split(",")
    .flatMap((item) => {
      const trimmed = item.trim();
      return trimmed ? [trimmed] : [];
    });
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatDate(value?: string | null) {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 p-5 text-sm text-muted-foreground space-y-3">
      <div className="font-medium text-foreground">{title}</div>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Profile() {
  const { user, status, reloadUser } = useAuth();
  const [builder, setBuilder] = useState<ProfileBuilderSnapshot | null>(null);
  const [loadingBuilder, setLoadingBuilder] = useState(true);
  const [savingCore, setSavingCore] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [certificationSaving, setCertificationSaving] = useState(false);
  const [importingRepoId, setImportingRepoId] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachResult, setCoachResult] = useState<null | {
    summary: string;
    completionScore: number;
    strengths: string[];
    missingFields: string[];
    nextSteps: string[];
    suggestedHeadline: string;
    suggestedCareerTrack: string;
  }>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingCertificationId, setEditingCertificationId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [coreForm, setCoreForm] = useState({
    fullName: "",
    age: "",
    location: "",
    phone: "",
    linkedin: "",
    education: "",
    experience: "",
    experienceType: "fresher" as "fresher" | "experienced",
    skills: "",
    interests: "",
    preferences: "",
    skillLevel: "",
    currentTitle: "",
    careerTrack: "",
  });

  const [projectDraft, setProjectDraft] = useState({
    title: "",
    description: "",
    techStack: "",
    highlights: "",
    liveUrl: "",
    repoUrl: "",
    featured: false,
  });

  const [certificationDraft, setCertificationDraft] = useState({
    title: "",
    issuer: "",
    credentialId: "",
    credentialUrl: "",
    issuedAt: "",
    expiresAt: "",
    description: "",
  });

  const profile = builder?.user || user || null;
  const avatarDraft = profile?.avatar || null;
  const completion = builder?.completion;

  useEffect(() => {
    let active = true;

    async function loadBuilder() {
      if (!user) {
        setLoadingBuilder(false);
        return;
      }

      try {
        setLoadingBuilder(true);
        const snapshot = await authService.getProfileBuilder();
        if (!active) return;
        setBuilder(snapshot);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load profile builder");
      } finally {
        if (active) {
          setLoadingBuilder(false);
        }
      }
    }

    loadBuilder();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setCoreForm({
      fullName: profile.fullName || "",
      age: profile.age ? String(profile.age) : "",
      location: profile.location || "",
      phone: profile.phone || "",
      linkedin: profile.linkedin || "",
      education: profile.education || "",
      experience: profile.experience || "",
      experienceType: profile.experienceType || "fresher",
      skills: joinList(profile.skills),
      interests: joinList(profile.interests),
      preferences: joinList(profile.preferences),
      skillLevel: profile.skillLevel || "",
      currentTitle: profile.currentTitle || "",
      careerTrack: profile.careerTrack || "",
    });
  }, [profile]);

  useEffect(() => {
    if (!editingProjectId) {
      setProjectDraft({
        title: "",
        description: "",
        techStack: "",
        highlights: "",
        liveUrl: "",
        repoUrl: "",
        featured: false,
      });
      return;
    }

    const project = builder?.projects.find((item) => item.id === editingProjectId);
    if (!project) return;

    setProjectDraft({
      title: project.title,
      description: project.description || "",
      techStack: joinList(project.techStack),
      highlights: joinList(project.highlights),
      liveUrl: project.liveUrl || "",
      repoUrl: project.repoUrl || "",
      featured: project.featured,
    });
  }, [builder?.projects, editingProjectId]);

  useEffect(() => {
    if (!editingCertificationId) {
      setCertificationDraft({
        title: "",
        issuer: "",
        credentialId: "",
        credentialUrl: "",
        issuedAt: "",
        expiresAt: "",
        description: "",
      });
      return;
    }

    const certification = builder?.certifications.find((item) => item.id === editingCertificationId);
    if (!certification) return;

    setCertificationDraft({
      title: certification.title,
      issuer: certification.issuer,
      credentialId: certification.credentialId || "",
      credentialUrl: certification.credentialUrl || "",
      issuedAt: toDateInput(certification.issuedAt),
      expiresAt: toDateInput(certification.expiresAt),
      description: certification.description || "",
    });
  }, [builder?.certifications, editingCertificationId]);

  const profileCompleteness = useMemo(() => {
    if (completion) {
      return completion.score;
    }

    const fallbackSignals = [profile?.fullName, profile?.education, profile?.skills?.length, profile?.phone, profile?.avatar];
    return Math.min(100, fallbackSignals.filter(Boolean).length * 20);
  }, [completion, profile]);

  const refreshBuilder = async () => {
    const snapshot = await authService.getProfileBuilder();
    setBuilder(snapshot);
    await reloadUser();
  };

  const handleAvatarSave = async (nextAvatar: string | null) => {
    try {
      setAvatarSaving(true);
      await authService.updateProfile({ avatar: nextAvatar });
      await refreshBuilder();
      toast.success(nextAvatar ? "Profile picture updated successfully" : "Profile picture removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile picture");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleAvatarPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile pictures must be smaller than 2MB");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      await handleAvatarSave(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load the selected image");
    }
  };

  const saveCoreProfile = async () => {
    try {
      setSavingCore(true);
      await authService.updateProfileBuilder({
        fullName: coreForm.fullName,
        age: coreForm.age ? Number(coreForm.age) : undefined,
        location: coreForm.location || undefined,
        phone: coreForm.phone || undefined,
        linkedin: coreForm.linkedin || undefined,
        education: coreForm.education || undefined,
        experience: coreForm.experience || undefined,
        experienceType: coreForm.experienceType,
        skills: splitList(coreForm.skills),
        interests: splitList(coreForm.interests),
        preferences: splitList(coreForm.preferences),
        skillLevel: coreForm.skillLevel || undefined,
      });
      await refreshBuilder();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profile");
    } finally {
      setSavingCore(false);
    }
  };

  const submitProject = async () => {
    if (!projectDraft.title.trim()) {
      toast.error("Project title is required");
      return;
    }

    try {
      setProjectSaving(true);
      const payload = {
        title: projectDraft.title,
        description: projectDraft.description || undefined,
        techStack: splitList(projectDraft.techStack),
        highlights: splitList(projectDraft.highlights),
        liveUrl: projectDraft.liveUrl || undefined,
        repoUrl: projectDraft.repoUrl || undefined,
        featured: projectDraft.featured,
      };

      if (editingProjectId) {
        await authService.updatePortfolioProject(editingProjectId, payload);
        toast.success("Project updated");
      } else {
        await authService.createPortfolioProject(payload);
        toast.success("Project added");
      }

      setEditingProjectId(null);
      await refreshBuilder();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save project");
    } finally {
      setProjectSaving(false);
    }
  };

  const submitCertification = async () => {
    if (!certificationDraft.title.trim() || !certificationDraft.issuer.trim()) {
      toast.error("Certification title and issuer are required");
      return;
    }

    try {
      setCertificationSaving(true);
      const payload = {
        title: certificationDraft.title,
        issuer: certificationDraft.issuer,
        credentialId: certificationDraft.credentialId || undefined,
        credentialUrl: certificationDraft.credentialUrl || undefined,
        issuedAt: certificationDraft.issuedAt || undefined,
        expiresAt: certificationDraft.expiresAt || undefined,
        description: certificationDraft.description || undefined,
      };

      if (editingCertificationId) {
        await authService.updateCertification(editingCertificationId, payload);
        toast.success("Certification updated");
      } else {
        await authService.createCertification(payload);
        toast.success("Certification added");
      }

      setEditingCertificationId(null);
      await refreshBuilder();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save certification");
    } finally {
      setCertificationSaving(false);
    }
  };

  const importRepository = async (repo: GitHubRepositorySummary) => {
    try {
      setImportingRepoId(repo.repoId);
      await authService.importGithubRepositories({ repoIds: [repo.repoId] });
      await refreshBuilder();
      toast.success(`${repo.name} imported into your projects`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import repository");
    } finally {
      setImportingRepoId(null);
    }
  };

  const generateCoach = async () => {
    try {
      setCoachLoading(true);
      const result = await authService.getProfileCoach();
      setCoachResult(result);
      toast.success("Gemini profile coach generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate Gemini coach");
    } finally {
      setCoachLoading(false);
    }
  };

  const removeProject = async (projectId: string) => {
    try {
      await authService.deletePortfolioProject(projectId);
      if (editingProjectId === projectId) {
        setEditingProjectId(null);
      }
      await refreshBuilder();
      toast.success("Project removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete project");
    }
  };

  const removeCertification = async (certificationId: string) => {
    try {
      await authService.deleteCertification(certificationId);
      if (editingCertificationId === certificationId) {
        setEditingCertificationId(null);
      }
      await refreshBuilder();
      toast.success("Certification removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete certification");
    }
  };

  if (status === "initializing" || loadingBuilder) {
    return (
      <div className="min-h-screen relative pt-24 px-6 flex items-center justify-center text-muted-foreground">
        Loading profile builder...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen relative pt-24 px-6 flex items-center justify-center">
        <GlassCard glow glowColor="primary" className="max-w-xl w-full text-center space-y-4">
          <SectionHeader title="Profile unavailable" subtitle="Sign in to view your career profile builder." />
          <Link to="/auth" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground">
            Sign in
          </Link>
        </GlassCard>
      </div>
    );
  }

  const linkedGithub = builder?.providerStatus.github?.linked ?? false;
  const githubRepositories = builder?.githubRepositories || [];
  const projects = builder?.projects || [];
  const certifications = builder?.certifications || [];

  return (
    <div className="min-h-screen relative pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.04),transparent_24%)]" />
      <div className="max-w-6xl mx-auto px-6 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard glow glowColor="primary" className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border border-primary/20 shadow-[0_0_30px_-8px_rgba(139,92,246,0.6)]">
                    <AvatarImage src={avatarDraft || profile.avatar || undefined} alt={profile.fullName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl font-semibold">
                      {getInitials(profile.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex items-center gap-2">
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarSaving}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Change profile photo"
                      title="Change profile photo"
                    >
                      {avatarSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">Career Profile Builder</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">{profile.fullName}</h1>
                  <p className="text-muted-foreground max-w-2xl">
                    Shape your identity, prove your skills, and keep your career evidence in one place.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="outline" className="border-primary/30 bg-background/40 text-foreground">
                      <Target className="mr-2 h-3.5 w-3.5" />
                      {profileCompleteness}% complete
                    </Badge>
                    <Badge variant="outline" className="border-secondary/30 bg-background/40 text-foreground">
                      <Github className="mr-2 h-3.5 w-3.5" />
                      {linkedGithub ? "GitHub connected" : "GitHub not connected"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:w-[18rem]">
                <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Completion</div>
                  <div className="mt-2 text-3xl font-semibold">{profileCompleteness}%</div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${profileCompleteness}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
            <GlassCard glow glowColor="secondary" className="h-full">
              <SectionHeader title="Identity and Contact" subtitle="Keep the core profile that powers recommendations, dashboards, and referrals up to date." className="mb-6" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm text-muted-foreground">Full name</label>
                  <Input value={coreForm.fullName} onChange={(event) => setCoreForm((current) => ({ ...current, fullName: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Age</label>
                  <Input value={coreForm.age} onChange={(event) => setCoreForm((current) => ({ ...current, age: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Location</label>
                  <Input value={coreForm.location} onChange={(event) => setCoreForm((current) => ({ ...current, location: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Phone</label>
                  <Input value={coreForm.phone} onChange={(event) => setCoreForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">LinkedIn</label>
                  <Input value={coreForm.linkedin} onChange={(event) => setCoreForm((current) => ({ ...current, linkedin: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Current title</label>
                  <Input value={coreForm.currentTitle} onChange={(event) => setCoreForm((current) => ({ ...current, currentTitle: event.target.value }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm text-muted-foreground">Career track</label>
                  <Input value={coreForm.careerTrack} onChange={(event) => setCoreForm((current) => ({ ...current, careerTrack: event.target.value }))} />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end">
                <Button onClick={saveCoreProfile} disabled={savingCore}>
                  {savingCore ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save identity
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <GlassCard glow glowColor="accent" className="h-full">
              <SectionHeader title="Profile Health" subtitle="A quick signal of how complete your builder currently is." className="mb-6" />

              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Completion score</span>
                    <span>{profileCompleteness}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent" style={{ width: `${profileCompleteness}%` }} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Skills</p>
                    <p className="font-medium">{joinList(profile.skills)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Education</p>
                    <p className="font-medium">{profile.education || "Not specified"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Experience</p>
                    <p className="font-medium">{profile.experience || "Not specified"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
                    <p className="text-sm text-muted-foreground mb-1">GitHub repos</p>
                    <p className="font-medium">{githubRepositories.length}</p>
                  </div>
                </div>

                {completion?.missing?.length ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 p-4">
                    <p className="text-sm font-medium mb-2">Missing pieces</p>
                    <div className="flex flex-wrap gap-2">
                      {completion.missing.map((item) => (
                        <Badge key={item} variant="outline" className="border-border/60">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </GlassCard>

            <div className="mt-6">
              <GlassCard glow glowColor="primary" className="h-full">
                <SectionHeader title="Gemini Coach" subtitle="Generate AI guidance for your profile story and next improvements." className="mb-6" />

                <div className="space-y-4">
                  <Button onClick={generateCoach} disabled={coachLoading}>
                    {coachLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Ask Gemini
                  </Button>

                  {coachResult ? (
                    <div className="space-y-4 rounded-2xl border border-border/70 bg-background/30 p-4">
                      <p className="text-sm text-muted-foreground">{coachResult.summary}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-border/70 bg-background/40 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Suggested headline</p>
                          <p className="font-medium">{coachResult.suggestedHeadline}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-background/40 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Suggested track</p>
                          <p className="font-medium">{coachResult.suggestedCareerTrack}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Strengths</p>
                        <div className="flex flex-wrap gap-2">
                          {coachResult.strengths.map((item) => (
                            <Badge key={item} variant="outline">{item}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Next steps</p>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {coachResult.nextSteps.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={async () => {
                            setCoreForm((current) => ({ ...current, currentTitle: coachResult.suggestedHeadline, careerTrack: coachResult.suggestedCareerTrack }));
                            toast.success("Suggestions applied to the form");
                          }}
                        >
                          Apply suggestions
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Use Gemini to turn your current profile into a better headline, clearer track, and specific next steps.</p>
                  )}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}>
            <GlassCard glow glowColor="pink" className="h-full">
              <SectionHeader title="Skills, Interests, and Education" subtitle="These fields drive matching quality, readiness scoring, and roadmap suggestions." className="mb-6" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Skills</label>
                  <Textarea rows={3} value={coreForm.skills} onChange={(event) => setCoreForm((current) => ({ ...current, skills: event.target.value }))} placeholder="React, TypeScript, SQL" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Interests</label>
                  <Textarea rows={3} value={coreForm.interests} onChange={(event) => setCoreForm((current) => ({ ...current, interests: event.target.value }))} placeholder="Product design, data analysis" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Preferences</label>
                  <Textarea rows={3} value={coreForm.preferences} onChange={(event) => setCoreForm((current) => ({ ...current, preferences: event.target.value }))} placeholder="Remote work, team projects, fast-paced learning" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Education</label>
                    <Textarea rows={3} value={coreForm.education} onChange={(event) => setCoreForm((current) => ({ ...current, education: event.target.value }))} placeholder="BTech CSE, 2024" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Experience</label>
                    <Textarea rows={3} value={coreForm.experience} onChange={(event) => setCoreForm((current) => ({ ...current, experience: event.target.value }))} placeholder="Built internal dashboards and APIs" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Experience type</label>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm outline-none"
                      value={coreForm.experienceType}
                      onChange={(event) => setCoreForm((current) => ({ ...current, experienceType: event.target.value as "fresher" | "experienced" }))}
                    >
                      <option value="fresher">Fresher</option>
                      <option value="experienced">Experienced</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Skill level</label>
                    <Input value={coreForm.skillLevel} onChange={(event) => setCoreForm((current) => ({ ...current, skillLevel: event.target.value }))} placeholder="Beginner, intermediate, advanced" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}>
            <GlassCard glow glowColor="primary" className="h-full">
              <SectionHeader title={editingProjectId ? "Edit Project" : "Portfolio Projects"} subtitle="Add project proof or import work directly from GitHub." className="mb-6" />

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-muted-foreground">Title</label>
                    <Input value={projectDraft.title} onChange={(event) => setProjectDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Career Match Engine" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-muted-foreground">Description</label>
                    <Textarea rows={3} value={projectDraft.description} onChange={(event) => setProjectDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Explain the outcome, scope, and impact." />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-muted-foreground">Tech stack</label>
                    <Input value={projectDraft.techStack} onChange={(event) => setProjectDraft((current) => ({ ...current, techStack: event.target.value }))} placeholder="React, Prisma, MongoDB" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-muted-foreground">Highlights</label>
                    <Textarea rows={3} value={projectDraft.highlights} onChange={(event) => setProjectDraft((current) => ({ ...current, highlights: event.target.value }))} placeholder="Reduced manual work, shipped roadmap generation, improved completion scores" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Live URL</label>
                    <Input value={projectDraft.liveUrl} onChange={(event) => setProjectDraft((current) => ({ ...current, liveUrl: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Repository URL</label>
                    <Input value={projectDraft.repoUrl} onChange={(event) => setProjectDraft((current) => ({ ...current, repoUrl: event.target.value }))} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={projectDraft.featured}
                    onChange={(event) => setProjectDraft((current) => ({ ...current, featured: event.target.checked }))}
                    className="rounded border-border"
                  />
                  Feature this project
                </label>

                <div className="flex items-center gap-2">
                  <Button onClick={submitProject} disabled={projectSaving}>
                    {projectSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {editingProjectId ? "Update project" : "Add project"}
                  </Button>
                  {editingProjectId ? (
                    <Button variant="outline" onClick={() => setEditingProjectId(null)}>
                      Cancel edit
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-3 pt-2">
                  {projects.length ? (
                    projects.map((project) => (
                      <div key={project.id} className="rounded-2xl border border-border/70 bg-background/30 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{project.title}</h3>
                              {project.featured ? <Badge className="bg-primary/15 text-primary border-primary/30">Featured</Badge> : null}
                              {project.source === "github" ? <Badge variant="outline">GitHub</Badge> : null}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{project.description || "No description provided."}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditingProjectId(project.id)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeProject(project.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.techStack.map((item) => (
                            <Badge key={item} variant="outline">
                              {item}
                            </Badge>
                          ))}
                        </div>
                        {project.highlights.length ? (
                          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            {project.highlights.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="flex flex-wrap gap-3 text-sm">
                          {project.liveUrl ? (
                            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                              <Globe className="h-4 w-4" />
                              Live site
                            </a>
                          ) : null}
                          {project.repoUrl ? (
                            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                              <Github className="h-4 w-4" />
                              Repository
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No projects yet"
                      description="Add one strong project or import an existing repository to make your profile more credible."
                    />
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}>
            <GlassCard glow glowColor="accent" className="h-full">
              <SectionHeader title={editingCertificationId ? "Edit Certification" : "Certifications"} subtitle="Add formal proof of learning and verified achievements." className="mb-6" />

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-muted-foreground">Title</label>
                    <Input value={certificationDraft.title} onChange={(event) => setCertificationDraft((current) => ({ ...current, title: event.target.value }))} placeholder="AWS Certified Developer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Issuer</label>
                    <Input value={certificationDraft.issuer} onChange={(event) => setCertificationDraft((current) => ({ ...current, issuer: event.target.value }))} placeholder="AWS" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Credential ID</label>
                    <Input value={certificationDraft.credentialId} onChange={(event) => setCertificationDraft((current) => ({ ...current, credentialId: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Issued at</label>
                    <Input type="date" value={certificationDraft.issuedAt} onChange={(event) => setCertificationDraft((current) => ({ ...current, issuedAt: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Expires at</label>
                    <Input type="date" value={certificationDraft.expiresAt} onChange={(event) => setCertificationDraft((current) => ({ ...current, expiresAt: event.target.value }))} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-muted-foreground">Credential URL</label>
                    <Input value={certificationDraft.credentialUrl} onChange={(event) => setCertificationDraft((current) => ({ ...current, credentialUrl: event.target.value }))} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-muted-foreground">Description</label>
                    <Textarea rows={3} value={certificationDraft.description} onChange={(event) => setCertificationDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Add the skills or topics covered." />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={submitCertification} disabled={certificationSaving}>
                    {certificationSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                    {editingCertificationId ? "Update certification" : "Add certification"}
                  </Button>
                  {editingCertificationId ? (
                    <Button variant="outline" onClick={() => setEditingCertificationId(null)}>
                      Cancel edit
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-3 pt-2">
                  {certifications.length ? (
                    certifications.map((certification) => (
                      <div key={certification.id} className="rounded-2xl border border-border/70 bg-background/30 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">{certification.title}</h3>
                            <p className="text-sm text-muted-foreground">{certification.issuer}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditingCertificationId(certification.id)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeCertification(certification.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <div>Issued: {formatDate(certification.issuedAt)}</div>
                          <div>Expires: {formatDate(certification.expiresAt)}</div>
                          {certification.credentialId ? <div className="sm:col-span-2">Credential ID: {certification.credentialId}</div> : null}
                        </div>
                        {certification.description ? <p className="text-sm text-muted-foreground">{certification.description}</p> : null}
                        {certification.credentialUrl ? (
                          <a href={certification.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                            <ChevronRight className="h-4 w-4" />
                            Open credential
                          </a>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No certifications yet"
                      description="Add certificates, badges, or verified courses to strengthen your profile."
                    />
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <GlassCard glow glowColor="pink" className="h-full">
              <SectionHeader title="GitHub Integration" subtitle="Import repositories as projects and keep your public work visible." className="mb-6" />

              {linkedGithub ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-4 flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">GitHub is connected</p>
                      <p className="text-sm text-muted-foreground">Repositories synced from GitHub can be imported into your portfolio as proof of work.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {githubRepositories.length ? (
                      githubRepositories.map((repo) => (
                        <div key={repo.id} className="rounded-2xl border border-border/70 bg-background/30 p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold">{repo.fullName}</h3>
                                {repo.language ? <Badge variant="outline">{repo.language}</Badge> : null}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{repo.description || "No description provided."}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => importRepository(repo)} disabled={importingRepoId === repo.repoId}>
                              {importingRepoId === repo.repoId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                              Import
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {repo.stars}</span>
                            <span className="inline-flex items-center gap-1"><Code2 className="h-3.5 w-3.5" /> {repo.forks}</span>
                            <span className="inline-flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> {repo.defaultBranch || "main"}</span>
                          </div>
                          <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                            View repository
                          </a>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="No synced repositories"
                        description="Link GitHub and sync repositories to turn your public work into portfolio-ready projects."
                      />
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="GitHub is not connected"
                  description="Link your GitHub account from the account area to enable repository import and richer profile proof."
                  action={
                    <Link to="/profile" className="inline-flex items-center gap-2 text-primary hover:underline">
                      Back to profile settings
                    </Link>
                  }
                />
              )}
            </GlassCard>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}>
          <GlassCard glow glowColor="secondary">
            <SectionHeader title="Quick Profile Snapshot" subtitle="What the builder currently knows about your career identity." className="mb-6" />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground"><UserCircle2 className="h-4 w-4 text-primary" /><span className="text-sm">Identity</span></div>
                <p className="mt-2 font-medium">{profile.fullName}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 text-primary" /><span className="text-sm">Contact</span></div>
                <p className="mt-2 font-medium">{profile.email}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4 text-primary" /><span className="text-sm">Track</span></div>
                <p className="mt-2 font-medium">{profile.careerTrack || "Not specified"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="h-4 w-4 text-primary" /><span className="text-sm">Education</span></div>
                <p className="mt-2 font-medium">{profile.education || "Not specified"}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

export default Profile;
