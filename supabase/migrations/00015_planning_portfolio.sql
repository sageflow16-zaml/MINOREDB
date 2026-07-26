-- Migration 00015: Planning and Portfolio Management tables

-- ============= PLANNING =============
CREATE TABLE IF NOT EXISTS public.trading_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  plan_type TEXT,
  plan_date DATE,
  content TEXT,
  goals TEXT,
  pairs TEXT,
  risk_notes TEXT,
  status TEXT DEFAULT 'draft',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trading_plan_project ON public.trading_plan(project_id);
CREATE INDEX IF NOT EXISTS idx_trading_plan_date ON public.trading_plan(plan_date);

CREATE TABLE IF NOT EXISTS public.checklist_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checklist_template_project ON public.checklist_template(project_id);

CREATE TABLE IF NOT EXISTS public.checklist_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.checklist_template(id) ON DELETE SET NULL,
  title TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checklist_execution_project ON public.checklist_execution(project_id);

CREATE TABLE IF NOT EXISTS public.economic_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  event_date TIMESTAMPTZ,
  title TEXT,
  country TEXT,
  impact TEXT,
  actual TEXT,
  forecast TEXT,
  previous TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_economic_event_project ON public.economic_event(project_id);
CREATE INDEX IF NOT EXISTS idx_economic_event_date ON public.economic_event(event_date);

CREATE TABLE IF NOT EXISTS public.daily_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  content TEXT,
  lessons_learned TEXT,
  improvements TEXT,
  mood TEXT,
  energy_level INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, review_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_review_project ON public.daily_review(project_id);

CREATE TABLE IF NOT EXISTS public.goal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active',
  progress NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goal_project ON public.goal(project_id);

CREATE TABLE IF NOT EXISTS public.reminder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_time TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reminder_project ON public.reminder(project_id);
CREATE INDEX IF NOT EXISTS idx_reminder_time ON public.reminder(reminder_time);

CREATE TABLE IF NOT EXISTS public.calendar_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  event_type TEXT,
  color TEXT,
  is_all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calendar_event_project ON public.calendar_event(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_date ON public.calendar_event(event_date);

-- ============= PORTFOLIO =============
CREATE TABLE IF NOT EXISTS public.broker_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  broker_type TEXT,
  description TEXT,
  website TEXT,
  commission_structure TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broker_profile_project ON public.broker_profile(project_id);

CREATE TABLE IF NOT EXISTS public.account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  broker_profile_id UUID REFERENCES public.broker_profile(id) ON DELETE SET NULL,
  account_number TEXT,
  name TEXT NOT NULL,
  account_type TEXT,
  currency TEXT DEFAULT 'USD',
  leverage TEXT,
  balance NUMERIC DEFAULT 0,
  equity NUMERIC DEFAULT 0,
  open_pl NUMERIC DEFAULT 0,
  used_margin NUMERIC DEFAULT 0,
  free_margin NUMERIC DEFAULT 0,
  margin_level NUMERIC,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_account_project ON public.account(project_id);
CREATE INDEX IF NOT EXISTS idx_account_broker ON public.account(broker_profile_id);

CREATE TABLE IF NOT EXISTS public.account_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_account_group_project ON public.account_group(project_id);

CREATE TABLE IF NOT EXISTS public.funding_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.account(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  funding_type TEXT,
  notes TEXT,
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_funding_history_account ON public.funding_history(account_id);

CREATE TABLE IF NOT EXISTS public.balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.account(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL,
  record_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_balance_history_account ON public.balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_date ON public.balance_history(record_date);

CREATE TABLE IF NOT EXISTS public.equity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.account(id) ON DELETE CASCADE,
  equity NUMERIC NOT NULL,
  record_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_equity_history_account ON public.equity_history(account_id);
CREATE INDEX IF NOT EXISTS idx_equity_history_date ON public.equity_history(record_date);

CREATE TABLE IF NOT EXISTS public.portfolio_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.account(id) ON DELETE CASCADE,
  symbol TEXT,
  allocation_pct NUMERIC,
  amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_allocation_project ON public.portfolio_allocation(project_id);

CREATE TABLE IF NOT EXISTS public.transfer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES public.account(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.account(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  notes TEXT,
  transfer_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transfer_project ON public.transfer(project_id);

CREATE TABLE IF NOT EXISTS public.portfolio_goal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.account(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC,
  current_amount NUMERIC DEFAULT 0,
  target_date DATE,
  goal_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_goal_project ON public.portfolio_goal(project_id);

CREATE TABLE IF NOT EXISTS public.account_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  account_id UUID UNIQUE NOT NULL REFERENCES public.account(id) ON DELETE CASCADE,
  health_score NUMERIC,
  risk_level TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_account_health_project ON public.account_health(project_id);

CREATE TABLE IF NOT EXISTS public.account_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.account(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT,
  limit_value NUMERIC,
  current_value NUMERIC,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_account_rule_account ON public.account_rule(account_id);

CREATE TABLE IF NOT EXISTS public.account_note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.account(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  note_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_account_note_account ON public.account_note(account_id);

CREATE TABLE IF NOT EXISTS public.portfolio_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  total_balance NUMERIC,
  total_equity NUMERIC,
  total_open_pl NUMERIC,
  total_used_margin NUMERIC,
  total_free_margin NUMERIC,
  total_margin_level NUMERIC,
  account_summary JSONB DEFAULT '[]'::jsonb,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshot_project ON public.portfolio_snapshot(project_id);

-- RLS policies
ALTER TABLE public.trading_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_note ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshot ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'trading_plan' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.trading_plan FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
