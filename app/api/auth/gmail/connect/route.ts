import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";
import { getGmailAuthUrl } from "@/lib/gmail/auth";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL));
  }

  const orgId = await getActiveOrgId();
  if (!orgId) {
    return NextResponse.redirect(new URL("/select-org", process.env.NEXT_PUBLIC_APP_URL));
  }

  // State encodes userId + orgId to verify on callback
  const state = Buffer.from(JSON.stringify({ userId: user.id, orgId })).toString("base64url");
  const authUrl = getGmailAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
