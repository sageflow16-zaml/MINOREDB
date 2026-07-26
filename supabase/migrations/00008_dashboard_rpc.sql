-- Migration 00008: Dashboard RPC functions
-- Aggregated dashboard statistics from migrated tables

-- ============= GET_DASHBOARD_TRADE_STATS =============
-- Returns trade-derived metrics for the dashboard.
-- Single-query aggregation replacing 6+ individual CRUD calls.
CREATE OR REPLACE FUNCTION public.get_dashboard_trade_stats(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSON;
  v_total BIGINT;
  v_open BIGINT;
  v_wins BIGINT;
  v_losses BIGINT;
  v_total_pnl NUMERIC;
  v_avg_rr NUMERIC;
  v_avg_win NUMERIC;
  v_avg_loss NUMERIC;
  v_win_rate NUMERIC;
BEGIN
  -- RLS: caller must own the project
  IF NOT EXISTS (SELECT 1 FROM public.project WHERE id = p_project_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'User does not own this project';
  END IF;

  -- Single aggregated query over public.trade
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'OPEN'),
    COUNT(*) FILTER (WHERE result = 'WIN'),
    COUNT(*) FILTER (WHERE result = 'LOSS'),
    COALESCE(SUM(pnl), 0),
    ROUND(AVG(rr)::NUMERIC, 2),
    ROUND(AVG(pnl) FILTER (WHERE result = 'WIN' AND pnl IS NOT NULL)::NUMERIC, 2),
    ROUND(AVG(pnl) FILTER (WHERE result = 'LOSS' AND pnl IS NOT NULL)::NUMERIC, 2)
  INTO v_total, v_open, v_wins, v_losses, v_total_pnl, v_avg_rr, v_avg_win, v_avg_loss
  FROM public.trade
  WHERE project_id = p_project_id AND deleted_at IS NULL;

  -- Compute win_rate
  v_win_rate := CASE WHEN (v_wins + v_losses) > 0
    THEN ROUND((v_wins::NUMERIC / (v_wins + v_losses)) * 100, 1)
    ELSE 0
  END;

  -- Build JSON result
  result := json_build_object(
    'total_trades', v_total,
    'open_trades', v_open,
    'wins', v_wins,
    'losses', v_losses,
    'total_pnl', v_total_pnl,
    'avg_rr', v_avg_rr,
    'avg_win', v_avg_win,
    'avg_loss', v_avg_loss,
    'win_rate', v_win_rate,
    'expectancy', CASE WHEN v_win_rate > 0 AND v_avg_loss IS NOT NULL AND v_avg_loss != 0
      THEN ROUND(
        (v_win_rate / 100 * v_avg_win) + ((100 - v_win_rate) / 100 * v_avg_loss),
      2)
      ELSE ROUND(v_win_rate / 100 * v_avg_win, 2)
    END
  );

  RETURN result;
END;
$$;
