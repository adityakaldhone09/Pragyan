import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Compass,
  Map,
  Sparkles,
} from "lucide-react";

const outcomes = [
  { label: "AI career matching", value: "95%", icon: Compass },
  { label: "Skill gap clarity", value: "18", icon: BrainCircuit },
  { label: "Roadmap progress", value: "12", icon: Map },
];

const steps = [
  "Share your goals and interests",
  "Review career matches with fit scores",
  "Follow a focused learning roadmap",
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">Pragyan AI</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#career-fit" className="hover:text-foreground">Career Fit</a>
            <a href="#roadmap" className="hover:text-foreground">Roadmap</a>
            <a href="#outcomes" className="hover:text-foreground">Outcomes</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/auth"
              className="rounded-md px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-primary-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
            <Sparkles className="h-4 w-4" />
            AI career guidance for students
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-normal text-foreground md:text-6xl">
            Pragyan AI
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Discover suitable careers, understand your strengths, and move through a practical roadmap built around your goals.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/auth?mode=signup"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-primary-border bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md"
            >
              Start assessment <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/home"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-6 py-3 text-sm font-bold text-foreground shadow-sm"
            >
              View demo dashboard
            </Link>
          </div>

          <div id="outcomes" className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
            {outcomes.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <Icon className="mb-3 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-lg">
            <div className="relative min-h-[460px] bg-[#151D3B] p-6 text-white">
              <img
                src="/opengraph.jpg"
                alt="Pragyan AI interface preview"
                className="absolute inset-0 h-full w-full object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-[#151D3B]/70" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Recommended path</p>
                    <h2 className="mt-1 text-3xl font-bold">Data Scientist</h2>
                  </div>
                  <span className="rounded-full bg-green-400 px-3 py-1 text-xs font-bold text-[#102016]">
                    95% match
                  </span>
                </div>

                <div id="career-fit" className="mt-8 rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <div className="mb-4 flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-200" />
                    <p className="font-semibold">Career fit analysis</p>
                  </div>
                  <div className="space-y-4">
                    {["Analytical thinking", "Problem solving", "Technology interest"].map((label, index) => (
                      <div key={label}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-white/80">{label}</span>
                          <span className="font-semibold">{92 - index * 7}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/15">
                          <div
                            className="h-2 rounded-full bg-blue-300"
                            style={{ width: `${92 - index * 7}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="roadmap" className="mt-5 rounded-lg border border-white/15 bg-white p-5 text-foreground shadow-md">
                  <p className="mb-4 text-sm font-bold">Roadmap preview</p>
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div key={step} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                        <span className="text-sm font-medium">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
