-- ============================================================
-- Nexus CRM — Full schema setup for Supabase SQL Editor
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enums
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');
CREATE TYPE "public"."deal_status" AS ENUM('open', 'won', 'lost');
CREATE TYPE "public"."activity_type" AS ENUM('email', 'call', 'meeting', 'note', 'stage_change', 'score_update');

-- organizations
CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "logo_url" text,
  "timezone" text DEFAULT 'Europe/Paris' NOT NULL,
  "currency" text DEFAULT 'EUR' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);

-- users
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "full_name" text,
  "avatar_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- organization_members
CREATE TABLE "organization_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" "member_role" DEFAULT 'member' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "organization_members_organization_id_user_id_unique" UNIQUE("organization_id","user_id")
);

-- contacts
CREATE TABLE "contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "first_name" text,
  "last_name" text,
  "email" text,
  "phone" text,
  "company" text,
  "job_title" text,
  "linkedin_url" text,
  "avatar_url" text,
  "score" integer DEFAULT 0 NOT NULL,
  "owner_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- pipeline_stages
CREATE TABLE "pipeline_stages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "order" integer NOT NULL,
  "color" text DEFAULT '#6366f1' NOT NULL,
  "default_probability" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- deals
CREATE TABLE "deals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "title" text NOT NULL,
  "value" numeric(12, 2) DEFAULT '0' NOT NULL,
  "currency" text DEFAULT 'EUR' NOT NULL,
  "probability" integer DEFAULT 0 NOT NULL,
  "expected_close_date" date,
  "stage_id" uuid,
  "contact_id" uuid,
  "owner_id" uuid,
  "status" "deal_status" DEFAULT 'open' NOT NULL,
  "lost_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- activities
CREATE TABLE "activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "contact_id" uuid,
  "deal_id" uuid,
  "user_id" uuid,
  "type" "activity_type" NOT NULL,
  "subject" text,
  "body" text,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- notes
CREATE TABLE "notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "contact_id" uuid,
  "deal_id" uuid,
  "user_id" uuid,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- tags
CREATE TABLE "tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "color" text DEFAULT '#6366f1' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "tags_organization_id_name_unique" UNIQUE("organization_id","name")
);

-- contact_tags
CREATE TABLE "contact_tags" (
  "contact_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL,
  CONSTRAINT "contact_tags_contact_id_tag_id_pk" PRIMARY KEY("contact_id","tag_id")
);

-- ai_usage
CREATE TABLE "ai_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid,
  "feature" text NOT NULL,
  "model" text NOT NULL,
  "input_tokens" integer DEFAULT 0 NOT NULL,
  "output_tokens" integer DEFAULT 0 NOT NULL,
  "estimated_cost_usd" numeric(10, 6) DEFAULT '0',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- invitations
CREATE TABLE "invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "email" text NOT NULL,
  "role" "member_role" DEFAULT 'member' NOT NULL,
  "token" text NOT NULL,
  "invited_by" uuid,
  "expires_at" timestamp with time zone NOT NULL,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "invitations_token_unique" UNIQUE("token")
);

-- Foreign keys
ALTER TABLE "organization_members"
  ADD CONSTRAINT "organization_members_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade,
  ADD CONSTRAINT "organization_members_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

ALTER TABLE "contacts"
  ADD CONSTRAINT "contacts_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade,
  ADD CONSTRAINT "contacts_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE set null;

ALTER TABLE "pipeline_stages"
  ADD CONSTRAINT "pipeline_stages_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;

ALTER TABLE "deals"
  ADD CONSTRAINT "deals_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade,
  ADD CONSTRAINT "deals_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "pipeline_stages"("id") ON DELETE set null,
  ADD CONSTRAINT "deals_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE set null,
  ADD CONSTRAINT "deals_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE set null;

ALTER TABLE "activities"
  ADD CONSTRAINT "activities_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade,
  ADD CONSTRAINT "activities_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE cascade,
  ADD CONSTRAINT "activities_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE cascade,
  ADD CONSTRAINT "activities_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null;

ALTER TABLE "notes"
  ADD CONSTRAINT "notes_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade,
  ADD CONSTRAINT "notes_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE cascade,
  ADD CONSTRAINT "notes_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE cascade,
  ADD CONSTRAINT "notes_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null;

ALTER TABLE "tags"
  ADD CONSTRAINT "tags_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;

ALTER TABLE "contact_tags"
  ADD CONSTRAINT "contact_tags_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE cascade,
  ADD CONSTRAINT "contact_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE cascade;

ALTER TABLE "ai_usage"
  ADD CONSTRAINT "ai_usage_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade,
  ADD CONSTRAINT "ai_usage_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null;

ALTER TABLE "invitations"
  ADD CONSTRAINT "invitations_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade,
  ADD CONSTRAINT "invitations_invited_by_fk" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE set null;

-- ============================================================
-- Drizzle migration tracking (tells drizzle-kit these migrations are applied)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id serial PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES
  ('0000_tearful_ma_gnuci', extract(epoch from now()) * 1000),
  ('0001_fat_daredevil', extract(epoch from now()) * 1000),
  ('0002_lame_sleeper', extract(epoch from now()) * 1000);
