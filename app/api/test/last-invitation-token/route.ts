/**
 * Test-only endpoint for E2E tests — retrieves the latest invitation token
 * sent to a given email address.
 *
 * Only available when E2E_SECRET env var is set (never in production).
 * Returns 404 in production builds.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Gate: only callable in test/dev environments
  const e2eSecret = process.env.E2E_SECRET;
  if (!e2eSecret || process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");
  const email = searchParams.get("email");

  if (secret !== e2eSecret || !email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("token")
    .eq("email", email)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No invitation found" }, { status: 404 });

  return NextResponse.json({ token: data.token });
}
