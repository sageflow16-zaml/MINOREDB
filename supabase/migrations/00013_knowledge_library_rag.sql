-- Migration 00013: Knowledge Library + RAG Copilot tables
-- Knowledge Category/Tag/Concept system, RAG/chat tables

-- ============= KNOWLEDGE LIBRARY =============
CREATE TABLE IF NOT EXISTS public.knowledge_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_category_project ON public.knowledge_category(project_id);

CREATE TABLE IF NOT EXISTS public.knowledge_tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_tag_project ON public.knowledge_tag(project_id);

CREATE TABLE IF NOT EXISTS public.knowledge_concept (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.knowledge_category(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  definition TEXT,
  purpose TEXT,
  market_context TEXT,
  rules JSONB DEFAULT '[]'::jsonb,
  conditions TEXT,
  confirmations TEXT,
  invalidations TEXT,
  common_mistakes TEXT,
  best_practices TEXT,
  difficulty TEXT,
  confidence NUMERIC,
  status TEXT DEFAULT 'draft',
  reviewed BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_concept_project ON public.knowledge_concept(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_concept_category ON public.knowledge_concept(category_id);

CREATE TABLE IF NOT EXISTS public.knowledge_concept_tag (
  concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.knowledge_tag(id) ON DELETE CASCADE,
  PRIMARY KEY (concept_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.knowledge_relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  source_concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  target_concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  relationship_type TEXT,
  strength NUMERIC,
  confidence NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_concept_id, target_concept_id, relationship_type)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationship_project ON public.knowledge_relationship(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationship_source ON public.knowledge_relationship(source_concept_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationship_target ON public.knowledge_relationship(target_concept_id);

CREATE TABLE IF NOT EXISTS public.knowledge_example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  market TEXT,
  pair TEXT,
  timeframe TEXT,
  image TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_example_concept ON public.knowledge_example(concept_id);

CREATE TABLE IF NOT EXISTS public.knowledge_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  source_type TEXT,
  title TEXT,
  author TEXT,
  publication TEXT,
  url TEXT,
  page_number TEXT,
  section TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_reference_concept ON public.knowledge_reference(concept_id);

CREATE TABLE IF NOT EXISTS public.knowledge_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  path TEXT,
  checksum TEXT,
  status TEXT DEFAULT 'pending',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_source_project ON public.knowledge_source(project_id);

CREATE TABLE IF NOT EXISTS public.knowledge_chunk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.knowledge_source(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text TEXT,
  token_count INTEGER,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunk_source ON public.knowledge_chunk(source_id);

CREATE TABLE IF NOT EXISTS public.knowledge_revision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(concept_id, version)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_revision_concept ON public.knowledge_revision(concept_id);

-- ============= RAG COPILOT =============
CREATE TABLE IF NOT EXISTS public.ai_conversation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  title TEXT,
  model TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_project ON public.ai_conversation(project_id);

CREATE TABLE IF NOT EXISTS public.ai_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversation(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  model TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_message_conversation ON public.ai_message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_created ON public.ai_message(created_at);

CREATE TABLE IF NOT EXISTS public.ai_pinned_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversation(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_saved_prompt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  folder_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_saved_prompt_project ON public.ai_saved_prompt(project_id);

CREATE TABLE IF NOT EXISTS public.ai_prompt_folder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_folder_project ON public.ai_prompt_folder(project_id);

ALTER TABLE public.ai_saved_prompt ADD CONSTRAINT fk_prompt_folder FOREIGN KEY (folder_id) REFERENCES public.ai_prompt_folder(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.ai_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB DEFAULT '[]'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_project ON public.ai_workflow(project_id);

CREATE TABLE IF NOT EXISTS public.ai_workflow_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.ai_workflow(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_exec_workflow ON public.ai_workflow_execution(workflow_id);

CREATE TABLE IF NOT EXISTS public.ai_document_ingestion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  source_type TEXT,
  status TEXT DEFAULT 'pending',
  chunk_count INTEGER DEFAULT 0,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_doc_ingestion_project ON public.ai_document_ingestion(project_id);

CREATE TABLE IF NOT EXISTS public.ai_document_chunk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  ingestion_id UUID NOT NULL REFERENCES public.ai_document_ingestion(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  token_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_doc_chunk_ingestion ON public.ai_document_chunk(ingestion_id);

CREATE TABLE IF NOT EXISTS public.ai_agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  name TEXT,
  model TEXT,
  system_prompt TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, agent_type)
);
CREATE INDEX IF NOT EXISTS idx_ai_agent_config_project ON public.ai_agent_config(project_id);

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, key)
);
CREATE INDEX IF NOT EXISTS idx_ai_memory_project ON public.ai_memory(project_id);

CREATE TABLE IF NOT EXISTS public.ai_citation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.ai_message(id) ON DELETE CASCADE,
  source_type TEXT,
  source_id TEXT,
  title TEXT,
  excerpt TEXT,
  url TEXT,
  relevance NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_citation_message ON public.ai_citation(message_id);

CREATE TABLE IF NOT EXISTS public.ai_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  model TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost NUMERIC,
  endpoint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_project ON public.ai_token_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_created ON public.ai_token_usage(created_at);

CREATE TABLE IF NOT EXISTS public.ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT,
  action TEXT,
  summary TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_project ON public.ai_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_created ON public.ai_audit_log(created_at);

-- RLS policies
ALTER TABLE public.knowledge_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_concept ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_concept_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_relationship ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_example ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_revision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_pinned_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_saved_prompt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_folder ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_document_ingestion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_document_chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_citation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Simplified RLS: all tables use project-based ownership check
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'knowledge_category' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.knowledge_category FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
