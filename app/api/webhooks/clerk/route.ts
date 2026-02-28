import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

type ClerkUserEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
};

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("CLERK_WEBHOOK_SECRET not configured", { status: 500 });
  }

  // Verify Svix signature
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkUserEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created" || type === "user.updated") {
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
      return new Response("No primary email found", { status: 400 });
    }

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

    await db
      .insert(users)
      .values({
        id: data.id,
        email: primaryEmail,
        fullName,
        avatarUrl: data.image_url,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: primaryEmail,
          fullName,
          avatarUrl: data.image_url,
          updatedAt: new Date(),
        },
      });
  }

  if (type === "user.deleted") {
    await db.delete(users).where(eq(users.id, data.id));
  }

  return new Response(null, { status: 200 });
}
