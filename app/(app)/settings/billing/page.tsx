import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Billing</h2>
        <p className="text-sm text-zinc-500">Manage your subscription and payment details.</p>
      </div>

      <Separator />

      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Free plan</p>
            <p className="text-sm text-zinc-500">Up to 100 contacts, 1 pipeline</p>
          </div>
          <Badge variant="secondary">Current</Badge>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Pro</p>
              <p className="text-sm text-zinc-500">
                Unlimited contacts, AI features, team collaboration
              </p>
            </div>
            <p className="font-semibold">
              €29<span className="text-sm font-normal text-zinc-500">/mo</span>
            </p>
          </div>
          <Button disabled className="w-full">
            Upgrade to Pro — coming soon
          </Button>
        </div>
      </div>
    </div>
  );
}
