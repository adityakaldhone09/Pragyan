import { Button } from "@/components/ui/button";
import { Code2, Heart, Star, BookOpen, Briefcase, User, BarChart2, Pencil } from "lucide-react";

export default function Skills() {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Skills, Interest and Education</h1>
          <p className="text-muted-foreground mt-1">These fields drive matching quality, readiness scoring, and roadmap suggestions.</p>
        </div>
        <Button variant="outline" className="rounded-xl px-5 flex items-center gap-2" data-testid="button-edit-skills">
          <Pencil className="w-4 h-4" /> Edit
        </Button>
      </div>

      <div className="bg-card border border-border rounded-[20px] shadow-sm overflow-hidden mb-6">
        {[
          { icon: Code2, iconBg: "bg-blue-100 text-blue-600", label: "Skills", value: "React, TypeScript, SQL" },
          { icon: Heart, iconBg: "bg-red-100 text-red-500", label: "Interests", value: "Product design, data analysis" },
          { icon: Star, iconBg: "bg-amber-100 text-amber-500", label: "Preferences", value: "Remote work, team projects, fast-paced learning" },
        ].map(({ icon: Icon, iconBg, label, value }, idx) => (
          <div
            key={label}
            className={`flex items-center gap-5 px-7 py-5 ${idx < 2 ? "border-b border-border" : ""}`}
          >
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: BookOpen, iconBg: "bg-blue-100 text-blue-600", label: "Education", value: "BTech CSE, 2024" },
          { icon: Briefcase, iconBg: "bg-purple-100 text-purple-600", label: "Experience", value: "Built internal dashboards and APIs" },
          { icon: User, iconBg: "bg-green-100 text-green-600", label: "Experience type", value: "Fresher" },
          { icon: BarChart2, iconBg: "bg-amber-100 text-amber-600", label: "Skill level", value: "Beginner, Intermediate, Advance" },
        ].map(({ icon: Icon, iconBg, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
