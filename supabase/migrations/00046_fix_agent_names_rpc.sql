-- Migration 00046: fix get_distinct_agent_names — public.agent never existed.
-- Agent names live in agent_task / agent_execution (both have agent_name).
CREATE OR REPLACE FUNCTION public.get_distinct_agent_names(p_project_id UUID)
RETURNS TABLE(agent_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT agent_name
  FROM public.agent_task
  WHERE project_id = p_project_id AND agent_name IS NOT NULL
  UNION
  SELECT DISTINCT agent_name
  FROM public.agent_execution
  WHERE project_id = p_project_id AND agent_name IS NOT NULL
  ORDER BY agent_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_distinct_agent_names(UUID) TO authenticated, anon;
