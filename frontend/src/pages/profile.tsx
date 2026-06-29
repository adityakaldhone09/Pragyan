import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, MapPin, Pencil,
  FolderOpen, Award, Upload, BarChart2, BadgeCheck
} from "lucide-react";

const profileChecks = [
  { label: "Basic Information", done: true },
  { label: "Skills Added", done: true },
  { label: "Projects Added", done: true },
  { label: "Certifications Added", done: true },
  { label: "Resume Uploaded", done: true },
  { label: "Assessments Completed", done: false },
];

const quickActions = [
  { icon: Pencil, label: "Edit Personal Info", href: "/information/edit" },
  { icon: FolderOpen, label: "Add New Project", href: "/profile" },
  { icon: Award, label: "Add Certification", href: "/resources/certificates" },
  { icon: Upload, label: "Upload Resume", href: "/profile" },
  { icon: BarChart2, label: "View Career Readiness", href: "/information/career-readiness" },
];

export default function Profile() {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Profile Overview</h1>
        <p className="text-muted-foreground mt-1">These fields drive matching quality, readiness scoring, and roadmap suggestions.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-3xl font-bold mb-4">
            A
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-xl text-foreground">Sanika Bavaskar</h2>
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <BadgeCheck className="w-4 h-4" /> Verified
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Learner</p>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-6">
            <MapPin className="w-4 h-4" /> Pune, Maharashtra
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
            value={87}
            size={100}
            strokeWidth={10}
            valueFormatter={() => "87%"}
          />
          <p className="text-green-600 font-bold mt-3 text-lg">Great Match!</p>
          <div className="flex gap-8 mt-4 pt-4 border-t border-border w-full justify-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Target Role</p>
              <p className="font-bold text-sm text-foreground mt-1">Data Scientist</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Career Track</p>
              <p className="font-bold text-sm text-foreground mt-1">Government Job</p>
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
