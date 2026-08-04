-- Migration 00051: automation scheduler (pg_cron + pg_net)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Runs the automation-connector job runner every 5 minutes.
-- The x-cron-secret header is validated by the function against its CRON_SECRET env var.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'automation-run-jobs') THEN
    PERFORM cron.schedule(
      'automation-run-jobs',
      '*/5 * * * *',
      $cmd$
      SELECT net.http_post(
        url := 'https://wlpukdzvcidbwwwehiql.supabase.co/functions/v1/automation-connector',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndscHVrZHp2Y2lkYnd3d2VoaXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwOTMzNDAsImV4cCI6MjEwMDY2OTM0MH0.CHyEmF2qHOLQWxznxMsJkAT9J2rrvvM3swFJHchtGMw',
          'x-cron-secret', 'ab6f590832fa770f46e7858d372e52f96f0bb132d87d7e1b'
        ),
        body := jsonb_build_object('operation', 'run_jobs')
      );
      $cmd$
    );
  END IF;
END $$;
