import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Prevent the page from being embedded in an iframe (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information in requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by the app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Force HTTPS for 2 years (only meaningful in production behind HTTPS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Content Security Policy
  // 'unsafe-inline' is required by Next.js inline scripts; tighten once nonces are added.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: Next.js needs unsafe-inline for its inline scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://*.sentry.io",
      // Styles: Tailwind injects inline styles
      "style-src 'self' 'unsafe-inline'",
      // Images: allow Supabase storage and data URIs for avatars
      "img-src 'self' data: blob: https://*.supabase.co",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // API connections: Supabase, Sentry, PostHog
      [
        "connect-src 'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://*.sentry.io",
        "https://*.posthog.com",
        "https://eu.i.posthog.com",
      ].join(" "),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Silent in CI to avoid noise
  silent: !process.env.CI,
  // Tree-shake Sentry debug logging in production builds
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  // Automatically upload source maps when building
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },
});
