-- Migration 00044: fix search_knowledge — source table has no "title" column
-- (title lives in source_metadata->>'original_name' or raw_text)
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
    SELECT id, 'source', COALESCE(source_metadata->>'original_name', raw_text, ''), created_at
    FROM public.source
    WHERE project_id = p_project_id AND deleted_at IS NULL
      AND (COALESCE(source_metadata->>'original_name', '') ILIKE '%' || p_query || '%'
           OR raw_text ILIKE '%' || p_query || '%'
           OR normalized_text ILIKE '%' || p_query || '%')
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
