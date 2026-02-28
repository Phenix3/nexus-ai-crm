# Nexus CRM — Project Memory

## Stack

- Next.js 16.1.6, TypeScript strict, Tailwind v4, shadcn/ui (zinc)
- Drizzle ORM + Supabase (PostgreSQL)
- Clerk v6 auth (`proxy.ts` — NOT `middleware.ts`, required by Next.js 16)
- Multi-tenancy: `org_id` httpOnly cookie via `lib/org.ts`
- Server actions with `useActionState` (React 19), Zod validation
- Resend + React Email for transactional emails
- Sentry + PostHog for observability

## Key Files

- `proxy.ts` — Clerk middleware (renamed from middleware.ts for Next 16)
- `lib/org.ts` — `getActiveOrgId()`, `setActiveOrgId()`, `clearActiveOrgId()`
- `lib/permissions.ts` — `requireRole(minRole)`, `getCurrentMembership()`
- `db/index.ts` — Drizzle client (postgres.js, `prepare: false` for Supabase pooler)
- `drizzle.config.ts` — uses `DIRECT_DATABASE_URL ?? DATABASE_URL`
- `db/schema/index.ts` — exports all 12 tables
- `db/migrations/supabase-setup.sql` — **paste into Supabase SQL Editor** to create tables
- `db/rls.sql` — run after schema to enable RLS policies

## DB Connection

- `DATABASE_URL` = Transaction pooler (port 6543) — for app runtime
- `DIRECT_DATABASE_URL` = Session pooler (port 5432) — for drizzle-kit
- Direct connection (`db.xxx.supabase.co`) does NOT work (DNS issue)

## Auth Flow

1. Sign up → Clerk webhook creates DB user (or use `/api/dev/sync-user` on localhost)
2. Redirect to `/dashboard` → proxy detects no `org_id` → redirect `/new-org`
3. Create org → set `org_id` cookie → access `/dashboard`

## Pending DB Setup

- User must paste `db/migrations/supabase-setup.sql` into Supabase SQL Editor
- Then run `db/rls.sql` for RLS policies
- Then call `GET /api/dev/sync-user` to sync Clerk user

## Weeks Progress

- S1J1 ✅ Tooling (Prettier, Husky, lint-staged) + shell (layout, sidebar, route groups)
- S1J2 ✅ Drizzle ORM + Supabase schema (12 tables)
- S1J4 ✅ GitHub Actions CI
- S1J5 ✅ Sentry + PostHog
- S2J1 ✅ Clerk auth (middleware → proxy.ts, sign-in/up pages, webhook)
- S2J2 ✅ Organisation model (create, select, org_id cookie)
- S2J3 ✅ Invitations & Roles (Resend, invite email, accept, team management)
- S2J4 ✅ Settings & Profile (org settings, user profile, billing/integrations placeholders)
- S3J1 ✅ Contacts CRUD (list + create + edit + delete + detail page + notes)

## shadcn Components Available

avatar, badge, button, card, dropdown-menu, input, label, separator, tooltip

## Server Action Pattern

```ts
"use server";
// Zod schema → safeParse → DB operation via Drizzle → return state
// State type: { error?: string; fieldErrors?: Record<string, string[]> }
// Use `requireRole("admin")` for protected actions
// Use `getActiveOrgId()` to get current org
```
