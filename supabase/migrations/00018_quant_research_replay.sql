-- Migration 00018: Quantitative Research and Market Replay tables

-- ============= QUANT RESEARCH =============
CREATE TABLE IF NOT EXISTS public.quant_experiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT,
  status TEXT DEFAULT 'draft',
  config JSONB DEFAULT '{}'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quant_experiment_project ON public.quant_experiment(project_id);

CREATE TABLE IF NOT EXISTS public.quant_backtest_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.quant_experiment(id) ON DELETE SET NULL,
  name TEXT,
  status TEXT DEFAULT 'pending',
  symbol TEXT,
  timeframe TEXT,
  strategy_config JSONB DEFAULT '{}'::jsonb,
  start_date DATE,
  end_date DATE,
  initial_capital NUMERIC DEFAULT 10000,
  total_trades INTEGER DEFAULT 0,
  win_rate NUMERIC,
  profit_factor NUMERIC,
  net_profit NUMERIC,
  max_drawdown NUMERIC,
  sharpe_ratio NUMERIC,
  total_return NUMERIC,
  metrics JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quant_backtest_experiment ON public.quant_backtest_run(experiment_id);
CREATE INDEX IF NOT EXISTS idx_quant_backtest_project ON public.quant_backtest_run(project_id);

CREATE TABLE IF NOT EXISTS public.quant_backtest_trade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  backtest_run_id UUID NOT NULL REFERENCES public.quant_backtest_run(id) ON DELETE CASCADE,
  entry_date TIMESTAMPTZ,
  exit_date TIMESTAMPTZ,
  direction TEXT,
  entry_price NUMERIC,
  exit_price NUMERIC,
  position_size NUMERIC,
  profit NUMERIC,
  profit_pct NUMERIC,
  rr_ratio NUMERIC,
  exit_reason TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quant_backtest_trade_run ON public.quant_backtest_trade(backtest_run_id);

CREATE TABLE IF NOT EXISTS public.quant_simulation_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.quant_experiment(id) ON DELETE SET NULL,
  backtest_run_id UUID REFERENCES public.quant_backtest_run(id) ON DELETE SET NULL,
  name TEXT,
  simulation_type TEXT,
  status TEXT DEFAULT 'pending',
  iterations INTEGER DEFAULT 1000,
  config JSONB DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  distribution JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quant_simulation_experiment ON public.quant_simulation_run(experiment_id);

CREATE TABLE IF NOT EXISTS public.quant_walk_forward_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.quant_experiment(id) ON DELETE SET NULL,
  name TEXT,
  status TEXT DEFAULT 'pending',
  symbol TEXT,
  timeframe TEXT,
  strategy_config JSONB DEFAULT '{}'::jsonb,
  window_size INTEGER DEFAULT 252,
  step_size INTEGER DEFAULT 63,
  results JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quant_walkforward_experiment ON public.quant_walk_forward_run(experiment_id);

CREATE TABLE IF NOT EXISTS public.quant_optimization_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.quant_experiment(id) ON DELETE SET NULL,
  name TEXT,
  status TEXT DEFAULT 'pending',
  symbol TEXT,
  timeframe TEXT,
  optimization_type TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  ranges JSONB DEFAULT '{}'::jsonb,
  metric_target TEXT,
  results JSONB DEFAULT '{}'::jsonb,
  best_params JSONB DEFAULT '{}'::jsonb,
  heatmap_data JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quant_optimization_experiment ON public.quant_optimization_run(experiment_id);

CREATE TABLE IF NOT EXISTS public.quant_edge_health_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.quant_experiment(id) ON DELETE SET NULL,
  metrics JSONB DEFAULT '{}'::jsonb,
  is_healthy BOOLEAN,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quant_edge_health_experiment ON public.quant_edge_health_snapshot(experiment_id);

CREATE TABLE IF NOT EXISTS public.quant_regime_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  backtest_run_id UUID NOT NULL REFERENCES public.quant_backtest_run(id) ON DELETE CASCADE,
  regime TEXT,
  trades INTEGER DEFAULT 0,
  win_rate NUMERIC,
  avg_return NUMERIC,
  sharpe NUMERIC,
  max_drawdown NUMERIC,
  metrics JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_quant_regime_perf_backtest ON public.quant_regime_performance(backtest_run_id);

CREATE TABLE IF NOT EXISTS public.quant_research_notebook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.quant_experiment(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quant_notebook_experiment ON public.quant_research_notebook(experiment_id);

CREATE TABLE IF NOT EXISTS public.quant_hypothesis_test (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.quant_experiment(id) ON DELETE SET NULL,
  hypothesis TEXT,
  null_hypothesis TEXT,
  test_type TEXT,
  significance_level NUMERIC DEFAULT 0.05,
  test_statistic NUMERIC,
  p_value NUMERIC,
  result TEXT,
  conclusion TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quant_hypothesis_experiment ON public.quant_hypothesis_test(experiment_id);

-- ============= REPLAY =============
CREATE TABLE IF NOT EXISTS public.market_candle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  open_time TIMESTAMPTZ NOT NULL,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC,
  volume NUMERIC,
  UNIQUE(symbol, timeframe, open_time)
);
CREATE INDEX IF NOT EXISTS idx_market_candle_lookup ON public.market_candle(symbol, timeframe, open_time);

CREATE TABLE IF NOT EXISTS public.replay_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name TEXT,
  symbol TEXT,
  timeframe TEXT,
  status TEXT DEFAULT 'created',
  current_index INTEGER DEFAULT 0,
  total_candles INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  speed INTEGER DEFAULT 1,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replay_session_project ON public.replay_session(project_id);

CREATE TABLE IF NOT EXISTS public.replay_trade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.replay_session(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trade(id) ON DELETE SET NULL,
  entry_index INTEGER,
  exit_index INTEGER,
  direction TEXT,
  entry_price NUMERIC,
  exit_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  position_size NUMERIC,
  profit NUMERIC,
  result TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replay_trade_session ON public.replay_trade(session_id);

CREATE TABLE IF NOT EXISTS public.replay_bookmark (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.replay_session(id) ON DELETE CASCADE,
  candle_index INTEGER NOT NULL,
  label TEXT,
  notes TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replay_bookmark_session ON public.replay_bookmark(session_id);

CREATE TABLE IF NOT EXISTS public.replay_annotation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.replay_session(id) ON DELETE CASCADE,
  candle_index INTEGER NOT NULL,
  content TEXT,
  annotation_type TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replay_annotation_session ON public.replay_annotation(session_id);

CREATE TABLE IF NOT EXISTS public.replay_timeline_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.replay_session(id) ON DELETE CASCADE,
  candle_index INTEGER NOT NULL,
  event_type TEXT,
  title TEXT,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replay_timeline_session ON public.replay_timeline_event(session_id);

CREATE TABLE IF NOT EXISTS public.replay_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_id UUID UNIQUE NOT NULL REFERENCES public.replay_session(id) ON DELETE CASCADE,
  content TEXT,
  rating INTEGER,
  strengths TEXT,
  weaknesses TEXT,
  lessons TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.replay_mistake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.replay_session(id) ON DELETE CASCADE,
  mistake_type TEXT,
  description TEXT,
  severity TEXT DEFAULT 'medium',
  lesson TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replay_mistake_session ON public.replay_mistake(session_id);

CREATE TABLE IF NOT EXISTS public.replay_screenshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.replay_session(id) ON DELETE CASCADE,
  candle_index INTEGER,
  image_url TEXT,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replay_screenshot_session ON public.replay_screenshot(session_id);

-- RLS
ALTER TABLE public.quant_experiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_backtest_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_backtest_trade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_simulation_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_walk_forward_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_optimization_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_edge_health_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_regime_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_research_notebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_hypothesis_test ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_trade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_bookmark ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_annotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_timeline_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_mistake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_screenshot ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'quant_experiment' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.quant_experiment FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
