import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Search, ChevronDown, Star, Clock, ExternalLink,
  Award, TrendingUp, Briefcase, BarChart2, Users
} from "lucide-react";

const resourceList = [
  { icon: "code", title: "SQL Tutorial for Beginners", desc: "Learn SQL from basics to advanced queries.", type: "Tutorial", duration: "1h 10m", rec: "Recommended for you", recNote: "Fill your SQL skill gap. Improves match by 15%.", color: "bg-blue-100 text-blue-600" },
  { icon: "sigma", title: "Statistics Fundamentals", desc: "Learn core statistics concepts for data science.", type: "Course", duration: "2h 25m", rec: "Recommended for you", recNote: "Important for Data Scientist role; improves match by 12%.", color: "bg-purple-100 text-purple-600" },
  { icon: "chart", title: "Data Visualization with Python", desc: "Create stunning visualizations using Python.", type: "Video", duration: "25min", rec: "Recommended for you", recNote: "Strengthen data visualization skill. Improves match by 8%.", color: "bg-green-100 text-green-600" },
  { icon: "book", title: "Python for Data Science", desc: "Learn Python programming for data analysis.", type: "Course", duration: "4h 30m", rec: "Continue Learning", recNote: "You left off at 60%. Continue to stay on track.", color: "bg-orange-100 text-orange-600" },
];

const typeColors: Record<string, string> = {
  Tutorial: "bg-blue-100 text-blue-700",
  Course: "bg-purple-100 text-purple-700",
  Video: "bg-green-100 text-green-700",
};

const tabs = ["All", "Articles", "Videos", "Courses", "Books", "Tutorials"];

export default function Resources() {
  const [activeTab, setActiveTab] = useState("All");

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
            className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-search-resources"
          />
        </div>
        {["All Types", "All Topics", "Sort by"].map(label => (
          <button key={label} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground hover:bg-muted transition-colors">
            {label} <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">AI Recommendations For You</p>
          <h3 className="font-bold text-sm text-foreground leading-tight mb-3">Recommended to achieve your goal faster</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">Target Role</span>
            <span className="px-2 py-0.5 bg-primary text-white rounded text-xs font-medium">Data Scientist</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">Career Match Score</p>
          <p className="text-3xl font-bold text-primary">89%</p>
          <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 12% this week
          </p>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm">
          <h3 className="font-bold text-sm text-foreground mb-4">Skill Gap Analysis</h3>
          {[
            { label: "Python", val: 80, color: "bg-green-500" },
            { label: "Statistics", val: 60, color: "bg-primary" },
            { label: "SQL", val: 40, color: "bg-amber-500" },
            { label: "Machine Learning", val: 30, color: "bg-orange-500" },
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
          <h3 className="font-bold text-sm text-foreground mb-4">Your Career Matches</h3>
          {[
            { role: "Data Scientist", pct: 92, color: "bg-green-500" },
            { role: "AI/ML Engineer", pct: 85, color: "bg-primary" },
            { role: "Data Analyst", pct: 78, color: "bg-blue-400" },
            { role: "Product Manager", pct: 48, color: "bg-red-400" },
          ].map(({ role, pct, color }) => (
            <div key={role} className="flex items-center justify-between mb-2.5 last:mb-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-sm text-foreground">{role}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{pct}%</span>
            </div>
          ))}
          <button className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1">
            Explore Careers <ExternalLink className="w-3 h-3" />
          </button>
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
          <Link href="/resources/certificates">
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
            {resourceList.map(({ title, desc, type, duration, rec, recNote, color }) => (
              <div key={title} className="bg-card border border-border rounded-[16px] p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-semibold text-sm text-foreground">{title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[type] ?? "bg-muted text-foreground"}`}>{type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {duration}
                </div>
                <div className="w-36 flex-shrink-0">
                  <p className={`text-xs font-medium ${rec === "Continue Learning" ? "text-amber-600" : "text-green-600"}`}>{rec}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{recNote}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl flex-shrink-0" data-testid={`button-view-${title.toLowerCase().replace(/\s/g, '-')}`}>
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-5">Resource Impact</h3>
            {[
              { icon: Briefcase, label: "RESOURCES COMPLETED", value: "24", color: "bg-primary/10 text-primary" },
              { icon: Clock, label: "CONTENT CONSUMED", value: "96h", color: "bg-amber-100 text-amber-600" },
              { icon: TrendingUp, label: "CAREER MATCH IMPROVEMENT", value: "+18%", color: "bg-green-100 text-green-600" },
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
            <button className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View Learning Report <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
