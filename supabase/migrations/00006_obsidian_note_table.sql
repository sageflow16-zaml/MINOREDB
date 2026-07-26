-- Migration 00006: Obsidian Note table
-- Primary notes system for the journaling / knowledge base feature

-- ============= OBSIDIAN_NOTE TABLE =============
CREATE TABLE IF NOT EXISTS public.obsidian_note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vault_id UUID NOT NULL,                       -- FK → public.vault (not yet migrated)
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT,
  title TEXT,
  content TEXT,
  html_content TEXT,
  frontmatter JSONB,
  tags JSONB DEFAULT '[]'::jsonb,
  aliases JSONB DEFAULT '[]'::jsonb,
  wiki_links JSONB DEFAULT '[]'::jsonb,
  backlinks JSONB DEFAULT '[]'::jsonb,
  embeds JSONB DEFAULT '[]'::jsonb,
  headings JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  concepts JSONB DEFAULT '[]'::jsonb,
  referenced_entities JSONB DEFAULT '[]'::jsonb,
  detected_dates JSONB DEFAULT '[]'::jsonb,
  detected_sessions JSONB DEFAULT '[]'::jsonb,
  detected_markets JSONB DEFAULT '[]'::jsonb,
  detected_pairs JSONB DEFAULT '[]'::jsonb,
  detected_timeframes JSONB DEFAULT '[]'::jsonb,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_direction TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ,
  note_type TEXT
);

-- ============= INDEXES =============
-- Primary query: list non-deleted notes for a vault/project
CREATE INDEX IF NOT EXISTS idx_obsidian_note_vault_active
  ON public.obsidian_note(project_id, vault_id, is_deleted, created_at DESC);

-- Filter by vault
CREATE INDEX IF NOT EXISTS idx_obsidian_note_vault_id ON public.obsidian_note(vault_id);

-- Filter by note type (trade_review, journal, strategy, etc.)
CREATE INDEX IF NOT EXISTS idx_obsidian_note_note_type ON public.obsidian_note(note_type);

-- Filter by sync status
CREATE INDEX IF NOT EXISTS idx_obsidian_note_sync_status ON public.obsidian_note(sync_status);

-- Search by title
CREATE INDEX IF NOT EXISTS idx_obsidian_note_title ON public.obsidian_note(title);

-- GIN index for JSONB tags array contains queries
CREATE INDEX IF NOT EXISTS idx_obsidian_note_tags ON public.obsidian_note USING GIN (tags);

-- ============= UPDATED_AT TRIGGER =============
CREATE TRIGGER set_obsidian_note_updated_at
  BEFORE UPDATE ON public.obsidian_note
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= ROW LEVEL SECURITY =============
ALTER TABLE public.obsidian_note ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project notes"
  ON public.obsidian_note FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert notes"
  ON public.obsidian_note FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own project notes"
  ON public.obsidian_note FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
