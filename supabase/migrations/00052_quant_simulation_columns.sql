ALTER TABLE public.quant_simulation_run
  ADD COLUMN IF NOT EXISTS percentiles JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS equity_curves JSONB DEFAULT '{}'::jsonb;
