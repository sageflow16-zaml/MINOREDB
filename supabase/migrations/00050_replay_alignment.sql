-- Migration 00050: replay schema alignment with frontend contracts
ALTER TABLE public.replay_trade
  ADD COLUMN IF NOT EXISTS candle_index INTEGER,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS risk_percent NUMERIC;

ALTER TABLE public.replay_review
  ADD COLUMN IF NOT EXISTS went_well TEXT,
  ADD COLUMN IF NOT EXISTS went_wrong TEXT,
  ADD COLUMN IF NOT EXISTS rule_violations TEXT,
  ADD COLUMN IF NOT EXISTS execution_quality TEXT,
  ADD COLUMN IF NOT EXISTS risk_management TEXT,
  ADD COLUMN IF NOT EXISTS psychology TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC,
  ADD COLUMN IF NOT EXISTS trade_grade TEXT,
  ADD COLUMN IF NOT EXISTS discipline_score NUMERIC,
  ADD COLUMN IF NOT EXISTS completed_checklist JSONB,
  ADD COLUMN IF NOT EXISTS missed_checklist JSONB,
  ADD COLUMN IF NOT EXISTS rule_compliance NUMERIC;

ALTER TABLE public.replay_mistake
  ADD COLUMN IF NOT EXISTS recommendation TEXT,
  ADD COLUMN IF NOT EXISTS preventable BOOLEAN,
  ADD COLUMN IF NOT EXISTS candle_index INTEGER;

ALTER TABLE public.replay_screenshot
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS caption TEXT;

CREATE INDEX IF NOT EXISTS idx_replay_trade_session_index ON public.replay_trade(session_id, candle_index);
