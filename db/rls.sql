-- ============================================================
-- Row Level Security — Nexus CRM (Supabase Auth)
-- Run this in the Supabase SQL editor AFTER the Drizzle migration.
--
-- Two-layer approach:
--   1. postgres role  → used by Drizzle/server; gets full access via
--      explicit bypass policies so DATABASE_URL always works.
--   2. authenticated  → browser/client calls via Supabase JS;
--      filtered to their own org data via auth.uid().
-- ============================================================

-- ── Helper: user's org IDs ────────────────────────────────────
-- SECURITY DEFINER avoids re-applying RLS inside the policy subquery
-- (fixes the "circular dependency" issue with self-referential policies).
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
$$;

-- ── Enable RLS ────────────────────────────────────────────────
ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals                ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage             ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts               ENABLE ROW LEVEL SECURITY;

-- ── Drop existing policies before recreating ─────────────────
DO $$ DECLARE pol record; BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================
-- LAYER 1 — postgres role (Drizzle / server-side)
-- Full access; application code enforces authorization.
-- ============================================================

CREATE POLICY "postgres: full access"
  ON organizations        FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON users                FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON organization_members FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON contacts             FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON pipeline_stages      FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON deals                FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON activities           FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON notes                FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON tags                 FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON contact_tags         FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON ai_usage             FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON oauth_tokens         FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres: full access"
  ON alerts               FOR ALL TO postgres USING (true) WITH CHECK (true);

-- ============================================================
-- LAYER 2 — authenticated role (Supabase JS client / browser)
-- ============================================================

-- ── users ─────────────────────────────────────────────────────
CREATE POLICY "users: view own profile"
  ON users FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users: update own profile"
  ON users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ── organizations ─────────────────────────────────────────────
CREATE POLICY "members can view their organization"
  ON organizations FOR SELECT TO authenticated
  USING (id IN (SELECT get_my_org_ids()));

-- ── organization_members ──────────────────────────────────────
CREATE POLICY "members can view members of same org"
  ON organization_members FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

-- ── contacts ──────────────────────────────────────────────────
CREATE POLICY "members can select contacts in their org"
  ON contacts FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

CREATE POLICY "members can insert contacts in their org"
  ON contacts FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_my_org_ids()));

CREATE POLICY "members can update contacts in their org"
  ON contacts FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

CREATE POLICY "members can delete contacts in their org"
  ON contacts FOR DELETE TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

-- ── pipeline_stages ───────────────────────────────────────────
CREATE POLICY "members can manage pipeline stages in their org"
  ON pipeline_stages FOR ALL TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

-- ── deals ─────────────────────────────────────────────────────
CREATE POLICY "members can manage deals in their org"
  ON deals FOR ALL TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

-- ── activities ────────────────────────────────────────────────
CREATE POLICY "members can manage activities in their org"
  ON activities FOR ALL TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

-- ── notes ─────────────────────────────────────────────────────
CREATE POLICY "members can manage notes in their org"
  ON notes FOR ALL TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

-- ── tags ──────────────────────────────────────────────────────
CREATE POLICY "members can manage tags in their org"
  ON tags FOR ALL TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

-- ── contact_tags ──────────────────────────────────────────────
CREATE POLICY "members can manage contact_tags in their org"
  ON contact_tags FOR ALL TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM contacts
      WHERE organization_id IN (SELECT get_my_org_ids())
    )
  );

-- ── ai_usage ──────────────────────────────────────────────────
CREATE POLICY "members can view ai_usage in their org"
  ON ai_usage FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()));

-- ── oauth_tokens ───────────────────────────────────────────────
CREATE POLICY "users can manage their own oauth tokens"
  ON oauth_tokens FOR ALL TO authenticated
  USING (user_id = auth.uid() AND organization_id IN (SELECT get_my_org_ids()))
  WITH CHECK (user_id = auth.uid() AND organization_id IN (SELECT get_my_org_ids()));

-- ── alerts ─────────────────────────────────────────────────────
CREATE POLICY "members can manage alerts in their org"
  ON alerts FOR ALL TO authenticated
  USING (organization_id IN (SELECT get_my_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_my_org_ids()));
