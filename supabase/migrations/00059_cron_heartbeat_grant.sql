-- Migration 00059: grant authenticated SELECT on cron_heartbeat.
--
-- 00058 revoked all grants and relied on the RLS policy alone, but PostgREST
-- needs a table-level grant for the role before policies apply. Grant SELECT
-- to authenticated; RLS still restricts writes to the service role.

GRANT SELECT ON public.cron_heartbeat TO authenticated;
