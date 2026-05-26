import { motion } from "motion/react";
import { Link } from "react-router";
import { Github, Mail, Briefcase, GraduationCap, MapPin, Sparkles, Calendar, ShieldCheck } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { SectionHeader } from "../components/SectionHeader";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../../context/AuthContext";
import { AUTH_SESSION_KEY } from "@/services/apiClient";

function formatList(items?: string[] | null, fallback = "Not specified") {
  if (!items || !items.length) {
    return fallback;
  }

  return items.join(", ");
}

function getInitials(name?: string) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export function Profile() {
  const { user, status } = useAuth();

  const handleGitHubLink = () => {
    // Start authenticated linking flow: request a redirect URL then navigate
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    const token = stored ? JSON.parse(stored)?.accessToken : null;
    fetch('/api/auth/link/start?provider=github', { method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${token || ''}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      })
      .catch(() => {
        window.location.href = 'http://localhost:5000/api/auth/github';
      });
  };

  const handleGoogleLink = () => {
    const stored2 = localStorage.getItem(AUTH_SESSION_KEY);
    const token2 = stored2 ? JSON.parse(stored2)?.accessToken : null;
    fetch('/api/auth/link/start?provider=google', { method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${token2 || ''}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      })
      .catch(() => {
        window.location.href = 'http://localhost:5000/api/auth/google';
      });
  };

  if (status === "initializing") {
    return (
      <div className="min-h-screen relative pt-24 px-6 flex items-center justify-center text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen relative pt-24 px-6 flex items-center justify-center">
        <GlassCard glow glowColor="primary" className="max-w-xl w-full text-center space-y-4">
          <SectionHeader title="Profile unavailable" subtitle="Sign in to view your personal details, skills, and account information." />
          <Link to="/auth" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground">
            Sign in
          </Link>
        </GlassCard>
      </div>
    );
  }

  const details = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: Briefcase, label: "Role", value: user.role || "Learner" },
    { icon: MapPin, label: "Location", value: user.bio || "Career explorer" },
    { icon: Calendar, label: "Experience", value: user.experience || "Not specified" },
    { icon: GraduationCap, label: "Education", value: user.education || "Not specified" },
    { icon: ShieldCheck, label: "Email Verified", value: user.emailVerified ? "Verified" : "Not verified" },
  ];

  return (
    <div className="min-h-screen relative pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard glow glowColor="primary" className="overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border border-primary/20 shadow-[0_0_30px_-8px_rgba(139,92,246,0.6)]">
                  <AvatarImage src={user.avatar || undefined} alt={user.fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl font-semibold">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">User Profile</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">{user.fullName}</h1>
                  <p className="text-muted-foreground max-w-2xl">
                    Review your personal details, skills, and account information in one place.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  {user.provider || "local"}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm border-primary/30 text-primary">
                  {user.emailVerified ? "Verified account" : "Unverified account"}
                </Badge>
                {!(user.linkedAccounts || []).some((a: any) => a.provider === 'github') && (
                  <button
                    type="button"
                    onClick={handleGitHubLink}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-400/20 hover:text-cyan-200"
                  >
                    <Github className="w-4 h-4" />
                    Link GitHub
                  </button>
                )}

                {!(user.linkedAccounts || []).some((a: any) => a.provider === 'google') && (
                  <button
                    type="button"
                    onClick={handleGoogleLink}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-400/20 hover:text-sky-200"
                  >
                    <span className="w-4 h-4 inline-block text-sm font-semibold">G</span>
                    Link Google
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="lg:col-span-2">
            <GlassCard glow glowColor="secondary" className="h-full">
              <SectionHeader title="Personal Details" subtitle="Your identity and account information as stored in Pragyan." className="mb-6" />

              <div className="grid sm:grid-cols-2 gap-4">
                {details.map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-background/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <item.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <p className="text-base font-medium break-words">{item.value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <GlassCard glow glowColor="accent" className="h-full">
              <SectionHeader title="Account Summary" subtitle="Quick snapshot of your profile completeness." className="mb-6" />

              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-4">
                  <p className="text-sm text-muted-foreground mb-1">Skills</p>
                  <p className="font-medium">{formatList(user.skills)}</p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-secondary/10 to-accent/10 border border-secondary/20 p-4">
                  <p className="text-sm text-muted-foreground mb-1">Interests</p>
                  <p className="font-medium">{formatList(user.interests)}</p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 p-4">
                  <p className="text-sm text-muted-foreground mb-1">Bio</p>
                  <p className="font-medium">{user.bio || "No bio added yet."}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <GlassCard glow glowColor="pink">
            <SectionHeader title="Skills & Focus" subtitle="The skills currently attached to your profile." className="mb-6" />

            {user.skills?.length ? (
              <div className="flex flex-wrap gap-3">
                {user.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="px-3 py-1 text-sm border-primary/30 text-foreground bg-background/40">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Add skills to make recommendations and roadmap suggestions more precise.</p>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

export default Profile;