-- Migration 00026: Planning schema upgrade — add missing columns, RLS, and dashboard RPC

-- ============= TRADING PLAN =============
ALTER TABLE public.trading_plan
  ADD COLUMN IF NOT EXISTS market_bias TEXT,
  ADD COLUMN IF NOT EXISTS watchlist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pairs_to_avoid JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS key_levels JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS liquidity_areas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS expected_scenarios JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS invalidation_levels JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS session_goals JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_allocation JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- ============= CHECKLIST TEMPLATE =============
ALTER TABLE public.checklist_template
  ADD COLUMN IF NOT EXISTS checklist_type TEXT;

UPDATE public.checklist_template SET checklist_type = category WHERE checklist_type IS NULL AND category IS NOT NULL;

-- ============= CHECKLIST EXECUTION =============
ALTER TABLE public.checklist_execution
  ADD COLUMN IF NOT EXISTS execution_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

UPDATE public.checklist_execution SET is_completed = (status = 'completed') WHERE is_completed IS NULL;

-- ============= ECONOMIC EVENT =============
ALTER TABLE public.economic_event
  ADD COLUMN IF NOT EXISTS event_time TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS event_category TEXT,
  ADD COLUMN IF NOT EXISTS impact_level TEXT,
  ADD COLUMN IF NOT EXISTS event_name TEXT,
  ADD COLUMN IF NOT EXISTS previous_value TEXT,
  ADD COLUMN IF NOT EXISTS forecast_value TEXT,
  ADD COLUMN IF NOT EXISTS actual_value TEXT;

UPDATE public.economic_event SET impact_level = impact WHERE impact_level IS NULL AND impact IS NOT NULL;
UPDATE public.economic_event SET event_name = title WHERE event_name IS NULL AND title IS NOT NULL;
UPDATE public.economic_event SET previous_value = previous WHERE previous_value IS NULL AND previous IS NOT NULL;
UPDATE public.economic_event SET forecast_value = forecast WHERE forecast_value IS NULL AND forecast IS NOT NULL;
UPDATE public.economic_event SET actual_value = actual WHERE actual_value IS NULL AND actual IS NOT NULL;

-- ============= DAILY REVIEW =============
ALTER TABLE public.daily_review
  ADD COLUMN IF NOT EXISTS daily_summary TEXT,
  ADD COLUMN IF NOT EXISTS best_trade TEXT,
  ADD COLUMN IF NOT EXISTS worst_trade TEXT,
  ADD COLUMN IF NOT EXISTS mistakes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lessons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS next_improvements JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS discipline_score INTEGER,
  ADD COLUMN IF NOT EXISTS adherence_to_plan INTEGER,
  ADD COLUMN IF NOT EXISTS psychology_rating INTEGER,
  ADD COLUMN IF NOT EXISTS overall_rating INTEGER;

-- ============= GOAL =============
ALTER TABLE public.goal
  ADD COLUMN IF NOT EXISTS goal_type TEXT,
  ADD COLUMN IF NOT EXISTS target_value NUMERIC,
  ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS progress_history JSONB DEFAULT '[]'::jsonb;

UPDATE public.goal SET goal_type = category WHERE goal_type IS NULL AND category IS NOT NULL;

-- ============= REMINDER =============
ALTER TABLE public.reminder
  ADD COLUMN IF NOT EXISTS reminder_type TEXT,
  ADD COLUMN IF NOT EXISTS reminder_days JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE public.reminder SET is_active = NOT is_completed WHERE is_active IS NULL;

-- ============= CALENDAR EVENT =============
ALTER TABLE public.calendar_event
  ADD COLUMN IF NOT EXISTS event_time TEXT,
  ADD COLUMN IF NOT EXISTS end_time TEXT,
  ADD COLUMN IF NOT EXISTS recurrence TEXT,
  ADD COLUMN IF NOT EXISTS metadata_json JSONB DEFAULT '{}'::jsonb;

-- ============= RLS POLICIES =============
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'checklist_template' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.checklist_template FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'checklist_execution' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.checklist_execution FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'economic_event' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.economic_event FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'daily_review' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.daily_review FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'goal' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.goal FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'reminder' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.reminder FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE tablename = 'calendar_event' AND policyname = 'project_access';
  IF NOT FOUND THEN
    CREATE POLICY project_access ON public.calendar_event FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============= UPDATED PLANNING DASHBOARD RPC =============
CREATE OR REPLACE FUNCTION public.get_planning_dashboard(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_today_plan JSONB;
  v_goals JSONB;
  v_goals_by_type JSONB;
  v_active_goals_count INT;
  v_completed_goals_count INT;
  v_goal_progress NUMERIC;
  v_active_reminders JSONB;
  v_today_events JSONB;
BEGIN
  SELECT row_to_json(tp.*)::jsonb INTO v_today_plan
  FROM public.trading_plan tp
  WHERE tp.project_id = p_project_id
    AND tp.plan_date = v_today
    AND tp.deleted_at IS NULL
  ORDER BY tp.created_at DESC
  LIMIT 1;

  SELECT
    COALESCE(JSONB_AGG(row_to_json(g.*)::jsonb) FILTER (WHERE g.status = 'active'), '[]'::jsonb),
    COALESCE(JSONB_AGG(row_to_json(g.*)::jsonb) FILTER (WHERE g.status = 'completed'), '[]'::jsonb)
  INTO v_goals, v_goals_by_type
  FROM public.goal g
  WHERE g.project_id = p_project_id;

  SELECT COUNT(*) FILTER (WHERE status = 'active') INTO v_active_goals_count FROM public.goal WHERE project_id = p_project_id;
  SELECT COUNT(*) FILTER (WHERE status = 'completed') INTO v_completed_goals_count FROM public.goal WHERE project_id = p_project_id;
  SELECT CASE WHEN COUNT(*) > 0 THEN AVG(COALESCE(current_value, 0) / NULLIF(target_value, 0) * 100) ELSE 0 END INTO v_goal_progress
  FROM public.goal WHERE project_id = p_project_id AND target_value > 0;

  SELECT COALESCE(JSONB_AGG(row_to_json(r.*)::jsonb ORDER BY r.reminder_time), '[]'::jsonb) INTO v_active_reminders
  FROM public.reminder r
  WHERE r.project_id = p_project_id AND r.is_active = true;

  SELECT COALESCE(JSONB_AGG(
    jsonb_build_object(
      'type', 'calendar',
      'data', row_to_json(ce.*)::jsonb
    ) ORDER BY ce.event_date
  ), '[]'::jsonb) INTO v_today_events
  FROM public.calendar_event ce
  WHERE ce.project_id = p_project_id AND ce.event_date::DATE = v_today;

  RETURN JSONB_BUILD_OBJECT(
    'today', v_today::TEXT,
    'has_plan', v_today_plan IS NOT NULL,
    'plan_status', CASE WHEN v_today_plan IS NOT NULL THEN v_today_plan->>'status' ELSE NULL END,
    'active_goals_count', v_active_goals_count,
    'completed_goals_count', v_completed_goals_count,
    'goal_progress', v_goal_progress,
    'goals_by_type', JSONB_BUILD_OBJECT('active', v_goals, 'completed', v_goals_by_type),
    'active_reminders', v_active_reminders,
    'today_events', v_today_events
  );
END;
$$;
