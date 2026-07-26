-- Migration 00011: Strategy, Knowledge Rule, and remaining entity tables
-- Tables that exist in SQLAlchemy models but were missing from Supabase schema

-- ============= STRATEGY =============
CREATE TABLE IF NOT EXISTS public.strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT,
  category TEXT,
  description TEXT,
  market TEXT,
  instrument_types JSONB DEFAULT '[]'::jsonb,
  timeframes JSONB DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'draft',
  market_bias TEXT,
  entry_conditions JSONB DEFAULT '{}'::jsonb,
  confirmation_rules JSONB DEFAULT '{}'::jsonb,
  invalidation_rules JSONB DEFAULT '{}'::jsonb,
  exit_rules JSONB DEFAULT '{}'::jsonb,
  risk_rules JSONB DEFAULT '{}'::jsonb,
  entry_model TEXT,
  stop_loss_model TEXT,
  take_profit_model TEXT,
  partial_close_rules JSONB DEFAULT '[]'::jsonb,
  trade_management_rules JSONB DEFAULT '{}'::jsonb,
  preferred_sessions JSONB DEFAULT '[]'::jsonb,
  preferred_market_conditions JSONB DEFAULT '[]'::jsonb,
  volatility_requirements TEXT,
  news_restrictions TEXT,
  required_mindset TEXT,
  discipline_rules TEXT,
  common_mistakes TEXT,
  things_to_avoid TEXT,
  checklist_items JSONB DEFAULT '[]'::jsonb,
  documentation TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  author TEXT,
  change_log TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_project_id ON public.strategy(project_id);
CREATE INDEX IF NOT EXISTS idx_strategy_deleted_at ON public.strategy(deleted_at);

ALTER TABLE public.strategy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project strategies"
  ON public.strategy FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Users can insert own project strategies"
  ON public.strategy FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own project strategies"
  ON public.strategy FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Users can soft-delete own project strategies"
  ON public.strategy FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE TRIGGER set_strategy_updated_at
  BEFORE UPDATE ON public.strategy
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============= KNOWLEDGE_RULE =============
CREATE TABLE IF NOT EXISTS public.knowledge_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  condition JSONB DEFAULT '{}'::jsonb,
  action JSONB DEFAULT '{}'::jsonb,
  confidence DOUBLE PRECISION DEFAULT 0,
  occurrences INTEGER DEFAULT 0,
  win_rate DOUBLE PRECISION DEFAULT 0,
  expectancy DOUBLE PRECISION DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_rule_project_id ON public.knowledge_rule(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_rule_category ON public.knowledge_rule(category);

ALTER TABLE public.knowledge_rule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project knowledge rules"
  ON public.knowledge_rule FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own project knowledge rules"
  ON public.knowledge_rule FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own project knowledge rules"
  ON public.knowledge_rule FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own project knowledge rules"
  ON public.knowledge_rule FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE TRIGGER set_knowledge_rule_updated_at
  BEFORE UPDATE ON public.knowledge_rule
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
