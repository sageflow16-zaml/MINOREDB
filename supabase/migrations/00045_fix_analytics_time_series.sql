-- Migration 00045: fix get_analytics_time_series — rolling50 CTE lacked
-- column aliases (three "count" columns), so json_build_object references
-- to trades/wins/losses/pnl failed → whole RPC errored → analytics charts empty.
CREATE OR REPLACE FUNCTION public.get_analytics_time_series(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSON;
  v_min_date DATE; v_max_date DATE; v_cur DATE;
  v_daily_pnl NUMERIC;
  daily_data JSONB := '{}'::jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.project WHERE id = p_project_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'User does not own this project';
  END IF;

  WITH base AS (
    SELECT * FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND pnl IS NOT NULL
  ),
  monthly AS (
    SELECT to_char(created_at, 'YYYY-MM') AS month,
      COUNT(*) AS trades, COUNT(*) FILTER (WHERE result = 'WIN') AS wins,
      COUNT(*) FILTER (WHERE result = 'LOSS') AS losses, SUM(pnl) AS pnl
    FROM base WHERE created_at IS NOT NULL
    GROUP BY month ORDER BY month
  ),
  weekly AS (
    SELECT CONCAT(EXTRACT(YEAR FROM created_at)::text, '-W', LPAD(EXTRACT(WEEK FROM created_at)::text, 2, '0')) AS week,
      COUNT(*) AS trades, COUNT(*) FILTER (WHERE result = 'WIN') AS wins,
      COUNT(*) FILTER (WHERE result = 'LOSS') AS losses, SUM(pnl) AS pnl
    FROM base WHERE created_at IS NOT NULL
    GROUP BY week ORDER BY week
  ),
  yearly AS (
    SELECT EXTRACT(YEAR FROM created_at)::text AS year,
      COUNT(*) AS trades, COUNT(*) FILTER (WHERE result = 'WIN') AS wins,
      COUNT(*) FILTER (WHERE result = 'LOSS') AS losses, SUM(pnl) AS pnl
    FROM base WHERE created_at IS NOT NULL
    GROUP BY year ORDER BY year
  ),
  rolling10 AS (
    SELECT * FROM (
      SELECT COUNT(*) OVER w AS trades, COUNT(*) FILTER (WHERE result = 'WIN') OVER w AS wins,
             COUNT(*) FILTER (WHERE result = 'LOSS') OVER w AS losses, SUM(pnl) OVER w AS pnl,
             ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
      FROM base
      WINDOW w AS (ORDER BY created_at ROWS BETWEEN 9 PRECEDING AND CURRENT ROW)
    ) sub WHERE rn = 1
  ),
  rolling50 AS (
    SELECT * FROM (
      SELECT COUNT(*) OVER w AS trades, COUNT(*) FILTER (WHERE result = 'WIN') OVER w AS wins,
             COUNT(*) FILTER (WHERE result = 'LOSS') OVER w AS losses, SUM(pnl) OVER w AS pnl,
             ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
      FROM base
      WINDOW w AS (ORDER BY created_at ROWS BETWEEN 49 PRECEDING AND CURRENT ROW)
    ) sub WHERE rn = 1
  ),
  daily AS (
    SELECT created_at::date AS trade_date, SUM(pnl) AS daily_pnl
    FROM base WHERE created_at IS NOT NULL
    GROUP BY trade_date ORDER BY trade_date
  )
  SELECT
    json_build_object(
      'monthly_returns', COALESCE((SELECT json_agg(json_build_object(
        'month', month, 'pnl', pnl, 'trades', trades, 'wins', wins, 'losses', losses
      ) ORDER BY month) FROM monthly), '[]'::json),
      'weekly_returns', COALESCE((SELECT json_agg(json_build_object(
        'week', week, 'pnl', pnl, 'trades', trades, 'wins', wins, 'losses', losses
      ) ORDER BY week) FROM weekly), '[]'::json),
      'yearly_returns', COALESCE((SELECT json_agg(json_build_object(
        'year', year, 'pnl', pnl, 'trades', trades, 'wins', wins, 'losses', losses,
        'win_rate', ROUND(CASE WHEN trades > 0 THEN wins::NUMERIC / trades * 100 ELSE 0 END, 1)
      ) ORDER BY year) FROM yearly), '[]'::json),
      'rolling_10', COALESCE((SELECT json_build_object(
        'available', true, 'window', 10,
        'trades', trades, 'wins', wins, 'losses', losses,
        'win_rate', ROUND(CASE WHEN trades > 0 THEN wins::NUMERIC / trades * 100 ELSE 0 END, 1),
        'pnl', pnl
      ) FROM rolling10), json_build_object('available', false, 'window', 10, 'trades_needed', 10 - (SELECT COUNT(*) FROM base))),
      'rolling_50', COALESCE((SELECT json_build_object(
        'available', true, 'window', 50,
        'trades', trades, 'wins', wins, 'losses', losses,
        'win_rate', ROUND(CASE WHEN trades > 0 THEN wins::NUMERIC / trades * 100 ELSE 0 END, 1),
        'pnl', pnl
      ) FROM rolling50), json_build_object('available', false, 'window', 50, 'trades_needed', 50 - (SELECT COUNT(*) FROM base)))
    ) INTO result;

  SELECT MIN(trade_date), MAX(trade_date) INTO v_min_date, v_max_date FROM daily;

  IF v_min_date IS NOT NULL AND v_max_date IS NOT NULL THEN
    FOR v_cur IN SELECT generate_series(v_min_date, v_max_date, '1 day'::interval)::date
    LOOP
      SELECT daily_pnl INTO v_daily_pnl FROM daily WHERE trade_date = v_cur;
      daily_data := daily_data || jsonb_build_object(to_char(v_cur, 'YYYY-MM-DD'), COALESCE(v_daily_pnl, 0));
    END LOOP;
  END IF;

  result := result || json_build_object(
    'calendar_heatmap', json_build_object(
      'daily_pnl', daily_data,
      'min_date', v_min_date,
      'max_date', v_max_date
    )
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_time_series(UUID) TO authenticated, anon;
