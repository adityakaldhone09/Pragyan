import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  Bell, Lock, Palette, Globe, Shield,
  Eye, EyeOff, Moon, Sun, Smartphone,
  CheckCircle2, ChevronRight, LogOut, Trash2, Download,
  MessageSquareDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

const FeedbackSettings = lazy(() => import("@/pages/settings/FeedbackSettings"));

type Section = "notifications" | "privacy" | "appearance" | "account" | "security" | "feedback";

const sections: { id: Section; label: string; icon: typeof Bell }[] = [
  { id: "notifications", label: "Notifications",       icon: Bell               },
  { id: "appearance",    label: "Appearance",           icon: Palette            },
  { id: "privacy",       label: "Privacy",              icon: Eye                },
  { id: "security",      label: "Security",             icon: Lock               },
  { id: "account",       label: "Account",              icon: Shield             },
  { id: "feedback",      label: "Feedback & Support",   icon: MessageSquareDot   },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} data-testid="toggle"
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-muted-foreground/30"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 pr-6">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function SH({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 mt-6 first:mt-0 px-1">{children}</h3>;
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Support deep-link: /settings?tab=feedback
  const search = useSearch();
  const tabParam = new URLSearchParams(search).get("tab") as Section | null;
  const [active, setActive] = useState<Section>(
    tabParam && sections.some((s) => s.id === tabParam) ? tabParam : "notifications"
  );

  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Notifications / Appearance / Privacy state ──────────────────────────────
  const [notifs, setNotifs] = useState({
    emailUpdates: true, milestoneAlerts: true, weeklyReport: true,
    aiTips: true, jobAlerts: false, communityDigest: false,
    smsAlerts: false, pushBrowser: true,
  });
  const [privacy, setPrivacy] = useState({
    profilePublic: false, showSkills: true, showCertificates: true,
    shareWithEmployers: false, analyticsTracking: true, showOnLeaderboard: true,
  });
  const [appearance, setAppearance] = useState({
    theme: "light" as "light" | "dark" | "system",
    compactSidebar: false, animationsEnabled: true,
    language: "English", timezone: "Asia/Kolkata (IST)",
  });

  useEffect(() => {
    if (user?.preferences && typeof user.preferences === "object" && !Array.isArray(user.preferences)) {
      setAppearance((p) => ({ ...p, ...(user.preferences as object) }));
    }
  }, [user?.preferences]);

  const prefMutation = useMutation({
    mutationFn: (prefs: object) => authService.updateProfile({ preferences: prefs } as any),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const tn  = <K extends keyof typeof notifs>(k: K)  => setNotifs(p  => ({ ...p, [k]: !p[k] }));
  const tp  = <K extends keyof typeof privacy>(k: K) => setPrivacy(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile, preferences, and account settings.</p>
      </div>

      <div className={`flex gap-6 ${active === "feedback" ? "items-start" : ""}`}>
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0">
          <nav className="bg-card border border-border rounded-[20px] overflow-hidden shadow-sm">
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActive(id)} data-testid={`settings-nav-${id}`}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors border-b border-border last:border-0 ${
                  active === id ? "bg-primary/5 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Feedback & Support ─────────────────────────────────────────── */}
        {active === "feedback" ? (
          <div className="flex-1 min-w-0">
            <Suspense fallback={
              <div className="bg-card border border-border rounded-[20px] p-7 shadow-sm animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-3" />
                <div className="h-4 w-72 bg-muted rounded" />
              </div>
            }>
              <FeedbackSettings />
            </Suspense>
          </div>
        ) : (
        /* ── All other sections ───────────────────────────────────────── */
        <div className="flex-1 bg-card border border-border rounded-[20px] p-7 shadow-sm">
          {saved && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Changes saved and synchronized across the platform.
            </div>
          )}

          {active === "notifications" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose how and when Pragyan AI notifies you.</p>
              <SH>Email</SH>
              <Row label="Career Updates & Tips" desc="Weekly tips based on your roadmap progress."><Toggle on={notifs.emailUpdates} onChange={() => tn("emailUpdates")} /></Row>
              <Row label="Weekly Progress Report" desc="Summary of activity, milestones, and match score."><Toggle on={notifs.weeklyReport} onChange={() => tn("weeklyReport")} /></Row>
              <Row label="Job & Opportunity Alerts" desc="Postings matching your career track."><Toggle on={notifs.jobAlerts} onChange={() => tn("jobAlerts")} /></Row>
              <Row label="Community Digest" desc="Highlights from forums and peer discussions."><Toggle on={notifs.communityDigest} onChange={() => tn("communityDigest")} /></Row>
              <SH>In-App</SH>
              <Row label="Milestone Alerts" desc="Notified when you reach or miss a roadmap milestone."><Toggle on={notifs.milestoneAlerts} onChange={() => tn("milestoneAlerts")} /></Row>
              <Row label="AI Suggestions" desc="Smart nudges when you're off track."><Toggle on={notifs.aiTips} onChange={() => tn("aiTips")} /></Row>
              <Row label="Browser Push" desc="Real-time alerts delivered to your browser."><Toggle on={notifs.pushBrowser} onChange={() => tn("pushBrowser")} /></Row>
              <SH>SMS</SH>
              <Row label="Critical Alerts via SMS" desc="Deadline or milestone reminders via text."><Toggle on={notifs.smsAlerts} onChange={() => tn("smsAlerts")} /></Row>
            </div>
          )}

          {/* ── APPEARANCE ─────────────────────────────────────────────────── */}
          {active === "appearance" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Appearance</h2>
              <p className="text-sm text-muted-foreground mb-6">Customize how the app looks and feels.</p>
              <SH>Theme</SH>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(["light","dark","system"] as const).map(t => (
                  <button key={t} onClick={() => setAppearance(p => ({ ...p, theme: t }))} data-testid={`theme-${t}`}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${appearance.theme === t ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    {t === "light" && <Sun className="w-6 h-6 text-amber-500" />}
                    {t === "dark"  && <Moon className="w-6 h-6 text-primary" />}
                    {t === "system"&& <Smartphone className="w-6 h-6 text-muted-foreground" />}
                    <span className="text-sm font-medium capitalize text-foreground">{t}</span>
                    {appearance.theme === t && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
              <SH>Display</SH>
              <Row label="Compact Sidebar" desc="Reduce sidebar item height for more screen space."><Toggle on={appearance.compactSidebar} onChange={() => setAppearance(p => ({ ...p, compactSidebar: !p.compactSidebar }))} /></Row>
              <Row label="Animations & Transitions" desc="Enable smooth page transitions."><Toggle on={appearance.animationsEnabled} onChange={() => setAppearance(p => ({ ...p, animationsEnabled: !p.animationsEnabled }))} /></Row>
              <SH>Language & Region</SH>
              <Row label="Language">
                <select value={appearance.language} onChange={e => setAppearance(p => ({ ...p, language: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" data-testid="select-language">
                  {["English","Hindi","Marathi","Tamil","Telugu"].map(l => <option key={l}>{l}</option>)}
                </select>
              </Row>
              <Row label="Timezone">
                <select value={appearance.timezone} onChange={e => setAppearance(p => ({ ...p, timezone: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" data-testid="select-timezone">
                  {["Asia/Kolkata (IST)","America/New_York (EST)","Europe/London (GMT)","Asia/Dubai (GST)"].map(z => <option key={z}>{z}</option>)}
                </select>
              </Row>
            </div>
          )}

          {/* ── PRIVACY ────────────────────────────────────────────────────── */}
          {active === "privacy" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Privacy Controls</h2>
              <p className="text-sm text-muted-foreground mb-6">Control what others can see and how your data is used.</p>
              <SH>Profile Visibility</SH>
              <Row label="Public Profile" desc="Allow anyone with a link to view your profile."><Toggle on={privacy.profilePublic} onChange={() => tp("profilePublic")} /></Row>
              <Row label="Show Skills on Profile" desc="Display skill tags publicly."><Toggle on={privacy.showSkills} onChange={() => tp("showSkills")} /></Row>
              <Row label="Show Certificates" desc="Make certifications visible to employers."><Toggle on={privacy.showCertificates} onChange={() => tp("showCertificates")} /></Row>
              <Row label="Appear on Leaderboard" desc="Show progress on the career readiness leaderboard."><Toggle on={privacy.showOnLeaderboard} onChange={() => tp("showOnLeaderboard")} /></Row>
              <SH>Data Usage</SH>
              <Row label="Share Profile with Employers" desc="Allow anonymized profile access for job matching."><Toggle on={privacy.shareWithEmployers} onChange={() => tp("shareWithEmployers")} /></Row>
              <Row label="Analytics & Improvement" desc="Help improve Pragyan AI with anonymized usage data."><Toggle on={privacy.analyticsTracking} onChange={() => tp("analyticsTracking")} /></Row>
              <SH>Data Management</SH>
              <Row label="Download My Data" desc="Export a full copy of your profile and activity.">
                <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-2" data-testid="button-download-data">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </Row>
            </div>
          )}

          {/* ── SECURITY ───────────────────────────────────────────────────── */}
          {active === "security" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Security</h2>
              <p className="text-sm text-muted-foreground mb-6">Keep your account secure.</p>
              <SH>Password</SH>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Enter current password"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-11" data-testid="input-current-password" />
                    <button onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">New Password</label>
                  <input type="password" placeholder="Enter new password" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" data-testid="input-new-password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" data-testid="input-confirm-password" />
                </div>
                <Button className="rounded-xl px-6" data-testid="button-update-password">Update Password</Button>
              </div>
              <SH>Two-Factor Authentication</SH>
              <Row label="Enable 2FA" desc="Add an extra layer of security using an authenticator app.">
                <Button variant="outline" size="sm" className="rounded-xl" data-testid="button-setup-2fa">Set Up</Button>
              </Row>
            </div>
          )}

          {/* ── ACCOUNT ────────────────────────────────────────────────────── */}
          {active === "account" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Account</h2>
              <p className="text-sm text-muted-foreground mb-6">Manage your account and integrations.</p>
              <SH>Profile Summary</SH>
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-6">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {user?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-bold text-foreground">{user?.fullName || "User"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {user?.careerGoal && <p className="text-xs text-primary font-medium mt-0.5">Goal: {user.careerGoal}</p>}
                </div>
                <Link href="/profile" className="ml-auto">
                  <Button variant="outline" size="sm" className="rounded-xl">View Profile</Button>
                </Link>
              </div>
              <SH>Integrations</SH>
              {[
                { label: "LinkedIn", desc: "Import your experience and certifications.", connected: false },
                { label: "GitHub",   desc: "Showcase your repositories and coding activity.", connected: true  },
                { label: "Google Calendar", desc: "Sync roadmap milestones and study schedule.", connected: false },
              ].map(({ label, desc, connected }) => (
                <Row key={label} label={label} desc={desc}>
                  <Button variant={connected ? "outline" : "default"} size="sm" className="rounded-xl"
                    data-testid={`button-${connected ? "disconnect" : "connect"}-${label.toLowerCase()}`}>
                    {connected ? "Disconnect" : "Connect"}
                  </Button>
                </Row>
              ))}
              <SH>Danger Zone</SH>
              <div className="border border-destructive/30 rounded-xl p-5 space-y-4 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2"><LogOut className="w-4 h-4 text-destructive" /> Logout</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sign out of this session and return to the login screen.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => logout()}
                    data-testid="button-logout"
                  >
                    Logout
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-destructive/20">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently delete account and all data. Cannot be undone.</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10" data-testid="button-delete-account">Delete Account</Button>
                </div>
              </div>
            </div>
          )}

          {/* Generic save for notifications/appearance/privacy */}
          {active !== "account" && active !== "security" && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <p className={`text-sm font-medium transition-all ${saved ? "text-green-600 opacity-100" : "opacity-0"}`}>
                <CheckCircle2 className="w-4 h-4 inline mr-1.5" /> Saved
              </p>
              <Button onClick={() => prefMutation.mutate(appearance)} className="rounded-xl px-7"
                disabled={prefMutation.isPending} data-testid="button-save-settings">
                {prefMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
