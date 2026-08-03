import { useState, useEffect, lazy, Suspense } from "react";
import { useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  Bell, Lock, Palette, Shield,
  Eye, EyeOff, Moon, Sun, Smartphone,
  CheckCircle2, ChevronRight, LogOut, Trash2, Download,
  MessageSquareDot, Mail, KeyRound, CalendarDays, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { TwoFactorSetupModal } from "@/components/TwoFactorSetupModal";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";

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
  const { user, logout, reloadUser } = useAuth();
  const { toast } = useToast();

  // Support deep-link and in-app navigation: /settings?tab=feedback
  // useSearch re-runs on every location change, so this effect keeps
  // the active tab in sync whenever the URL query string changes.
  const search = useSearch();
  const tabParam = new URLSearchParams(search).get("tab") as Section | null;
  const [active, setActive] = useState<Section>(
    tabParam && sections.some((s) => s.id === tabParam) ? tabParam : "notifications"
  );

  // Keep active tab in sync whenever the URL query string changes
  // (e.g. AccountMenu navigates to /settings?tab=feedback while already on /settings)
  useEffect(() => {
    if (!tabParam) return;
    if (sections.some((s) => s.id === tabParam)) {
      setActive(tabParam);
    }
  }, [tabParam]);

  const [saved, setSaved] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    compactSidebar: false,
    animationsEnabled: true,
    language: "English",
  });

  useEffect(() => {
    const preferencePayload = user?.preferences && typeof user.preferences === "object" && !Array.isArray(user.preferences)
      ? (user.preferences as Record<string, unknown>)
      : {};

    if (Object.keys(preferencePayload).length === 0) return;

    setAppearance((p) => ({
      ...p,
      theme: (preferencePayload.theme as typeof p.theme | undefined) || p.theme,
      compactSidebar: typeof preferencePayload.compactSidebar === "boolean" ? preferencePayload.compactSidebar : p.compactSidebar,
      animationsEnabled: typeof preferencePayload.animationsEnabled === "boolean" ? preferencePayload.animationsEnabled : p.animationsEnabled,
      language: typeof preferencePayload.language === "string" ? preferencePayload.language : p.language,
    }));

    setPrivacy((p) => ({
      ...p,
      profilePublic: typeof preferencePayload.profilePublic === "boolean" ? preferencePayload.profilePublic : p.profilePublic,
      showSkills: typeof preferencePayload.showSkills === "boolean" ? preferencePayload.showSkills : p.showSkills,
      showCertificates: typeof preferencePayload.showCertificates === "boolean" ? preferencePayload.showCertificates : p.showCertificates,
      shareWithEmployers: typeof preferencePayload.shareWithEmployers === "boolean" ? preferencePayload.shareWithEmployers : p.shareWithEmployers,
      analyticsTracking: typeof preferencePayload.analyticsTracking === "boolean" ? preferencePayload.analyticsTracking : p.analyticsTracking,
      showOnLeaderboard: typeof preferencePayload.showOnLeaderboard === "boolean" ? preferencePayload.showOnLeaderboard : p.showOnLeaderboard,
    }));

    setNotifs((p) => ({
      ...p,
      emailUpdates: typeof preferencePayload.emailUpdates === "boolean" ? preferencePayload.emailUpdates : p.emailUpdates,
      milestoneAlerts: typeof preferencePayload.milestoneAlerts === "boolean" ? preferencePayload.milestoneAlerts : p.milestoneAlerts,
      weeklyReport: typeof preferencePayload.weeklyReport === "boolean" ? preferencePayload.weeklyReport : p.weeklyReport,
      aiTips: typeof preferencePayload.aiTips === "boolean" ? preferencePayload.aiTips : p.aiTips,
      jobAlerts: typeof preferencePayload.jobAlerts === "boolean" ? preferencePayload.jobAlerts : p.jobAlerts,
      communityDigest: typeof preferencePayload.communityDigest === "boolean" ? preferencePayload.communityDigest : p.communityDigest,
      smsAlerts: typeof preferencePayload.smsAlerts === "boolean" ? preferencePayload.smsAlerts : p.smsAlerts,
      pushBrowser: typeof preferencePayload.pushBrowser === "boolean" ? preferencePayload.pushBrowser : p.pushBrowser,
    }));
  }, [user?.preferences]);

  const preferencesPayload = { ...appearance, ...privacy, ...notifs } as Record<string, unknown>;

  const prefMutation = useMutation({
    mutationFn: () => authService.updateProfile({ preferences: preferencesPayload } as any),
    onSuccess: async () => {
      await reloadUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: "Preferences saved", description: "Your settings were updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Unable to save preferences", description: error.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      authService.changePassword({ currentPassword, newPassword, confirmPassword: newPassword }),
    onSuccess: async () => {
      await reloadUser();
      setPasswordSuccess(true);
      setPasswordErrors({});
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password updated", description: "Your password was changed successfully." });
    },
    onError: (error: Error) => {
      setPasswordSuccess(false);
      // Surface backend message as a field error on currentPassword if it's about "incorrect"
      const msg = error.message || "Password update failed";
      if (/incorrect|wrong|invalid/i.test(msg)) {
        setPasswordErrors({ currentPassword: msg });
      } else {
        setPasswordErrors({ general: msg });
      }
      toast({ title: "Password update failed", description: msg, variant: "destructive" });
    },
  });

  /** Validate password fields client-side before sending to backend */
  const handlePasswordUpdate = () => {
    const errs: Record<string, string> = {};
    if (!passwordForm.currentPassword.trim()) {
      errs.currentPassword = "Current password is required";
    }
    if (!passwordForm.newPassword) {
      errs.newPassword = "New password is required";
    } else {
      if (passwordForm.newPassword.length < 8) errs.newPassword = "Password must be at least 8 characters";
      else if (!/[A-Z]/.test(passwordForm.newPassword)) errs.newPassword = "Password must contain at least one uppercase letter";
      else if (!/\d/.test(passwordForm.newPassword)) errs.newPassword = "Password must contain at least one number";
      else if (!/[@$!%*?&]/.test(passwordForm.newPassword)) errs.newPassword = "Password must contain at least one special character (@$!%*?&)";
    }
    if (!passwordForm.confirmPassword) {
      errs.confirmPassword = "Please confirm your new password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    if (passwordForm.currentPassword && passwordForm.newPassword && passwordForm.currentPassword === passwordForm.newPassword) {
      errs.newPassword = "New password must be different from the current password";
    }
    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      setPasswordSuccess(false);
      return;
    }
    setPasswordErrors({});
    setPasswordSuccess(false);
    passwordMutation.mutate(passwordForm);
  };

  const tn  = <K extends keyof typeof notifs>(k: K)  => setNotifs(p  => ({ ...p, [k]: !p[k] }));
  const tp  = <K extends keyof typeof privacy>(k: K) => setPrivacy(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <TwoFactorSetupModal open={show2FAModal} onClose={() => setShow2FAModal(false)} />
      <DeleteAccountModal  open={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
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
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => {
                        setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }));
                        setPasswordErrors((p) => { const n = { ...p }; delete n.currentPassword; return n; });
                      }}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-11 ${passwordErrors.currentPassword ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
                      data-testid="input-current-password"
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-destructive mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Min 8 chars, uppercase, number, special char"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm((p) => ({ ...p, newPassword: e.target.value }));
                        setPasswordErrors((p) => { const n = { ...p }; delete n.newPassword; return n; });
                      }}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-11 ${passwordErrors.newPassword ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
                      data-testid="input-new-password"
                    />
                    <button type="button" onClick={() => setShowNewPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-destructive mt-1">{passwordErrors.newPassword}</p>
                  )}
                  {/* Strength hints */}
                  {passwordForm.newPassword && !passwordErrors.newPassword && (
                    <ul className="mt-1.5 space-y-0.5">
                      {[
                        { test: passwordForm.newPassword.length >= 8,        label: "At least 8 characters" },
                        { test: /[A-Z]/.test(passwordForm.newPassword),       label: "One uppercase letter" },
                        { test: /\d/.test(passwordForm.newPassword),          label: "One number" },
                        { test: /[@$!%*?&]/.test(passwordForm.newPassword),   label: "One special character (@$!%*?&)" },
                      ].map(({ test, label }) => (
                        <li key={label} className={`text-xs flex items-center gap-1.5 ${test ? "text-green-600" : "text-muted-foreground"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${test ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                          {label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }));
                        setPasswordErrors((p) => { const n = { ...p }; delete n.confirmPassword; return n; });
                      }}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-11 ${passwordErrors.confirmPassword ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
                      data-testid="input-confirm-password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                {/* General backend error */}
                {passwordErrors.general && (
                  <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-2.5">{passwordErrors.general}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Password updated successfully.
                  </p>
                )}

                <Button
                  className="rounded-xl px-6"
                  data-testid="button-update-password"
                  onClick={handlePasswordUpdate}
                  disabled={passwordMutation.isPending}
                >
                  {passwordMutation.isPending ? "Updating…" : "Update Password"}
                </Button>
              </div>
              <SH>Two-Factor Authentication</SH>
              <Row label="Enable 2FA" desc="Add an extra layer of security using an authenticator app.">
                <Button variant="outline" size="sm" className="rounded-xl" data-testid="button-setup-2fa" onClick={() => setShow2FAModal(true)}>
                  Set Up
                </Button>
              </Row>
            </div>
          )}

          {/* ── ACCOUNT ────────────────────────────────────────────────────── */}
          {active === "account" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Account</h2>
              <p className="text-sm text-muted-foreground mb-6">Manage your account information, integrations, and session.</p>

              {/* ── Account Information ── */}
              <SH>Account Information</SH>
              <div className="rounded-xl border border-border overflow-hidden mb-6">
                {/* Primary Email */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-none mb-1">Primary Email</p>
                    <p className="text-sm text-foreground font-medium truncate">{user?.email ?? "—"}</p>
                  </div>
                  {user?.emailVerified ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex-shrink-0">
                      Unverified
                    </span>
                  )}
                </div>

                {/* Authentication Provider */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-none mb-1">Authentication</p>
                    <p className="text-sm text-foreground font-medium capitalize">
                      {user?.provider === "google" ? "Google OAuth" : user?.provider === "github" ? "GitHub OAuth" : "Email & Password"}
                    </p>
                  </div>
                  {user?.linkedAccounts && user.linkedAccounts.length > 1 && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full flex-shrink-0">
                      {user.linkedAccounts.length} connected
                    </span>
                  )}
                </div>

                {/* Member Since */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-none mb-1">Member Since</p>
                    <p className="text-sm text-foreground font-medium">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Active Sessions ── */}
              <SH>Active Sessions</SH>
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl mb-6">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Current session</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This device · Active now</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl flex-shrink-0 text-amber-700 border-amber-300 hover:bg-amber-50 gap-1.5 font-semibold"
                  onClick={() => logout()}
                  data-testid="button-logout-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </Button>
              </div>

              {/* ── Integrations ── */}
              <SH>Integrations</SH>
              {[
                { label: "LinkedIn",       desc: "Import your experience and certifications.",          connected: false },
                { label: "GitHub",         desc: "Showcase your repositories and coding activity.",     connected: true  },
                { label: "Google Calendar",desc: "Sync roadmap milestones and study schedule.",         connected: false },
              ].map(({ label, desc, connected }) => (
                <Row key={label} label={label} desc={desc}>
                  <Button variant={connected ? "outline" : "default"} size="sm" className="rounded-xl"
                    data-testid={`button-${connected ? "disconnect" : "connect"}-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {connected ? "Disconnect" : "Connect"}
                  </Button>
                </Row>
              ))}

              {/* ── Danger Zone ── */}
              <SH>Danger Zone</SH>
              <div className="border border-destructive/30 rounded-xl p-5 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently removes your account and all associated data. This action cannot be undone.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl ml-4 flex-shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold"
                    data-testid="button-delete-account"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </Button>
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
              <Button onClick={() => prefMutation.mutate()} className="rounded-xl px-7"
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
