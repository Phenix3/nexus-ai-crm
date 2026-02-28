import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, organizationMembers } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setActiveOrganization } from "@/lib/actions/set-active-organization";

export default async function SelectOrgPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const userId = user.id;

  const memberships = await db
    .select({
      org: organizations,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, userId));

  if (memberships.length === 0) {
    redirect("/new-org");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Select an organisation</CardTitle>
        <CardDescription>Choose the workspace you want to access.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {memberships.map(({ org, role }) => (
          <form
            key={org.id}
            action={async () => {
              "use server";
              await setActiveOrganization(org.id);
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <span className="font-medium">{org.name}</span>
              <Badge variant="secondary" className="capitalize">
                {role}
              </Badge>
            </button>
          </form>
        ))}

        <div className="pt-2">
          <Button variant="outline" className="w-full" asChild>
            <a href="/new-org">Create a new organisation</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
