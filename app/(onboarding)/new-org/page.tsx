import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrgForm } from "./_components/create-org-form";

export default async function NewOrgPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // If user already belongs to an org, send them to select-org instead
  const memberships = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId))
    .limit(1);

  if (memberships.length > 0) {
    redirect("/select-org");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your organisation</CardTitle>
        <CardDescription>Set up your workspace to start using Nexus CRM.</CardDescription>
      </CardHeader>
      <CardContent>
        <CreateOrgForm />
      </CardContent>
    </Card>
  );
}
