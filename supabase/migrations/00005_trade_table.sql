-- Migration 00005: Trade table
-- Core trading journal data model

-- ============= UPDATED_AT TRIGGER =============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============= TRADE TABLE =============
CREATE TABLE IF NOT EXISTS public.trade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  strategy_id UUID,                          -- FK → public.strategy (not yet migrated)
  market_structure_id UUID,                  -- FK → public.market_structure (not yet migrated)
  pair TEXT,
  direction TEXT,                            -- "BUY" | "SELL"
  entry_price DOUBLE PRECISION,
  stop_loss DOUBLE PRECISION,
  take_profit DOUBLE PRECISION,
  exit_price DOUBLE PRECISION,
  position_size DOUBLE PRECISION,
  risk_percent DOUBLE PRECISION,
  rr DOUBLE PRECISION,
  pnl DOUBLE PRECISION,
  commission DOUBLE PRECISION,
  swap DOUBLE PRECISION,
  result TEXT,                               -- "WIN" | "LOSS" | "BREAKEVEN"
  status TEXT,                               -- "OPEN" | "CLOSED" | "PENDING"
  broker_name TEXT,
  timeframe TEXT,                            -- "M1","M5","M15","H1","H4","D1","W1"
  open_time TIMESTAMPTZ,
  close_time TIMESTAMPTZ,
  tags JSONB DEFAULT '[]'::jsonb,
  weekly_bias TEXT,
  daily_bias TEXT,
  h4_bias TEXT,
  liquidity_sweep TEXT,
  bos TEXT,
  mss TEXT,
  order_block TEXT,
  fvg TEXT,
  asian_session TEXT,
  london_session TEXT,
  newyork_session TEXT,
  dxy TEXT,
  us10y TEXT,
  us02y TEXT,
  news_event TEXT,
  emotion TEXT,
  notes TEXT,
  before_image TEXT,
  after_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- ============= INDEXES =============
-- Core query: list all non-deleted trades for a project, sorted by recency
CREATE INDEX IF NOT EXISTS idx_trade_project_active
  ON public.trade(project_id, deleted_at, created_at DESC);

-- Filtering/sorting individual columns
CREATE INDEX IF NOT EXISTS idx_trade_created_at ON public.trade(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_status ON public.trade(status);
CREATE INDEX IF NOT EXISTS idx_trade_result ON public.trade(result);
CREATE INDEX IF NOT EXISTS idx_trade_pair ON public.trade(pair);
CREATE INDEX IF NOT EXISTS idx_trade_deleted_at ON public.trade(deleted_at);
CREATE INDEX IF NOT EXISTS idx_trade_open_time ON public.trade(open_time DESC);
CREATE INDEX IF NOT EXISTS idx_trade_close_time ON public.trade(close_time DESC);

-- ============= UPDATED_AT TRIGGER =============
CREATE TRIGGER set_trade_updated_at
  BEFORE UPDATE ON public.trade
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= ROW LEVEL SECURITY =============
ALTER TABLE public.trade ENABLE ROW LEVEL SECURITY;

-- Users can view non-deleted trades in their projects
CREATE POLICY "Users can view own project trades"
  ON public.trade FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Users can create trades in their projects
CREATE POLICY "Users can insert trades"
  ON public.trade FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

-- Users can update trades in their projects (includes soft-delete via deleted_at)
CREATE POLICY "Users can update own project trades"
  ON public.trade FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
