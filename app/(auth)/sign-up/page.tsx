"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Zap, ArrowLeft, Mail } from "lucide-react";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUp, {});

  if (state.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 dark:bg-zinc-950">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Check your email</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{state.success}</p>
          <Button variant="outline" className="mt-6 w-full" asChild>
            <Link href="/sign-in">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      </div>
    );
  }

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
          <h2 className="text-3xl font-bold leading-tight text-white">
            Start closing deals in minutes
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed">
            Set up your workspace, invite your team, and start managing your pipeline — all in one
            place. No credit card required.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Free to start", desc: "No credit card" },
              { label: "Invite team", desc: "Unlimited members" },
              { label: "AI insights", desc: "Powered by Claude" },
              { label: "Multi-org", desc: "Manage workspaces" },
            ].map(({ label, desc }) => (
              <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-sm font-semibold text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
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
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Free forever. No credit card required.
            </p>
          </div>

          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Smith"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
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
                autoComplete="new-password"
                minLength={8}
                placeholder="Min. 8 characters"
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
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-zinc-400">
            By creating an account you agree to our{" "}
            <span className="underline cursor-default">Terms of Service</span> and{" "}
            <span className="underline cursor-default">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
