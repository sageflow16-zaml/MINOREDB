-- Migration 00046: fix get_distinct_agent_names — public.agent never existed.
-- Agent names live in agent_task / agent_execution (both have agent_name).
CREATE OR REPLACE FUNCTION public.get_distinct_agent_names(p_project_id UUID)
RETURNS TABLE(agent_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.agent_name
  FROM public.agent_task t
  WHERE t.project_id = p_project_id AND t.agent_name IS NOT NULL
  UNION
  SELECT DISTINCT e.agent_name
  FROM public.agent_execution e
  WHERE e.project_id = p_project_id AND e.agent_name IS NOT NULL
  ORDER BY 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_distinct_agent_names(UUID) TO authenticated, anon;
