-- Migration 00038: Fix remaining RLS policies
-- Adds missing policies for tables that had RLS enabled but no policies
-- Follows the existing project-based ownership model:
--   project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())

-- ============= 00013 KNOWLEDGE LIBRARY & AI =============
-- These 14 tables had RLS enabled but no policies (00013 only wired knowledge_category)

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_tag' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.knowledge_tag FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_concept_tag' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.knowledge_concept_tag FOR ALL USING (
      concept_id IN (SELECT id FROM public.knowledge_concept WHERE project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_source' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.knowledge_source FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_chunk' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.knowledge_chunk FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_revision' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.knowledge_revision FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_pinned_chat' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_pinned_chat FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_saved_prompt' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_saved_prompt FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_prompt_folder' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_prompt_folder FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_workflow' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_workflow FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_workflow_execution' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_workflow_execution FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agent_config' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_agent_config FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_memory' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_memory FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_citation' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_citation FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_token_usage' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_token_usage FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_audit_log' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_audit_log FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============= 00014 MARKET INTELLIGENCE =============
-- 00014 only wired economic_calendar_event; 00027 wired: market_regime, correlation_data,
-- liquidity_level, market_structure_point, session_analysis, watchlist, market_alert,
-- market_timeline, market_data_provider
-- Still missing: market_data_cache, market_event, watchlist_item

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_data_cache' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.market_data_cache FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_event' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.market_event FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watchlist_item' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.watchlist_item FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============= 00015 PLANNING & PORTFOLIO =============
-- 00015 only wired trading_plan; 00027 wired most:
-- checklist_template, checklist_execution, economic_event, daily_review, goal, reminder,
-- calendar_event, broker_profile, account, account_group, funding_history, portfolio_allocation,
-- transfer, portfolio_goal, account_health, account_rule, account_note, portfolio_snapshot
-- Still missing: balance_history, equity_history

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'balance_history' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.balance_history FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'equity_history' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.equity_history FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============= 00016 BROKER HUB =============
-- 00016 only wired broker_connection_new; the other 8 broker tables had no policies

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'broker_account' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.broker_account FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_history_new' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.sync_history_new FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'broker_log' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.broker_log FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'broker_health' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.broker_health FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'imported_trade' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.imported_trade FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'broker_position' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.broker_position FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'broker_order' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.broker_order FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'broker_analytics' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.broker_analytics FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============= 00018 QUANT RESEARCH =============
-- 00018 only wired quant_experiment; 00027 wired: quant_backtest_run, quant_backtest_trade,
-- quant_simulation_run, quant_walk_forward_run, quant_optimization_run, quant_edge_health_snapshot,
-- quant_research_notebook, quant_hypothesis_test
-- Still missing: quant_regime_performance

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quant_regime_performance' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.quant_regime_performance FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============= 00019 AI FOUNDATION =============
-- 00019 only wired ai_profile; 00032 wired: collector_status, collector_log, collector_schedule,
-- coaching_session; 00027 wired: note_template, sync_log, sync_conflict
-- Still missing: trade_evaluation, knowledge_link, detected_pattern, ai_insight,
-- ai_recommendation, ai_summary, ai_context_snapshot, ai_provider_config,
-- trade_import, broker_connection, trade_sync_log

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trade_evaluation' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.trade_evaluation FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_link' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.knowledge_link FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'detected_pattern' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.detected_pattern FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_insight' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_insight FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendation' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_recommendation FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_summary' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_summary FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_context_snapshot' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_context_snapshot FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_provider_config' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.ai_provider_config FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trade_import' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.trade_import FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'broker_connection' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.broker_connection FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trade_sync_log' AND policyname = 'project_access') THEN
    CREATE POLICY project_access ON public.trade_sync_log FOR ALL USING (
      project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
    );
  END IF;
END $$;
