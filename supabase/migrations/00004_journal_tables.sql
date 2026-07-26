-- Migration 00004: Journal (Learning) tables
-- learning_event + knowledge_snapshot

-- ============= LEARNING_EVENT =============
CREATE TABLE IF NOT EXISTS public.learning_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  summary TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_event_project_id ON public.learning_event(project_id);
CREATE INDEX IF NOT EXISTS idx_learning_event_created_at ON public.learning_event(created_at DESC);

ALTER TABLE public.learning_event ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project learning events"
  ON public.learning_event FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert learning events"
  ON public.learning_event FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- ============= KNOWLEDGE_SNAPSHOT =============
CREATE TABLE IF NOT EXISTS public.knowledge_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  total_trades INTEGER NOT NULL DEFAULT 0,
  total_patterns INTEGER NOT NULL DEFAULT 0,
  total_claims INTEGER NOT NULL DEFAULT 0,
  total_concepts INTEGER NOT NULL DEFAULT 0,
  total_sources INTEGER NOT NULL DEFAULT 0,
  total_similarities INTEGER NOT NULL DEFAULT 0,
  total_interpretations INTEGER NOT NULL DEFAULT 0,
  win_rate REAL NOT NULL DEFAULT 0.0,
  avg_rr REAL NOT NULL DEFAULT 0.0,
  expectancy REAL NOT NULL DEFAULT 0.0,
  knowledge_growth REAL NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_snapshot_project_id ON public.knowledge_snapshot(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_snapshot_created_at ON public.knowledge_snapshot(created_at DESC);

ALTER TABLE public.knowledge_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project snapshots"
  ON public.knowledge_snapshot FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert snapshots"
  ON public.knowledge_snapshot FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
