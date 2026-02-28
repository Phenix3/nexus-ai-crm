-- ============================================================
-- Row Level Security — Nexus CRM
-- Run this in the Supabase SQL editor AFTER the Drizzle migration.
-- ============================================================

-- Helper: returns the current user's organization_id from the session claim
-- set by the API middleware (Clerk JWT custom claim or session variable).
-- During dev you can test with: SET app.current_organization_id = '<uuid>';

-- Enable RLS on all tenant tables
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

-- ── organizations ────────────────────────────────────────────
CREATE POLICY "members can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── organization_members ─────────────────────────────────────
CREATE POLICY "members can view members of same org"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── contacts ─────────────────────────────────────────────────
CREATE POLICY "members can select contacts in their org"
  ON contacts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can insert contacts in their org"
  ON contacts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can update contacts in their org"
  ON contacts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can delete contacts in their org"
  ON contacts FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── pipeline_stages ──────────────────────────────────────────
CREATE POLICY "members can manage pipeline stages in their org"
  ON pipeline_stages FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── deals ────────────────────────────────────────────────────
CREATE POLICY "members can manage deals in their org"
  ON deals FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── activities ───────────────────────────────────────────────
CREATE POLICY "members can manage activities in their org"
  ON activities FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── notes ────────────────────────────────────────────────────
CREATE POLICY "members can manage notes in their org"
  ON notes FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── tags ─────────────────────────────────────────────────────
CREATE POLICY "members can manage tags in their org"
  ON tags FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── contact_tags ─────────────────────────────────────────────
CREATE POLICY "members can manage contact_tags in their org"
  ON contact_tags FOR ALL
  USING (
    contact_id IN (
      SELECT id FROM contacts
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ── ai_usage ─────────────────────────────────────────────────
CREATE POLICY "members can view ai_usage in their org"
  ON ai_usage FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
