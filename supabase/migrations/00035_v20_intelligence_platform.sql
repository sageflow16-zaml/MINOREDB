-- Migration 00035: V2.0 Intelligence Platform
-- Adds: search_memories RPC, performance indexes, dashboard KPI fixes

-- ============= SEARCH MEMORIES RPC =============
CREATE OR REPLACE FUNCTION public.search_memories(
  query_embedding vector(1536),
  match_threshold double precision DEFAULT 0.6,
  match_count int DEFAULT 10,
  p_project_id uuid DEFAULT NULL
) RETURNS TABLE (
  id uuid, key text, value text, category text, memory_type text,
  text_value text, importance int, similarity double precision
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id, m.key, m.value, m.category, m.memory_type,
    m.text_value, m.importance,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM public.ai_memory m
  WHERE (p_project_id IS NULL OR m.project_id = p_project_id)
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============= PERFORMANCE INDEXES =============
CREATE INDEX IF NOT EXISTS idx_ai_memory_project_embedding ON public.ai_memory USING ivfflat (embedding vector_cosine_ops) WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_document_chunk_project_embedding ON public.ai_document_chunk USING ivfflat (embedding vector_cosine_ops) WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_learning_event_project_created ON public.learning_event(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_event_type ON public.learning_event(event_type);
CREATE INDEX IF NOT EXISTS idx_trade_project_created ON public.trade(project_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trade_status ON public.trade(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trade_result ON public.trade(project_id, result) WHERE deleted_at IS NULL;

-- ============= UPDATED DASHBOARD STATS RPC =============
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_project_id uuid)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  result JSONB;
  t_count INT; w_count INT; l_count INT; o_count INT;
  t_pnl NUMERIC; t_wins NUMERIC; t_losses NUMERIC; w_rate NUMERIC; a_rr NUMERIC;
  expectancy NUMERIC; profit_factor NUMERIC; max_dd NUMERIC;
  g_nodes INT; g_edges INT;
BEGIN
  SELECT COUNT(*) INTO t_count FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL;
  SELECT COUNT(*) INTO w_count FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND result = 'WIN';
  SELECT COUNT(*) INTO l_count FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND result = 'LOSS';
  SELECT COUNT(*) INTO o_count FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND status = 'OPEN';
  SELECT COALESCE(SUM(pnl), 0) INTO t_pnl FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL;
  SELECT COALESCE(SUM(pnl), 0) INTO t_wins FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND result = 'WIN';
  SELECT COALESCE(SUM(ABS(pnl)), 0) INTO t_losses FROM public.trade WHERE project_id = p_project_id AND deleted_at IS NULL AND result = 'LOSS';
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

  result := jsonb_build_object(
    'total_trades', t_count, 'total_pnl', t_pnl, 'win_rate', w_rate,
    'avg_rr', a_rr, 'open_trades', o_count,
    'expectancy', expectancy, 'profit_factor', profit_factor,
    'max_drawdown', COALESCE(max_dd, 0),
    'graph_nodes', g_nodes, 'graph_edges', g_edges
  );
  RETURN result;
END;
$$;
