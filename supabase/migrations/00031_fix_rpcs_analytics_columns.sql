-- Fix SQL RPCs with ambiguous column references and type issues
-- 1. get_analytics_overview: result variable shadows column
-- 2. get_analytics_breakdowns: result variable shadows column
-- 3. get_analytics_detail: result variable + ROUND(double precision, int)
-- 4. get_market_intelligence_dashboard: bias column doesn't exist
-- 5. search_knowledge: function not found (re-create)
-- 6. calculate_position_size: function not found (re-create)

-- ============= FIX GET_ANALYTICS_OVERVIEW =============
CREATE OR REPLACE FUNCTION public.get_analytics_overview(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result JSON;
  v_total BIGINT; v_closed BIGINT; v_wins BIGINT; v_losses BIGINT; v_be BIGINT; v_open BIGINT;
  v_win_rate NUMERIC; v_avg_rr NUMERIC; v_total_pnl NUMERIC;
  v_expectancy NUMERIC; v_avg_win NUMERIC; v_avg_loss NUMERIC;
  v_max_dd NUMERIC; v_profit_factor NUMERIC; v_sharpe NUMERIC; v_recovery NUMERIC;
  v_gross_profit NUMERIC; v_gross_loss NUMERIC;
  v_mean NUMERIC; v_stddev NUMERIC;
  v_peak NUMERIC; v_equity NUMERIC; v_dd NUMERIC;
  r RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.project WHERE id = p_project_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'User does not own this project';
  END IF;

  SELECT
    COUNT(*), COUNT(*) FILTER (WHERE status = 'CLOSED'),
    COUNT(*) FILTER (WHERE result = 'WIN'), COUNT(*) FILTER (WHERE result = 'LOSS'),
    COUNT(*) FILTER (WHERE result = 'BREAKEVEN' OR result = 'BE'),
    COUNT(*) FILTER (WHERE status = 'OPEN'),
    ROUND(COUNT(*) FILTER (WHERE result = 'WIN')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE result IN ('WIN','LOSS')), 0) * 100, 1),
    ROUND(AVG(rr)::NUMERIC, 2), COALESCE(SUM(pnl), 0),
    ROUND(AVG(pnl) FILTER (WHERE result = 'WIN' AND pnl IS NOT NULL)::NUMERIC, 2),
    ROUND(AVG(pnl) FILTER (WHERE result = 'LOSS' AND pnl IS NOT NULL)::NUMERIC, 2)
  INTO v_total, v_closed, v_wins, v_losses, v_be, v_open,
       v_win_rate, v_avg_rr, v_total_pnl, v_avg_win, v_avg_loss
  FROM public.trade
  WHERE project_id = p_project_id AND deleted_at IS NULL;

  v_expectancy := CASE WHEN v_win_rate > 0 AND COALESCE(v_avg_loss, 0) != 0
    THEN ROUND((v_win_rate / 100 * v_avg_win) + ((100 - v_win_rate) / 100 * v_avg_loss), 2)
    ELSE ROUND(v_win_rate / 100 * v_avg_win, 2)
  END;

  v_peak := 0; v_equity := 0; v_max_dd := 0;
  FOR r IN SELECT pnl FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND pnl IS NOT NULL
    ORDER BY COALESCE(close_time, created_at)
  LOOP
    v_equity := v_equity + COALESCE(r.pnl, 0);
    IF v_equity > v_peak THEN v_peak := v_equity; END IF;
    IF v_peak > 0 THEN
      v_dd := (v_peak - v_equity) / v_peak;
      IF v_dd > v_max_dd THEN v_max_dd := v_dd; END IF;
    END IF;
  END LOOP;
  v_max_dd := ROUND(v_max_dd * 100, 2);

  SELECT COALESCE(SUM(pnl) FILTER (WHERE pnl > 0), 0),
         COALESCE(SUM(ABS(pnl)) FILTER (WHERE pnl < 0), 0)
  INTO v_gross_profit, v_gross_loss
  FROM public.trade
  WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND pnl IS NOT NULL;
  v_profit_factor := CASE WHEN v_gross_loss > 0 THEN ROUND(v_gross_profit / v_gross_loss, 2) ELSE 0 END;

  SELECT AVG(pnl), STDDEV(pnl) INTO v_mean, v_stddev
  FROM public.trade
  WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND pnl IS NOT NULL;
  v_sharpe := CASE WHEN COALESCE(v_stddev, 0) > 0 THEN ROUND(v_mean / NULLIF(v_stddev, 0), 2) ELSE 0 END;

  v_recovery := CASE WHEN v_max_dd > 0 THEN ROUND(v_total_pnl / (v_max_dd / 100), 2) ELSE 0 END;

  v_result := json_build_object(
    'total_trades', v_total, 'closed_trades', v_closed,
    'wins', v_wins, 'losses', v_losses, 'breakevens', v_be, 'open_trades', v_open,
    'win_rate', v_win_rate, 'avg_rr', v_avg_rr, 'total_pnl', v_total_pnl,
    'expectancy', v_expectancy, 'avg_win', v_avg_win, 'avg_loss', v_avg_loss,
    'max_drawdown', v_max_dd, 'profit_factor', v_profit_factor,
    'sharpe_ratio', v_sharpe, 'recovery_factor', v_recovery,
    'by_result', json_build_object('WIN', v_wins, 'LOSS', v_losses, 'BE', v_be)
  );

  RETURN v_result;
END;
$$;

-- ============= FIX GET_ANALYTICS_BREAKDOWNS =============
CREATE OR REPLACE FUNCTION public.get_analytics_breakdowns(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.project WHERE id = p_project_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'User does not own this project';
  END IF;

  WITH base AS (
    SELECT * FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED'
  ),
  grouped AS (
    SELECT
      'by_pair' AS section, COALESCE(pair, 'Unknown') AS key,
      COUNT(*) AS trades, COUNT(*) FILTER (WHERE result = 'WIN') AS wins,
      COUNT(*) FILTER (WHERE result = 'LOSS') AS losses, COALESCE(SUM(pnl), 0) AS pnl
    FROM base GROUP BY 1, 2
    UNION ALL
    SELECT 'by_direction', COALESCE(direction, 'Unknown'), COUNT(*),
      COUNT(*) FILTER (WHERE result = 'WIN'), COUNT(*) FILTER (WHERE result = 'LOSS'), COALESCE(SUM(pnl), 0)
    FROM base GROUP BY 1, 2
    UNION ALL
    SELECT 'by_bias', CONCAT(COALESCE(weekly_bias,'N/A'),'/',COALESCE(daily_bias,'N/A'),'/',COALESCE(h4_bias,'N/A')),
      COUNT(*), COUNT(*) FILTER (WHERE result = 'WIN'), COUNT(*) FILTER (WHERE result = 'LOSS'), COALESCE(SUM(pnl), 0)
    FROM base GROUP BY 1, 2
    UNION ALL
    SELECT 'by_timeframe', COALESCE(timeframe, 'Unknown'),
      COUNT(*), COUNT(*) FILTER (WHERE result = 'WIN'), COUNT(*) FILTER (WHERE result = 'LOSS'), COALESCE(SUM(pnl), 0)
    FROM base GROUP BY 1, 2
    UNION ALL
    SELECT 'by_news', CASE WHEN news_event IS NOT NULL AND TRIM(news_event) != '' THEN 'News Day' ELSE 'No News' END,
      COUNT(*), COUNT(*) FILTER (WHERE result = 'WIN'), COUNT(*) FILTER (WHERE result = 'LOSS'), COALESCE(SUM(pnl), 0)
    FROM base GROUP BY 1, 2
    UNION ALL
    SELECT 'by_weekday', TO_CHAR(created_at, 'Day'),
      COUNT(*), COUNT(*) FILTER (WHERE result = 'WIN'), COUNT(*) FILTER (WHERE result = 'LOSS'), COALESCE(SUM(pnl), 0)
    FROM base WHERE created_at IS NOT NULL GROUP BY 1, 2
  ),
  with_win_rate AS (
    SELECT section, key, trades, wins, losses, pnl,
      ROUND(CASE WHEN trades > 0 THEN wins::NUMERIC / trades * 100 ELSE 0 END, 1) AS win_rate
    FROM grouped
  ),
  aggregated AS (
    SELECT section, json_object_agg(key, json_build_object(
      'trades', trades, 'wins', wins, 'losses', losses, 'pnl', pnl, 'win_rate', win_rate
    )) AS data
    FROM with_win_rate
    GROUP BY section
  )
  SELECT json_object_agg(section, data) INTO v_result FROM aggregated;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- ============= FIX GET_ANALYTICS_DETAIL =============
CREATE OR REPLACE FUNCTION public.get_analytics_detail(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result JSON;
  v_equity NUMERIC := 0;
  v_peak NUMERIC := 0;
  v_dd NUMERIC;
  v_dd_start TIMESTAMPTZ;
  v_in_drawdown BOOLEAN := false;
  v_dd_count INT := 0;
  v_dd_total NUMERIC := 0;
  v_dd_duration INT := 0;
  v_dd_duration_total INT := 0;
  v_max_dd NUMERIC := 0;
  v_avg_dd NUMERIC;
  v_avg_duration NUMERIC;
  v_risk_percent_avg NUMERIC;
  v_pos_size_avg NUMERIC;
  v_pos_size_max NUMERIC;
  v_total_exposure NUMERIC;
  v_rule_violations INT;
  v_prev_pnl NUMERIC;
  v_prev_risk NUMERIC;
  v_revenge INT := 0;
  v_early_exits INT := 0;
  v_late_entries INT := 0;
  v_overtrading INT := 0;
  v_psyc_rule_violations INT := 0;
  r RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.project WHERE id = p_project_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'User does not own this project';
  END IF;

  -- EQUITY CURVE
  WITH closed_pnl AS (
    SELECT created_at, pnl, id AS trade_id
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND pnl IS NOT NULL
    ORDER BY created_at
  ),
  running AS (
    SELECT created_at, pnl, trade_id,
      SUM(pnl) OVER (ORDER BY created_at) AS equity
    FROM closed_pnl
  )
  SELECT json_agg(json_build_object(
    'date', created_at, 'equity', ROUND(equity::NUMERIC, 2),
    'trade_id', trade_id, 'pnl', pnl
  ) ORDER BY created_at) INTO v_result
  FROM running;

  v_result := json_build_object('equity_curve', COALESCE(v_result, '[]'::json));

  -- DISTRIBUTIONS
  WITH closed_pnl AS (
    SELECT pnl::NUMERIC AS val FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND pnl IS NOT NULL
  ),
  closed_rr AS (
    SELECT rr::NUMERIC AS val FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND rr IS NOT NULL
  ),
  pnl_stats AS (
    SELECT MIN(val) AS min_v, MAX(val) AS max_v,
      COUNT(*) AS n, MAX(val) - MIN(val) AS range_v
    FROM closed_pnl
  ),
  rr_stats AS (
    SELECT MIN(val) AS min_v, MAX(val) AS max_v,
      COUNT(*) AS n, MAX(val) - MIN(val) AS range_v
    FROM closed_rr
  )
  SELECT
    json_build_object(
      'pnl_distribution', CASE WHEN p.n > 0 THEN
        (SELECT json_build_object('bins', json_agg(bin ORDER BY bin), 'counts', json_agg(cnt ORDER BY bin))
         FROM (
           SELECT ROUND((p.min_v + (p.range_v / 20) * gs)::NUMERIC, 2) AS bin,
             COUNT(*) FILTER (WHERE t.val >= p.min_v + (p.range_v / 20) * (gs - 1)
               AND (gs = 20 OR t.val < p.min_v + (p.range_v / 20) * gs)) AS cnt
           FROM generate_series(1, 20) gs
           CROSS JOIN closed_pnl t
           CROSS JOIN pnl_stats p
           GROUP BY gs, p.min_v, p.range_v
           ORDER BY gs
         ) sub
        ) ELSE '{"bins":[],"counts":[]}'::json END,
      'rr_distribution', CASE WHEN r.n > 0 THEN
        (SELECT json_build_object('bins', json_agg(bin ORDER BY bin), 'counts', json_agg(cnt ORDER BY bin))
         FROM (
           SELECT ROUND((r.min_v + (r.range_v / 20) * gs)::NUMERIC, 2) AS bin,
             COUNT(*) FILTER (WHERE t.val >= r.min_v + (r.range_v / 20) * (gs - 1)
               AND (gs = 20 OR t.val < r.min_v + (r.range_v / 20) * gs)) AS cnt
           FROM generate_series(1, 20) gs
           CROSS JOIN closed_rr t
           CROSS JOIN rr_stats r
           GROUP BY gs, r.min_v, r.range_v
           ORDER BY gs
         ) sub
        ) ELSE '{"bins":[],"counts":[]}'::json END
    ) INTO v_result
  FROM pnl_stats p, rr_stats r;

  v_result := json_build_object('pnl_distribution', (v_result->>'pnl_distribution')::json,
    'rr_distribution', (v_result->>'rr_distribution')::json);

  -- SCATTER DATA  
  WITH scatter AS (
    SELECT rr, pnl, result, pair, 0 AS hold_time_hours, NULL::NUMERIC AS confidence
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED'
      AND pnl IS NOT NULL
  )
  SELECT json_build_object(
    'pnl_vs_rr', COALESCE((SELECT json_agg(json_build_object(
      'rr', rr, 'pnl', pnl, 'result', result, 'pair', pair
    )) FROM scatter WHERE rr IS NOT NULL), '[]'::json),
    'pnl_vs_hold_time', COALESCE((SELECT json_agg(json_build_object(
      'pnl', pnl, 'hold_time_hours', hold_time_hours, 'result', result
    )) FROM scatter), '[]'::json),
    'win_loss_scatter', COALESCE((SELECT json_agg(json_build_object(
      'x', rr, 'y', pnl, 'result', result, 'pair', pair
    )) FROM scatter WHERE rr IS NOT NULL), '[]'::json),
    'confidence_vs_pnl', COALESCE((SELECT json_agg(json_build_object(
      'confidence', confidence, 'pnl', pnl, 'result', result
    )) FROM scatter), '[]'::json)
  ) INTO v_result;

  v_result := json_build_object('scatter_data', v_result);

  -- RISK ANALYTICS
  SELECT
    ROUND(AVG(risk_percent)::NUMERIC, 2),
    ROUND(AVG(position_size)::NUMERIC, 2),
    ROUND(MAX(position_size)::NUMERIC, 2),
    ROUND(SUM(position_size)::NUMERIC, 2),
    COUNT(*) FILTER (WHERE risk_percent > 2.0)
  INTO v_risk_percent_avg, v_pos_size_avg, v_pos_size_max, v_total_exposure, v_rule_violations
  FROM public.trade
  WHERE project_id = p_project_id AND deleted_at IS NULL;

  v_equity := 0; v_peak := 0; v_in_drawdown := false;
  v_dd_count := 0; v_dd_total := 0; v_dd_duration_total := 0; v_max_dd := 0;
  FOR r IN SELECT created_at, pnl FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED' AND pnl IS NOT NULL
    ORDER BY COALESCE(close_time, created_at)
  LOOP
    v_equity := v_equity + COALESCE(r.pnl, 0);
    IF v_equity > v_peak THEN
      v_peak := v_equity;
      IF v_in_drawdown THEN
        v_dd_duration_total := v_dd_duration_total + v_dd_duration;
        v_in_drawdown := false;
      END IF;
    ELSE
      v_dd := (v_peak - v_equity) / NULLIF(v_peak, 0);
      IF v_dd > v_max_dd THEN v_max_dd := v_dd; END IF;
      IF NOT v_in_drawdown THEN
        v_in_drawdown := true;
        v_dd_count := v_dd_count + 1;
        v_dd_duration := 0;
        v_dd_start := r.created_at;
      END IF;
      IF v_in_drawdown THEN
        v_dd_duration := v_dd_duration + 1;
      END IF;
    END IF;
  END LOOP;
  IF v_in_drawdown THEN
    v_dd_duration_total := v_dd_duration_total + v_dd_duration;
  END IF;
  v_avg_dd := CASE WHEN v_dd_count > 0 THEN ROUND((v_max_dd / GREATEST(v_dd_count, 1) * 100)::NUMERIC, 2) ELSE 0 END;
  v_avg_duration := CASE WHEN v_dd_count > 0 THEN ROUND((v_dd_duration_total::NUMERIC / v_dd_count)::NUMERIC, 1) ELSE 0 END;

  v_result := v_result || json_build_object('risk_analytics', json_build_object(
    'avg_risk_percent', v_risk_percent_avg,
    'avg_position_size', v_pos_size_avg,
    'max_position_size', v_pos_size_max,
    'total_exposure', v_total_exposure,
    'rr_distribution', (SELECT json_build_object('bins', json_agg(bin ORDER BY bin), 'counts', json_agg(cnt ORDER BY bin))
      FROM (
        SELECT ROUND((r.min_v + (r.range_v / 15) * gs)::NUMERIC, 2) AS bin,
          COUNT(*) FILTER (WHERE t.val >= r.min_v + (r.range_v / 15) * (gs - 1)
            AND (gs = 15 OR t.val < r.min_v + (r.range_v / 15) * gs)) AS cnt
        FROM (SELECT MIN(rr::NUMERIC) AS min_v, MAX(rr::NUMERIC) AS max_v, MAX(rr::NUMERIC) - MIN(rr::NUMERIC) AS range_v
              FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND rr IS NOT NULL) r
        CROSS JOIN generate_series(1, 15) gs
        CROSS JOIN LATERAL (SELECT rr::NUMERIC AS val FROM public.trade
          WHERE project_id = p_project_id AND deleted_at IS NULL AND rr IS NOT NULL) t
        GROUP BY gs, r.min_v, r.range_v ORDER BY gs
      ) sub),
    'drawdown_analysis', json_build_object(
      'max_dd', ROUND((v_max_dd * 100)::NUMERIC, 2),
      'avg_dd', v_avg_dd,
      'avg_dd_duration_days', v_avg_duration,
      'num_drawdowns', v_dd_count
    ),
    'risk_usage', json_build_object(
      'current', v_risk_percent_avg,
      'max', COALESCE((SELECT ROUND(MAX(risk_percent)::NUMERIC, 2) FROM public.trade
        WHERE project_id = p_project_id AND deleted_at IS NULL), 0),
      'avg', v_risk_percent_avg
    ),
    'rule_violations', v_rule_violations
  ));

  -- PSYCHOLOGY ANALYTICS
  v_prev_pnl := 0; v_prev_risk := 0;
  FOR r IN SELECT created_at::date AS trade_date, pnl, risk_percent, result, notes, emotion
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED'
    ORDER BY created_at
  LOOP
    IF v_prev_pnl < 0 AND r.risk_percent IS NOT NULL AND v_prev_risk > 0
       AND r.risk_percent > v_prev_risk * 1.2 THEN
      v_revenge := v_revenge + 1;
    END IF;
    v_prev_pnl := COALESCE(r.pnl, 0);
    v_prev_risk := COALESCE(r.risk_percent, 0);
  END LOOP;

  SELECT
    COALESCE(COUNT(*) FILTER (WHERE result = 'WIN' AND rr IS NOT NULL AND rr < 1.0), 0),
    COALESCE(COUNT(*) FILTER (WHERE notes ILIKE '%late%'), 0),
    COALESCE(COUNT(*) FILTER (WHERE risk_percent > 2.0), 0)
  INTO v_early_exits, v_late_entries, v_psyc_rule_violations
  FROM public.trade
  WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED';

  SELECT COUNT(*) INTO v_overtrading
  FROM (
    SELECT created_at::date, COUNT(*) AS cnt
    FROM public.trade
    WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED'
    GROUP BY created_at::date HAVING COUNT(*) > 5
  ) sub;

  v_result := v_result || json_build_object('psychology_analytics', json_build_object(
    'fomo_frequency', 0,
    'revenge_trades', v_revenge,
    'early_exits', v_early_exits,
    'late_entries', v_late_entries,
    'rule_violations', v_psyc_rule_violations,
    'missed_setups', 0,
    'overtrading_days', v_overtrading,
    'confidence_vs_results', '[]'::json,
    'emotion_breakdown', COALESCE((SELECT json_object_agg(
      COALESCE(emotion, 'Unknown'),
      json_build_object(
        'trades', COUNT(*), 'wins', COUNT(*) FILTER (WHERE result = 'WIN'),
        'pnl', COALESCE(SUM(pnl), 0),
        'win_rate', ROUND(COUNT(*) FILTER (WHERE result = 'WIN')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1)
      )
    ) FROM public.trade
      WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'CLOSED'
      GROUP BY emotion), '{}'::json),
    'psychology_trend', '[]'::json
  ));

  RETURN v_result;
END;
$$;

-- ============= FIX GET_MARKET_INTELLIGENCE_DASHBOARD =============
-- Column "bias" does not exist on watchlist_item; the column is "alias"
CREATE OR REPLACE FUNCTION public.get_market_intelligence_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
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
      'count', COUNT(*), 'bullish', COUNT(*) FILTER (WHERE alias = 'bullish'), 'bearish', COUNT(*) FILTER (WHERE alias = 'bearish')
    ) FROM public.watchlist_item WHERE project_id = p_project_id),
    'session_status', '{}'::jsonb,
    'correlation_summary', NULL,
    'usd_strength', 0,
    'volatility_summary', JSONB_BUILD_OBJECT('level', 'unknown', 'regime', NULL),
    'equity_summary', NULL,
    'commodity_summary', NULL,
    'bond_summary', NULL
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- ============= RECREATE SEARCH_KNOWLEDGE =============
CREATE OR REPLACE FUNCTION public.search_knowledge(p_project_id UUID, p_query TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH results AS (
    SELECT id, 'claim' AS entity_type, verbatim_text AS text, created_at
    FROM public.claim
    WHERE project_id = p_project_id AND deleted_at IS NULL
      AND verbatim_text ILIKE '%' || p_query || '%'
    UNION ALL
    SELECT id, 'concept', conceptual_term, created_at
    FROM public.concept
    WHERE project_id = p_project_id AND deleted_at IS NULL
      AND conceptual_term ILIKE '%' || p_query || '%'
    UNION ALL
    SELECT id, 'source', COALESCE(title, ''), created_at
    FROM public.source
    WHERE project_id = p_project_id AND deleted_at IS NULL
      AND (title ILIKE '%' || p_query || '%' OR normalized_text ILIKE '%' || p_query || '%')
    ORDER BY created_at DESC
    LIMIT 50
  )
  SELECT json_agg(json_build_object(
    'id', id, 'type', entity_type, 'text', text, 'created_at', created_at
  )) INTO v_result FROM results;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_knowledge(UUID, TEXT) TO authenticated, anon;

-- ============= RECREATE CALCULATE_POSITION_SIZE =============
CREATE OR REPLACE FUNCTION public.calculate_position_size(
  p_balance NUMERIC DEFAULT 10000,
  p_risk_percent NUMERIC DEFAULT 1.0,
  p_entry_price NUMERIC DEFAULT 0,
  p_stop_price NUMERIC DEFAULT 0,
  p_account_currency_usd_rate NUMERIC DEFAULT 1.0
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_risk_amount NUMERIC;
  v_price_distance NUMERIC;
  v_position_size NUMERIC;
  v_units NUMERIC;
BEGIN
  IF p_entry_price <= 0 OR p_stop_price <= 0 THEN
    RETURN json_build_object('error', 'Entry and stop prices must be positive');
  END IF;

  v_risk_amount := p_balance * (p_risk_percent / 100);
  v_price_distance := ABS(p_entry_price - p_stop_price);
  v_position_size := v_risk_amount / v_price_distance;
  v_units := v_position_size / p_account_currency_usd_rate;

  RETURN json_build_object(
    'position_size', ROUND(v_position_size::NUMERIC, 2),
    'units', ROUND(v_units::NUMERIC, 4),
    'risk_amount', ROUND(v_risk_amount::NUMERIC, 2),
    'risk_percent', p_risk_percent
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_position_size(NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated, anon;

-- ============= RECREATE GET_DISTINCT_AGENT_NAMES =============
CREATE OR REPLACE FUNCTION public.get_distinct_agent_names(p_project_id UUID)
RETURNS TABLE(agent_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT a.name
  FROM public.agent a
  WHERE a.project_id = p_project_id
    AND a.deleted_at IS NULL
  ORDER BY a.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_distinct_agent_names(UUID) TO authenticated, anon;
