import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Briefcase, Globe, Code2, BarChart2, Cpu,
  ChevronRight, Search, Star, Users, ArrowRight, Sparkles
} from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";
import { aiService } from "@/services/aiService";

const careerIcons: Record<string, typeof Code2> = {
  "Data Scientist": BarChart2,
  "AI/ML Engineer": Cpu,
  "Data Analyst": BarChart2,
  "Software Engineer": Code2,
  "Product Manager": Briefcase,
  "DevOps Engineer": Globe,
  "Frontend Developer": Code2,
  "Backend Developer": Code2,
};

const demandMap: Record<string, { text: string; color: string }> = {
  high: { text: "High", color: "text-green-600 bg-green-100" },
  medium: { text: "Medium", color: "text-amber-600 bg-amber-100" },
  low: { text: "Low", color: "text-red-600 bg-red-100" },
};

export default function CareerDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["ai", "recommend-careers"],
    queryFn: aiService.getCareerRecommendations,
    retry: false,
  });

  const filteredCareers = useMemo(() => {
    return recommendations
      .filter((rec) =>
        searchQuery === ""
          ? true
          : rec.career?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [recommendations, searchQuery]);

  const getCareerIcon = (career: string) => {
    const Icon = careerIcons[career] || Briefcase;
    return Icon;
  };

  const getDemand = (score: number): "high" | "medium" | "low" => {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  };

  const getCareerSalary = (career: string): string => {
    const salaryRanges: Record<string, string> = {
      "Software Engineer": "₹8–18 LPA",
      "Data Scientist": "₹10–22 LPA",
      "AI/ML Engineer": "₹12–25 LPA",
      "Product Manager": "₹12–24 LPA",
      "DevOps Engineer": "₹10–20 LPA",
      "Cloud Architect": "₹14–28 LPA",
      "Frontend Developer": "₹8–16 LPA",
      "Backend Developer": "₹10–20 LPA",
    };
    return salaryRanges[career] || "₹8–20 LPA";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Career Discovery</h1>
        <p className="text-muted-foreground mt-1">Find careers that match your skills and interests.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search careers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading career recommendations...</div>
      ) : filteredCareers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredCareers.map((rec, idx) => {
            const Icon = getCareerIcon(rec.career);
            const demand = getDemand(rec.score || 0);
            const salary = getCareerSalary(rec.career);

            return (
              <div
                key={rec.career}
                className="bg-card border border-border rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-foreground">{rec.career}</h3>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                            Top Match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.reason || "Based on your profile and skills"}</p>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">AVERAGE SALARY</p>
                          <p className="text-lg font-semibold text-foreground">{salary}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">JOB DEMAND</p>
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${demandMap[demand].color}`}>
                            {demandMap[demand].text}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">GROWTH RATE</p>
                          <p className="text-lg font-semibold text-green-600">+20%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4 flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <CircularProgress
                        value={rec.score || 0}
                        size={80}
                        strokeWidth={6}
                        valueFormatter={(val) => `${val}%`}
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-center">Match Score</p>
                    </div>

                    <Link href={`/journey/${rec.career.toLowerCase().replace(/\s+/g, "-")}`}>
                      <Button className="rounded-full px-6 flex items-center gap-2">
                        Explore
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No careers found matching your search.</p>
          <Button
            variant="outline"
            onClick={() => setSearchQuery("")}
            className="rounded-xl"
          >
            Clear Search
          </Button>
        </div>
      )}

      {recommendations.length === 0 && !isLoading && (
        <div className="bg-card border border-border rounded-[20px] p-12 shadow-sm text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Recommendations Yet</h3>
          <p className="text-muted-foreground mb-6">
            Complete your assessment to get personalized career recommendations.
          </p>
          <Link href="/assessments">
            <Button className="rounded-full px-6">
              Start Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
