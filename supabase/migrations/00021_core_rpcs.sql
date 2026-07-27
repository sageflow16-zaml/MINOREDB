-- Migration 00021: Core RPC Functions — replaces statistics.py, dashboard.py, search.py, risk.py compute

-- ============= DASHBOARD STATS =============
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'sources', (SELECT COUNT(*) FROM public.source WHERE project_id = p_project_id AND deleted_at IS NULL),
    'claims', (SELECT COUNT(*) FROM public.claim WHERE project_id = p_project_id AND deleted_at IS NULL),
    'concepts', (SELECT COUNT(*) FROM public.concept WHERE project_id = p_project_id AND deleted_at IS NULL),
    'interpretations', (SELECT COUNT(*) FROM public.interpretation WHERE project_id = p_project_id AND deleted_at IS NULL),
    'conflicts', (SELECT COUNT(*) FROM public.conflict WHERE project_id = p_project_id AND deleted_at IS NULL),
    'questions', (SELECT COUNT(*) FROM public.research_question WHERE project_id = p_project_id AND deleted_at IS NULL),
    'hypotheses', (SELECT COUNT(*) FROM public.hypothesis WHERE project_id = p_project_id AND deleted_at IS NULL),
    'total_trades', (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL),
    'wins', (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result = 'WIN' AND deleted_at IS NULL),
    'losses', (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result = 'LOSS' AND deleted_at IS NULL),
    'open_trades', (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND status = 'OPEN' AND deleted_at IS NULL),
    'win_rate', COALESCE(
      ROUND(
        (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result = 'WIN' AND deleted_at IS NULL)::NUMERIC
        / NULLIF((SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result IN ('WIN','LOSS') AND deleted_at IS NULL), 0)
        * 100, 1
      ), 0
    ),
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

-- ============= STATS BY PAIR =============
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

-- ============= STATS BY DIRECTION =============
CREATE OR REPLACE FUNCTION public.get_stats_by_direction(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'direction', direction,
      'total', COUNT(*),
      'wins', COUNT(*) FILTER (WHERE result = 'WIN'),
      'losses', COUNT(*) FILTER (WHERE result = 'LOSS'),
      'win_rate', ROUND(COUNT(*) FILTER (WHERE result = 'WIN')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE result IN ('WIN','LOSS')), 0) * 100, 1),
      'total_pnl', ROUND(COALESCE(SUM(pnl), 0), 2)
    )) FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND direction IS NOT NULL
    GROUP BY direction),
    '[]'::jsonb
  );
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
      'pnl', ROUND(COALESCE(SUM(pnl), 0), 2),
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
      'equity', ROUND(SUM(pnl) OVER (ORDER BY close_time), 2),
      'pnl', ROUND(pnl, 2)
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
      'pnl', ROUND(COALESCE(SUM(pnl), 0), 2)
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
      'rolling_pnl', ROUND(SUM(pnl) OVER (ORDER BY close_time ROWS BETWEEN p_window - 1 PRECEDING AND CURRENT ROW), 2),
      'rolling_avg_rr', ROUND(AVG(rr) OVER (ORDER BY close_time ROWS BETWEEN p_window - 1 PRECEDING AND CURRENT ROW), 2)
    ) ORDER BY close_time)
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND close_time IS NOT NULL AND result IS NOT NULL),
    '[]'::jsonb
  );
END;
$$;

-- ============= RISK DASHBOARD =============
CREATE OR REPLACE FUNCTION public.get_risk_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  result JSONB;
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
  ) INTO result;
  RETURN result;
END;
$$;

-- ============= PATTERN STATISTICS =============
CREATE OR REPLACE FUNCTION public.get_pattern_stats(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', id, 'name', name, 'total_occurrences', total_occurrences,
      'win_rate', win_rate, 'avg_rr', average_rr, 'confidence_score', confidence_score
    ) ORDER BY total_occurrences DESC)
    FROM public.pattern WHERE project_id = p_project_id),
    '[]'::jsonb
  );
END;
$$;

-- ============= SIMILAR TRADES (pgvector) =============
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
  result JSONB;
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
  INTO result FROM public.trade t
  WHERE t.project_id = p_project_id
    AND t.deleted_at IS NULL
    AND (p_pair IS NULL OR t.pair = p_pair)
    AND (p_direction IS NULL OR t.direction = p_direction)
    AND (p_weekly_bias IS NULL OR t.weekly_bias = p_weekly_bias)
    AND (p_daily_bias IS NULL OR t.daily_bias = p_daily_bias)
  LIMIT p_limit;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ============= FULL-TEXT SEARCH =============
CREATE OR REPLACE FUNCTION public.search_knowledge(p_project_id UUID, p_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  result JSONB;
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
  ) INTO result;
  RETURN result;
END;
$$;

-- ============= POSITION SIZE CALCULATOR =============
CREATE OR REPLACE FUNCTION public.calculate_position_size(
  p_account_balance NUMERIC,
  p_risk_percent NUMERIC,
  p_entry_price NUMERIC,
  p_stop_loss NUMERIC,
  p_contract_size NUMERIC DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  risk_amount NUMERIC;
  risk_pips NUMERIC;
  position_size NUMERIC;
BEGIN
  risk_amount := p_account_balance * (p_risk_percent / 100.0);
  risk_pips := ABS(p_entry_price - p_stop_loss);
  IF risk_pips = 0 THEN
    RETURN JSONB_BUILD_OBJECT('error', 'Stop loss cannot equal entry price');
  END IF;
  position_size := risk_amount / (risk_pips * p_contract_size);
  RETURN JSONB_BUILD_OBJECT(
    'risk_amount', ROUND(risk_amount, 2),
    'risk_pips', ROUND(risk_pips, 2),
    'position_size', ROUND(position_size, 4),
    'account_balance', p_account_balance,
    'risk_percent', p_risk_percent
  );
END;
$$;

-- ============= MARKET STRUCTURE BIAS SUMMARY =============
CREATE OR REPLACE FUNCTION public.get_market_bias_summary(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'date', ms.date,
      'pair', ms.pair,
      'timeframe', ms.timeframe,
      'weekly_bias', ms.weekly_bias,
      'daily_bias', ms.daily_bias,
      'market_phase', ms.market_phase,
      'trend', ms.trend
    ) ORDER BY ms.date DESC)
    FROM public.market_structure ms
    WHERE ms.project_id = p_project_id),
    '[]'::jsonb
  );
END;
$$;

-- ============= REPLAY DASHBOARD =============
CREATE OR REPLACE FUNCTION public.get_replay_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN JSONB_BUILD_OBJECT(
    'total_sessions', (SELECT COUNT(*) FROM public.replay_session WHERE project_id = p_project_id),
    'completed_sessions', (SELECT COUNT(*) FROM public.replay_session WHERE project_id = p_project_id AND status = 'completed'),
    'active_sessions', (SELECT COUNT(*) FROM public.replay_session WHERE project_id = p_project_id AND status = 'in_progress'),
    'total_trades', (SELECT COUNT(*) FROM public.replay_trade rt JOIN public.replay_session rs ON rt.session_id = rs.id WHERE rs.project_id = p_project_id),
    'total_reviews', (SELECT COUNT(*) FROM public.replay_review rr JOIN public.replay_session rs ON rr.session_id = rs.id WHERE rs.project_id = p_project_id),
    'total_mistakes', (SELECT COUNT(*) FROM public.replay_mistake rm JOIN public.replay_session rs ON rm.session_id = rs.id WHERE rs.project_id = p_project_id)
  );
END;
$$;

-- ============= TRADER INTELLIGENCE DASHBOARD =============
CREATE OR REPLACE FUNCTION public.get_trader_intelligence_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN JSONB_BUILD_OBJECT(
    'total_debriefs', (SELECT COUNT(*) FROM public.trade_debrief WHERE project_id = p_project_id),
    'active_patterns', (SELECT COUNT(*) FROM public.personal_pattern WHERE project_id = p_project_id AND active = true),
    'approved_rules', (SELECT COUNT(*) FROM public.personal_rule WHERE project_id = p_project_id AND status = 'approved'),
    'pending_rules', (SELECT COUNT(*) FROM public.personal_rule WHERE project_id = p_project_id AND status = 'draft'),
    'avg_discipline', (SELECT ROUND(AVG(discipline_score), 1) FROM public.trader_profile WHERE project_id = p_project_id),
    'profile_exists', (SELECT COUNT(*) > 0 FROM public.trader_profile WHERE project_id = p_project_id)
  );
END;
$$;

-- ============= AUTOMATION DASHBOARD =============
CREATE OR REPLACE FUNCTION public.get_automation_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN JSONB_BUILD_OBJECT(
    'active_workflows', (SELECT COUNT(*) FROM public.automation_workflow WHERE project_id = p_project_id AND status = 'active' AND deleted_at IS NULL),
    'total_workflows', (SELECT COUNT(*) FROM public.automation_workflow WHERE project_id = p_project_id AND deleted_at IS NULL),
    'active_rules', (SELECT COUNT(*) FROM public.automation_rule WHERE project_id = p_project_id AND enabled = true),
    'active_jobs', (SELECT COUNT(*) FROM public.automation_scheduled_job WHERE project_id = p_project_id AND enabled = true),
    'recent_executions', (SELECT COUNT(*) FROM public.automation_workflow_execution WHERE project_id = p_project_id AND created_at > NOW() - INTERVAL '24 hours'),
    'failed_executions', (SELECT COUNT(*) FROM public.automation_workflow_execution WHERE project_id = p_project_id AND status = 'failed' AND created_at > NOW() - INTERVAL '24 hours'),
    'unread_notifications', (SELECT COUNT(*) FROM public.automation_notification WHERE project_id = p_project_id AND is_read = false)
  );
END;
$$;

-- ============= PORTFOLIO DASHBOARD =============
CREATE OR REPLACE FUNCTION public.get_portfolio_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN JSONB_BUILD_OBJECT(
    'total_accounts', (SELECT COUNT(*) FROM public.account WHERE project_id = p_project_id AND is_archived = false),
    'active_accounts', (SELECT COUNT(*) FROM public.account WHERE project_id = p_project_id AND is_active = true AND is_archived = false),
    'total_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.account WHERE project_id = p_project_id AND is_archived = false),
    'total_equity', (SELECT COALESCE(SUM(equity), 0) FROM public.account WHERE project_id = p_project_id AND is_archived = false),
    'total_open_pl', (SELECT COALESCE(SUM(open_pl), 0) FROM public.account WHERE project_id = p_project_id AND is_archived = false),
    'total_brokers', (SELECT COUNT(*) FROM public.broker_profile WHERE project_id = p_project_id),
    'total_goals', (SELECT COUNT(*) FROM public.portfolio_goal WHERE project_id = p_project_id AND status = 'active'),
    'unread_notes', (SELECT COUNT(*) FROM public.account_note WHERE project_id = p_project_id),
    'latest_snapshot', (SELECT row_to_json(s.*)::jsonb FROM public.portfolio_snapshot s WHERE project_id = p_project_id ORDER BY snapshot_date DESC LIMIT 1)
  );
END;
$$;

-- ============= QUANT RESEARCH DASHBOARD =============
CREATE OR REPLACE FUNCTION public.get_quant_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN JSONB_BUILD_OBJECT(
    'total_experiments', (SELECT COUNT(*) FROM public.quant_experiment WHERE project_id = p_project_id),
    'recent_backtests', (SELECT COUNT(*) FROM public.quant_backtest_run WHERE project_id = p_project_id AND created_at > NOW() - INTERVAL '7 days'),
    'completed_backtests', (SELECT COUNT(*) FROM public.quant_backtest_run WHERE project_id = p_project_id AND status = 'completed'),
    'failed_backtests', (SELECT COUNT(*) FROM public.quant_backtest_run WHERE project_id = p_project_id AND status = 'failed'),
    'total_simulations', (SELECT COUNT(*) FROM public.quant_simulation_run WHERE project_id = p_project_id),
    'recent_notebooks', (SELECT COUNT(*) FROM public.quant_research_notebook WHERE project_id = p_project_id AND created_at > NOW() - INTERVAL '7 days'),
    'edge_health', (SELECT is_healthy FROM public.quant_edge_health_snapshot qehs
      JOIN public.quant_experiment qe ON qehs.experiment_id = qe.id
      WHERE qe.project_id = p_project_id
      ORDER BY qehs.snapshot_date DESC LIMIT 1)
  );
END;
$$;

-- ============= MARKET INTELLIGENCE DASHBOARD =============
CREATE OR REPLACE FUNCTION public.get_market_intelligence_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN JSONB_BUILD_OBJECT(
    'active_regime', (SELECT row_to_json(mr.*)::jsonb FROM public.market_regime mr WHERE mr.project_id = p_project_id AND mr.is_active = true ORDER BY mr.detected_at DESC LIMIT 1),
    'upcoming_events', (SELECT COUNT(*) FROM public.economic_calendar_event ece WHERE ece.project_id = p_project_id AND ece.event_date > NOW() AND ece.importance >= 2),
    'total_watchlist_items', (SELECT COUNT(*) FROM public.watchlist_item wi JOIN public.watchlist w ON wi.watchlist_id = w.id WHERE w.project_id = p_project_id),
    'unread_alerts', (SELECT COUNT(*) FROM public.market_alert WHERE project_id = p_project_id AND is_read = false AND is_dismissed = false),
    'recent_timeline_events', (SELECT COUNT(*) FROM public.market_timeline WHERE project_id = p_project_id AND event_time > NOW() - INTERVAL '24 hours'),
    'total_correlations', (SELECT COUNT(*) FROM public.correlation_data WHERE project_id = p_project_id)
  );
END;
$$;

-- ============= AI FOUNDATION DASHBOARD =============
CREATE OR REPLACE FUNCTION public.get_ai_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN JSONB_BUILD_OBJECT(
    'profile_exists', (SELECT COUNT(*) > 0 FROM public.ai_profile WHERE project_id = p_project_id),
    'total_evaluations', (SELECT COUNT(*) FROM public.trade_evaluation WHERE project_id = p_project_id),
    'active_patterns', (SELECT COUNT(*) FROM public.detected_pattern WHERE project_id = p_project_id AND is_active = true),
    'unread_insights', (SELECT COUNT(*) FROM public.ai_insight WHERE project_id = p_project_id AND is_read = false AND is_dismissed = false),
    'pending_recommendations', (SELECT COUNT(*) FROM public.ai_recommendation WHERE project_id = p_project_id AND is_dismissed = false AND is_completed = false),
    'recent_coaching_sessions', (SELECT COUNT(*) FROM public.coaching_session WHERE project_id = p_project_id AND created_at > NOW() - INTERVAL '7 days'),
    'total_knowledge_links', (SELECT COUNT(*) FROM public.knowledge_link WHERE project_id = p_project_id),
    'total_summaries', (SELECT COUNT(*) FROM public.ai_summary WHERE project_id = p_project_id)
  );
END;
$$;

-- ============= VECTOR SEARCH (pgvector) =============
CREATE OR REPLACE FUNCTION public.search_documents(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  p_project_id UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, content TEXT, ingestion_id UUID, similarity FLOAT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT adc.id, adc.content, adc.ingestion_id, 1 - (adc.embedding <=> query_embedding) AS similarity
  FROM public.ai_document_chunk adc
  WHERE (p_project_id IS NULL OR adc.project_id = p_project_id)
    AND 1 - (adc.embedding <=> query_embedding) > match_threshold
  ORDER BY adc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============= PLANNING DASHBOARD =============
CREATE OR REPLACE FUNCTION public.get_planning_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN JSONB_BUILD_OBJECT(
    'today_plan', (SELECT row_to_json(tp.*)::jsonb FROM public.trading_plan tp WHERE tp.project_id = p_project_id AND tp.plan_date = CURRENT_DATE AND tp.deleted_at IS NULL ORDER BY tp.created_at DESC LIMIT 1),
    'active_goals', (SELECT COUNT(*) FROM public.goal WHERE project_id = p_project_id AND status = 'active'),
    'today_events', (SELECT JSONB_AGG(row_to_json(ce.*)::jsonb) FROM public.calendar_event ce WHERE ce.project_id = p_project_id AND ce.event_date::DATE = CURRENT_DATE),
    'pending_reminders', (SELECT COUNT(*) FROM public.reminder WHERE project_id = p_project_id AND is_completed = false AND (reminder_time IS NULL OR reminder_time <= NOW())),
    'recent_reviews', (SELECT COUNT(*) FROM public.daily_review WHERE project_id = p_project_id AND review_date > CURRENT_DATE - 7),
    'upcoming_economic_events', (SELECT COUNT(*) FROM public.economic_event WHERE project_id = p_project_id AND event_date > NOW() AND event_date < NOW() + INTERVAL '7 days')
  );
END;
$$;
