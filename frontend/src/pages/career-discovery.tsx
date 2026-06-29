import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Briefcase, Globe, Code2, BarChart2, Cpu,
  ChevronRight, Search, Star, Users, ArrowRight, Sparkles
} from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";

const careers = [
  {
    id: 1,
    title: "Data Scientist",
    sector: "Government & Tech",
    match: 92,
    demand: "High",
    demandColor: "text-green-600 bg-green-100",
    avg: "₹12–18 LPA",
    icon: BarChart2,
    iconBg: "bg-primary/10 text-primary",
    tags: ["Python", "ML", "Statistics", "SQL"],
    desc: "Analyze large datasets to drive data-informed decisions in government and enterprise organizations.",
    recommended: true,
  },
  {
    id: 2,
    title: "AI / ML Engineer",
    sector: "Technology",
    match: 85,
    demand: "High",
    demandColor: "text-green-600 bg-green-100",
    avg: "₹14–22 LPA",
    icon: Cpu,
    iconBg: "bg-purple-100 text-purple-600",
    tags: ["Deep Learning", "TensorFlow", "Python", "Cloud"],
    desc: "Design and deploy machine learning models that power intelligent systems and applications.",
    recommended: false,
  },
  {
    id: 3,
    title: "Data Analyst",
    sector: "Finance & Analytics",
    match: 78,
    demand: "Medium",
    demandColor: "text-amber-600 bg-amber-100",
    avg: "₹6–12 LPA",
    icon: BarChart2,
    iconBg: "bg-blue-100 text-blue-600",
    tags: ["Excel", "SQL", "Tableau", "Power BI"],
    desc: "Interpret data and translate insights into business strategies for decision-makers.",
    recommended: false,
  },
  {
    id: 4,
    title: "Software Engineer",
    sector: "Government IT",
    match: 74,
    demand: "High",
    demandColor: "text-green-600 bg-green-100",
    avg: "₹8–15 LPA",
    icon: Code2,
    iconBg: "bg-orange-100 text-orange-600",
    tags: ["React", "Node.js", "Java", "Cloud"],
    desc: "Build scalable digital infrastructure for public services and government applications.",
    recommended: false,
  },
  {
    id: 5,
    title: "Product Manager",
    sector: "Startups & Enterprise",
    match: 48,
    demand: "Medium",
    demandColor: "text-amber-600 bg-amber-100",
    avg: "₹15–25 LPA",
    icon: Briefcase,
    iconBg: "bg-pink-100 text-pink-600",
    tags: ["Strategy", "Agile", "User Research", "Roadmapping"],
    desc: "Define product vision and drive cross-functional teams to deliver impactful solutions.",
    recommended: false,
  },
  {
    id: 6,
    title: "Cybersecurity Analyst",
    sector: "Government & Defense",
    match: 42,
    demand: "Very High",
    demandColor: "text-green-600 bg-green-100",
    avg: "₹10–20 LPA",
    icon: Globe,
    iconBg: "bg-red-100 text-red-500",
    tags: ["Networking", "Ethical Hacking", "SIEM", "Compliance"],
    desc: "Protect digital assets and infrastructure from cyber threats in high-security environments.",
    recommended: false,
  },
];

const sectors = ["All Sectors", "Government & Tech", "Technology", "Finance & Analytics", "Government IT", "Startups & Enterprise"];

export default function CareerDiscovery() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All Sectors");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = careers.filter(c => {
    const matchesSector = sector === "All Sectors" || c.sector === sector;
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesSector && matchesSearch;
  });

  const selectedCareer = careers.find(c => c.id === selected);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Career Discovery</h1>
        <p className="text-muted-foreground mt-1">Explore career paths matched to your skills, interests, and goals.</p>
      </div>

      {/* AI Match Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-[20px] p-5 flex items-center gap-5 mb-7">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground">AI-Powered Career Matching</p>
          <p className="text-sm text-muted-foreground mt-0.5">Based on your assessment, skills, and interests — Pragyan AI has identified <span className="font-semibold text-primary">6 compatible career paths</span> for you.</p>
        </div>
        <Link href="/assessments">
          <Button variant="outline" className="rounded-xl flex-shrink-0" data-testid="button-retake-assessment">
            Retake Assessment <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search careers or skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-search-careers"
          />
        </div>
        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          data-testid="select-sector"
        >
          {sectors.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className={`grid gap-6 ${selectedCareer ? "grid-cols-3" : "grid-cols-3"}`}>
        {/* Career cards */}
        <div className={`${selectedCareer ? "col-span-2" : "col-span-3"} grid ${selectedCareer ? "grid-cols-2" : "grid-cols-3"} gap-4 content-start`}>
          {filtered.map(career => {
            const Icon = career.icon;
            const isSelected = selected === career.id;
            return (
              <div
                key={career.id}
                onClick={() => setSelected(isSelected ? null : career.id)}
                data-testid={`card-career-${career.id}`}
                className={`bg-card border rounded-[20px] p-5 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {career.recommended && (
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
                    <Star className="w-3 h-3 fill-primary" /> Best Match for You
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${career.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <CircularProgress
                    value={career.match}
                    size={44}
                    strokeWidth={5}
                    valueFormatter={v => `${v}%`}
                  />
                </div>
                <h3 className="font-bold text-foreground text-sm leading-tight mb-0.5">{career.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{career.sector}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${career.demandColor}`}>
                    {career.demand} Demand
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">{career.avg}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {career.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-muted rounded text-[10px] text-foreground font-medium">{tag}</span>
                  ))}
                  {career.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">+{career.tags.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedCareer && (
          <div className="col-span-1">
            <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm sticky top-0">
              <div className="flex items-start gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl ${selectedCareer.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <selectedCareer.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg leading-tight">{selectedCareer.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCareer.sector}</p>
                </div>
              </div>

              <div className="flex justify-center mb-5">
                <div className="text-center">
                  <CircularProgress value={selectedCareer.match} size={90} strokeWidth={9} />
                  <p className="text-sm font-semibold text-foreground mt-2">Career Match Score</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{selectedCareer.desc}</p>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground font-medium">Avg. Salary</span>
                  <span className="text-sm font-bold text-foreground">{selectedCareer.avg}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground font-medium">Job Demand</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedCareer.demandColor}`}>{selectedCareer.demand}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground font-medium">Openings</span>
                  <span className="text-sm font-bold text-foreground flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" /> 1,200+
                  </span>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Skills Required</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCareer.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Link href="/roadmap">
                  <Button className="w-full rounded-xl" data-testid="button-explore-roadmap">
                    Explore Roadmap <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/resources">
                  <Button variant="outline" className="w-full rounded-xl" data-testid="button-view-resources">
                    View Resources
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="col-span-3 text-center py-16 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No careers match your search.</p>
          <p className="text-sm mt-1">Try different keywords or clear the filters.</p>
        </div>
      )}
    </div>
  );
}
