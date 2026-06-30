import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { aiService } from "@/services/aiService";
import { dashboardService } from "@/services/dashboardService";
import {
  Sparkles, ArrowRight, Search, BarChart2, Brain,
  Target, MapPin, TrendingUp
} from "lucide-react";

const robotImg = "/opengraph.jpg";

function RobotIllustration() {
  return (
    <div className="relative w-full h-full flex items-end justify-center">
      <style>{`
        @keyframes robotFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes bubbleIn {
          0%        { opacity: 0; transform: translateY(8px) scale(0.85); }
          15%       { opacity: 1; transform: translateY(0px) scale(1); }
          75%       { opacity: 1; transform: translateY(0px) scale(1); }
          90%, 100% { opacity: 0; transform: translateY(-6px) scale(0.9); }
        }
        .robot-float { animation: robotFloat 3.2s ease-in-out infinite; }
        .hi-bubble   { animation: bubbleIn 4s ease-in-out infinite; }
      `}</style>

      {/* "Hi!" speech bubble */}
      <div className="hi-bubble absolute top-2 left-4 bg-white rounded-2xl px-4 py-2 shadow-lg pointer-events-none z-10" style={{ borderBottomLeftRadius: 4 }}>
        <span className="text-[#5B5FCF] font-bold text-sm">Hi! 👋</span>
        {/* bubble tail */}
        <div className="absolute -bottom-2 left-4 w-0 h-0" style={{ borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "10px solid white" }} />
      </div>

      {/* Robot image */}
      <img
        src={robotImg}
        alt="Pragyan AI Robot"
        className="robot-float w-full h-full object-contain drop-shadow-2xl"
      />
    </div>
  );
}

function getFirstName(fullName?: string | null) {
  return fullName?.trim().split(/\s+/)[0] || "there";
}

export default function Home() {
  const { user } = useAuth();
  const firstName = getFirstName(user?.fullName);

  const { data: heroRecommendation } = useQuery({
    queryKey: ["ai", "top-career"],
    queryFn: aiService.getTopCareer,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["ai", "recommend-careers"],
    queryFn: aiService.getCareerRecommendations,
    retry: false,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.getDashboard,
    retry: false,
  });

  const topRecommendation = heroRecommendation || recommendations[0];
  const careerMatches = recommendations.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Page header with search */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Hello, {firstName}!</h1>
          <p className="text-muted-foreground mt-1.5 text-base">Let's discover the best career path for your future</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search anything..."
              className="pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-search-home"
            />
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div
        className="relative rounded-[24px] overflow-hidden mb-8 min-h-[210px] flex items-center"
        style={{
          background: "linear-gradient(135deg, #1D1B5E 0%, #3730A3 40%, #4F46E5 70%, #5B5FCF 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-60 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-40 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />

        {/* Left content */}
        <div className="relative z-10 px-10 py-10 flex-1">
          <p className="text-white/70 text-sm font-medium mb-3">Your AI Career Recommendation</p>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-blue-300 flex-shrink-0" />
            <h2 className="text-4xl font-bold text-white leading-tight">
              {topRecommendation?.career || "Complete Assessment"}
            </h2>
          </div>
          <p className="text-white/75 text-sm leading-relaxed max-w-xs mb-7">
            {topRecommendation?.reason || "Take an assessment to get personalized career recommendations"}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {topRecommendation && (
              <button className="px-5 py-2.5 rounded-full border-2 border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition-colors backdrop-blur-sm">
                {Math.round(topRecommendation.score)}% MATCH
              </button>
            )}
            <Link href={topRecommendation ? "/roadmap" : "/assessments"}>
              <button className="px-5 py-2.5 rounded-full border-2 border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition-colors flex items-center gap-2 backdrop-blur-sm" data-testid="button-view-roadmap">
                {topRecommendation ? "View Full Roadmap" : "Start Assessment"} <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Robot illustration */}
        <div className="relative z-10 w-64 h-64 flex-shrink-0 mr-6 mt-4">
          <RobotIllustration />
        </div>
      </div>

      {/* Journey at a Glance */}
      <h2 className="text-xl font-bold text-foreground mb-4">Your Journey at a Glance</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-[18px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-tight">{recommendations.length}</p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">career option explored</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-[18px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-tight">{Math.round((recommendations[0]?.score || 0))}%</p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">top career match</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-[18px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-tight">{user?.skills?.length || 0}</p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">Skills Identified</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-[18px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-tight">{Math.round(dashboardData?.progress?.[0]?.progressPercentage || 0)}%</p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">Roadmap progress</p>
          </div>
        </div>
      </div>

      {/* Bottom two cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Career Matches */}
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
          <h3 className="font-bold text-foreground text-base mb-4">Top Career Matches</h3>
          <div className="space-y-3">
            {careerMatches.map((rec, idx) => (
              <div key={rec.career} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${
                    idx === 0 ? "bg-purple-50 text-purple-500" : 
                    idx === 1 ? "bg-orange-50 text-orange-500" : 
                    "bg-blue-50 text-blue-500"
                  } flex items-center justify-center flex-shrink-0`}>
                    {idx === 0 ? <BarChart2 className="w-4 h-4" /> : 
                     idx === 1 ? <Brain className="w-4 h-4" /> : 
                     <Target className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">{rec.career}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                  rec.score >= 80 ? "bg-green-500" : rec.score >= 60 ? "bg-green-400" : "bg-amber-500"
                }`}>
                  {Math.round(rec.score)}% match
                </span>
              </div>
            ))}
          </div>
          <Link href="/career-discovery">
            <button className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary hover:underline" data-testid="button-explore-careers">
              Explore all Careers <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Continue your Roadmap */}
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm relative overflow-hidden">
          <h3 className="font-bold text-foreground text-base mb-1">Continue your Roadmap</h3>
          <p className="text-sm font-semibold text-foreground mt-3">
            {dashboardData?.progress?.[0]?.roadmapTitle || "No active roadmap"}
          </p>
          <p className="text-xs text-muted-foreground">
            Step {Math.round((dashboardData?.progress?.[0]?.progressPercentage || 0) / 10)} of 12
          </p>

          <div className="mt-4 mb-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${dashboardData?.progress?.[0]?.progressPercentage || 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              {Math.round(dashboardData?.progress?.[0]?.progressPercentage || 0)}%
            </p>
          </div>

          <Link href="/roadmap">
            <button className="mt-2 px-5 py-2 rounded-full border-2 border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors" data-testid="button-continue-learning">
              Continue Learning
            </button>
          </Link>

          {/* Mountain decoration */}
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
            <svg viewBox="0 0 140 100" width="140" height="100" fill="none">
              <polygon points="0,100 70,20 140,100" fill="#5B5FCF"/>
              <polygon points="60,100 110,40 160,100" fill="#7C6FF7"/>
              <circle cx="110" cy="25" r="18" fill="#93C5FD" opacity="0.8"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
