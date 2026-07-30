-- Migration 00039: Grant EXECUTE on get_dashboard_stats
-- Migration 00035 redefined get_dashboard_stats via CREATE OR REPLACE FUNCTION,
-- which preserves existing grants from 00022.  This is a safety-net migration
-- to ensure the function is accessible after any future redefinitions.

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated, anon;
