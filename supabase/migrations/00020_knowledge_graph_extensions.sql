-- Migration 00020: Knowledge Graph nodes/edges, strategy_version tables
-- These complete the schema for features already migrated to Supabase

-- ============= KNOWLEDGE GRAPH NODES/EDGES =============
CREATE TABLE IF NOT EXISTS public.knowledge_node (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  weight NUMERIC DEFAULT 1.0,
  occurrences INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, type, name)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_node_project ON public.knowledge_node(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_node_type ON public.knowledge_node(project_id, type);

CREATE TABLE IF NOT EXISTS public.knowledge_edge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.knowledge_node(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.knowledge_node(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'CORRELATED',
  strength NUMERIC DEFAULT 1.0,
  occurrences INTEGER DEFAULT 1,
  confidence NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_node_id, target_node_id, relationship)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_edge_project ON public.knowledge_edge(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edge_source ON public.knowledge_edge(source_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edge_target ON public.knowledge_edge(target_node_id);

CREATE TABLE IF NOT EXISTS public.knowledge_graph_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  total_nodes INTEGER DEFAULT 0,
  total_edges INTEGER DEFAULT 0,
  most_connected_type TEXT,
  highest_confidence_edge_id UUID,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_snapshot_project ON public.knowledge_graph_snapshot(project_id);

-- ============= STRATEGY VERSION =============
CREATE TABLE IF NOT EXISTS public.strategy_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.strategy(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  change_log TEXT,
  author TEXT,
  snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(strategy_id, version)
);
CREATE INDEX IF NOT EXISTS idx_strategy_version_strategy ON public.strategy_version(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_version_project ON public.strategy_version(project_id);

-- RLS
ALTER TABLE public.knowledge_node ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_version ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'knowledge_node' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.knowledge_node FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
    CREATE POLICY project_access ON public.knowledge_edge FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
    CREATE POLICY project_access ON public.knowledge_graph_snapshot FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
    CREATE POLICY project_access ON public.strategy_version FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
