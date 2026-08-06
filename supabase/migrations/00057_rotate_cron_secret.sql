-- Migration 00057: rotate automation cron secret to DB-backed value.
--
-- The previous cron secret was hardcoded in migration 00051 and committed to the
-- public repo, allowing anyone with repo read access to trigger the service-role
-- job runner (automation-connector / run_jobs). The new secret is generated at
-- migration time, stored only in the database (never in git), and read by the
-- edge function through its service-role client. RLS is enabled with no policies,
-- so anon/authenticated roles cannot read it, and explicit grants are revoked.

CREATE TABLE IF NOT EXISTS public.edge_cron_secrets (
  name   TEXT PRIMARY KEY,
  secret TEXT NOT NULL
);

ALTER TABLE public.edge_cron_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.edge_cron_secrets FROM anon, authenticated;

INSERT INTO public.edge_cron_secrets (name, secret)
VALUES (
  'automation-connector',
  substr(md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text), 1, 48)
)
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

UPDATE cron.job
SET command = format(
  $cmd$SELECT net.http_post(
  url := 'https://wlpukdzvcidbwwwehiql.supabase.co/functions/v1/automation-connector',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndscHVrZHp2Y2lkYnd3d2VoaXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwOTMzNDAsImV4cCI6MjEwMDY2OTM0MH0.CHyEmF2qHOLQWxznxMsJkAT9J2rrvvM3swFJHchtGMw',
    'x-cron-secret', %L
  ),
  body := jsonb_build_object('operation', 'run_jobs')
);$cmd$,
  (SELECT secret FROM public.edge_cron_secrets WHERE name = 'automation-connector')
)
WHERE jobname = 'automation-run-jobs';
