import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up", "/auth/callback", "/api/health"];

const APP_ROUTES = ["/dashboard", "/contacts", "/deals", "/settings"];

// Auth routes subject to rate limiting (brute-force protection)
const RATE_LIMITED_ROUTES = ["/sign-in", "/sign-up", "/auth/callback"];

function isPublic(pathname: string) {
  return (
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) ||
    /^\/api\/webhooks(\/|$)/.test(pathname)
  );
}

function isAppRoute(pathname: string) {
  return APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isRateLimited(pathname: string) {
  return RATE_LIMITED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

/**
 * Lazily initialise the rate limiter only when Upstash env vars are present.
 * Falls back to no-op if not configured (dev without Redis).
 */
function getRateLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    // 10 requests per 10 seconds per IP on auth routes
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: false,
    prefix: "nexus-crm:ratelimit",
  });
}

const rateLimiter = getRateLimiter();

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ── Rate limiting (auth routes only) ────────────────────────────────────────
  if (rateLimiter && isRateLimited(request.nextUrl.pathname)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    const { success } = await rateLimiter.limit(ip);

    if (!success) {
      return new NextResponse("Too many requests. Please try again later.", {
        status: 429,
        headers: { "Retry-After": "10", "Content-Type": "text/plain" },
      });
    }
  }

  // ── Supabase session refresh ─────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT remove this call
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return supabaseResponse;
  }

  // All non-public routes require authentication
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // App routes also require an active organisation cookie
  if (isAppRoute(pathname)) {
    const orgId = request.cookies.get("org_id")?.value;
    if (!orgId) {
      const url = request.nextUrl.clone();
      url.pathname = "/new-org";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
