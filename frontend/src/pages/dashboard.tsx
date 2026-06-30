import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Code, Brain, BarChart, 
  CalendarClock, ChevronRight, Sparkles,
  ArrowRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { dashboardService } from "@/services/dashboardService";
import { aiService } from "@/services/aiService";

function getFirstName(fullName?: string | null) {
  const source = fullName?.trim() || "there";
  return source.split(/\s+/)[0];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.getDashboard,
    retry: false,
  });

  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ["ai", "recommend-careers"],
    queryFn: aiService.getCareerRecommendations,
    retry: false,
  });

  const firstName = useMemo(() => getFirstName(user?.fullName), [user?.fullName]);
  const topRecommendation = recommendations[0];

  // Calculate stats from dashboard data
  const stats = useMemo(() => ({
    clarityScore: Math.round(((recommendations.length / 10) * 100)) || 0,
    roadmapProgress: dashboardData?.progress?.[0]?.progressPercentage || 0,
    skillsInProgress: user?.skills?.length || 0,
    recommendedCareers: recommendations.length || 0,
    totalXp: dashboardData?.user?.xp || 0,
    streak: dashboardData?.user?.streak || 0,
    completedRoadmaps: dashboardData?.completedRoadmaps?.length || 0,
  }), [dashboardData, recommendations, user?.skills]);

  const currentRoadmap = dashboardData?.progress?.[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back {firstName}! Let's continue your journey..</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex flex-col items-center text-center">
          <CircularProgress value={stats.clarityScore} size={70} strokeWidth={6} />
          <h3 className="font-semibold mt-4 text-sm text-foreground">Career Clarity Score</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.clarityScore < 50 ? "Keep exploring" : stats.clarityScore < 75 ? "Getting there" : "Strong match"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex flex-col items-center text-center">
          <CircularProgress 
            value={Math.round(stats.roadmapProgress)} 
            size={70} 
            strokeWidth={6} 
            color="hsl(var(--primary))"
            valueFormatter={(val) => `${val}%`}
          />
          <h3 className="font-semibold mt-4 text-sm text-foreground">Roadmap Progress</h3>
          <p className="text-xs text-muted-foreground mt-1">Currently Active</p>
        </div>
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex flex-col items-center text-center">
          <CircularProgress 
            value={stats.skillsInProgress} 
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
            value={stats.recommendedCareers} 
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
            {currentRoadmap ? (
              <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                      <BarChart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {dashboardData?.progress?.[0]?.roadmapTitle || "Current Learning Path"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">In Progress</p>
                    </div>
                  </div>
                  <Link href="/roadmap">
                    <Button className="rounded-full px-6">Continue</Button>
                  </Link>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <Progress value={Math.round(currentRoadmap.progressPercentage)} className="h-2 flex-1" />
                  <span className="text-sm font-medium">{Math.round(currentRoadmap.progressPercentage)}%</span>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm text-center text-muted-foreground">
                <p>Start your first roadmap to begin learning!</p>
                <Link href="/roadmap" className="mt-3">
                  <Button className="rounded-full px-6">Explore Roadmaps</Button>
                </Link>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Recommended for you</h2>
            <div className="grid grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className="bg-card border border-border rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                    idx === 0 ? "bg-purple-50 text-purple-500" : 
                    idx === 1 ? "bg-orange-50 text-orange-500" : 
                    "bg-blue-50 text-blue-500"
                  }`}>
                    {idx === 0 ? <Code className="w-5 h-5" /> : 
                     idx === 1 ? <Brain className="w-5 h-5" /> : 
                     <BarChart className="w-5 h-5" />}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 leading-snug">{rec.career}</h3>
                  <p className="text-xs text-muted-foreground mb-3">Career Match</p>
                  <div className="flex items-center text-amber-500 text-xs font-medium">
                    ★ {(rec.score / 20).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total XP</span>
                <span className="font-semibold text-foreground">{stats.totalXp} XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <span className="font-semibold text-foreground">{stats.streak} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Roadmaps Completed</span>
                <span className="font-semibold text-foreground">{stats.completedRoadmaps}</span>
              </div>
            </div>
          </div>

          <div className="bg-primary text-primary-foreground rounded-[20px] p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
            <Sparkles className="w-8 h-8 text-white/80 mb-4" />
            <h3 className="font-bold text-lg mb-2">AI Suggestion</h3>
            <p className="text-sm text-primary-foreground/90 mb-6 leading-relaxed">
              {topRecommendation 
                ? `${topRecommendation.career} has a strong ${topRecommendation.score}% match with your profile. ${topRecommendation.reason || "Focus on the recommended roadmap to get started!"}`
                : "Complete your assessment to get personalized recommendations!"}
            </p>
            <Link href={topRecommendation ? "/roadmap" : "/assessments"} className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-white/80 transition-colors">
              {topRecommendation ? "View Roadmap" : "Start Assessment"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
