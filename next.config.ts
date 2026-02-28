import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {};

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
