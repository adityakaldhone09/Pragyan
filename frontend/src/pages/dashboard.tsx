import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Code, Brain, BarChart, 
  CalendarClock, ChevronRight, Sparkles,
  ArrowRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back Sanika! Let's continue your journey..</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex flex-col items-center text-center">
          <CircularProgress value={42} size={70} strokeWidth={6} />
          <h3 className="font-semibold mt-4 text-sm text-foreground">Career Clarity Score</h3>
          <p className="text-xs text-muted-foreground mt-1">Keep exploring</p>
        </div>
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex flex-col items-center text-center">
          <CircularProgress 
            value={3} 
            max={12} 
            size={70} 
            strokeWidth={6} 
            color="hsl(var(--primary))"
            valueFormatter={(val, max) => `${val} / ${max}`}
          />
          <h3 className="font-semibold mt-4 text-sm text-foreground">Roadmap Progress</h3>
          <p className="text-xs text-muted-foreground mt-1">Steps Completed</p>
        </div>
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex flex-col items-center text-center">
          <CircularProgress 
            value={2} 
            max={10} 
            size={70} 
            strokeWidth={6} 
            color="hsl(var(--primary))"
            valueFormatter={(val) => `${val}`}
          />
          <h3 className="font-semibold mt-4 text-sm text-foreground">Skills In Progress</h3>
          <p className="text-xs text-muted-foreground mt-1">Keep Learning</p>
        </div>
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex flex-col items-center text-center">
          <CircularProgress 
            value={6} 
            max={10} 
            size={70} 
            strokeWidth={6} 
            color="hsl(var(--primary))"
            valueFormatter={(val) => `${val}`}
          />
          <h3 className="font-semibold mt-4 text-sm text-foreground">Recommended Careers</h3>
          <p className="text-xs text-muted-foreground mt-1">Matches Found</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Continue Learning</h2>
            <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <BarChart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Data Analysis with Pandas</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">In Progress</p>
                  </div>
                </div>
                <Button className="rounded-full px-6">Continue</Button>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <Progress value={60} className="h-2 flex-1" />
                <span className="text-sm font-medium">60%</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Recommended for you</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 mb-4">
                  <Code className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1 leading-snug">Python for Data Science</h3>
                <p className="text-xs text-muted-foreground mb-3">Course • Beginner</p>
                <div className="flex items-center text-amber-500 text-xs font-medium">
                  ★ 4.8
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1 leading-snug">Machine Learning Basics</h3>
                <p className="text-xs text-muted-foreground mb-3">Course • Beginner</p>
                <div className="flex items-center text-amber-500 text-xs font-medium">
                  ★ 4.9
                </div>
              </div>

              <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                  <BarChart className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1 leading-snug">Data Visualization</h3>
                <p className="text-xs text-muted-foreground mb-3">Course • Beginner</p>
                <div className="flex items-center text-amber-500 text-xs font-medium">
                  ★ 4.7
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Upcoming Milestones</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Finish Pandas Course</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">May 25 2024</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Complete SQL Basics</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">May 30 2024</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary text-primary-foreground rounded-[20px] p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
            <Sparkles className="w-8 h-8 text-white/80 mb-4" />
            <h3 className="font-bold text-lg mb-2">AI Suggestion</h3>
            <p className="text-sm text-primary-foreground/90 mb-6 leading-relaxed">
              Based on your recent activity, focusing on advanced SQL queries will boost your Data Analyst match score by 15%.
            </p>
            <Link href="/roadmap" className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-white/80 transition-colors">
              View Roadmap
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
