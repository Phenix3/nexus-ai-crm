import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrgForm } from "./_components/create-org-form";
import { createClient } from "@/lib/supabase/client";

export default async function NewOrgPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const userId = user.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", userId)
    .limit(1);

  if (data && data.length > 0) redirect("/select-org");

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
