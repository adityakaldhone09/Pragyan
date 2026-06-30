import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  User, Linkedin, CalendarDays, Mail,
  Phone, MapPin, Briefcase, Target, Pencil, Save
} from "lucide-react";

export default function Information() {
  const { user } = useAuth();

  const fields = [
    { icon: User, label: "FULL NAME", value: user?.fullName || "Not set" },
    { icon: Linkedin, label: "LINKEDIN", value: user?.linkedin || "Not provided" },
    { icon: CalendarDays, label: "AGE", value: user?.age ? String(user.age) : "Not set" },
    { icon: Mail, label: "EMAIL", value: user?.email || "Not set" },
    { icon: Phone, label: "PHONE", value: user?.phone || "Not provided" },
    { icon: MapPin, label: "LOCATION", value: user?.location || "Not set" },
    { icon: Briefcase, label: "CURRENT TITLE", value: user?.title || "Learner" },
    { icon: Target, label: "CAREER TRACK", value: user?.careerTrack || "Not specified" },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Identity and Contact</h1>
          <p className="text-muted-foreground mt-1">Keep the core profile that powers recommendations, dashboards, and referrals up to date.</p>
        </div>
        <Link href="/information/edit">
          <Button variant="outline" className="rounded-xl px-5 flex items-center gap-2" data-testid="button-edit-profile">
            <Pencil className="w-4 h-4" /> Edit Profile
          </Button>
        </Link>
      </div>

      <div className="mt-8 bg-card border border-border rounded-[20px] shadow-sm overflow-hidden">
        <div className="grid grid-cols-2">
          {fields.map(({ icon: Icon, label, value }, idx) => {
            const isLastRow = idx >= fields.length - 2;
            const isLeft = idx % 2 === 0;
            return (
              <div
                key={label}
                className={`flex items-center gap-4 px-8 py-6
                  ${!isLastRow ? "border-b border-border" : ""}
                  ${isLeft ? "border-r border-border" : ""}
                `}
                data-testid={`field-${label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="font-semibold text-foreground mt-0.5">{value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="outline" className="rounded-xl px-6 flex items-center gap-2" data-testid="button-save-identity">
          <Save className="w-4 h-4" /> Save Identity
        </Button>
      </div>
    </div>
  );
}
