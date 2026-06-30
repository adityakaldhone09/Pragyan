import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { aiService } from "@/services/aiService";
import { profileService } from "@/services/profileService";
import {
  CheckCircle2, Circle, MapPin, Pencil,
  FolderOpen, Award, Upload, BarChart2, BadgeCheck,
  Github, Linkedin, Link as LinkIcon
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  const { data: recommendations = [] } = useQuery({
    queryKey: ["ai", "recommend-careers"],
    queryFn: aiService.getCareerRecommendations,
    retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getProfile,
    retry: false,
  });

  const topRecommendation = recommendations[0];
  const careerMatchScore = useMemo(() => Math.round(topRecommendation?.score || 0), [topRecommendation]);

  const githubAccount = user?.linkedAccounts?.find((account) => account.provider === "github");
  const isGitHubLinked = Boolean(githubAccount);
  const githubProfileUrl = githubAccount?.username ? `https://github.com/${githubAccount.username}` : "https://github.com";
  const linkedInUrl = user?.linkedin
    ? user.linkedin.startsWith("http")
      ? user.linkedin
      : `https://${user.linkedin}`
    : undefined;

  const linkGithubMutation = useMutation({
    mutationFn: () => profileService.startProviderLink("github"),
    onSuccess: (data) => {
      window.location.href = data.redirectUrl;
    },
  });

  const profileChecks = [
    { label: "Basic Information", done: !!user?.fullName },
    { label: "Skills Added", done: (user?.skills?.length || 0) > 0 },
    { label: "Projects Added", done: (profile?.projects?.length || 0) > 0 },
    { label: "Certifications Added", done: (profile?.certifications?.length || 0) > 0 },
    { label: "Resume Uploaded", done: !!user?.resume },
    { label: "Assessments Completed", done: false },
  ];

  const quickActions = [
    { icon: Pencil, label: "Edit Personal Info", href: "/information/edit" },
    { icon: FolderOpen, label: "Add New Project", href: "/profile" },
    { icon: Award, label: "Add Certification", href: "/resources/certificates" },
    { icon: Upload, label: "Upload Resume", href: "/profile" },
    { icon: BarChart2, label: "View Career Readiness", href: "/information/career-readiness" },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Profile Overview</h1>
        <p className="text-muted-foreground mt-1">These fields drive matching quality, readiness scoring, and roadmap suggestions.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
            {user?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-xl text-foreground">{user?.fullName || "User"}</h2>
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <BadgeCheck className="w-4 h-4" /> Verified
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Learner</p>
          {user?.location && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-6">
              <MapPin className="w-4 h-4" /> {user.location}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mb-5">
            {linkedInUrl ? (
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Linkedin className="w-4 h-4" /> View LinkedIn
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                <Linkedin className="w-4 h-4" /> LinkedIn not added
              </span>
            )}

            <Button
              variant={isGitHubLinked ? "outline" : "default"}
              size="sm"
              onClick={() => isGitHubLinked ? window.open(githubProfileUrl, "_blank") : linkGithubMutation.mutate()}
              disabled={linkGithubMutation.isLoading}
              className="rounded-full"
              data-testid="button-github-link"
            >
              <Github className="w-4 h-4" />
              {isGitHubLinked ? "View GitHub" : "Connect GitHub"}
            </Button>
          </div>

          <Link href="/information/edit">
            <Button variant="outline" className="rounded-xl px-6" data-testid="button-edit-profile">
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm flex flex-col items-center text-center">
          <h2 className="font-bold text-foreground text-lg mb-4 self-start">Career Match Score</h2>
          <CircularProgress
            value={careerMatchScore}
            size={100}
            strokeWidth={10}
            valueFormatter={() => `${careerMatchScore}%`}
          />
          <p className={`font-bold mt-3 text-lg ${
            careerMatchScore >= 80 ? "text-green-600" : 
            careerMatchScore >= 60 ? "text-amber-600" : 
            "text-red-600"
          }`}>
            {careerMatchScore >= 80 ? "Great Match!" : careerMatchScore >= 60 ? "Good Match" : "Build Skills"}
          </p>
          <div className="flex gap-8 mt-4 pt-4 border-t border-border w-full justify-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Target Role</p>
              <p className="font-bold text-sm text-foreground mt-1">{topRecommendation?.career || "Not set"}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Career Track</p>
              <p className="font-bold text-sm text-foreground mt-1">{user?.careerTrack || "Not specified"}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-7 shadow-sm">
          <h2 className="font-bold text-foreground mb-1">Profile Health</h2>
          <p className="text-sm text-muted-foreground mb-4">80% Complete</p>
          <Progress value={80} className="h-2 mb-5" />
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {profileChecks.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                }
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-7 shadow-sm">
          <h2 className="font-bold text-foreground mb-5">Quick Actions</h2>
          <div className="space-y-1">
            {quickActions.map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href}>
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors cursor-pointer group" data-testid={`link-${label.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
