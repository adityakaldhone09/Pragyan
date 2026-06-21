import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, Github, Linkedin } from "lucide-react";

const inputCls = "w-full px-4 py-3 border border-border rounded-xl text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
const labelCls = "block text-sm font-medium text-muted-foreground mb-1.5";

export default function EditInformation() {
  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link href="/profile" className="hover:text-foreground transition-colors">Profile</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-medium">Personal Information</span>
      </div>

      <div className="mb-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Personal Information</h1>
        <p className="text-muted-foreground mt-1">Manage your identity and contact details.</p>
      </div>

      <div className="mt-6 bg-card border border-border rounded-[20px] p-8 shadow-sm">
        <h2 className="font-bold text-foreground text-lg mb-6">Identity & Contact</h2>

        <div className="space-y-5">
          <div>
            <label className={labelCls}>Full Name</label>
            <input type="text" defaultValue="Sanika Bavaskar" className={inputCls} data-testid="input-full-name" />
          </div>

          <div>
            <label className={labelCls}>Age</label>
            <input type="number" defaultValue="21" className={inputCls} data-testid="input-age" />
          </div>

          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" defaultValue="9876543210" className={inputCls} data-testid="input-phone" />
          </div>

          <div>
            <label className={labelCls}>LinkedIn</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Linkedin className="w-4 h-4" />
              </div>
              <input type="text" defaultValue="linkedin.com/in/sanika-bavaskar" className={`${inputCls} pl-11`} data-testid="input-linkedin" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Location</label>
            <input type="text" defaultValue="Pune, Maharashtra" className={inputCls} data-testid="input-location" />
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input type="email" defaultValue="sanikabavskra@gmail.com" className={inputCls} data-testid="input-email" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Current Title</label>
              <select className={inputCls} data-testid="select-current-title">
                <option>Learner</option>
                <option>Student</option>
                <option>Professional</option>
                <option>Fresher</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Career Track</label>
              <select className={inputCls} data-testid="select-career-track">
                <option>Government Job</option>
                <option>Private Sector</option>
                <option>Startup</option>
                <option>Freelance</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>GitHub</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Github className="w-4 h-4" />
              </div>
              <input type="text" defaultValue="github.com/sanikabavaskar" className={`${inputCls} pl-11`} data-testid="input-github" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button className="rounded-xl px-8 py-3 text-base font-medium" data-testid="button-save-changes">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
