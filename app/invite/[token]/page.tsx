import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { acceptInvitation } from "@/lib/actions/accept-invitation";

type Props = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/sign-in?redirect_url=/invite/${token}`);
  }

  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invitations")
    .select("id, email, role, expires_at, organizations(name)")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has already expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href="/dashboard">Go to dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orgRow = Array.isArray(invite.organizations)
    ? invite.organizations[0]
    : invite.organizations;
  const orgName = orgRow?.name ?? "this organisation";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {orgName}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{orgName}</strong> as a{" "}
            <strong>{invite.role}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={async () => {
              "use server";
              await acceptInvitation(token);
            }}
          >
            <Button type="submit" className="w-full">
              Accept invitation
            </Button>
          </form>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">Decline</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
