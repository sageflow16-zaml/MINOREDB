-- Migration 00042: Fix collector data flow + close RLS gaps
-- 1. Add project_id to macro_event, market_snapshot, market_candle (collector inserts
--    were failing silently — column did not exist — and reporting fake success).
-- 2. Enable RLS + project policies on the 6 tables that had none:
--    macro_event, market_snapshot, market_candle, automation_workflow_template,
--    vault_statistics, sync_settings.

-- ============= 1. Add project_id to market tables =============

ALTER TABLE public.macro_event
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.project(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_macro_event_project ON public.macro_event(project_id);

ALTER TABLE public.market_snapshot
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.project(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_market_snapshot_project ON public.market_snapshot(project_id);

ALTER TABLE public.market_candle
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.project(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_market_candle_project ON public.market_candle(project_id);

-- ============= 2. Enable RLS + policies =============

-- macro_event (project-scoped)
ALTER TABLE public.macro_event ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'macro_event' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.macro_event FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- market_snapshot (project-scoped)
ALTER TABLE public.market_snapshot ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_snapshot' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.market_snapshot FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- market_candle (project-scoped)
ALTER TABLE public.market_candle ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_candle' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.market_candle FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- automation_workflow_template: built-in templates are shared read-only;
-- writes are denied (default) since the table has no ownership column.
ALTER TABLE public.automation_workflow_template ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_workflow_template' AND policyname = 'templates_readable') THEN
    CREATE POLICY templates_readable ON public.automation_workflow_template FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- vault_statistics (vault-scoped)
ALTER TABLE public.vault_statistics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vault_statistics' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.vault_statistics FOR ALL USING (
      vault_id IN (SELECT id FROM public.vault WHERE project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))
    );
  END IF;
END $$;

-- sync_settings (vault-scoped)
ALTER TABLE public.sync_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_settings' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.sync_settings FOR ALL USING (
      vault_id IN (SELECT id FROM public.vault WHERE project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))
    );
  END IF;
END $$;

-- ============= 3. Align collector_log schema with the UI =============
-- Frontend CollectorLog type expects: status, records_count, errors_count,
-- error_message, started_at, finished_at, duration_ms. The original table
-- only had level/message/details, so the logs table rendered empty rows.
ALTER TABLE public.collector_log
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS records_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS errors_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
