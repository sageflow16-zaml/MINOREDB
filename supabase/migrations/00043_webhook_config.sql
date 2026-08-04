-- Migration 00043: TradingView webhook configuration
-- Per-project shared secret so TradingView alerts (which cannot send custom
-- headers or JSON) can be authenticated via a ?secret= query param.
CREATE TABLE IF NOT EXISTS public.webhook_config (
  project_id UUID PRIMARY KEY REFERENCES public.project(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.webhook_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_config' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.webhook_config FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
