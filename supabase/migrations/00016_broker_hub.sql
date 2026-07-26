-- Migration 00016: Broker Integration Hub tables

-- ============= BROKER HUB =============
CREATE TABLE IF NOT EXISTS public.broker_connection_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  label TEXT,
  status TEXT DEFAULT 'disconnected',
  credentials_encrypted TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_connected_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broker_connection_project ON public.broker_connection_new(project_id);
CREATE INDEX IF NOT EXISTS idx_broker_connection_provider ON public.broker_connection_new(project_id, provider);

CREATE TABLE IF NOT EXISTS public.broker_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.broker_connection_new(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  external_id TEXT,
  name TEXT,
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
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broker_account_connection ON public.broker_account(connection_id);
CREATE INDEX IF NOT EXISTS idx_broker_account_project ON public.broker_account(project_id);

CREATE TABLE IF NOT EXISTS public.sync_history_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.broker_connection_new(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.broker_account(id) ON DELETE SET NULL,
  sync_type TEXT,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds NUMERIC,
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_duplicates INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sync_history_connection ON public.sync_history_new(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_project ON public.sync_history_new(project_id);

CREATE TABLE IF NOT EXISTS public.broker_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.broker_connection_new(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'info',
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broker_log_connection ON public.broker_log(connection_id);

CREATE TABLE IF NOT EXISTS public.broker_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.broker_connection_new(id) ON DELETE CASCADE,
  is_reachable BOOLEAN,
  latency_ms NUMERIC,
  last_check_at TIMESTAMPTZ,
  error_message TEXT,
  uptime_percentage NUMERIC,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, connection_id)
);

CREATE TABLE IF NOT EXISTS public.imported_trade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.broker_connection_new(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.broker_account(id) ON DELETE SET NULL,
  strategy_id UUID REFERENCES public.strategy(id) ON DELETE SET NULL,
  external_id TEXT,
  symbol TEXT,
  trade_type TEXT,
  volume NUMERIC,
  open_price NUMERIC,
  close_price NUMERIC,
  open_time TIMESTAMPTZ,
  close_time TIMESTAMPTZ,
  profit NUMERIC,
  commission NUMERIC,
  swap NUMERIC,
  magic_number INTEGER,
  comment TEXT,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  is_duplicate BOOLEAN DEFAULT false,
  import_hash TEXT,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imported_trade_connection ON public.imported_trade(connection_id);
CREATE INDEX IF NOT EXISTS idx_imported_trade_project ON public.imported_trade(project_id);
CREATE INDEX IF NOT EXISTS idx_imported_trade_external ON public.imported_trade(external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_imported_trade_hash ON public.imported_trade(import_hash) WHERE import_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.broker_position (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.broker_connection_new(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.broker_account(id) ON DELETE CASCADE,
  external_id TEXT,
  symbol TEXT,
  position_type TEXT,
  volume NUMERIC,
  open_price NUMERIC,
  current_price NUMERIC,
  open_time TIMESTAMPTZ,
  profit NUMERIC,
  commission NUMERIC,
  swap NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  magic_number INTEGER,
  comment TEXT,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broker_position_account ON public.broker_position(account_id);

CREATE TABLE IF NOT EXISTS public.broker_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.broker_connection_new(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.broker_account(id) ON DELETE CASCADE,
  external_id TEXT,
  symbol TEXT,
  order_type TEXT,
  order_status TEXT,
  volume NUMERIC,
  price NUMERIC,
  stop_price NUMERIC,
  created_time TIMESTAMPTZ,
  expiration TIMESTAMPTZ,
  comment TEXT,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broker_order_account ON public.broker_order(account_id);

CREATE TABLE IF NOT EXISTS public.broker_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.broker_connection_new(id) ON DELETE CASCADE,
  total_trades INTEGER DEFAULT 0,
  total_profit NUMERIC,
  total_commission NUMERIC,
  total_swap NUMERIC,
  avg_spread NUMERIC,
  avg_execution_ms NUMERIC,
  avg_slippage NUMERIC,
  rejected_orders INTEGER DEFAULT 0,
  latency_avg_ms NUMERIC,
  uptime_pct NUMERIC,
  error_rate NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, connection_id)
);

-- RLS
ALTER TABLE public.broker_connection_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_trade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_position ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_analytics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'broker_connection_new' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.broker_connection_new FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
