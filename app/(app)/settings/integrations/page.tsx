import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Calendar } from "lucide-react";

const integrations = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Sync emails and track opens automatically.",
    icon: Mail,
    available: false,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Log meetings and sync your calendar.",
    icon: Calendar,
    available: false,
  },
];

export default function IntegrationsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Integrations</h2>
        <p className="text-sm text-zinc-500">Connect your tools to Nexus CRM.</p>
      </div>

      <Separator />

      <ul className="divide-y rounded-lg border">
        {integrations.map(({ id, name, description, icon: Icon, available }) => (
          <li key={id} className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-zinc-50 dark:bg-zinc-800">
                <Icon className="h-4 w-4 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-zinc-500">{description}</p>
              </div>
            </div>
            {available ? (
              <Button size="sm">Connect</Button>
            ) : (
              <Badge variant="outline">Coming soon</Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
