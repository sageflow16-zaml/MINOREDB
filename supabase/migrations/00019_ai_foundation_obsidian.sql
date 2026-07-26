-- Migration 00019: AI Foundation, Collector, Legacy MT5, Obsidian extras

-- ============= AI FOUNDATION =============
CREATE TABLE IF NOT EXISTS public.ai_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  trading_style TEXT,
  preferred_sessions JSONB DEFAULT '[]'::jsonb,
  preferred_markets JSONB DEFAULT '[]'::jsonb,
  preferred_timeframes JSONB DEFAULT '[]'::jsonb,
  preferred_pairs JSONB DEFAULT '[]'::jsonb,
  risk_profile TEXT,
  avg_rr NUMERIC,
  avg_holding_time_min INTEGER,
  avg_risk_per_trade NUMERIC,
  max_drawdown_pct NUMERIC,
  best_conditions JSONB DEFAULT '{}'::jsonb,
  worst_conditions JSONB DEFAULT '{}'::jsonb,
  psychological_patterns JSONB DEFAULT '[]'::jsonb,
  most_common_mistakes JSONB DEFAULT '[]'::jsonb,
  most_successful_behaviors JSONB DEFAULT '[]'::jsonb,
  learning_progress JSONB DEFAULT '{}'::jsonb,
  overall_score NUMERIC,
  total_trades_analyzed INTEGER DEFAULT 0,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trade_evaluation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trade(id) ON DELETE CASCADE,
  strength_score NUMERIC,
  risk_score NUMERIC,
  execution_score NUMERIC,
  psychology_score NUMERIC,
  discipline_score NUMERIC,
  strategy_alignment NUMERIC,
  confidence_score NUMERIC,
  overall_quality NUMERIC,
  critique TEXT,
  provider TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_evaluation_project ON public.trade_evaluation(project_id);
CREATE INDEX IF NOT EXISTS idx_trade_evaluation_trade ON public.trade_evaluation(trade_id);

CREATE TABLE IF NOT EXISTS public.knowledge_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relationship TEXT,
  strength NUMERIC,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_link_project ON public.knowledge_link(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_link_source ON public.knowledge_link(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_link_target ON public.knowledge_link(target_type, target_id);

CREATE TABLE IF NOT EXISTS public.detected_pattern (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_key TEXT NOT NULL,
  pattern_value TEXT,
  confidence NUMERIC,
  sample_size INTEGER DEFAULT 0,
  avg_pnl NUMERIC,
  win_rate NUMERIC,
  description TEXT,
  is_positive BOOLEAN,
  is_active BOOLEAN DEFAULT true,
  last_detected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_detected_pattern_project ON public.detected_pattern(project_id);
CREATE INDEX IF NOT EXISTS idx_detected_pattern_type ON public.detected_pattern(pattern_type);

CREATE TABLE IF NOT EXISTS public.coaching_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_type TEXT,
  session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  summary TEXT,
  key_findings JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  score NUMERIC,
  metrics_snapshot JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coaching_session_project ON public.coaching_session(project_id);

CREATE TABLE IF NOT EXISTS public.ai_insight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  insight_type TEXT,
  category TEXT,
  title TEXT,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  confidence NUMERIC,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_insight_project ON public.ai_insight(project_id);

CREATE TABLE IF NOT EXISTS public.ai_recommendation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  recommendation_type TEXT,
  priority TEXT DEFAULT 'medium',
  title TEXT,
  description TEXT,
  rationale TEXT,
  action_url TEXT,
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_project ON public.ai_recommendation(project_id);

CREATE TABLE IF NOT EXISTS public.ai_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  summary_type TEXT,
  entity_id TEXT,
  period TEXT,
  content TEXT,
  text_summary TEXT,
  keywords JSONB DEFAULT '[]'::jsonb,
  sentiment TEXT,
  importance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_summary_project ON public.ai_summary(project_id);

CREATE TABLE IF NOT EXISTS public.ai_context_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  snapshot_type TEXT,
  trade_id UUID REFERENCES public.trade(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_context_snapshot_project ON public.ai_context_snapshot(project_id);

CREATE TABLE IF NOT EXISTS public.ai_provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  display_name TEXT,
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  model_name TEXT,
  api_endpoint TEXT,
  config_json JSONB DEFAULT '{}'::jsonb,
  capabilities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, provider_name)
);
CREATE INDEX IF NOT EXISTS idx_ai_provider_config_project ON public.ai_provider_config(project_id);

-- ============= COLLECTOR =============
CREATE TABLE IF NOT EXISTS public.collector_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  collector_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'idle',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  errors INTEGER DEFAULT 0,
  records_collected INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, collector_name)
);
CREATE INDEX IF NOT EXISTS idx_collector_status_project ON public.collector_status(project_id);

CREATE TABLE IF NOT EXISTS public.collector_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  collector_name TEXT NOT NULL,
  level TEXT DEFAULT 'info',
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_collector_log_project ON public.collector_log(project_id);

CREATE TABLE IF NOT EXISTS public.collector_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  collector_name TEXT NOT NULL,
  cron_expression TEXT,
  is_active BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, collector_name)
);
CREATE INDEX IF NOT EXISTS idx_collector_schedule_project ON public.collector_schedule(project_id);

-- ============= IMPORT =============
CREATE TABLE IF NOT EXISTS public.trade_import (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  filename TEXT,
  file_type TEXT,
  status TEXT DEFAULT 'pending',
  total_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  duplicate_rows INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  import_config JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_import_project ON public.trade_import(project_id);

-- ============= LEGACY MT5 =============
CREATE TABLE IF NOT EXISTS public.broker_connection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  broker TEXT,
  account TEXT,
  server TEXT,
  terminal_path TEXT,
  status TEXT DEFAULT 'disconnected',
  connected BOOLEAN DEFAULT false,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broker_connection_legacy_project ON public.broker_connection(project_id);

CREATE TABLE IF NOT EXISTS public.trade_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  broker TEXT,
  trade_ticket TEXT,
  sync_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT,
  message TEXT
);
CREATE INDEX IF NOT EXISTS idx_trade_sync_log_ticket ON public.trade_sync_log(trade_ticket);

-- ============= OBSIDIAN EXTRA TABLES =============
CREATE TABLE IF NOT EXISTS public.vault_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID UNIQUE NOT NULL REFERENCES public.vault(id) ON DELETE CASCADE,
  total_notes INTEGER DEFAULT 0,
  synced_notes INTEGER DEFAULT 0,
  pending_notes INTEGER DEFAULT 0,
  conflicted_notes INTEGER DEFAULT 0,
  deleted_notes INTEGER DEFAULT 0,
  total_size_kb INTEGER DEFAULT 0,
  total_tags INTEGER DEFAULT 0,
  total_wiki_links INTEGER DEFAULT 0,
  total_backlinks INTEGER DEFAULT 0,
  notes_by_type JSONB DEFAULT '{}'::jsonb,
  notes_by_folder JSONB DEFAULT '{}'::jsonb,
  top_tags JSONB DEFAULT '[]'::jsonb,
  last_full_sync TIMESTAMPTZ,
  last_incremental_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.vault(id) ON DELETE CASCADE,
  sync_type TEXT,
  status TEXT,
  direction TEXT,
  files_processed INTEGER DEFAULT 0,
  files_imported INTEGER DEFAULT 0,
  files_exported INTEGER DEFAULT 0,
  files_conflicted INTEGER DEFAULT 0,
  files_skipped INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  duration_ms INTEGER,
  trigger TEXT,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sync_log_vault ON public.sync_log(vault_id);

CREATE TABLE IF NOT EXISTS public.sync_conflict (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.vault(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.obsidian_note(id) ON DELETE SET NULL,
  file_path TEXT,
  conflict_type TEXT,
  local_version INTEGER,
  remote_version INTEGER,
  local_hash TEXT,
  remote_hash TEXT,
  local_content TEXT,
  remote_content TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sync_conflict_vault ON public.sync_conflict(vault_id);

CREATE TABLE IF NOT EXISTS public.sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID UNIQUE NOT NULL REFERENCES public.vault(id) ON DELETE CASCADE,
  auto_sync BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT '5min',
  folder_mapping JSONB DEFAULT '{}'::jsonb,
  ignored_folders JSONB DEFAULT '[]'::jsonb,
  ignored_files JSONB DEFAULT '[]'::jsonb,
  ignored_patterns JSONB DEFAULT '[]'::jsonb,
  conflict_policy TEXT DEFAULT 'ask',
  backup_policy TEXT DEFAULT 'local',
  sync_attachments BOOLEAN DEFAULT true,
  sync_metadata BOOLEAN DEFAULT true,
  sync_templates BOOLEAN DEFAULT false,
  max_file_size_kb INTEGER DEFAULT 1024,
  encrypt_sync BOOLEAN DEFAULT false,
  note_type_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.note_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT,
  content TEXT,
  description TEXT,
  frontmatter_template JSONB DEFAULT '{}'::jsonb,
  tags_template JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  target_folder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_note_template_project ON public.note_template(project_id);

-- RLS
ALTER TABLE public.ai_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_pattern ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insight ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_context_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_import ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_connection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_conflict ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'ai_profile' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.ai_profile FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
