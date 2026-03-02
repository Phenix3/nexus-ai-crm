/**
 * Gmail sync logic.
 * For each user with a valid Gmail token, fetches recent emails and creates
 * activities of type "email" for contacts matched by email address.
 */

import { createClient } from "@/lib/supabase/server";
import { decrypt, encrypt } from "./encrypt";
import { refreshAccessToken } from "./auth";
import { listMessages, getMessage, parseMessage } from "./client";

type OauthTokenRow = {
  id: string;
  user_id: string;
  organization_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  email: string | null;
  last_synced_at: string | null;
};

async function ensureValidToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: OauthTokenRow
): Promise<string | null> {
  const now = Date.now();
  const expiresAt = token.expires_at ? new Date(token.expires_at).getTime() : 0;

  // Refresh if expiring within 5 minutes
  if (expiresAt - now < 5 * 60 * 1000) {
    if (!token.refresh_token) return null;

    let refreshTokenPlain: string;
    try {
      refreshTokenPlain = await decrypt(token.refresh_token);
    } catch {
      return null;
    }

    try {
      const refreshed = await refreshAccessToken(refreshTokenPlain);
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      const encryptedNewToken = await encrypt(refreshed.access_token);

      await supabase
        .from("oauth_tokens")
        .update({
          access_token: encryptedNewToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", token.id);

      return refreshed.access_token;
    } catch {
      return null;
    }
  }

  // Decrypt current access token
  try {
    return await decrypt(token.access_token);
  } catch {
    return null;
  }
}

export type SyncResult = {
  orgId: string;
  userId: string;
  synced: number;
  errors: string[];
};

export async function syncGmailForOrg(orgId: string): Promise<SyncResult[]> {
  const supabase = await createClient();

  // Fetch all Gmail tokens for this org
  const { data: tokens, error } = await supabase
    .from("oauth_tokens")
    .select("*")
    .eq("organization_id", orgId)
    .eq("provider", "gmail");

  if (error || !tokens?.length) return [];

  const results: SyncResult[] = [];

  for (const token of tokens as OauthTokenRow[]) {
    const result: SyncResult = { orgId, userId: token.user_id, synced: 0, errors: [] };

    const accessToken = await ensureValidToken(supabase, token);
    if (!accessToken) {
      result.errors.push("Could not obtain valid access token");
      results.push(result);
      continue;
    }

    // Build date query — incremental sync from last_synced_at, otherwise 30 days
    const since = token.last_synced_at
      ? new Date(token.last_synced_at)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const afterEpoch = Math.floor(since.getTime() / 1000);
    const query = `after:${afterEpoch}`;

    let messages;
    try {
      messages = await listMessages(accessToken, query, 100);
    } catch (e) {
      result.errors.push(`listMessages failed: ${String(e)}`);
      results.push(result);
      continue;
    }

    for (const msg of messages) {
      try {
        // Check for duplicate via metadata->gmailId
        const { data: existing } = await supabase
          .from("activities")
          .select("id")
          .eq("organization_id", orgId)
          .filter("metadata->>gmailId", "eq", msg.id)
          .maybeSingle();

        if (existing) continue;

        const detail = await getMessage(accessToken, msg.id);
        const parsed = await parseMessage(detail);

        // Determine direction using connected email
        const connectedEmail = token.email?.toLowerCase();
        const fromEmail =
          parsed.from?.match(/<(.+)>/)?.[1]?.toLowerCase() ?? parsed.from?.toLowerCase();
        const direction: "inbound" | "outbound" =
          fromEmail === connectedEmail ? "outbound" : "inbound";

        // Match contact by email address (from or to field)
        const emailToSearch =
          direction === "inbound"
            ? fromEmail
            : (parsed.to?.match(/<(.+)>/)?.[1]?.toLowerCase() ?? parsed.to?.toLowerCase());

        let contactId: string | null = null;
        if (emailToSearch) {
          const { data: contact } = await supabase
            .from("contacts")
            .select("id")
            .eq("organization_id", orgId)
            .ilike("email", emailToSearch)
            .maybeSingle();

          contactId = contact?.id ?? null;
        }

        // Only create activity if we matched a contact
        if (!contactId) continue;

        const body = parsed.textPlain?.slice(0, 2000) ?? null;

        await supabase.from("activities").insert({
          organization_id: orgId,
          contact_id: contactId,
          user_id: token.user_id,
          type: "email",
          subject: parsed.subject,
          body,
          occurred_at: parsed.date.toISOString(),
          metadata: {
            gmailId: msg.id,
            threadId: msg.threadId,
            direction,
            from: parsed.from,
            to: parsed.to,
            tracked: false,
          },
        });

        result.synced++;
      } catch (e) {
        result.errors.push(`msg ${msg.id}: ${String(e)}`);
      }
    }

    // Update last_synced_at
    await supabase
      .from("oauth_tokens")
      .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", token.id);

    results.push(result);
  }

  return results;
}

export async function syncAllOrgs(): Promise<SyncResult[]> {
  const supabase = await createClient();

  // Get distinct orgs with active Gmail tokens
  const { data: tokens } = await supabase
    .from("oauth_tokens")
    .select("organization_id")
    .eq("provider", "gmail");

  if (!tokens?.length) return [];

  const orgIds = [...new Set(tokens.map((t: { organization_id: string }) => t.organization_id))];
  const all: SyncResult[] = [];

  for (const orgId of orgIds) {
    const results = await syncGmailForOrg(orgId);
    all.push(...results);
  }

  return all;
}
