import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, Users, TrendingUp, Brain, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

const features = [
  {
    icon: Users,
    title: "Contact Intelligence",
    description: "Centralize your contacts with AI-powered enrichment and lead scoring.",
  },
  {
    icon: TrendingUp,
    title: "Visual Pipeline",
    description: "Drag-and-drop deals through your custom stages. Never miss a close.",
  },
  {
    icon: Brain,
    title: "AI Sales Copilot",
    description: "Get instant summaries, follow-up drafts, and deal insights powered by Claude.",
  },
];

const highlights = [
  "Multi-tenant workspaces",
  "Role-based permissions",
  "Real-time collaboration",
  "AI-generated summaries",
];

export default async function LandingPage() {
  const user = await getUser();
  if (user) {
    const orgId = await getActiveOrgId();
    redirect(orgId ? "/dashboard" : "/new-org");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/30">
            <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Nexus CRM</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sign-up">
              Get started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Zap className="h-3 w-3" />
          AI-powered B2B Sales CRM
        </div>

        {/* Headline */}
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-6xl">
          Close more deals with{" "}
          <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            intelligent sales automation
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
          Nexus CRM combines a powerful contact database, visual pipeline, and AI copilot to help
          modern B2B teams sell smarter — not harder.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            asChild
            className="h-11 px-6 text-sm font-medium shadow-md shadow-primary/25"
          >
            <Link href="/sign-up">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-11 px-6 text-sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>

        {/* Highlights */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {highlights.map((item) => (
            <div
              key={item}
              className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
              {item}
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Nexus CRM — Built for modern B2B teams
      </footer>
    </div>
  );
}
