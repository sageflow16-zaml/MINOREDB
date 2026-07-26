-- Migration 00012: Risk, Pattern, Trader Intelligence tables

-- ============= RISK =============
CREATE TABLE IF NOT EXISTS public.risk_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT,
  rule_type TEXT,
  description TEXT,
  limit_value NUMERIC,
  current_value NUMERIC,
  is_active BOOLEAN DEFAULT true,
  severity TEXT DEFAULT 'medium',
  rule_config JSONB DEFAULT '{}'::jsonb,
  last_triggered_at TIMESTAMPTZ,
  violation_count INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risk_rule_project ON public.risk_rule(project_id);

CREATE TABLE IF NOT EXISTS public.risk_alert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  alert_type TEXT,
  severity TEXT DEFAULT 'info',
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risk_alert_project ON public.risk_alert(project_id);

CREATE TABLE IF NOT EXISTS public.risk_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  account_balance NUMERIC,
  equity NUMERIC,
  daily_pnl NUMERIC,
  weekly_pnl NUMERIC,
  monthly_pnl NUMERIC,
  current_risk_percent NUMERIC,
  open_risk NUMERIC,
  closed_risk NUMERIC,
  available_risk NUMERIC,
  daily_risk_remaining NUMERIC,
  max_drawdown NUMERIC,
  current_drawdown NUMERIC,
  recovery_progress NUMERIC,
  open_positions INTEGER DEFAULT 0,
  total_exposure NUMERIC,
  exposure_json JSONB DEFAULT '{}'::jsonb,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risk_snapshot_project ON public.risk_snapshot(project_id);

CREATE TABLE IF NOT EXISTS public.trade_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  status TEXT,
  pair TEXT,
  direction TEXT,
  entry_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  position_size NUMERIC,
  risk_percent NUMERIC,
  validation_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_validation_project ON public.trade_validation(project_id);

-- ============= PATTERN =============
CREATE TABLE IF NOT EXISTS public.pattern (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  signature JSONB DEFAULT '{}'::jsonb,
  total_occurrences INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  breakevens INTEGER DEFAULT 0,
  win_rate NUMERIC,
  average_rr NUMERIC,
  expectancy NUMERIC,
  profit_factor NUMERIC,
  average_duration INTERVAL,
  avg_win NUMERIC,
  avg_loss NUMERIC,
  confidence_score NUMERIC,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pattern_project ON public.pattern(project_id);
CREATE INDEX IF NOT EXISTS idx_pattern_name ON public.pattern(project_id, name);

CREATE TABLE IF NOT EXISTS public.pattern_trade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  pattern_id UUID NOT NULL REFERENCES public.pattern(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trade(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pattern_trade_pattern ON public.pattern_trade(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_trade_trade ON public.pattern_trade(trade_id);

-- ============= TRADER INTELLIGENCE =============
CREATE TABLE IF NOT EXISTS public.trade_debrief (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  trade_id UUID UNIQUE REFERENCES public.trade(id) ON DELETE CASCADE,
  entry_review TEXT,
  execution_review TEXT,
  exit_review TEXT,
  psychology_review TEXT,
  lessons_learned TEXT,
  strengths TEXT,
  weaknesses TEXT,
  mistakes TEXT,
  improvements TEXT,
  overall_rating INTEGER,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_debrief_project ON public.trade_debrief(project_id);

CREATE TABLE IF NOT EXISTS public.personal_pattern (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  signature JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  trade_ids JSONB DEFAULT '[]'::jsonb,
  occurrence_count INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  total_pnl NUMERIC,
  avg_rr NUMERIC,
  confidence NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);
CREATE INDEX IF NOT EXISTS idx_personal_pattern_project ON public.personal_pattern(project_id);

CREATE TABLE IF NOT EXISTS public.personal_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  evidence TEXT,
  supporting_stats JSONB DEFAULT '{}'::jsonb,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_personal_rule_project ON public.personal_rule(project_id);

CREATE TABLE IF NOT EXISTS public.personal_rule_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.personal_rule(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  evidence TEXT,
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rule_id, version)
);

CREATE TABLE IF NOT EXISTS public.trader_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  trading_habits JSONB DEFAULT '[]'::jsonb,
  discipline_score NUMERIC,
  rule_adherence NUMERIC,
  performance_trends JSONB DEFAULT '{}'::jsonb,
  total_trades_analyzed INTEGER DEFAULT 0,
  total_debriefs INTEGER DEFAULT 0,
  active_patterns INTEGER DEFAULT 0,
  approved_rules INTEGER DEFAULT 0,
  improvement_suggestions JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trader_profile_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  discipline_score NUMERIC,
  rule_adherence NUMERIC,
  total_trades_analyzed INTEGER DEFAULT 0,
  total_debriefs INTEGER DEFAULT 0,
  active_patterns INTEGER DEFAULT 0,
  approved_rules INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_trader_profile_snapshot_project ON public.trader_profile_snapshot(project_id);

-- RLS policies
ALTER TABLE public.risk_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_trade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_debrief ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_pattern ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_rule_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_profile_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project risk_rules" ON public.risk_rule FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own project risk_rules" ON public.risk_rule FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own project risk_alerts" ON public.risk_alert FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own project risk_alerts" ON public.risk_alert FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own project risk_snapshots" ON public.risk_snapshot FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own project risk_snapshots" ON public.risk_snapshot FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own project validations" ON public.trade_validation FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own project validations" ON public.trade_validation FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own project patterns" ON public.pattern FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own project patterns" ON public.pattern FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own project pattern_trades" ON public.pattern_trade FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own project pattern_trades" ON public.pattern_trade FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own project debriefs" ON public.trade_debrief FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own project debriefs" ON public.trade_debrief FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own project personal_patterns" ON public.personal_pattern FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own project personal_patterns" ON public.personal_pattern FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own project personal_rules" ON public.personal_rule FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own project personal_rules" ON public.personal_rule FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own project rule_versions" ON public.personal_rule_version FOR SELECT USING (
  rule_id IN (SELECT id FROM public.personal_rule WHERE project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can manage own project rule_versions" ON public.personal_rule_version FOR ALL USING (
  rule_id IN (SELECT id FROM public.personal_rule WHERE project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can view own trader_profile" ON public.trader_profile FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own trader_profile" ON public.trader_profile FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own profile_snapshots" ON public.trader_profile_snapshot FOR SELECT USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own profile_snapshots" ON public.trader_profile_snapshot FOR ALL USING (
  project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
);
