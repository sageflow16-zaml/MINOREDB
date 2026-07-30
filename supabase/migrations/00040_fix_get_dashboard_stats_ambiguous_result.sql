-- Migration 00040: Fix ambiguous column reference "result" in get_dashboard_stats
-- Root cause: DECLARE variable named "result" conflicted with trade.result column.
-- PostgreSQL's default variable_conflict = error raises "column reference result is ambiguous"
-- when a PL/pgSQL variable name matches a table column used unqualified in SQL statements.
-- Fix: rename variable to v_result to match the pattern used in all other RPC functions.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_project_id uuid)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_result JSONB;
  t_count INT; w_count INT; l_count INT; o_count INT;
  t_pnl NUMERIC; t_wins NUMERIC; t_losses NUMERIC; w_rate NUMERIC; a_rr NUMERIC;
  expectancy NUMERIC; profit_factor NUMERIC; max_dd NUMERIC;
  g_nodes INT; g_edges INT;
BEGIN
  SELECT COUNT(*) INTO t_count FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL;
  SELECT COUNT(*) INTO w_count FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND trade.result = 'WIN';
  SELECT COUNT(*) INTO l_count FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND trade.result = 'LOSS';
  SELECT COUNT(*) INTO o_count FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'OPEN';
  SELECT COALESCE(SUM(pnl), 0) INTO t_pnl FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL;
  SELECT COALESCE(SUM(pnl), 0) INTO t_wins FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND trade.result = 'WIN';
  SELECT COALESCE(SUM(ABS(pnl)), 0) INTO t_losses FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND trade.result = 'LOSS';
  w_rate := CASE WHEN (w_count + l_count) > 0 THEN ROUND((w_count::NUMERIC / (w_count + l_count)) * 100, 1) ELSE 0 END;
  SELECT COALESCE(AVG(rr), 0) INTO a_rr FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND rr IS NOT NULL;
  expectancy := CASE WHEN (w_count + l_count) > 0 THEN ROUND((t_pnl / (w_count + l_count))::NUMERIC, 2) ELSE 0 END;
  profit_factor := CASE WHEN t_losses > 0 THEN ROUND((t_wins / t_losses)::NUMERIC, 2) ELSE 0 END;
  SELECT COALESCE(MAX(drawdown), 0) INTO max_dd FROM (
    SELECT (SUM(pnl) OVER (ORDER BY close_time) - MAX(SUM(pnl)) OVER (ORDER BY close_time)) AS drawdown
    FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND close_time IS NOT NULL
    GROUP BY close_time
  ) sub;
  SELECT COUNT(*) INTO g_nodes FROM public.knowledge_node WHERE project_id = p_project_id;
  SELECT COUNT(*) INTO g_edges FROM public.knowledge_edge WHERE project_id = p_project_id;

  v_result := jsonb_build_object(
    'total_trades', t_count, 'total_pnl', t_pnl, 'win_rate', w_rate,
    'avg_rr', a_rr, 'open_trades', o_count,
    'expectancy', expectancy, 'profit_factor', profit_factor,
    'max_drawdown', COALESCE(max_dd, 0),
    'graph_nodes', g_nodes, 'graph_edges', g_edges
  );
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated, anon;
