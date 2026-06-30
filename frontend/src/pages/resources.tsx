import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Search, ChevronDown, Star, Clock, ExternalLink,
  Award, TrendingUp, Briefcase, BarChart2, Users
} from "lucide-react";
import { resourceService, supportedResourceDomains } from "@/services/resourceService";
import { useAuth } from "@/hooks/useAuth";
import { aiService } from "@/services/aiService";

const typeColors: Record<string, string> = {
  Tutorial: "bg-blue-100 text-blue-700",
  Course: "bg-purple-100 text-purple-700",
  Video: "bg-green-100 text-green-700",
  Article: "bg-amber-100 text-amber-700",
  Book: "bg-rose-100 text-rose-700",
};

const tabs = ["All", "Articles", "Videos", "Courses", "Books", "Tutorials"];

export default function Resources() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>(user?.careerTrack || "Data Scientist");

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources", selectedDomain, activeTab],
    queryFn: () => resourceService.list(
      selectedDomain,
      activeTab === "All" ? undefined : activeTab,
      searchQuery
    ),
    retry: false,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["ai", "recommend-careers"],
    queryFn: aiService.getCareerRecommendations,
    retry: false,
  });

  const topRecommendation = recommendations[0];
  const topMatchScore = topRecommendation?.score || 0;

  const filteredResources = useMemo(() => {
    if (!searchQuery) return resources;
    return resources.filter(r => 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resources, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Resources</h1>
        <p className="text-muted-foreground mt-1">Explore curated sources to boost your skills.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-search-resources"
          />
        </div>
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {supportedResourceDomains.map(domain => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">AI Recommendations For You</p>
          <h3 className="font-bold text-sm text-foreground leading-tight mb-3">Recommended to achieve your goal faster</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">Target Role</span>
            <span className="px-2 py-0.5 bg-primary text-white rounded text-xs font-medium">{selectedDomain}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">Career Match Score</p>
          <p className="text-3xl font-bold text-primary">{Math.round(topMatchScore)}%</p>
          <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Strong match
          </p>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm">
          <h3 className="font-bold text-sm text-foreground mb-4">Skill Levels</h3>
          {[
            { label: "Beginner", val: 60, color: "bg-green-500" },
            { label: "Intermediate", val: 75, color: "bg-primary" },
            { label: "Advanced", val: 40, color: "bg-amber-500" },
            { label: "Expert", val: 25, color: "bg-orange-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">{label}</span>
                <span className="text-muted-foreground">{val}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${val}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm">
          <h3 className="font-bold text-sm text-foreground mb-4">Top Career Matches</h3>
          {recommendations.slice(0, 4).map(({ career, score }) => (
            <div key={career} className="flex items-center justify-between mb-2.5 last:mb-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-blue-400" : "bg-red-400"}`} />
                <span className="text-sm text-foreground">{career}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{Math.round(score)}%</span>
            </div>
          ))}
          <Link href="/career-discovery">
            <button className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Explore Careers <ExternalLink className="w-3 h-3" />
            </button>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-foreground mb-3">Learn and Earn Certificates</h3>
          <div className="space-y-2 mb-4">
            {["Enhance your skills", "Industry Recognized Certificates", "Boost Your Career Opportunities"].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs text-foreground">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                </div>
                {item}
              </div>
            ))}
          </div>
          <Link href="/certificates">
            <Button className="w-full rounded-xl text-xs py-2" data-testid="button-view-certificates">
              View Certificates
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="flex gap-1 border-b border-border mb-5">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                data-testid={`tab-resource-${tab.toLowerCase()}`}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading resources...</div>
            ) : filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
                <div key={resource.id} className="bg-card border border-border rounded-[16px] p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl ${typeColors[resource.type || "Course"] ?? "bg-muted"} flex items-center justify-center flex-shrink-0`}>
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm text-foreground">{resource.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[resource.type || "Course"] ?? "bg-muted text-foreground"}`}>
                        {resource.type || "Course"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {resource.duration || "N/A"}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl flex-shrink-0"
                    onClick={() => resource.url && window.open(resource.url, "_blank")}
                    data-testid={`button-view-${resource.id}`}
                  >
                    View
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No resources found. Try a different search or domain.
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-5">Learning Stats</h3>
            {[
              { icon: Briefcase, label: "RESOURCES AVAILABLE", value: filteredResources.length.toString(), color: "bg-primary/10 text-primary" },
              { icon: Clock, label: "TOTAL HOURS", value: "100+", color: "bg-amber-100 text-amber-600" },
              { icon: TrendingUp, label: "YOUR ENGAGEMENT", value: "8/10", color: "bg-green-100 text-green-600" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-4 mb-5 last:mb-0">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
