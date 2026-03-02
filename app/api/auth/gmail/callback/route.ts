import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode } from "@/lib/gmail/auth";
import { encrypt } from "@/lib/gmail/encrypt";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=missing_params`);
  }

  // Decode state
  let userId: string;
  let orgId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf-8")) as {
      userId: string;
      orgId: string;
    };
    userId = decoded.userId;
    orgId = decoded.orgId;
  } catch {
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=invalid_state`);
  }

  // Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch {
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=token_exchange_failed`);
  }

  // Encrypt tokens before storing
  const encryptedAccessToken = await encrypt(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null;
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const supabase = await createClient();

  // Upsert — one Gmail token per user per org
  const { error: dbError } = await supabase.from("oauth_tokens").upsert(
    {
      organization_id: orgId,
      user_id: userId,
      provider: "gmail",
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
      email: tokens.email ?? null,
      scopes: tokens.scope ? tokens.scope.split(" ") : [],
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "organization_id,user_id,provider",
    }
  );

  if (dbError) {
    console.error("Gmail callback DB error:", dbError);
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=db_error`);
  }

  return NextResponse.redirect(`${APP_URL}/settings/integrations?connected=gmail`);
}
