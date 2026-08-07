-- Migration 00058: cron heartbeat for liveness observability.
--
-- The pg_cron job automation-run-jobs hits automation-connector every 5 minutes.
-- If the job, its secret, or the function deployment breaks, the failure is
-- silent: nothing anywhere records that a tick happened. This table gives the
-- scheduler a heartbeat. The edge function upserts a row on every successful
-- tick; authenticated users can read it (read-only, no sensitive data) so
-- liveness is verifiable via the API. Only the service role can write.

CREATE TABLE IF NOT EXISTS public.cron_heartbeat (
  name         TEXT PRIMARY KEY,
  last_run_at  TIMESTAMPTZ NOT NULL,
  last_status  TEXT NOT NULL DEFAULT 'ok',
  last_error   TEXT
);

ALTER TABLE public.cron_heartbeat ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cron_heartbeat FROM anon, authenticated;

CREATE POLICY cron_heartbeat_read ON public.cron_heartbeat
  FOR SELECT TO authenticated USING (true);
