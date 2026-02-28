/**
 * DEV ONLY — Manual user sync endpoint.
 * Bypasses the Clerk webhook to insert/update the current user in the database.
 *
 * Usage: GET http://localhost:3000/api/dev/sync-user
 * (must be authenticated with Clerk first)
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available in production" }, { status: 403 });
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;

  if (!primaryEmail) {
    return Response.json({ error: "No primary email found on Clerk user" }, { status: 400 });
  }

  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const [upserted] = await db
    .insert(users)
    .values({
      id: userId,
      email: primaryEmail,
      fullName,
      avatarUrl: clerkUser.imageUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: primaryEmail,
        fullName,
        avatarUrl: clerkUser.imageUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return Response.json({
    ok: true,
    user: { id: upserted.id, email: upserted.email, fullName: upserted.fullName },
  });
}
