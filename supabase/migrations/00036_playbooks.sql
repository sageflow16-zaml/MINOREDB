CREATE TABLE IF NOT EXISTS playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Custom',
  status TEXT DEFAULT 'Draft',
  tags TEXT[] DEFAULT '{}',
  steps JSONB DEFAULT '[]'::jsonb,
  linked_trades UUID[] DEFAULT '{}',
  linked_research UUID[] DEFAULT '{}',
  linked_documents UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_project ON playbook(project_id);
CREATE INDEX IF NOT EXISTS idx_playbook_status ON playbook(status);
CREATE INDEX IF NOT EXISTS idx_playbook_category ON playbook(category);

ALTER TABLE playbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playbook_project_access"
  ON playbook
  USING (project_id IN (
    SELECT project_id FROM project_member WHERE user_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION get_playbook_stats(p_project_id UUID)
RETURNS TABLE (
  total_playbooks BIGINT,
  active_playbooks BIGINT,
  categories TEXT[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_playbooks,
    COUNT(*) FILTER (WHERE status = 'Active')::BIGINT AS active_playbooks,
    ARRAY_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS categories
  FROM playbook
  WHERE project_id = p_project_id;
END;
$$;
