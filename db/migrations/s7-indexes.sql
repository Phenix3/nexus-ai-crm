-- S7 Performance indexes
-- Run in Supabase SQL Editor after applying migration 0004

CREATE INDEX IF NOT EXISTS idx_activities_contact_type_occurred
  ON activities(contact_id, type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_org_read
  ON alerts(organization_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_org_score
  ON contacts(organization_id, score DESC);
