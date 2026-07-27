-- Migration 00023: Fix ROUND type error in get_dashboard_stats
-- Uses pre-computed variables for win rate calculation
-- to avoid double precision type resolution in subquery context

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
    'wins', COALESCE((SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result = 'WIN' AND deleted_at IS NULL), 0),
    'losses', COALESCE((SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result = 'LOSS' AND deleted_at IS NULL), 0),
    'open_trades', COALESCE((SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND status = 'OPEN' AND deleted_at IS NULL), 0),
    'win_rate', COALESCE(
      ROUND(
        (
          (SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result = 'WIN' AND deleted_at IS NULL)::numeric
          / NULLIF((SELECT COUNT(*) FROM public.trade WHERE project_id = p_project_id AND result IN ('WIN','LOSS') AND deleted_at IS NULL), 0)
          * 100
        )::numeric, 1
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
