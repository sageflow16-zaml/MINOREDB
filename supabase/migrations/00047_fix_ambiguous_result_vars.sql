-- Migration 00047: fix 42702 ambiguous "result" in get_dashboard_trade_stats
-- and get_analytics_time_series — PL/pgSQL variable `result` collides with
-- trade.result column inside FILTER (WHERE result = 'WIN') clauses.
CREATE OR REPLACE FUNCTION public.get_dashboard_trade_stats(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result JSON;
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
  IF NOT EXISTS (SELECT 1 FROM public.project WHERE id = p_project_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'User does not own this project';
  END IF;

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

  v_win_rate := CASE WHEN (v_wins + v_losses) > 0
    THEN ROUND((v_wins::NUMERIC / (v_wins + v_losses)) * 100, 1)
    ELSE 0
  END;

  v_result := json_build_object(
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

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_time_series(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result JSON;
  v_min_date DATE; v_max_date DATE;
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
    ) INTO v_result;

  WITH daily AS (
    SELECT created_at::date AS trade_date, SUM(pnl) AS daily_pnl
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND pnl IS NOT NULL AND created_at IS NOT NULL
    GROUP BY trade_date
  )
  SELECT MIN(trade_date), MAX(trade_date) INTO v_min_date, v_max_date FROM daily;

  IF v_min_date IS NOT NULL AND v_max_date IS NOT NULL THEN
    WITH daily AS (
      SELECT created_at::date AS trade_date, SUM(pnl) AS daily_pnl
      FROM public.trade
      WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND pnl IS NOT NULL AND created_at IS NOT NULL
      GROUP BY trade_date
    )
    SELECT COALESCE(jsonb_object_agg(to_char(d.trade_date, 'YYYY-MM-DD'), d.daily_pnl), '{}'::jsonb)
    INTO daily_data
    FROM generate_series(v_min_date, v_max_date, '1 day'::interval) gs(d)
    LEFT JOIN daily d ON d.trade_date = gs.d::date;
  END IF;

  v_result := (v_result::jsonb || json_build_object(
    'calendar_heatmap', json_build_object(
      'daily_pnl', daily_data,
      'min_date', v_min_date,
      'max_date', v_max_date
    )
  )::jsonb)::json;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_trade_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_time_series(UUID) TO authenticated, anon;
