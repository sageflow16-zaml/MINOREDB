-- Migration 00027: Schema upgrades for Replay, Brain, Automation, Portfolio, Obsidian, Market Intel, Quant Research

-- ============= REPLAY =============
ALTER TABLE public.replay_session
  ADD COLUMN IF NOT EXISTS pair TEXT GENERATED ALWAYS AS (symbol) STORED,
  ADD COLUMN IF NOT EXISTS "current_date" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_candle INTEGER GENERATED ALWAYS AS (current_index) STORED,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.replay_trade
  ADD COLUMN IF NOT EXISTS candle_index INTEGER GENERATED ALWAYS AS (entry_index) STORED,
  ADD COLUMN IF NOT EXISTS risk_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC;

ALTER TABLE public.replay_bookmark
  ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED,
  ADD COLUMN IF NOT EXISTS note TEXT GENERATED ALWAYS AS (notes) STORED;

ALTER TABLE public.replay_annotation
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT;

ALTER TABLE public.replay_timeline_event
  ADD COLUMN IF NOT EXISTS severity TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE public.replay_review
  ADD COLUMN IF NOT EXISTS went_well TEXT,
  ADD COLUMN IF NOT EXISTS went_wrong TEXT,
  ADD COLUMN IF NOT EXISTS rule_violations TEXT,
  ADD COLUMN IF NOT EXISTS execution_quality TEXT,
  ADD COLUMN IF NOT EXISTS risk_management TEXT,
  ADD COLUMN IF NOT EXISTS psychology TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC,
  ADD COLUMN IF NOT EXISTS trade_grade TEXT,
  ADD COLUMN IF NOT EXISTS discipline_score NUMERIC,
  ADD COLUMN IF NOT EXISTS completed_checklist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS missed_checklist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rule_compliance NUMERIC;

ALTER TABLE public.replay_mistake
  ADD COLUMN IF NOT EXISTS candle_index INTEGER,
  ADD COLUMN IF NOT EXISTS preventable BOOLEAN,
  ADD COLUMN IF NOT EXISTS recommendation TEXT;

ALTER TABLE public.replay_screenshot
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS caption TEXT;

-- ============= BRAIN DASHBOARD =============
CREATE TABLE IF NOT EXISTS public.brain_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL,
  key TEXT NOT NULL,
  title TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  text_content TEXT,
  importance TEXT DEFAULT 'normal',
  tags JSONB DEFAULT '[]'::jsonb,
  source_entity_type TEXT,
  source_entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brain_memory_project ON public.brain_memory(project_id);
CREATE INDEX IF NOT EXISTS idx_brain_memory_type ON public.brain_memory(memory_type);

CREATE TABLE IF NOT EXISTS public.brain_decision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  decision_type TEXT,
  title TEXT,
  description TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  outcome TEXT,
  outcome_feedback TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brain_decision_project ON public.brain_decision(project_id);

CREATE TABLE IF NOT EXISTS public.learning_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  observation_type TEXT,
  title TEXT,
  description TEXT,
  severity TEXT DEFAULT 'info',
  source TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_learning_observation_project ON public.learning_observation(project_id);

-- RLS for Brain tables
ALTER TABLE public.brain_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_decision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_observation ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'brain_memory' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.brain_memory FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'brain_decision' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.brain_decision FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'learning_observation' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.learning_observation FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;

-- ============= OBSIDIAN =============
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'vault' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.vault FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'obsidian_note' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.obsidian_note FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'sync_settings' AND policyname = 'project_access_vault';
  IF NOT FOUND THEN CREATE POLICY project_access_vault ON public.sync_settings FOR ALL USING (vault_id IN (SELECT v.id FROM public.vault v WHERE v.project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'sync_log' AND policyname = 'project_access_vault';
  IF NOT FOUND THEN CREATE POLICY project_access_vault ON public.sync_log FOR ALL USING (vault_id IN (SELECT v.id FROM public.vault v WHERE v.project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'sync_conflict' AND policyname = 'project_access_vault';
  IF NOT FOUND THEN CREATE POLICY project_access_vault ON public.sync_conflict FOR ALL USING (vault_id IN (SELECT v.id FROM public.vault v WHERE v.project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'note_template' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.note_template FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;

-- ============= REPLAY RLS =============
ALTER TABLE public.replay_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_trade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_bookmark ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_annotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_timeline_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_mistake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_screenshot ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'replay_session' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.replay_session FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'replay_trade' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.replay_trade FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'replay_bookmark' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.replay_bookmark FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'replay_annotation' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.replay_annotation FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'replay_timeline_event' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.replay_timeline_event FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'replay_review' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.replay_review FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'replay_mistake' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.replay_mistake FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'replay_screenshot' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.replay_screenshot FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;

-- ============= PORTFOLIO RLS =============
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'broker_profile' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.broker_profile FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'account' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.account FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'account_group' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.account_group FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'funding_history' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.funding_history FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'portfolio_allocation' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.portfolio_allocation FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'transfer' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.transfer FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'portfolio_goal' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.portfolio_goal FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'account_health' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.account_health FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'account_rule' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.account_rule FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'account_note' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.account_note FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'portfolio_snapshot' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.portfolio_snapshot FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;

-- ============= MARKET INTEL RLS =============
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'economic_calendar_event' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.economic_calendar_event FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'market_regime' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.market_regime FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'correlation_data' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.correlation_data FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'liquidity_level' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.liquidity_level FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'market_structure_point' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.market_structure_point FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'session_analysis' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.session_analysis FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.watchlist FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'market_alert' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.market_alert FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'market_timeline' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.market_timeline FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'market_data_provider' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.market_data_provider FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;

-- ============= QUANT RESEARCH RLS =============
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_experiment' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.quant_experiment FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_backtest_run' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.quant_backtest_run FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_backtest_trade' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.quant_backtest_trade FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_simulation_run' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.quant_simulation_run FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_walk_forward_run' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.quant_walk_forward_run FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_optimization_run' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.quant_optimization_run FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_edge_health_snapshot' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.quant_edge_health_snapshot FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_research_notebook' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.quant_research_notebook FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_hypothesis_test' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.quant_hypothesis_test FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;

-- ============= AUTOMATION RLS =============
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_workflow' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_workflow FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_workflow_execution' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_workflow_execution FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_rule' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_rule FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_scheduled_job' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_scheduled_job FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_job_execution' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_job_execution FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_notification' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_notification FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_notification_channel' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_notification_channel FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_audit_log' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_audit_log FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_connector' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_connector FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'automation_report' AND policyname = 'project_access';
  IF NOT FOUND THEN CREATE POLICY project_access ON public.automation_report FOR ALL USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())); END IF;
END $$;

-- ============= MARKET INTEL ECONOMIC EVENT ALIASES =============
-- The frontend uses economic_calendar_event for market intel
ALTER TABLE public.economic_calendar_event
  ADD COLUMN IF NOT EXISTS event_date_tz TIMESTAMPTZ GENERATED ALWAYS AS (event_date) STORED;
