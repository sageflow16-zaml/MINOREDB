-- Migration 00017: Automation / Workflow Engine tables

CREATE TABLE IF NOT EXISTS public.automation_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  tags JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  nodes JSONB DEFAULT '[]'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  triggers JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_handling JSONB DEFAULT '{}'::jsonb,
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  usage_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_workflow_project ON public.automation_workflow(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflow_status ON public.automation_workflow(status);

CREATE TABLE IF NOT EXISTS public.automation_workflow_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.automation_workflow(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  triggered_by TEXT,
  trigger_type TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  nodes_executed JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  error_details JSONB DEFAULT '{}'::jsonb,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_workflow_exec_workflow ON public.automation_workflow_execution(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflow_exec_status ON public.automation_workflow_execution(status);

CREATE TABLE IF NOT EXISTS public.automation_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  category TEXT,
  condition_expression TEXT,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions_config JSONB DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  cooldown_minutes INTEGER DEFAULT 0,
  max_triggers_per_day INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_rule_project ON public.automation_rule(project_id);

CREATE TABLE IF NOT EXISTS public.automation_scheduled_job (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.automation_workflow(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  cron_expression TEXT,
  timezone TEXT DEFAULT 'UTC',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  action_type TEXT,
  action_config JSONB DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  total_runs INTEGER DEFAULT 0,
  success_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  retry_on_failure BOOLEAN DEFAULT false,
  max_retries INTEGER DEFAULT 3,
  retry_delay_minutes INTEGER DEFAULT 5,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_job_project ON public.automation_scheduled_job(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_job_next_run ON public.automation_scheduled_job(next_run_at) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS public.automation_job_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.automation_scheduled_job(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  result TEXT,
  error TEXT,
  error_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_job_exec_job ON public.automation_job_execution(job_id);

CREATE TABLE IF NOT EXISTS public.automation_notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  notification_type TEXT,
  channel TEXT,
  status TEXT DEFAULT 'pending',
  source TEXT,
  source_id TEXT,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error TEXT,
  recipient TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_notification_project ON public.automation_notification(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_notification_status ON public.automation_notification(status);

CREATE TABLE IF NOT EXISTS public.automation_notification_channel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_channel_project ON public.automation_notification_channel(project_id);

CREATE TABLE IF NOT EXISTS public.automation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source TEXT,
  source_id TEXT,
  actor TEXT,
  action TEXT,
  summary TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_audit_log_project ON public.automation_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_audit_log_created ON public.automation_audit_log(created_at);

CREATE TABLE IF NOT EXISTS public.automation_connector (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_connector_project ON public.automation_connector(project_id);

CREATE TABLE IF NOT EXISTS public.automation_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  format TEXT DEFAULT 'markdown',
  recipients JSONB DEFAULT '[]'::jsonb,
  schedule_cron TEXT,
  last_generated_at TIMESTAMPTZ,
  last_generated_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_report_project ON public.automation_report(project_id);

CREATE TABLE IF NOT EXISTS public.automation_workflow_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  icon TEXT,
  nodes_config JSONB DEFAULT '[]'::jsonb,
  connections_config JSONB DEFAULT '[]'::jsonb,
  triggers_config JSONB DEFAULT '[]'::jsonb,
  actions_config JSONB DEFAULT '[]'::jsonb,
  conditions_config JSONB DEFAULT '[]'::jsonb,
  is_built_in BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.automation_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflow_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_scheduled_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_job_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_notification_channel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_connector ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_report ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_workflow' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.automation_workflow FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
