-- Portfolio Dashboard RPC
CREATE OR REPLACE FUNCTION public.get_portfolio_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'summary', (SELECT JSONB_BUILD_OBJECT(
      'total_balance', COALESCE(SUM(balance), 0),
      'total_equity', COALESCE(SUM(equity), 0),
      'total_open_pl', COALESCE(SUM(open_pl), 0),
      'total_used_margin', COALESCE(SUM(used_margin), 0),
      'total_free_margin', COALESCE(SUM(free_margin), 0),
      'total_margin_level', CASE WHEN COALESCE(SUM(used_margin), 0) > 0 THEN (COALESCE(SUM(equity), 0) / NULLIF(SUM(used_margin), 0)) * 100 ELSE 0 END,
      'account_count', COUNT(*)
    ) FROM public.account WHERE project_id = p_project_id AND is_active = true),
    'risk', (SELECT JSONB_BUILD_OBJECT(
      'total_exposure', COALESCE(SUM(used_margin), 0) + COALESCE(SUM(ABS(equity - balance)), 0),
      'used_margin', COALESCE(SUM(used_margin), 0),
      'free_margin', COALESCE(SUM(free_margin), 0),
      'margin_ratio', CASE WHEN COALESCE(SUM(equity), 0) > 0 THEN (COALESCE(SUM(used_margin), 0) / NULLIF(SUM(equity), 0)) * 100 ELSE 0 END,
      'margin_level', CASE WHEN COALESCE(SUM(used_margin), 0) > 0 THEN (COALESCE(SUM(equity), 0) / NULLIF(SUM(used_margin), 0)) * 100 ELSE 0 END,
      'portfolio_drawdown', 0,
      'win_rate', 0,
      'loss_count', 0,
      'concentration_risk', 0,
      'max_symbol_exposure', 0,
      'total_open_positions', 0,
      'risk_score', 0
    ) FROM public.account WHERE project_id = p_project_id AND is_active = true),
    'allocations', (SELECT JSONB_BUILD_OBJECT(
      'total_allocated', COALESCE(SUM(amount), 0),
      'allocations', COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id, 'account_id', account_id, 'symbol', symbol,
        'allocation_pct', allocation_pct, 'amount', amount
      )) FILTER (WHERE id IS NOT NULL), '[]'::jsonb),
      'unallocated', 0
    ) FROM public.portfolio_allocation WHERE project_id = p_project_id),
    'account_breakdown', COALESCE((
      SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', a.id, 'name', a.name, 'account_type', a.account_type,
        'current_balance', a.balance, 'current_equity', a.equity,
        'used_margin', a.used_margin, 'free_margin', a.free_margin,
        'margin_level', a.margin_level, 'trade_count', 0, 'win_rate', 0, 'pnl', 0
      ))
      FROM public.account a WHERE a.project_id = p_project_id AND a.is_active = true
    ), '[]'::jsonb),
    'history', JSONB_BUILD_OBJECT(
      'equity_curve', (SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'date', record_date, 'equity', equity, 'balance', 0
      ) ORDER BY record_date), '[]'::jsonb) FROM public.equity_history WHERE project_id = p_project_id),
      'snapshot_count', (SELECT COUNT(*) FROM public.portfolio_snapshot WHERE project_id = p_project_id)
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Market Intelligence Dashboard RPC
CREATE OR REPLACE FUNCTION public.get_market_intelligence_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'regime', (SELECT JSONB_BUILD_OBJECT(
      'id', id, 'project_id', project_id, 'regime_type', regime_type,
      'regime_value', regime_type, 'symbol', symbol, 'confidence', 0,
      'is_active', is_active
    ) FROM public.market_regime WHERE project_id = p_project_id AND is_active = true ORDER BY detected_at DESC LIMIT 1),
    'recent_regimes', COALESCE((
      SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id, 'project_id', project_id, 'regime_type', regime_type,
        'regime_value', regime_type, 'symbol', symbol, 'confidence', 0,
        'is_active', is_active
      ) ORDER BY detected_at DESC)
      FROM public.market_regime WHERE project_id = p_project_id
      LIMIT 10
    ), '[]'::jsonb),
    'upcoming_events', COALESCE((
      SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id, 'project_id', project_id, 'event_name', title,
        'event_date', event_date, 'country', country, 'currency', country,
        'category', category, 'impact', CASE WHEN importance = 1 THEN 'very_low' WHEN importance = 2 THEN 'low' WHEN importance = 3 THEN 'medium' WHEN importance = 4 THEN 'high' WHEN importance = 5 THEN 'very_high' ELSE 'medium' END,
        'actual', actual, 'forecast', forecast, 'previous', previous,
        'description', description, 'is_favorite', COALESCE(is_favorite, false)
      ) ORDER BY event_date)
      FROM public.economic_calendar_event WHERE project_id = p_project_id AND event_date >= NOW()
      LIMIT 20
    ), '[]'::jsonb),
    'alerts', COALESCE((
      SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id, 'alert_type', alert_type, 'symbol', symbol,
        'condition', condition, 'message', message,
        'is_read', COALESCE(is_read, false), 'is_dismissed', COALESCE(is_dismissed, false),
        'triggered_at', triggered_at
      ) ORDER BY triggered_at DESC)
      FROM public.market_alert WHERE project_id = p_project_id AND COALESCE(is_dismissed, false) = false
      LIMIT 10
    ), '[]'::jsonb),
    'watchlist_summary', (SELECT JSONB_BUILD_OBJECT(
      'count', COUNT(*), 'bullish', COUNT(*) FILTER (WHERE bias = 'bullish'), 'bearish', COUNT(*) FILTER (WHERE bias = 'bearish')
    ) FROM public.watchlist_item WHERE project_id = p_project_id),
    'session_status', '{}'::jsonb,
    'correlation_summary', NULL,
    'usd_strength', 0,
    'volatility_summary', JSONB_BUILD_OBJECT('level', 'unknown', 'regime', NULL),
    'equity_summary', NULL,
    'commodity_summary', NULL,
    'bond_summary', NULL
  ) INTO result;
  RETURN result;
END;
$$;

-- Quant Dashboard RPC
CREATE OR REPLACE FUNCTION public.get_quant_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'experiments', COALESCE((SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', id, 'name', name, 'description', description,
      'hypothesis', hypothesis, 'status', status, 'config', config,
      'tags', tags, 'created_at', created_at, 'updated_at', updated_at
    ) ORDER BY created_at DESC) FROM public.quant_experiment WHERE project_id = p_project_id LIMIT 10), '[]'::jsonb),
    'recent_backtests', COALESCE((SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', id, 'name', name, 'status', status, 'symbol', symbol,
      'timeframe', timeframe, 'win_rate', win_rate, 'profit_factor', profit_factor,
      'net_profit', net_profit, 'max_drawdown', max_drawdown,
      'sharpe_ratio', sharpe_ratio, 'total_return', total_return,
      'started_at', started_at, 'completed_at', completed_at
    ) ORDER BY created_at DESC) FROM public.quant_backtest_run WHERE project_id = p_project_id LIMIT 10), '[]'::jsonb),
    'recent_simulations', COALESCE((SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', id, 'name', name, 'simulation_type', simulation_type,
      'status', status, 'iterations', iterations
    ) ORDER BY created_at DESC) FROM public.quant_simulation_run WHERE project_id = p_project_id LIMIT 5), '[]'::jsonb),
    'recent_optimizations', COALESCE((SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', id, 'name', name, 'status', status, 'symbol', symbol,
      'optimization_type', optimization_type
    ) ORDER BY created_at DESC) FROM public.quant_optimization_run WHERE project_id = p_project_id LIMIT 5), '[]'::jsonb),
    'recent_walkforward', COALESCE((SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', id, 'name', name, 'status', status, 'symbol', symbol
    ) ORDER BY created_at DESC) FROM public.quant_walk_forward_run WHERE project_id = p_project_id LIMIT 5), '[]'::jsonb),
    'edge_health', (SELECT JSONB_BUILD_OBJECT(
      'metrics', metrics, 'is_healthy', is_healthy, 'snapshot_date', snapshot_date
    ) FROM public.quant_edge_health_snapshot WHERE project_id = p_project_id ORDER BY snapshot_date DESC LIMIT 1),
    'summary', JSONB_BUILD_OBJECT(
      'total_experiments', (SELECT COUNT(*) FROM public.quant_experiment WHERE project_id = p_project_id),
      'total_backtests', (SELECT COUNT(*) FROM public.quant_backtest_run WHERE project_id = p_project_id),
      'active_experiments', (SELECT COUNT(*) FROM public.quant_experiment WHERE project_id = p_project_id AND status = 'active'),
      'avg_win_rate', (SELECT COALESCE(AVG(win_rate), 0) FROM public.quant_backtest_run WHERE project_id = p_project_id AND win_rate IS NOT NULL)
    )
  ) INTO result;
  RETURN result;
END;
$$;
