-- Migration 00053: make market_candle cache project-scoped
-- The old UNIQUE(symbol, timeframe, open_time) made cross-project cache
-- inserts collide silently (RLS also requires project_id on every row,
-- so cache writes never persisted). Drop it and key uniqueness on
-- (project_id, symbol, timeframe, open_time).

ALTER TABLE public.market_candle
  DROP CONSTRAINT IF EXISTS market_candle_symbol_timeframe_open_time_key;

ALTER TABLE public.market_candle
  ADD CONSTRAINT market_candle_project_symbol_timeframe_open_time_key
  UNIQUE (project_id, symbol, timeframe, open_time);
