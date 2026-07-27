-- Migration 00024: Fix ROUND(double precision, integer) across all RPCs
-- PostgreSQL has ROUND(numeric, integer) but NOT ROUND(double precision, integer).
-- All trade financial columns (pnl, rr, etc.) are double precision, so we must
-- cast to NUMERIC before passing to two-argument ROUND.

-- ============= TRADE STATISTICS =============
CREATE OR REPLACE FUNCTION public.get_trade_statistics(p_project_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH trade_filter AS (
    SELECT * FROM public.trade
    WHERE project_id = p_project_id
      AND deleted_at IS NULL
      AND (p_start_date IS NULL OR open_time >= p_start_date)
      AND (p_end_date IS NULL OR open_time <= p_end_date)
  )
  SELECT JSONB_BUILD_OBJECT(
    'total_trades', COUNT(*),
    'wins', COUNT(*) FILTER (WHERE result = 'WIN'),
    'losses', COUNT(*) FILTER (WHERE result = 'LOSS'),
    'breakevens', COUNT(*) FILTER (WHERE result = 'BREAKEVEN'),
    'win_rate', ROUND(COUNT(*) FILTER (WHERE result = 'WIN')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE result IN ('WIN','LOSS')), 0) * 100, 1),
    'total_pnl', ROUND(COALESCE(SUM(pnl), 0)::NUMERIC, 2),
    'avg_win', ROUND(COALESCE(AVG(pnl) FILTER (WHERE result = 'WIN'), 0)::NUMERIC, 2),
    'avg_loss', ROUND(COALESCE(AVG(pnl) FILTER (WHERE result = 'LOSS'), 0)::NUMERIC, 2),
    'largest_win', ROUND(COALESCE(MAX(pnl) FILTER (WHERE result = 'WIN'), 0)::NUMERIC, 2),
    'largest_loss', ROUND(COALESCE(MIN(pnl) FILTER (WHERE result = 'LOSS'), 0)::NUMERIC, 2),
    'avg_rr', ROUND(COALESCE(AVG(rr), 0)::NUMERIC, 2),
    'profit_factor', ROUND(COALESCE(ABS(SUM(pnl) FILTER (WHERE pnl > 0)) / NULLIF(ABS(SUM(pnl) FILTER (WHERE pnl < 0)), 0), 0)::NUMERIC, 2),
    'avg_holding_time_min', ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (close_time - open_time)) / 60), 0), 0),
    'max_drawdown', 0,
    'expectancy', ROUND(COALESCE(AVG(pnl), 0)::NUMERIC, 2)
  ) INTO v_result FROM trade_filter;
  RETURN v_result;
END;
$$;

-- ============= MONTHLY RETURNS =============
CREATE OR REPLACE FUNCTION public.get_monthly_returns(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'year', EXTRACT(YEAR FROM open_time),
      'month', EXTRACT(MONTH FROM open_time),
      'pnl', ROUND(COALESCE(SUM(pnl), 0)::NUMERIC, 2),
      'trades', COUNT(*)
    ) ORDER BY EXTRACT(YEAR FROM open_time), EXTRACT(MONTH FROM open_time))
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND open_time IS NOT NULL
    GROUP BY EXTRACT(YEAR FROM open_time), EXTRACT(MONTH FROM open_time)),
    '[]'::jsonb
  );
END;
$$;

-- ============= EQUITY CURVE =============
CREATE OR REPLACE FUNCTION public.get_equity_curve(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'date', close_time,
      'equity', ROUND(SUM(pnl) OVER (ORDER BY close_time)::NUMERIC, 2),
      'pnl', ROUND(pnl::NUMERIC, 2)
    ) ORDER BY close_time)
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND close_time IS NOT NULL AND result IS NOT NULL),
    '[]'::jsonb
  );
END;
$$;

-- ============= DRAWDOWN =============
CREATE OR REPLACE FUNCTION public.get_drawdown_data(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH cumulative AS (
    SELECT close_time, pnl,
      SUM(pnl) OVER (ORDER BY close_time) AS cumulative_pnl,
      MAX(SUM(pnl) OVER (ORDER BY close_time)) OVER () AS peak
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND close_time IS NOT NULL
  )
  SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
    'date', close_time,
    'drawdown', ROUND(
      CASE WHEN cumulative_pnl >= 0 THEN 0
      ELSE cumulative_pnl END::NUMERIC, 2
    ),
    'drawdown_pct', ROUND(
      CASE WHEN peak > 0 THEN (cumulative_pnl / peak) * 100
      ELSE 0 END::NUMERIC, 2
    )
  ) ORDER BY close_time)
  INTO v_result FROM cumulative;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ============= CALENDAR HEATMAP =============
CREATE OR REPLACE FUNCTION public.get_calendar_heatmap(p_project_id UUID, p_year INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  target_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM NOW()));
BEGIN
  RETURN COALESCE(
    (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'date', open_time::DATE,
      'count', COUNT(*),
      'pnl', ROUND(COALESCE(SUM(pnl), 0)::NUMERIC, 2)
    ) ORDER BY open_time::DATE)
    FROM public.trade
    WHERE project_id = p_project_id
      AND deleted_at IS NULL
      AND EXTRACT(YEAR FROM open_time) = target_year
    GROUP BY open_time::DATE),
    '[]'::jsonb
  );
END;
$$;

-- ============= ROLLING STATS =============
CREATE OR REPLACE FUNCTION public.get_rolling_stats(p_project_id UUID, p_window INTEGER DEFAULT 10)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'date', close_time,
      'rolling_win_rate', ROUND(
        COUNT(*) FILTER (WHERE result = 'WIN') OVER (ORDER BY close_time ROWS BETWEEN p_window - 1 PRECEDING AND CURRENT ROW)::NUMERIC
        / NULLIF(COUNT(*) FILTER (WHERE result IN ('WIN','LOSS')) OVER (ORDER BY close_time ROWS BETWEEN p_window - 1 PRECEDING AND CURRENT ROW), 0) * 100, 1
      ),
      'rolling_pnl', ROUND(SUM(pnl) OVER (ORDER BY close_time ROWS BETWEEN p_window - 1 PRECEDING AND CURRENT ROW)::NUMERIC, 2),
      'rolling_avg_rr', ROUND(AVG(rr) OVER (ORDER BY close_time ROWS BETWEEN p_window - 1 PRECEDING AND CURRENT ROW)::NUMERIC, 2)
    ) ORDER BY close_time)
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND close_time IS NOT NULL AND result IS NOT NULL),
    '[]'::jsonb
  );
END;
$$;

-- Grant EXECUTE on all fixed functions
GRANT EXECUTE ON FUNCTION public.get_trade_statistics(UUID, DATE, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_monthly_returns(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_equity_curve(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_drawdown_data(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_calendar_heatmap(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_rolling_stats(UUID, INTEGER) TO authenticated, anon;
