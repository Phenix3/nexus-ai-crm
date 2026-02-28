import { cookies } from "next/headers";

const ORG_COOKIE = "org_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getActiveOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ORG_COOKIE)?.value ?? null;
}

/** Call only from Server Actions or Route Handlers — not from Server Components. */
export async function setActiveOrgId(orgId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearActiveOrgId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ORG_COOKIE);
}
