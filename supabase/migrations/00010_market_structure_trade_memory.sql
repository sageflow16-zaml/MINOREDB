-- Migration 00010: Market Structure and Trade Memory tables
-- Tables referenced by existing SQLAlchemy models but missing from Supabase migrations

-- ============= MARKET_STRUCTURE =============
CREATE TABLE IF NOT EXISTS public.market_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trade(id) ON DELETE SET NULL,
  date DATE,
  pair TEXT,
  timeframe TEXT,
  weekly_bias TEXT,
  daily_bias TEXT,
  h4_bias TEXT,
  market_phase TEXT,
  trend TEXT,
  premium_discount TEXT,
  external_liquidity TEXT,
  internal_liquidity TEXT,
  equal_highs TEXT,
  equal_lows TEXT,
  buy_side_liquidity TEXT,
  sell_side_liquidity TEXT,
  bos TEXT,
  mss TEXT,
  choch TEXT,
  order_block TEXT,
  breaker TEXT,
  mitigation TEXT,
  fvg TEXT,
  ifvg TEXT,
  asian_high DOUBLE PRECISION,
  asian_low DOUBLE PRECISION,
  london_open DOUBLE PRECISION,
  newyork_open DOUBLE PRECISION,
  london_killzone TEXT,
  newyork_killzone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_structure_project_id ON public.market_structure(project_id);
CREATE INDEX IF NOT EXISTS idx_market_structure_trade_id ON public.market_structure(trade_id);
CREATE INDEX IF NOT EXISTS idx_market_structure_pair ON public.market_structure(pair);

ALTER TABLE public.market_structure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project market structures"
  ON public.market_structure FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own project market structures"
  ON public.market_structure FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own project market structures"
  ON public.market_structure FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own project market structures"
  ON public.market_structure FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE TRIGGER set_market_structure_updated_at
  BEFORE UPDATE ON public.market_structure
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============= TRADE_MEMORY =============
CREATE TABLE IF NOT EXISTS public.trade_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trade(id) ON DELETE CASCADE UNIQUE,
  pair TEXT,
  direction TEXT,
  session TEXT,
  weekly_bias TEXT,
  daily_bias TEXT,
  h4_bias TEXT,
  market_phase TEXT,
  market_trend TEXT,
  entry_model TEXT,
  liquidity_type TEXT,
  execution_model TEXT,
  risk_percent DOUBLE PRECISION,
  rr DOUBLE PRECISION,
  pnl DOUBLE PRECISION,
  result TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  mistakes JSONB DEFAULT '[]'::jsonb,
  lessons JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  confidence DOUBLE PRECISION,
  pattern_match DOUBLE PRECISION,
  similarity_score DOUBLE PRECISION,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_memory_project_id ON public.trade_memory(project_id);
CREATE INDEX IF NOT EXISTS idx_trade_memory_trade_id ON public.trade_memory(trade_id);

ALTER TABLE public.trade_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project trade memories"
  ON public.trade_memory FOR SELECT
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own project trade memories"
  ON public.trade_memory FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own project trade memories"
  ON public.trade_memory FOR UPDATE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own project trade memories"
  ON public.trade_memory FOR DELETE
  USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
