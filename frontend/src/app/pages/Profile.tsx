import { motion } from "motion/react";
import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Camera,
  Calendar,
  CheckCircle2,
  Github,
  GraduationCap,
  Link2,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Unlink2,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { GlassCard } from "../components/GlassCard";
import { SectionHeader } from "../components/SectionHeader";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { useAuth } from "@/context/useAuth";
import { authService } from "@/services/authService";
import type { ConnectedProvidersResponse, ProviderConnectionStatus } from "@/types/api";

type OAuthProvider = "google" | "github";

const providerMeta: Record<OAuthProvider, {
  label: string;
  accent: string;
  icon: ReactNode;
}> = {
  google: {
    label: "Google",
    accent: "from-sky-400/20 via-cyan-400/10 to-emerald-400/10",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M21.35 11.1H12v2.9h5.38c-.24 1.28-.98 2.37-2.09 3.1v2.57h3.38c1.98-1.82 3.12-4.49 3.12-7.65 0-.7-.06-1.24-.15-1.92z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.38-2.57c-.93.63-2.12 1.01-3.25 1.01-2.5 0-4.62-1.68-5.38-3.96H3.17v2.48A10 10 0 0 0 12 22z" />
        <path fill="#FBBC05" d="M6.62 14.05A5.9 5.9 0 0 1 6.3 12c0-.71.12-1.4.32-2.05V7.47H3.17A10 10 0 0 0 2 12c0 1.63.39 3.17 1.17 4.53l3.45-2.48z" />
        <path fill="#EA4335" d="M12 5.94c1.47 0 2.78.51 3.82 1.5l2.87-2.87C16.96 2.97 14.7 2 12 2A10 10 0 0 0 3.17 7.47l3.45 2.48C7.38 7.62 9.5 5.94 12 5.94z" />
      </svg>
    ),
  },
  github: {
    label: "GitHub",
    accent: "from-violet-400/15 via-fuchsia-400/10 to-pink-400/10",
    icon: <Github className="h-5 w-5" />,
  },
};

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

function statusTone(linked: boolean) {
  return linked
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : "border-rose-400/30 bg-rose-400/10 text-rose-300";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected image"));
    reader.readAsDataURL(file);
  });
}

function ProviderCard({
  provider,
  status,
  loading,
  onLink,
  onUnlink,
}: {
  provider: OAuthProvider;
  status: ProviderConnectionStatus;
  loading: boolean;
  onLink: () => void;
  onUnlink: () => void;
}) {
  const meta = providerMeta[provider];
  const isLinked = Boolean(status?.linked);
  const displayValue = provider === "google" ? status?.email : status?.username || status?.email;

  return (
    <GlassCard glow glowColor="primary" className={`relative overflow-hidden border border-white/10 bg-card/80 ${loading ? "opacity-90" : ""}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-80`} />
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-background/40 text-foreground shadow-lg shadow-black/20">
              {meta.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{meta.label}</h3>
              <p className="text-sm text-muted-foreground">Connect this provider to sign in from the same Pragyan account.</p>
            </div>
          </div>

          <Badge className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(isLinked)}`}>
            {isLinked ? "Linked" : "Not Linked"}
          </Badge>
        </div>

        <div className="rounded-2xl border border-white/10 bg-background/30 p-4 space-y-3">
          {isLinked ? (
            <>
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">{meta.label} Linked</span>
              </div>
              {displayValue ? <p className="text-sm text-foreground break-words">{provider === "google" ? `Email: ${displayValue}` : `Username: ${displayValue}`}</p> : null}
              <div className="flex flex-wrap gap-2">
                {status?.verified ? (
                  <Badge className="rounded-full px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    Verified
                  </Badge>
                ) : null}
                {status?.avatar ? (
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs border-primary/30 text-primary">
                    Avatar synced
                  </Badge>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-rose-300">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Not Connected</span>
              </div>
              <p className="text-sm text-muted-foreground">Link {meta.label} to allow sign in with this provider.</p>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {isLinked ? (
            <button
              type="button"
              onClick={onUnlink}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink2 className="h-4 w-4" />}
              Unlink {meta.label}
            </button>
          ) : (
            <button
              type="button"
              onClick={onLink}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Link {meta.label}
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export function Profile() {
  const { user, status, reloadUser } = useAuth();
  const [providerStatus, setProviderStatus] = useState<ConnectedProvidersResponse | null>(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(user?.avatar || null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAvatarDraft(user?.avatar || null);
  }, [user?.avatar]);

  useEffect(() => {
    let active = true;

    async function loadProviders() {
      if (!user) {
        return;
      }

      setProvidersLoading(true);
      try {
        const data = await authService.getLinkedProviders();
        if (active) {
          setProviderStatus(data);
        }
      } catch (err) {
        if (active) {
          toast.error(err instanceof Error ? err.message : "Unable to load connected accounts");
        }
      } finally {
        if (active) {
          setProvidersLoading(false);
        }
      }
    }

    loadProviders();

    return () => {
      active = false;
    };
  }, [user]);

  const handleLink = async (provider: OAuthProvider) => {
    try {
      setPendingProvider(provider);
      const { redirectUrl } = await authService.startLink(provider);
      window.location.href = redirectUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Unable to start ${providerMeta[provider].label} linking`);
      setPendingProvider(null);
    }
  };

  const handleUnlink = async (provider: OAuthProvider) => {
    try {
      setPendingProvider(provider);
      await authService.unlinkProvider(provider);
      toast.success(`${providerMeta[provider].label} account unlinked successfully`);
      await Promise.all([reloadUser(), authService.getLinkedProviders().then(setProviderStatus)]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Unable to unlink ${providerMeta[provider].label}`);
    } finally {
      setPendingProvider(null);
    }
  };

  const handleAvatarSave = async (nextAvatar: string | null) => {
    try {
      setAvatarSaving(true);
      await authService.updateProfile({ avatar: nextAvatar });
      setAvatarDraft(nextAvatar);
      await reloadUser();
      toast.success(nextAvatar ? "Profile picture updated successfully" : "Profile picture removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile picture");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleAvatarPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

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

  const socialStatus = providerStatus || {
    google: { linked: false },
    github: { linked: false },
  };
  const googleLinked = Boolean(providerStatus?.google?.linked);
  const githubLinked = Boolean(providerStatus?.github?.linked);
  const hasVerifiedLinkedAccount = Boolean(
    (googleLinked && providerStatus?.google?.verified) || (githubLinked && providerStatus?.github?.verified),
  );

  return (
    <div className="min-h-screen relative pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard glow glowColor="primary" className="overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border border-primary/20 shadow-[0_0_30px_-8px_rgba(139,92,246,0.6)]">
                    <AvatarImage src={avatarDraft || user.avatar || undefined} alt={user.fullName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl font-semibold">
                      {getInitials(user.fullName)}
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
                    <span className="text-sm font-medium">User Profile</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">{user.fullName}</h1>
                  <p className="text-muted-foreground max-w-2xl">
                    Review your personal details, skills, and connected accounts in one place.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {providersLoading ? (
                  <Badge className="px-3 py-1 text-sm border border-white/10 bg-white/5 text-muted-foreground">
                    Loading providers...
                  </Badge>
                ) : (
                  <>
                    {googleLinked ? (
                      <Badge className="px-3 py-1 text-sm border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                        Google Linked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="px-3 py-1 text-sm border-white/20 text-muted-foreground">
                        Link Google
                      </Badge>
                    )}

                    {hasVerifiedLinkedAccount ? (
                      <Badge className="px-3 py-1 text-sm border border-purple-400/30 bg-purple-500/20 text-purple-300">
                        Verified Account
                      </Badge>
                    ) : null}

                    {githubLinked ? (
                      <Badge className="px-3 py-1 text-sm border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                        GitHub Linked
                      </Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLink("github")}
                        disabled={providersLoading || pendingProvider === "github"}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingProvider === "github" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Link GitHub
                      </button>
                    )}
                  </>
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

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }}>
          <GlassCard glow glowColor="primary">
            <SectionHeader title="Connected Accounts" subtitle="Link Google and GitHub to keep all login methods attached to the same Pragyan profile." className="mb-6" />

            <div className="grid gap-6 lg:grid-cols-2">
              <ProviderCard
                provider="google"
                status={socialStatus.google}
                loading={pendingProvider === "google"}
                onLink={() => handleLink("google")}
                onUnlink={() => handleUnlink("google")}
              />

              <ProviderCard
                provider="github"
                status={socialStatus.github}
                loading={pendingProvider === "github"}
                onLink={() => handleLink("github")}
                onUnlink={() => handleUnlink("github")}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-background/30 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-foreground">Automatic refresh</p>
                <p className="text-sm text-muted-foreground">Provider status updates after linking or unlinking without a manual reload.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setProvidersLoading(true);
                  try {
                    const data = await authService.getLinkedProviders();
                    setProviderStatus(data);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Unable to refresh connected accounts");
                  } finally {
                    setProvidersLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <ArrowRight className="h-4 w-4" />
                Refresh status
              </button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}>
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