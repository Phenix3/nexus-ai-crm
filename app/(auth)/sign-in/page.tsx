"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Zap, CheckCircle2 } from "lucide-react";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const perks = [
  "AI-powered lead scoring",
  "Visual sales pipeline",
  "Team collaboration & roles",
  "Real-time activity feed",
];

export default function SignInPage() {
  const [state, action, pending] = useActionState(signIn, {});

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-zinc-950 p-12 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Nexus CRM</span>
        </div>

        <div>
          <blockquote className="space-y-4">
            <p className="text-2xl font-medium leading-snug text-white">
              &quot; The AI copilot cut our pipeline review time in half. We close 30% more deals
              with the same team.&quot;
            </p>
            <footer className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-200">Sarah Chen</span> — VP Sales, Archo Labs
            </footer>
          </blockquote>

          <ul className="mt-10 space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-sm text-zinc-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Nexus CRM</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 dark:bg-zinc-950 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold">Nexus CRM</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Sign in to your workspace
            </p>
          </div>

          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-10"
              />
            </div>

            {state.error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              className="h-10 w-full font-medium shadow-sm shadow-primary/20"
              disabled={pending}
            >
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
