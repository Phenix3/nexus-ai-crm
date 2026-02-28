import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// Load .env.local so drizzle-kit can read env vars outside of Next.js
config({ path: ".env.local", override: true });

export default {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Use DIRECT_DATABASE_URL for migrations (session mode, no connection pooler).
    // Falls back to DATABASE_URL if not set.
    url: (process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL)!,
  },
} satisfies Config;
