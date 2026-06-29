import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";

const certs = [
  {
    logo: "AWS",
    logoBg: "bg-orange-900",
    logoText: "text-orange-400",
    title: "AWS Certified Developer",
    issuer: "AWS",
    issued: "12 May 2024",
    credential: "AWS-DEV-123456",
    expires: "12 May 2027",
  },
  {
    logo: "G",
    logoBg: "bg-white border border-border",
    logoText: "font-bold text-blue-500",
    title: "Google Data Analytics Professional Certificate",
    issuer: "Google",
    issued: "20 Feb 2024",
    credential: "GGL-DA-78910",
    expires: "20 Feb 2036",
  },
  {
    logo: "MS",
    logoBg: "bg-amber-400",
    logoText: "text-white font-bold",
    title: "Microsoft Azure Fundamentals",
    issuer: "Microsoft",
    issued: "10 Jan 2024",
    credential: "MS-AZ-45678",
    expires: "10 Jan 2026",
  },
];

export default function Certificates() {
  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Certificates</h1>
        <Button className="rounded-xl px-5" data-testid="button-add-certification">
          <Plus className="w-4 h-4 mr-2" /> Add Certification
        </Button>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
        <Link href="/resources" className="hover:text-foreground transition-colors">Resources</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-medium">Certifications</span>
      </div>

      <p className="text-muted-foreground text-sm mb-6 -mt-4">Add and manage your certifications.</p>

      <div className="space-y-4">
        {certs.map(({ logo, logoBg, logoText, title, issuer, issued, credential, expires }) => (
          <div key={title} className="bg-card border border-border rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-5">
              <div className={`w-16 h-16 rounded-xl ${logoBg} flex items-center justify-center flex-shrink-0 text-lg ${logoText}`}>
                {logo}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-foreground text-lg leading-tight">{title}</h3>
                  <div className="flex items-center gap-2 ml-4">
                    <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors" data-testid={`button-edit-${title.toLowerCase().replace(/\s/g, '-')}`}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors" data-testid={`button-delete-${title.toLowerCase().replace(/\s/g, '-')}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-12 gap-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issuer</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{issuer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issued On</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{issued}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Credential ID</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{credential}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expires On</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{expires}</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl" data-testid={`button-view-cert-${credential}`}>
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
