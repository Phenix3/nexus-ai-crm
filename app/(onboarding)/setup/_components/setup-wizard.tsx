"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Users,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/update-profile";

interface SetupWizardProps {
  step: number;
  userId: string;
  orgId: string;
}

export function SetupWizard({ step, userId, orgId }: SetupWizardProps) {
  void userId;
  void orgId;

  switch (step) {
    case 1:
      return <StepProfile />;
    case 2:
      return <StepGmail />;
    case 3:
      return <StepContacts />;
    case 4:
      return <StepDone />;
    default:
      return <StepProfile />;
  }
}

// ── Step 1: Profile ────────────────────────────────────────────────────────

function StepProfile() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      router.push("/onboarding/setup?step=2");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("fullName", name.trim());
      await updateProfile({}, fd);
      toast.success("Profile updated!");
      router.push("/onboarding/setup?step=2");
    });
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Set up your profile
          </h2>
          <p className="text-sm text-zinc-500">How should your team see you?</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            autoFocus
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isPending} className="flex-1 gap-1.5">
            {isPending ? "Saving…" : "Continue"}
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-zinc-400"
            onClick={() => router.push("/onboarding/setup?step=2")}
          >
            Skip
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Step 2: Connect Gmail ──────────────────────────────────────────────────

function StepGmail() {
  const router = useRouter();

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
          <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Connect Gmail</h2>
          <p className="text-sm text-zinc-500">Sync emails and track opens automatically.</p>
        </div>
      </div>

      <div className="mb-6 space-y-2.5">
        {[
          "Your last 30 days of emails synced automatically",
          "See when contacts open your emails",
          "Track link clicks in real time",
        ].map((benefit) => (
          <div key={benefit} className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{benefit}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button asChild className="flex-1 gap-1.5">
          <a href="/api/auth/gmail/connect">
            <Mail className="h-4 w-4" />
            Connect Gmail
          </a>
        </Button>
        <Button
          variant="ghost"
          className="text-zinc-400"
          onClick={() => router.push("/onboarding/setup?step=3")}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Import contacts ────────────────────────────────────────────────

function StepContacts() {
  const router = useRouter();

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
          <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Add your contacts
          </h2>
          <p className="text-sm text-zinc-500">Import from a CSV or add them one by one.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="justify-start gap-2 h-12"
          onClick={() => {
            router.push("/contacts?import=true");
          }}
        >
          <Upload className="h-4 w-4 text-zinc-400" />
          <span>
            <span className="font-medium">Import CSV file</span>
            <span className="ml-2 text-xs text-zinc-400">Supports any spreadsheet export</span>
          </span>
        </Button>

        <Button
          variant="outline"
          className="justify-start gap-2 h-12"
          onClick={() => router.push("/contacts?new=true")}
        >
          <Users className="h-4 w-4 text-zinc-400" />
          <span>
            <span className="font-medium">Add contacts manually</span>
            <span className="ml-2 text-xs text-zinc-400">One by one from the contacts page</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="text-zinc-400 mt-1"
          onClick={() => router.push("/onboarding/setup?step=4")}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}

// ── Step 4: Done ───────────────────────────────────────────────────────────

function StepDone() {
  const router = useRouter();

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 text-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            You&apos;re all set! 🎉
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Your workspace is ready. Let&apos;s close some deals.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button className="gap-2" onClick={() => router.push("/deals")}>
          <TrendingUp className="h-4 w-4" />
          Create my first deal
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => router.push("/dashboard")}>
          Go to dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
