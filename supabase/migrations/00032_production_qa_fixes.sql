-- Migration 00032: Production QA fixes
-- 1. Add market_phase column to trade table
-- 2. Fix get_risk_dashboard RPC to return all frontend-required fields
-- 3. Add RLS policies for collector tables (known to exist with project_id)
-- 4. Create missing tables + RLS + indices

-- ============= 1. ADD market_phase TO trade =============
ALTER TABLE IF EXISTS public.trade
  ADD COLUMN IF NOT EXISTS market_phase TEXT;

CREATE INDEX IF NOT EXISTS idx_trade_market_phase ON public.trade(market_phase);

-- ============= 2. FIX get_risk_dashboard RPC =============
CREATE OR REPLACE FUNCTION public.get_risk_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSONB;
  v_snap record;
  v_active_alerts INTEGER;
  v_rule_violations INTEGER;
  v_exposure_json JSONB;
BEGIN
  SELECT * INTO v_snap FROM public.risk_snapshot
  WHERE project_id = p_project_id
  ORDER BY snapshot_date DESC LIMIT 1;

  SELECT COUNT(*) INTO v_active_alerts
  FROM public.risk_alert
  WHERE project_id = p_project_id AND is_dismissed = false;

  SELECT COUNT(*) INTO v_rule_violations
  FROM public.risk_rule
  WHERE project_id = p_project_id AND is_active = true AND violation_count > 0;

  v_exposure_json := COALESCE(v_snap.exposure_json, '{}'::jsonb);

  v_result := JSONB_BUILD_OBJECT(
    'account_balance', COALESCE(v_snap.account_balance, 0),
    'equity', COALESCE(v_snap.equity, 0),
    'daily_pnl', COALESCE(v_snap.daily_pnl, 0),
    'weekly_pnl', COALESCE(v_snap.weekly_pnl, 0),
    'monthly_pnl', COALESCE(v_snap.monthly_pnl, 0),
    'current_risk_percent', COALESCE(v_snap.current_risk_percent, 0),
    'open_risk', COALESCE(v_snap.open_risk, 0),
    'closed_risk', COALESCE(v_snap.closed_risk, 0),
    'available_risk', COALESCE(v_snap.available_risk, 0),
    'daily_risk_remaining', COALESCE(v_snap.daily_risk_remaining, 0),
    'max_drawdown', COALESCE(v_snap.max_drawdown, 0),
    'current_drawdown', COALESCE(v_snap.current_drawdown, 0),
    'recovery_progress', COALESCE(v_snap.recovery_progress, 0),
    'open_positions', COALESCE(v_snap.open_positions, 0),
    'total_exposure', COALESCE(v_snap.total_exposure, 0),
    'active_alerts', v_active_alerts,
    'rule_violations', v_rule_violations,
    'exposure', JSONB_BUILD_OBJECT(
      'by_pair', COALESCE(v_exposure_json->'by_pair', '[]'::jsonb),
      'by_direction', COALESCE(v_exposure_json->'by_direction', '[]'::jsonb),
      'max_single_exposure', COALESCE((v_exposure_json->>'max_single_exposure')::NUMERIC, 0),
      'correlation_risk', COALESCE((v_exposure_json->>'correlation_risk')::NUMERIC, 0)
    )
  );
  RETURN v_result;
END;
$$;

-- ============= 3. RLS POLICIES FOR EXISTING COLLECTOR TABLES =============
-- These tables exist and have project_id; add policy only if column exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='collector_status' AND column_name='project_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='collector_status' AND policyname='project_access') THEN
      CREATE POLICY project_access ON public.collector_status FOR ALL USING (
        project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
      );
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='collector_log' AND column_name='project_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='collector_log' AND policyname='project_access') THEN
      CREATE POLICY project_access ON public.collector_log FOR ALL USING (
        project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
      );
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='collector_schedule' AND column_name='project_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='collector_schedule' AND policyname='project_access') THEN
      CREATE POLICY project_access ON public.collector_schedule FOR ALL USING (
        project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
      );
    END IF;
  END IF;
END $$;

-- ============= 4. CREATE MISSING TABLES + RLS =============

-- knowledge_category
CREATE TABLE IF NOT EXISTS public.knowledge_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT, icon TEXT, color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, slug)
);
ALTER TABLE IF EXISTS public.knowledge_category ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='knowledge_category' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.knowledge_category FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- knowledge_concept
CREATE TABLE IF NOT EXISTS public.knowledge_concept (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.knowledge_category(id) ON DELETE CASCADE,
  title TEXT NOT NULL, slug TEXT NOT NULL,
  summary TEXT, definition TEXT, purpose TEXT, market_context TEXT,
  rules JSONB DEFAULT '[]'::jsonb,
  conditions TEXT, confirmations TEXT, invalidations TEXT,
  common_mistakes TEXT, best_practices TEXT,
  difficulty TEXT, confidence NUMERIC,
  status TEXT DEFAULT 'draft', reviewed BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, slug)
);
ALTER TABLE IF EXISTS public.knowledge_concept ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='knowledge_concept' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.knowledge_concept FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- knowledge_relationship
CREATE TABLE IF NOT EXISTS public.knowledge_relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  source_concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  target_concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  relationship_type TEXT, label TEXT, strength NUMERIC DEFAULT 0, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.knowledge_relationship ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='knowledge_relationship' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.knowledge_relationship FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- knowledge_example
CREATE TABLE IF NOT EXISTS public.knowledge_example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  title TEXT, description TEXT, entry_conditions TEXT,
  chart_image TEXT, pnl NUMERIC, rr NUMERIC, result TEXT, lessons TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.knowledge_example ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='knowledge_example' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.knowledge_example FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- knowledge_reference
CREATE TABLE IF NOT EXISTS public.knowledge_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.knowledge_concept(id) ON DELETE CASCADE,
  title TEXT, url TEXT, source TEXT, description TEXT, reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.knowledge_reference ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='knowledge_reference' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.knowledge_reference FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- checklist_execution
CREATE TABLE IF NOT EXISTS public.checklist_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.checklist_template(id) ON DELETE SET NULL,
  title TEXT, items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending', completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.checklist_execution ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='checklist_execution' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.checklist_execution FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- webhook_log
CREATE TABLE IF NOT EXISTS public.webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID, source TEXT, event_type TEXT, status TEXT,
  payload JSONB DEFAULT '{}'::jsonb, response JSONB DEFAULT '{}'::jsonb,
  error TEXT, ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.webhook_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='webhook_log' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.webhook_log FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- replay_session
CREATE TABLE IF NOT EXISTS public.replay_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT, symbol TEXT, timeframe TEXT, status TEXT DEFAULT 'created',
  current_index INTEGER DEFAULT 0, total_candles INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ, end_date TIMESTAMPTZ, speed INTEGER DEFAULT 1,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.replay_session ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='replay_session' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.replay_session FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- replay_trade
CREATE TABLE IF NOT EXISTS public.replay_trade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.replay_session(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trade(id) ON DELETE SET NULL,
  entry_index INTEGER, exit_index INTEGER, direction TEXT,
  entry_price NUMERIC, exit_price NUMERIC, stop_loss NUMERIC,
  take_profit NUMERIC, position_size NUMERIC, profit NUMERIC,
  result TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.replay_trade ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='replay_trade' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.replay_trade FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- coaching_session
CREATE TABLE IF NOT EXISTS public.coaching_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_type TEXT,
  session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start TIMESTAMPTZ, period_end TIMESTAMPTZ,
  summary TEXT,
  key_findings JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  score NUMERIC,
  metrics_snapshot JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.coaching_session ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coaching_session' AND policyname='project_access') THEN
    CREATE POLICY project_access ON public.coaching_session FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============= INDICES =============
CREATE INDEX IF NOT EXISTS idx_knowledge_category_project ON public.knowledge_category(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_concept_project ON public.knowledge_concept(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_concept_category ON public.knowledge_concept(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationship_project ON public.knowledge_relationship(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationship_source ON public.knowledge_relationship(source_concept_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationship_target ON public.knowledge_relationship(target_concept_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_example_project ON public.knowledge_example(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_example_concept ON public.knowledge_example(concept_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_reference_project ON public.knowledge_reference(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_reference_concept ON public.knowledge_reference(concept_id);
CREATE INDEX IF NOT EXISTS idx_checklist_execution_project ON public.checklist_execution(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_created ON public.webhook_log(created_at);
CREATE INDEX IF NOT EXISTS idx_replay_session_project ON public.replay_session(project_id);
CREATE INDEX IF NOT EXISTS idx_replay_trade_session ON public.replay_trade(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_session_project ON public.coaching_session(project_id);
