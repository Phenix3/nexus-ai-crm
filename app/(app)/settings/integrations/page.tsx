import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Linkedin, Slack } from "lucide-react";

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
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Import contacts and track profile views.",
    icon: Linkedin,
    available: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get deal alerts and activity notifications.",
    icon: Slack,
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

      <div className="space-y-2">
        {integrations.map(({ id, name, description, icon: Icon }) => (
          <div
            key={id}
            className="flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700">
              <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{name}</p>
              <p className="text-xs text-zinc-500">{description}</p>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs text-zinc-400">
              Coming soon
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
