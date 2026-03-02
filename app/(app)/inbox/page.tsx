import Link from "next/link";
import { Inbox, Mail, ExternalLink, Eye, MousePointerClick } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import { Badge } from "@/components/ui/badge";

type EmailActivity = {
  id: string;
  contact_id: string | null;
  subject: string | null;
  body: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
  contacts: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

function timeAgo(date: string): string {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const orgId = await getActiveOrgId();

  let emails: EmailActivity[] = [];

  if (orgId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("activities")
      .select(
        "id, contact_id, subject, body, occurred_at, metadata, contacts(first_name, last_name, email)"
      )
      .eq("organization_id", orgId)
      .eq("type", "email")
      .order("occurred_at", { ascending: false })
      .limit(200);

    emails = (data ?? []) as unknown as EmailActivity[];
  }

  // Apply filter
  const filtered = emails.filter((e) => {
    if (filter === "tracked") return (e.metadata as Record<string, unknown>)?.tracked === true;
    if (filter === "opened") return !!(e.metadata as Record<string, unknown>)?.opened_at;
    if (filter === "clicked") {
      const clicks = (e.metadata as Record<string, unknown>)?.clicks;
      return Array.isArray(clicks) && clicks.length > 0;
    }
    return true;
  });

  const filters = [
    { key: "all", label: "All emails" },
    { key: "tracked", label: "Tracked" },
    { key: "opened", label: "Opened" },
    { key: "clicked", label: "Clicked" },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Inbox
        </h1>
        <p className="text-sm text-zinc-500">All email activity across your contacts.</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {filters.map(({ key, label }) => (
          <Link
            key={key}
            href={key === "all" ? "/inbox" : `/inbox?filter=${key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </Link>
        ))}
        <span className="ml-auto text-xs text-zinc-400 self-center">{filtered.length} emails</span>
      </div>

      {/* Email list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white px-6 py-12 text-center shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Inbox className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No emails yet</p>
            <p className="text-xs text-zinc-400 mt-1">
              Connect Gmail in Settings → Integrations to start syncing.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:divide-zinc-800">
          {filtered.map((email) => {
            const meta = (email.metadata as Record<string, unknown>) ?? {};
            const isOpened = !!meta.opened_at;
            const clicks = Array.isArray(meta.clicks) ? meta.clicks : [];
            const direction = meta.direction as string | undefined;
            const contactName =
              [email.contacts?.first_name, email.contacts?.last_name].filter(Boolean).join(" ") ||
              email.contacts?.email ||
              "Unknown contact";

            return (
              <div key={email.id} className="flex items-start gap-4 px-4 py-3.5 group">
                {/* Icon */}
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                  <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {email.subject ?? "(no subject)"}
                    </span>
                    {direction && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-4 px-1.5 shrink-0 ${
                          direction === "inbound"
                            ? "text-blue-500 border-blue-200 dark:border-blue-800"
                            : "text-zinc-400"
                        }`}
                      >
                        {direction}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 flex-wrap text-xs text-zinc-400">
                    {email.contact_id ? (
                      <Link
                        href={`/contacts/${email.contact_id}`}
                        className="font-medium text-zinc-500 hover:text-primary transition-colors flex items-center gap-0.5"
                      >
                        {contactName}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    ) : (
                      <span className="text-zinc-400">{contactName}</span>
                    )}
                    <span>·</span>
                    <span>{timeAgo(email.occurred_at)}</span>
                    {isOpened && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 text-emerald-500">
                          <Eye className="h-3 w-3" />
                          Opened
                        </span>
                      </>
                    )}
                    {clicks.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 text-violet-500">
                          <MousePointerClick className="h-3 w-3" />
                          {clicks.length} click{clicks.length > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                  {email.body && (
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-1">{email.body}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
