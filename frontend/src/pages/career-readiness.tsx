import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ChevronRight, Sparkles, ArrowRight } from "lucide-react";

const skillGaps = [
  { label: "Python", val: 90, color: "bg-primary" },
  { label: "Statistics", val: 70, color: "bg-primary" },
  { label: "SQL", val: 60, color: "bg-primary" },
  { label: "Machine Learning", val: 80, color: "bg-primary" },
  { label: "Data Visualization", val: 50, color: "bg-primary" },
];

const missingSkills = [
  { skill: "Feature Engineering", priority: "High Priority", color: "bg-red-100 text-red-600" },
  { skill: "Model Deployment", priority: "Medium", color: "bg-orange-100 text-orange-600" },
  { skill: "Deep Learning", priority: "Medium", color: "bg-orange-100 text-orange-600" },
  { skill: "Data Warehousing", priority: "Low", color: "bg-green-100 text-green-600" },
];

const actions = [
  "Take SQL Advanced Course",
  "Complete Machine Learning Project",
  "Finish Assessment 3",
  "Add 2 More Projects",
];

export default function CareerReadiness() {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link href="/profile" className="hover:text-foreground transition-colors">Profile</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-medium">Career Readiness</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Career Readiness</h1>
        <p className="text-muted-foreground mt-1">AI-powered insights to help you reach your dream role.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Target Career</p>
          <h2 className="text-2xl font-bold text-foreground mb-6">Data Scientist</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Career Match Score</p>
          <CircularProgress
            value={92}
            size={120}
            strokeWidth={10}
            valueFormatter={() => "92%"}
          />
          <p className="text-green-600 font-bold text-xl mt-4">Excellent Match!</p>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-7 shadow-sm">
          <h2 className="font-bold text-foreground text-lg mb-5">Skill Gap Analysis</h2>
          <div className="space-y-4">
            {skillGaps.map(({ label, val, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-foreground font-medium">{label}</span>
                  <span className="text-muted-foreground font-semibold">{val}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-[20px] p-7 shadow-sm">
          <h2 className="font-bold text-foreground text-lg mb-5">Top Missing Skills</h2>
          <div className="space-y-3">
            {missingSkills.map(({ skill, priority, color }) => (
              <div key={skill} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium text-foreground">{skill}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{priority}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-7 shadow-sm">
          <h2 className="font-bold text-foreground text-lg mb-5">Recommended Actions</h2>
          <div className="space-y-1">
            {actions.map(action => (
              <button
                key={action}
                className="w-full flex items-center justify-between py-3 px-3 rounded-xl text-sm text-foreground hover:bg-muted transition-colors group"
                data-testid={`action-${action.toLowerCase().replace(/\s/g, '-')}`}
              >
                <span className="font-medium">{action}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-[20px] p-6 flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground">AI Recommendation</p>
            <p className="text-sm text-muted-foreground mt-0.5">Focus on improving SQL and Data Visualization skills to boost your match score by 15%.</p>
          </div>
        </div>
        <Link href="/roadmap">
          <Button className="rounded-xl px-6 flex-shrink-0" data-testid="button-view-roadmap">
            View Roadmap <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
