import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getActiveOrgId } from "@/lib/org";
import { Separator } from "@/components/ui/separator";
import { OrgSettingsForm } from "./_components/org-settings-form";

export default async function GeneralSettingsPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) return null;

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

  if (!org) return null;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">General</h2>
        <p className="text-sm text-zinc-500">Manage your organisation settings.</p>
      </div>

      <Separator />

      <OrgSettingsForm
        defaultName={org.name}
        defaultTimezone={org.timezone}
        defaultCurrency={org.currency}
      />

      <Separator />

      <div className="space-y-1">
        <p className="text-sm font-medium">Slug</p>
        <p className="font-mono text-sm text-zinc-500">{org.slug}</p>
        <p className="text-xs text-zinc-400">
          The slug is used in URLs and cannot be changed after creation.
        </p>
      </div>
    </div>
  );
}
