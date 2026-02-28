import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// No auth required
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/webhooks(.*)",
]);

// Auth + active org required
const isAppRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/contacts(.*)",
  "/deals(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  // All non-public routes require authentication
  await auth.protect();

  // App routes also require an active organisation cookie
  if (isAppRoute(req)) {
    const orgId = req.cookies.get("org_id")?.value;
    if (!orgId) {
      return NextResponse.redirect(new URL("/new-org", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
