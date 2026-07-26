-- Migration 00014: Market Intelligence, Macro, TradingView tables

-- ============= MARKET INTELLIGENCE =============
CREATE TABLE IF NOT EXISTS public.economic_calendar_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  event_date TIMESTAMPTZ,
  title TEXT,
  country TEXT,
  category TEXT,
  importance INTEGER DEFAULT 0,
  actual NUMERIC,
  forecast NUMERIC,
  previous NUMERIC,
  description TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_economic_calendar_project ON public.economic_calendar_event(project_id);
CREATE INDEX IF NOT EXISTS idx_economic_calendar_date ON public.economic_calendar_event(event_date);

CREATE TABLE IF NOT EXISTS public.market_regime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  regime_type TEXT,
  symbol TEXT,
  timeframe TEXT,
  direction TEXT,
  strength NUMERIC,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_regime_project ON public.market_regime(project_id);
CREATE INDEX IF NOT EXISTS idx_market_regime_active ON public.market_regime(is_active);

CREATE TABLE IF NOT EXISTS public.correlation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  symbol_a TEXT NOT NULL,
  symbol_b TEXT NOT NULL,
  correlation NUMERIC,
  timeframe TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, symbol_a, symbol_b, timeframe)
);
CREATE INDEX IF NOT EXISTS idx_correlation_project ON public.correlation_data(project_id);

CREATE TABLE IF NOT EXISTS public.liquidity_level (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  level_type TEXT,
  price NUMERIC,
  volume NUMERIC,
  is_swept BOOLEAN DEFAULT false,
  swept_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_liquidity_level_project ON public.liquidity_level(project_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_level_symbol ON public.liquidity_level(project_id, symbol);

CREATE TABLE IF NOT EXISTS public.market_structure_point (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  symbol TEXT,
  timeframe TEXT,
  point_type TEXT,
  price NUMERIC,
  volume NUMERIC,
  is_mitigated BOOLEAN DEFAULT false,
  mitigated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_structure_point_project ON public.market_structure_point(project_id);
CREATE INDEX IF NOT EXISTS idx_market_structure_point_symbol ON public.market_structure_point(project_id, symbol);

CREATE TABLE IF NOT EXISTS public.session_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_name TEXT,
  symbol TEXT,
  date DATE,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC,
  volume NUMERIC,
  range NUMERIC,
  bias TEXT,
  analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, session_name, symbol, date)
);
CREATE INDEX IF NOT EXISTS idx_session_analysis_project ON public.session_analysis(project_id);

CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_watchlist_project ON public.watchlist(project_id);

CREATE TABLE IF NOT EXISTS public.watchlist_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES public.watchlist(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  alias TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_watchlist_item_watchlist ON public.watchlist_item(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_item_project ON public.watchlist_item(project_id);

CREATE TABLE IF NOT EXISTS public.market_alert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  alert_type TEXT,
  symbol TEXT,
  condition TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_alert_project ON public.market_alert(project_id);

CREATE TABLE IF NOT EXISTS public.market_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  event_type TEXT,
  title TEXT,
  description TEXT,
  symbol TEXT,
  importance TEXT DEFAULT 'normal',
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_timeline_project ON public.market_timeline(project_id);
CREATE INDEX IF NOT EXISTS idx_market_timeline_time ON public.market_timeline(event_time);

CREATE TABLE IF NOT EXISTS public.market_data_provider (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, provider_name)
);
CREATE INDEX IF NOT EXISTS idx_market_data_provider_project ON public.market_data_provider(project_id);

CREATE TABLE IF NOT EXISTS public.market_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT,
  data_type TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_market_data_cache_project ON public.market_data_cache(project_id);
CREATE INDEX IF NOT EXISTS idx_market_data_cache_lookup ON public.market_data_cache(project_id, symbol, data_type);

-- ============= MACRO TABLES =============
CREATE TABLE IF NOT EXISTS public.macro_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date TIMESTAMPTZ,
  title TEXT,
  country TEXT,
  category TEXT,
  importance INTEGER DEFAULT 0,
  actual NUMERIC,
  forecast NUMERIC,
  previous NUMERIC,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_macro_event_date ON public.macro_event(event_date);
CREATE INDEX IF NOT EXISTS idx_macro_event_importance ON public.macro_event(importance);

CREATE TABLE IF NOT EXISTS public.market_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT,
  price NUMERIC,
  change_pct NUMERIC,
  volume NUMERIC,
  snapshot_type TEXT,
  snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_snapshot_time ON public.market_snapshot(snapshot_time);
CREATE INDEX IF NOT EXISTS idx_market_snapshot_symbol ON public.market_snapshot(symbol);

-- ============= TRADINGVIEW TABLES =============
CREATE TABLE IF NOT EXISTS public.market_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  event_type TEXT,
  symbol TEXT,
  timeframe TEXT,
  price NUMERIC,
  direction TEXT,
  raw_data JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_event_project ON public.market_event(project_id);
CREATE INDEX IF NOT EXISTS idx_market_event_type ON public.market_event(event_type);
CREATE INDEX IF NOT EXISTS idx_market_event_symbol ON public.market_event(symbol);

CREATE TABLE IF NOT EXISTS public.webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  source TEXT,
  event_type TEXT,
  status TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  response JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_log_created ON public.webhook_log(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_log_source ON public.webhook_log(source);

-- RLS policies
ALTER TABLE public.economic_calendar_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_regime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correlation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_structure_point ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_provider ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'economic_calendar_event' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.economic_calendar_event FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
