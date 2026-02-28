# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nexus CRM** is an AI-powered B2B sales CRM built as a solo developer project. The full 8-week roadmap lives in `nexus-crm-plan-action.md`. The app is currently in early infrastructure stage — a bare Next.js scaffold with no CRM features yet.

## Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint (flat config via eslint.config.mjs)
```

TypeScript is checked via the Next.js build — there is no standalone `tsc` script. Run `npm run build` to catch type errors.

## Target Architecture (Monorepo — not yet scaffolded)

The plan calls for a **Turborepo** monorepo with this structure:

```
apps/
  web/     ← Next.js 15 frontend (current repo is this app)
  api/     ← Hono backend API (to be created)
packages/
  db/      ← Drizzle ORM schema & migrations
  ui/      ← Shared shadcn/ui components
  config/  ← Shared TypeScript/ESLint config
```

Until the monorepo is set up, all frontend code lives directly in the repo root.

## Planned Stack

| Layer      | Technology                                                |
| ---------- | --------------------------------------------------------- |
| Frontend   | Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui |
| Backend    | Hono (separate `apps/api` service)                        |
| Database   | Supabase (PostgreSQL) + Drizzle ORM                       |
| Auth       | Clerk (OAuth: Google, Microsoft)                          |
| AI         | Anthropic Claude API (`claude-sonnet-4-5`)                |
| Email      | Resend + React Email                                      |
| Jobs       | BullMQ + Upstash Redis                                    |
| Deployment | Vercel (web) + Railway (API)                              |
| Monitoring | Sentry + PostHog + Axiom                                  |
| Tests      | Vitest (unit) + Playwright (E2E)                          |

## Current Code Conventions

- **Path alias**: `@/*` maps to the repo root (e.g. `@/app/...`, `@/components/...`)
- **Tailwind v4**: Uses `@import "tailwindcss"` syntax in `globals.css`, not `@tailwind base/components/utilities`
- **CSS tokens**: Design tokens defined as CSS variables on `:root`, exposed to Tailwind via `@theme inline { ... }`
- **Fonts**: Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`) via `next/font/google`
- **TypeScript**: Strict mode enabled; `moduleResolution: "bundler"`

## Multi-tenancy Model

Every database table will have an `organization_id` foreign key. Supabase Row Level Security (RLS) enforces tenant isolation at the database level. The API middleware must inject `organization_id` from the session into every request. Never expose cross-tenant data.

## AI Integration Notes

- Use `@anthropic-ai/sdk` for Claude API calls
- Default model: `claude-sonnet-4-5` (see plan — not the latest version, chosen deliberately)
- Always stream responses (`stream: true`) for chat UI features
- Track token usage per organization in an `ai_usage` table
- Cache repeated AI calls with Upstash Redis

## Database Schema (planned)

Core tables: `organizations`, `users`, `organization_members`, `contacts`, `deals`, `pipeline_stages`, `activities`, `notes`, `tags`, `contact_tags`, `alerts`, `ai_usage`

All schemas defined with Drizzle ORM in `packages/db`.

## Route Structure (Next.js App Router)

Protected routes live under `/app/*` — middleware will guard these with Clerk. Public routes: `/sign-in`, `/sign-up`, `/verify-email`, landing page.
