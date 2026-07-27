-- Migration 00022: Fix ambiguous `result` variable in RPC functions
-- Renames PL/pgSQL variable `result` to `v_result` to avoid ambiguity
-- with `trade.result` column referenced in WHERE/FILTER clauses.

-- ============= DASHBOARD STATS (fixed) =============
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSONB;
  v_wins BIGINT;
  v_closed BIGINT;
BEGIN
  v_wins := (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result = 'WIN' AND deleted_at IS NULL);
  v_closed := (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result IN ('WIN','LOSS') AND deleted_at IS NULL);
  SELECT JSONB_BUILD_OBJECT(
    'sources', (SELECT COUNT(*) FROM public.source WHERE project_id = p_project_id AND deleted_at IS NULL),
    'claims', (SELECT COUNT(*) FROM public.claim WHERE project_id = p_project_id AND deleted_at IS NULL),
    'concepts', (SELECT COUNT(*) FROM public.concept WHERE project_id = p_project_id AND deleted_at IS NULL),
    'interpretations', (SELECT COUNT(*) FROM public.interpretation WHERE project_id = p_project_id AND deleted_at IS NULL),
    'conflicts', (SELECT COUNT(*) FROM public.conflict WHERE project_id = p_project_id AND deleted_at IS NULL),
    'questions', (SELECT COUNT(*) FROM public.research_question WHERE project_id = p_project_id AND deleted_at IS NULL),
    'hypotheses', (SELECT COUNT(*) FROM public.hypothesis WHERE project_id = p_project_id AND deleted_at IS NULL),
    'total_trades', (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL),
    'wins', v_wins,
    'losses', (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result = 'LOSS' AND deleted_at IS NULL),
    'open_trades', (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND status = 'OPEN' AND deleted_at IS NULL),
    'win_rate', COALESCE(ROUND(v_wins::NUMERIC / NULLIF(v_closed, 0) * 100, 1), 0),
    'avg_rr', COALESCE(
      (SELECT ROUND(AVG(rr), 2) FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL),
      0
    ),
    'bullish_bias', (
      (SELECT COUNT(*) FROM public.market_structure WHERE project_id = p_project_id AND weekly_bias = 'BULLISH') +
      (SELECT COUNT(*) FROM public.market_structure WHERE project_id = p_project_id AND daily_bias = 'BULLISH')
    ),
    'bearish_bias', (
      (SELECT COUNT(*) FROM public.market_structure WHERE project_id = p_project_id AND weekly_bias = 'BEARISH') +
      (SELECT COUNT(*) FROM public.market_structure WHERE project_id = p_project_id AND daily_bias = 'BEARISH')
    ),
    'total_collectors', (SELECT COUNT(*) FROM public.collector_status WHERE project_id = p_project_id),
    'active_collectors', (SELECT COUNT(*) FROM public.collector_status WHERE project_id = p_project_id AND enabled = true),
    'collector_errors', COALESCE((SELECT SUM(errors) FROM public.collector_status WHERE project_id = p_project_id), 0),
    'collector_records', COALESCE((SELECT SUM(records_collected) FROM public.collector_status WHERE project_id = p_project_id), 0)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- ============= TRADE STATISTICS (fixed) =============
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
    'total_pnl', ROUND(COALESCE(SUM(pnl), 0), 2),
    'avg_win', ROUND(COALESCE(AVG(pnl) FILTER (WHERE result = 'WIN'), 0), 2),
    'avg_loss', ROUND(COALESCE(AVG(pnl) FILTER (WHERE result = 'LOSS'), 0), 2),
    'largest_win', ROUND(COALESCE(MAX(pnl) FILTER (WHERE result = 'WIN'), 0), 2),
    'largest_loss', ROUND(COALESCE(MIN(pnl) FILTER (WHERE result = 'LOSS'), 0), 2),
    'avg_rr', ROUND(COALESCE(AVG(rr), 0), 2),
    'profit_factor', ROUND(
      COALESCE(ABS(SUM(pnl) FILTER (WHERE pnl > 0)) / NULLIF(ABS(SUM(pnl) FILTER (WHERE pnl < 0)), 0), 0), 2
    ),
    'avg_holding_time_min', ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (close_time - open_time)) / 60), 0), 0),
    'max_drawdown', ROUND(COALESCE(MAX(drawdown), 0), 2),
    'expectancy', ROUND(COALESCE(AVG(pnl), 0), 2)
  ) INTO v_result FROM trade_filter;
  RETURN v_result;
END;
$$;

-- ============= STATS BY PAIR (fixed) =============
CREATE OR REPLACE FUNCTION public.get_stats_by_pair(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
    'pair', pair,
    'total_trades', COUNT(*),
    'wins', COUNT(*) FILTER (WHERE result = 'WIN'),
    'losses', COUNT(*) FILTER (WHERE result = 'LOSS'),
    'win_rate', ROUND(COUNT(*) FILTER (WHERE result = 'WIN')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE result IN ('WIN','LOSS')), 0) * 100, 1),
    'total_pnl', ROUND(COALESCE(SUM(pnl), 0), 2),
    'avg_rr', ROUND(COALESCE(AVG(rr), 0), 2)
  ) ORDER BY COUNT(*) DESC)
  INTO v_result FROM public.trade
  WHERE project_id = p_project_id AND deleted_at IS NULL AND pair IS NOT NULL
  GROUP BY pair;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ============= DRAWDOWN (fixed) =============
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
      ELSE cumulative_pnl END, 2
    ),
    'drawdown_pct', ROUND(
      CASE WHEN peak > 0 THEN (cumulative_pnl / peak) * 100
      ELSE 0 END, 2
    )
  ) ORDER BY close_time)
  INTO v_result FROM cumulative;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ============= RISK DASHBOARD (fixed) =============
CREATE OR REPLACE FUNCTION public.get_risk_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH latest_snapshot AS (
    SELECT * FROM public.risk_snapshot
    WHERE project_id = p_project_id
    ORDER BY snapshot_date DESC LIMIT 1
  )
  SELECT JSONB_BUILD_OBJECT(
    'current_drawdown', COALESCE((SELECT current_drawdown FROM latest_snapshot), 0),
    'max_drawdown', COALESCE((SELECT max_drawdown FROM latest_snapshot), 0),
    'daily_pnl', COALESCE((SELECT daily_pnl FROM latest_snapshot), 0),
    'daily_risk_remaining', COALESCE((SELECT daily_risk_remaining FROM latest_snapshot), 0),
    'current_risk_percent', COALESCE((SELECT current_risk_percent FROM latest_snapshot), 0),
    'active_rules', (SELECT COUNT(*) FROM public.risk_rule WHERE project_id = p_project_id AND is_active = true AND deleted_at IS NULL),
    'unread_alerts', (SELECT COUNT(*) FROM public.risk_alert WHERE project_id = p_project_id AND is_read = false AND is_dismissed = false),
    'open_positions', COALESCE((SELECT open_positions FROM latest_snapshot), 0)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- ============= SIMILAR TRADES (fixed) =============
CREATE OR REPLACE FUNCTION public.find_similar_trades(
  p_project_id UUID,
  p_pair TEXT DEFAULT NULL,
  p_direction TEXT DEFAULT NULL,
  p_weekly_bias TEXT DEFAULT NULL,
  p_daily_bias TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
    'id', t.id, 'pair', t.pair, 'direction', t.direction,
    'result', t.result, 'pnl', t.pnl, 'rr', t.rr,
    'open_time', t.open_time, 'close_time', t.close_time,
    'weekly_bias', t.weekly_bias, 'daily_bias', t.daily_bias,
    'similarity_score', (
      CASE WHEN t.pair = p_pair THEN 1 ELSE 0 END +
      CASE WHEN t.direction = p_direction THEN 1 ELSE 0 END +
      CASE WHEN t.weekly_bias = p_weekly_bias THEN 1 ELSE 0 END +
      CASE WHEN t.daily_bias = p_daily_bias THEN 1 ELSE 0 END
    )::NUMERIC / 4.0
  ) ORDER BY (
    CASE WHEN t.pair = p_pair THEN 1 ELSE 0 END +
    CASE WHEN t.direction = p_direction THEN 1 ELSE 0 END +
    CASE WHEN t.weekly_bias = p_weekly_bias THEN 1 ELSE 0 END +
    CASE WHEN t.daily_bias = p_daily_bias THEN 1 ELSE 0 END
  ) DESC)
  INTO v_result FROM public.trade t
  WHERE t.project_id = p_project_id
    AND t.deleted_at IS NULL
    AND (p_pair IS NULL OR t.pair = p_pair)
    AND (p_direction IS NULL OR t.direction = p_direction)
    AND (p_weekly_bias IS NULL OR t.weekly_bias = p_weekly_bias)
    AND (p_daily_bias IS NULL OR t.daily_bias = p_daily_bias)
  LIMIT p_limit;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ============= SEARCH KNOWLEDGE (fixed) =============
CREATE OR REPLACE FUNCTION public.search_knowledge(p_project_id UUID, p_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'concepts', COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT('id', id, 'title', title, 'type', 'concept'))
       FROM public.knowledge_concept
       WHERE project_id = p_project_id
         AND (title ILIKE '%' || p_query || '%' OR summary ILIKE '%' || p_query || '%' OR definition ILIKE '%' || p_query || '%')
       LIMIT 10),
      '[]'::jsonb
    ),
    'rules', COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT('id', id, 'title', title, 'type', 'rule'))
       FROM public.knowledge_rule
       WHERE project_id = p_project_id
         AND (title ILIKE '%' || p_query || '%' OR description ILIKE '%' || p_query || '%')
       LIMIT 10),
      '[]'::jsonb
    ),
    'trades', COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT('id', id, 'pair', pair, 'type', 'trade'))
       FROM public.trade
       WHERE project_id = p_project_id
         AND deleted_at IS NULL
         AND (pair ILIKE '%' || p_query || '%' OR notes ILIKE '%' || p_query || '%')
       LIMIT 10),
      '[]'::jsonb
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- Grant EXECUTE on all RPC functions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_trade_statistics(UUID, DATE, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_stats_by_pair(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_stats_by_direction(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_monthly_returns(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_equity_curve(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_drawdown_data(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_calendar_heatmap(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_rolling_stats(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_risk_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_pattern_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.find_similar_trades(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.search_knowledge(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calculate_position_size(NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_market_bias_summary(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_replay_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_trader_intelligence_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_automation_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_portfolio_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_quant_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_market_intelligence_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.search_documents(vector(1536), FLOAT, INT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_planning_dashboard(UUID) TO authenticated, anon;
