-- Migration 00007: Vault table
-- Obsidian vault registration and connection management

CREATE TABLE IF NOT EXISTS public.vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  vault_type TEXT NOT NULL DEFAULT 'local',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ,
  sync_token TEXT,
  settings_json JSONB,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  health_message TEXT,
  permission_level TEXT NOT NULL DEFAULT 'read_write',
  api_key TEXT,
  metadata_json JSONB
);

CREATE INDEX IF NOT EXISTS idx_vault_project_id ON public.vault(project_id);
CREATE INDEX IF NOT EXISTS idx_vault_project_active ON public.vault(project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vault_name ON public.vault(name);
CREATE INDEX IF NOT EXISTS idx_vault_health_status ON public.vault(health_status);

CREATE TRIGGER set_vault_updated_at
  BEFORE UPDATE ON public.vault
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project vaults"
  ON public.vault FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert vaults"
  ON public.vault FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own project vaults"
  ON public.vault FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own project vaults"
  ON public.vault FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
