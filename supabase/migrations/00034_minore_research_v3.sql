-- Migration 00034: Minore Research V3 - Complete schema rebuild
-- Collections, folders, bookmarks, highlights, notes, journal analysis

-- ── Document Collections ──

CREATE TABLE document_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES document_collection(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Document Folders ──

CREATE TABLE document_folder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES document_folder(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES document_collection(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Document-Collection Membership ──

CREATE TABLE document_collection_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES document_collection(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES document_folder(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, collection_id)
);

-- ── Document Bookmarks ──

CREATE TABLE document_bookmark (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  page INTEGER,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Document Highlights ──

CREATE TABLE document_highlight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  page INTEGER,
  color TEXT DEFAULT 'yellow',
  text TEXT NOT NULL,
  note TEXT,
  position JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Document Notes ──

CREATE TABLE document_note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  page INTEGER,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Journal Analysis ──

CREATE TABLE document_journal_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Multi-document Chat Sessions ──

CREATE TABLE research_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  title TEXT,
  document_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Chat Messages (Research-specific, extends ai_message with citations) ──

ALTER TABLE ai_message ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]';
ALTER TABLE ai_message ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE ai_message ADD COLUMN IF NOT EXISTS document_ids UUID[] DEFAULT '{}';

-- ── Add page metadata to ai_document_chunk ──

ALTER TABLE ai_document_chunk ADD COLUMN IF NOT EXISTS page INTEGER;
ALTER TABLE ai_document_chunk ADD COLUMN IF NOT EXISTS token_count INTEGER;
ALTER TABLE ai_document_chunk ADD COLUMN IF NOT EXISTS section_title TEXT;

-- ── Add progress tracking to ai_document_ingestion ──

ALTER TABLE ai_document_ingestion ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES source(id) ON DELETE SET NULL;
ALTER TABLE ai_document_ingestion ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{"stage": "pending", "pct": 0}';
ALTER TABLE ai_document_ingestion ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE ai_document_ingestion ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE ai_document_ingestion ADD COLUMN IF NOT EXISTS word_count INTEGER;

-- ── Document processing queue ──

CREATE TABLE document_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Default Collections ──

INSERT INTO document_collection (project_id, name, slug, description, icon, color, sort_order)
SELECT
  p.id,
  c.name,
  c.slug,
  c.description,
  c.icon,
  c.color,
  c.sort_order
FROM project p
CROSS JOIN (VALUES
  ('ICT', 'ict', 'ICT Mentorship concepts and materials', 'book-open', '#6366f1', 1),
  ('Trading Journals', 'trading-journals', 'Personal trading journals and analysis', 'notebook', '#22c55e', 2),
  ('Macro', 'macro', 'Macroeconomic research and analysis', 'globe', '#f59e0b', 3),
  ('Psychology', 'psychology', 'Trading psychology resources', 'brain', '#ec4899', 4),
  ('Risk', 'risk', 'Risk management rules and frameworks', 'shield', '#ef4444', 5),
  ('Books', 'books', 'Trading books and educational materials', 'book', '#8b5cf6', 6),
  ('Research Papers', 'research-papers', 'Academic research and whitepapers', 'microscope', '#06b6d4', 7)
) AS c(name, slug, description, icon, color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM document_collection dc WHERE dc.project_id = p.id AND dc.slug = c.slug
);

-- ── Indexes ──

CREATE INDEX IF NOT EXISTS idx_document_collection_project ON document_collection(project_id);
CREATE INDEX IF NOT EXISTS idx_document_folder_project ON document_folder(project_id);
CREATE INDEX IF NOT EXISTS idx_document_collection_member_document ON document_collection_member(document_id);
CREATE INDEX IF NOT EXISTS idx_document_collection_member_collection ON document_collection_member(collection_id);
CREATE INDEX IF NOT EXISTS idx_document_bookmark_document ON document_bookmark(document_id);
CREATE INDEX IF NOT EXISTS idx_document_highlight_document ON document_highlight(document_id);
CREATE INDEX IF NOT EXISTS idx_document_note_document ON document_note(document_id);
CREATE INDEX IF NOT EXISTS idx_document_journal_analysis_document ON document_journal_analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_research_session_project ON research_session(project_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_queue_document ON document_processing_queue(document_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_queue_status ON document_processing_queue(status);

-- ── RLS Policies ──

ALTER TABLE document_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folder ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collection_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_bookmark ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_highlight ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_note ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_journal_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_queue ENABLE ROW LEVEL SECURITY;

-- Document Collections
CREATE POLICY "Users can view own collections"
  ON document_collection FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own collections"
  ON document_collection FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own collections"
  ON document_collection FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own collections"
  ON document_collection FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Folders
CREATE POLICY "Users can view own folders"
  ON document_folder FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own folders"
  ON document_folder FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own folders"
  ON document_folder FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own folders"
  ON document_folder FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Collection Members
CREATE POLICY "Users can view own collection members"
  ON document_collection_member FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own collection members"
  ON document_collection_member FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own collection members"
  ON document_collection_member FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON document_bookmark FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own bookmarks"
  ON document_bookmark FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own bookmarks"
  ON document_bookmark FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Highlights
CREATE POLICY "Users can view own highlights"
  ON document_highlight FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own highlights"
  ON document_highlight FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own highlights"
  ON document_highlight FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own highlights"
  ON document_highlight FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Notes
CREATE POLICY "Users can view own notes"
  ON document_note FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own notes"
  ON document_note FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own notes"
  ON document_note FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own notes"
  ON document_note FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Journal Analysis
CREATE POLICY "Users can view own journal analysis"
  ON document_journal_analysis FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own journal analysis"
  ON document_journal_analysis FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own journal analysis"
  ON document_journal_analysis FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Research Sessions
CREATE POLICY "Users can view own research sessions"
  ON research_session FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own research sessions"
  ON research_session FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own research sessions"
  ON research_session FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own research sessions"
  ON research_session FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Processing Queue
CREATE POLICY "Users can view own processing queue"
  ON document_processing_queue FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own processing queue"
  ON document_processing_queue FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own processing queue"
  ON document_processing_queue FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
