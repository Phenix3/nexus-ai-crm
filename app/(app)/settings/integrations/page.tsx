import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, Linkedin, Slack, CheckCircle2 } from "lucide-react";
import { getGmailIntegration } from "@/lib/actions/integrations";
import { GmailDisconnectButton } from "./_components/gmail-disconnect-button";

export default async function IntegrationsPage() {
  const gmailIntegration = await getGmailIntegration();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Integrations</h2>
        <p className="text-sm text-zinc-500">Connect your tools to Nexus CRM.</p>
      </div>

      <Separator />

      <div className="space-y-2">
        {/* Gmail — real OAuth status */}
        <div className="flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700">
            <Mail className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Gmail</p>
            {gmailIntegration ? (
              <p className="text-xs text-zinc-500 truncate">
                Connected as {gmailIntegration.email}
              </p>
            ) : (
              <p className="text-xs text-zinc-500">Sync emails and track opens automatically.</p>
            )}
          </div>
          {gmailIntegration ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </span>
              <GmailDisconnectButton />
            </div>
          ) : (
            <Button asChild size="sm" variant="outline" className="shrink-0 h-7 text-xs">
              <a href="/api/auth/gmail/connect">Connect Gmail</a>
            </Button>
          )}
        </div>

        {/* Google Calendar — coming soon */}
        <IntegrationRow
          icon={Calendar}
          name="Google Calendar"
          description="Log meetings and sync your calendar."
        />

        {/* LinkedIn — coming soon */}
        <IntegrationRow
          icon={Linkedin}
          name="LinkedIn"
          description="Import contacts and track profile views."
        />

        {/* Slack — coming soon */}
        <IntegrationRow
          icon={Slack}
          name="Slack"
          description="Get deal alerts and activity notifications."
        />
      </div>
    </div>
  );
}

function IntegrationRow({
  icon: Icon,
  name,
  description,
}: {
  icon: React.ElementType;
  name: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
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
  );
}
