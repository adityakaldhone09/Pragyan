import { useState, useEffect } from "react";
import {
  Bell, Lock, Palette, Globe, Shield,
  Eye, EyeOff, Moon, Sun, Smartphone,
  Mail, MessageSquare, TrendingUp, CheckCircle2,
  ChevronRight, LogOut, Trash2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useMutation } from "@tanstack/react-query";

type Section = "notifications" | "privacy" | "appearance" | "account" | "security";

const sections: { id: Section; label: string; icon: typeof Bell }[] = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "security", label: "Security", icon: Lock },
  { id: "account", label: "Account", icon: Shield },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      data-testid="toggle"
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
        on ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 pr-6">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 mt-6 first:mt-0 px-1">
      {children}
    </h3>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [active, setActive] = useState<Section>("notifications");
  const [saved, setSaved] = useState(false);

  const [notifs, setNotifs] = useState({
    emailUpdates: true,
    milestoneAlerts: true,
    weeklyReport: true,
    aiTips: true,
    jobAlerts: false,
    communityDigest: false,
    smsAlerts: false,
    pushBrowser: true,
  });

  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    showSkills: true,
    showCertificates: true,
    shareWithEmployers: false,
    analyticsTracking: true,
    showOnLeaderboard: true,
  });

  const [appearance, setAppearance] = useState({
    theme: "light" as "light" | "dark" | "system",
    compactSidebar: false,
    animationsEnabled: true,
    language: "English",
    timezone: "Asia/Kolkata (IST)",
  });

  const [showPassword, setShowPassword] = useState(false);

  const updatePreferencesMutation = useMutation({
    mutationFn: (prefs: Partial<typeof appearance>) =>
      authService.updateProfile({
        preferences: prefs,
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (user?.preferences) {
      setAppearance(prev => ({ ...prev, ...user.preferences }));
    }
  }, [user?.preferences]);

  const handleSave = () => {
    updatePreferencesMutation.mutate(appearance);
  };

  const toggle = <K extends keyof typeof notifs>(key: K) =>
    setNotifs(p => ({ ...p, [key]: !p[key] }));

  const togglePrivacy = <K extends keyof typeof privacy>(key: K) =>
    setPrivacy(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and privacy controls.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <aside className="w-52 flex-shrink-0">
          <nav className="bg-card border border-border rounded-[20px] overflow-hidden shadow-sm">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                data-testid={`settings-nav-${id}`}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors border-b border-border last:border-0 ${
                  active === id
                    ? "bg-primary/5 text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1 bg-card border border-border rounded-[20px] p-7 shadow-sm">
          {saved && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully!
            </div>
          )}

          {/* NOTIFICATIONS */}
          {active === "notifications" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose how and when Pragyan AI notifies you.</p>

              <SectionHeading>Email Notifications</SectionHeading>
              <SettingRow label="Career Updates & Tips" desc="Weekly personalized tips based on your roadmap progress.">
                <Toggle on={notifs.emailUpdates} onChange={() => toggle("emailUpdates")} />
              </SettingRow>
              <SettingRow label="Weekly Progress Report" desc="Summary of your activity, milestones, and match score changes.">
                <Toggle on={notifs.weeklyReport} onChange={() => toggle("weeklyReport")} />
              </SettingRow>
              <SettingRow label="Job & Opportunity Alerts" desc="Relevant job postings matching your career track and skills.">
                <Toggle on={notifs.jobAlerts} onChange={() => toggle("jobAlerts")} />
              </SettingRow>
              <SettingRow label="Community Digest" desc="Highlights from forums and peer discussions.">
                <Toggle on={notifs.communityDigest} onChange={() => toggle("communityDigest")} />
              </SettingRow>

              <SectionHeading>In-App Notifications</SectionHeading>
              <SettingRow label="Milestone Alerts" desc="Get notified when you reach or miss a roadmap milestone.">
                <Toggle on={notifs.milestoneAlerts} onChange={() => toggle("milestoneAlerts")} />
              </SettingRow>
              <SettingRow label="AI Suggestions" desc="Smart nudges from Pragyan AI when you're off track.">
                <Toggle on={notifs.aiTips} onChange={() => toggle("aiTips")} />
              </SettingRow>
              <SettingRow label="Browser Push Notifications" desc="Real-time alerts delivered to your browser.">
                <Toggle on={notifs.pushBrowser} onChange={() => toggle("pushBrowser")} />
              </SettingRow>

              <SectionHeading>SMS Notifications</SectionHeading>
              <SettingRow label="Critical Alerts via SMS" desc="Important deadline or milestone reminders via text message.">
                <Toggle on={notifs.smsAlerts} onChange={() => toggle("smsAlerts")} />
              </SettingRow>
            </div>
          )}

          {/* APPEARANCE */}
          {active === "appearance" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Appearance</h2>
              <p className="text-sm text-muted-foreground mb-6">Customize how the app looks and feels.</p>

              <SectionHeading>Theme</SectionHeading>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(["light", "dark", "system"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setAppearance(p => ({ ...p, theme: t }))}
                    data-testid={`theme-${t}`}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      appearance.theme === t
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    {t === "light" && <Sun className="w-6 h-6 text-amber-500" />}
                    {t === "dark" && <Moon className="w-6 h-6 text-primary" />}
                    {t === "system" && <Smartphone className="w-6 h-6 text-muted-foreground" />}
                    <span className="text-sm font-medium capitalize text-foreground">{t}</span>
                    {appearance.theme === t && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <SectionHeading>Display</SectionHeading>
              <SettingRow label="Compact Sidebar" desc="Reduce sidebar item height for more screen space.">
                <Toggle on={appearance.compactSidebar} onChange={() => setAppearance(p => ({ ...p, compactSidebar: !p.compactSidebar }))} />
              </SettingRow>
              <SettingRow label="Animations & Transitions" desc="Enable smooth page transitions and micro-interactions.">
                <Toggle on={appearance.animationsEnabled} onChange={() => setAppearance(p => ({ ...p, animationsEnabled: !p.animationsEnabled }))} />
              </SettingRow>

              <SectionHeading>Language & Region</SectionHeading>
              <SettingRow label="Language">
                <select
                  value={appearance.language}
                  onChange={e => setAppearance(p => ({ ...p, language: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  data-testid="select-language"
                >
                  {["English", "Hindi", "Marathi", "Tamil", "Telugu"].map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </SettingRow>
              <SettingRow label="Timezone">
                <select
                  value={appearance.timezone}
                  onChange={e => setAppearance(p => ({ ...p, timezone: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  data-testid="select-timezone"
                >
                  {[
                    "Asia/Kolkata (IST)",
                    "America/New_York (EST)",
                    "Europe/London (GMT)",
                    "Asia/Dubai (GST)",
                  ].map(z => <option key={z}>{z}</option>)}
                </select>
              </SettingRow>

              <div className="mt-8 flex gap-3">
                <Button 
                  onClick={handleSave}
                  disabled={updatePreferencesMutation.isPending}
                  className="rounded-xl"
                >
                  {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          )}

          {/* PRIVACY */}
          {active === "privacy" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Privacy Controls</h2>
              <p className="text-sm text-muted-foreground mb-6">Control what others can see and how your data is used.</p>

              <SectionHeading>Profile Visibility</SectionHeading>
              <SettingRow label="Public Profile" desc="Allow anyone with a link to view your profile and career match score.">
                <Toggle on={privacy.profilePublic} onChange={() => togglePrivacy("profilePublic")} />
              </SettingRow>
              <SettingRow label="Show Skills on Profile" desc="Display your skill tags and proficiency levels publicly.">
                <Toggle on={privacy.showSkills} onChange={() => togglePrivacy("showSkills")} />
              </SettingRow>
              <SettingRow label="Show Certificates" desc="Make your certifications visible to employers and peers.">
                <Toggle on={privacy.showCertificates} onChange={() => togglePrivacy("showCertificates")} />
              </SettingRow>
              <SettingRow label="Appear on Leaderboard" desc="Show your progress on the community career readiness leaderboard.">
                <Toggle on={privacy.showOnLeaderboard} onChange={() => togglePrivacy("showOnLeaderboard")} />
              </SettingRow>

              <SectionHeading>Data Usage</SectionHeading>
              <SettingRow label="Share Profile with Employers" desc="Allow curated job platforms to access your anonymized career profile for matching.">
                <Toggle on={privacy.shareWithEmployers} onChange={() => togglePrivacy("shareWithEmployers")} />
              </SettingRow>
              <SettingRow label="Analytics & Improvement" desc="Help improve Pragyan AI by sharing anonymized usage data.">
                <Toggle on={privacy.analyticsTracking} onChange={() => togglePrivacy("analyticsTracking")} />
              </SettingRow>

              <SectionHeading>Data Management</SectionHeading>
              <SettingRow label="Download My Data" desc="Export a full copy of your profile, assessments, and activity.">
                <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-2" data-testid="button-download-data">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </SettingRow>
            </div>
          )}

          {/* SECURITY */}
          {active === "security" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Security</h2>
              <p className="text-sm text-muted-foreground mb-6">Keep your account secure.</p>

              <SectionHeading>Password</SectionHeading>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-11"
                      data-testid="input-current-password"
                    />
                    <button
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button className="rounded-xl px-6" data-testid="button-update-password">
                  Update Password
                </Button>
              </div>

              <SectionHeading>Two-Factor Authentication</SectionHeading>
              <SettingRow
                label="Enable 2FA"
                desc="Add an extra layer of security using an authenticator app or SMS."
              >
                <Button variant="outline" size="sm" className="rounded-xl" data-testid="button-setup-2fa">
                  Set Up
                </Button>
              </SettingRow>

              <SectionHeading>Sessions</SectionHeading>
              {[
                { device: "Chrome on Windows", location: "Pune, Maharashtra", time: "Active now", current: true },
                { device: "Safari on iPhone", location: "Pune, Maharashtra", time: "2 hours ago", current: false },
                { device: "Chrome on Android", location: "Mumbai, Maharashtra", time: "3 days ago", current: false },
              ].map(({ device, location, time, current }) => (
                <div key={device} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${current ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{device}</p>
                      <p className="text-xs text-muted-foreground">{location} · {time}</p>
                    </div>
                    {current && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">This device</span>
                    )}
                  </div>
                  {!current && (
                    <button className="text-xs text-destructive hover:underline font-medium" data-testid={`button-revoke-${device.toLowerCase().replace(/\s/g, '-')}`}>
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ACCOUNT */}
          {active === "account" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Account</h2>
              <p className="text-sm text-muted-foreground mb-6">Manage your account details and subscription.</p>

              <SectionHeading>Profile</SectionHeading>
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-6">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {user?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-bold text-foreground">{user?.fullName || "User"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-primary font-semibold mt-0.5">{user?.role === "ADMIN" ? "Premium Plan" : "Free Plan"}</p>
                </div>
              </div>

              <SectionHeading>Account Stats</SectionHeading>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Career Match", value: "85%", color: "text-primary" },
                  { label: "Roadmaps Active", value: user?.roadmaps?.length || "1", color: "text-green-600" },
                  { label: "Assessments Done", value: "2", color: "text-amber-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{label}</p>
                  </div>
                ))}
              </div>

              <SectionHeading>Account Actions</SectionHeading>
              <SettingRow label="Download My Data" desc="Export a full copy of your profile and activity.">
                <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </SettingRow>
              <SettingRow label="Delete Account" desc="Permanently delete your account and all associated data.">
                <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:text-destructive" data-testid="button-delete-account">
                  Delete
                </Button>
              </SettingRow>

              <SectionHeading>Integrations</SectionHeading>
              {[
                { label: "LinkedIn", desc: "Connect to import your experience and certifications.", icon: Globe, connected: false },
                { label: "GitHub", desc: "Showcase your repositories and coding activity.", icon: Globe, connected: true },
                { label: "Google Calendar", desc: "Sync your roadmap milestones and study schedule.", icon: Globe, connected: false },
              ].map(({ label, desc, connected }) => (
                <SettingRow key={label} label={label} desc={desc}>
                  <Button
                    variant={connected ? "outline" : "default"}
                    size="sm"
                    className="rounded-xl"
                    data-testid={`button-${connected ? "disconnect" : "connect"}-${label.toLowerCase()}`}
                  >
                    {connected ? "Disconnect" : "Connect"}
                  </Button>
                </SettingRow>
              ))}

              <SectionHeading>Danger Zone</SectionHeading>
              <div className="border border-destructive/30 rounded-xl p-5 space-y-4 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-destructive" /> Sign Out of All Devices
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">This will end all active sessions.</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10" data-testid="button-signout-all">
                    Sign Out All
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-destructive/20">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-destructive" /> Delete Account
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10" data-testid="button-delete-account">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Save button (not shown for account section) */}
          {active !== "account" && active !== "security" && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <p className={`text-sm font-medium transition-all ${saved ? "text-green-600 opacity-100" : "opacity-0"}`}>
                <CheckCircle2 className="w-4 h-4 inline mr-1.5" /> Changes saved
              </p>
              <Button onClick={handleSave} className="rounded-xl px-7" data-testid="button-save-settings">
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
