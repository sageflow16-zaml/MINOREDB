-- Agent Module tables
CREATE TABLE IF NOT EXISTS public.agent_task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  input_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  workflow_id UUID,
  workflow_step INTEGER,
  depends_on UUID,
  output_data JSONB,
  error_message TEXT,
  execution_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.agent_task(id) ON DELETE SET NULL,
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reasoning TEXT,
  confidence REAL,
  discoveries JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '[]'::jsonb,
  output_summary TEXT,
  output_data JSONB,
  duration_ms INTEGER,
  sources_consulted JSONB DEFAULT '[]'::jsonb,
  memories_created INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.agent_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  steps JSONB DEFAULT '[]'::jsonb,
  trigger_type TEXT,
  trigger_config JSONB,
  total_runs INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ALTER TABLE for Copilot missing columns
ALTER TABLE public.ai_conversation ADD COLUMN IF NOT EXISTS agent_type TEXT;
ALTER TABLE public.ai_conversation ADD COLUMN IF NOT EXISTS folder TEXT;
ALTER TABLE public.ai_conversation ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_conversation ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
ALTER TABLE public.ai_conversation ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;
ALTER TABLE public.ai_conversation ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS agent_type TEXT;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS contexts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS cost_usd REAL DEFAULT 0;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS is_streaming BOOLEAN DEFAULT false;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS is_error BOOLEAN DEFAULT false;
ALTER TABLE public.ai_message ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.ai_message ALTER COLUMN content TYPE TEXT;

ALTER TABLE public.ai_saved_prompt ADD COLUMN IF NOT EXISTS agent_type TEXT;
ALTER TABLE public.ai_saved_prompt ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_saved_prompt ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.ai_agent_config ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.ai_agent_config ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.ai_agent_config ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.ai_agent_config ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.ai_agent_config ADD COLUMN IF NOT EXISTS tools JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_agent_config ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.ai_agent_config ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.ai_agent_config ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS memory_type TEXT;
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS text_value TEXT;
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 0;

-- RLS: Agent tables
ALTER TABLE public.agent_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own agent_tasks"
  ON public.agent_task FOR ALL
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD their own agent_executions"
  ON public.agent_execution FOR ALL
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD their own agent_workflows"
  ON public.agent_workflow FOR ALL
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
