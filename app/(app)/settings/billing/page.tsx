import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

const PRO_FEATURES = [
  "Unlimited contacts & deals",
  "AI-powered lead scoring",
  "Team collaboration (up to 10 seats)",
  "Advanced analytics & reports",
  "Email sequence automation",
  "Priority support",
];

export default function BillingPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Billing</h2>
        <p className="text-sm text-zinc-500">Manage your subscription and payment details.</p>
      </div>

      <Separator />

      {/* Current plan */}
      <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Free plan</p>
            <p className="mt-0.5 text-xs text-zinc-500">Up to 100 contacts · 1 pipeline</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Current plan
          </Badge>
        </div>
      </div>

      {/* Pro upgrade */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 dark:bg-primary/10 dark:border-primary/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/30">
              <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pro</p>
              <p className="text-xs text-zinc-500">Everything you need to close more deals</p>
            </div>
          </div>
          <p className="shrink-0 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            10 000FCFA<span className="text-sm font-normal text-zinc-500">/mo</span>
          </p>
        </div>

        <ul className="mt-4 space-y-2">
          {PRO_FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              {f}
            </li>
          ))}
        </ul>

        <Button disabled className="mt-5 w-full gap-2">
          <Zap className="h-3.5 w-3.5" />
          Upgrade to Pro — coming soon
        </Button>
      </div>
    </div>
  );
}
