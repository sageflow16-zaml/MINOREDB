-- Migration 00033: RLS policies for Research/Chat + Document tables
-- These tables have RLS enabled but no policies, causing default-deny.

-- ── ai_conversation policies ──

CREATE POLICY "Users can view own conversations"
  ON public.ai_conversation FOR SELECT
  USING (
    project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create conversations"
  ON public.ai_conversation FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own conversations"
  ON public.ai_conversation FOR UPDATE
  USING (
    project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
  );

-- ── ai_message policies ──

CREATE POLICY "Users can view own messages"
  ON public.ai_message FOR SELECT
  USING (
    project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create messages"
  ON public.ai_message FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
  );

-- ── ai_document_ingestion policies ──

CREATE POLICY "Users can view own document ingestions"
  ON public.ai_document_ingestion FOR SELECT
  USING (
    project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create document ingestions"
  ON public.ai_document_ingestion FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
  );

-- ── ai_document_chunk policies ──

CREATE POLICY "Users can view own document chunks"
  ON public.ai_document_chunk FOR SELECT
  USING (
    project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create document chunks"
  ON public.ai_document_chunk FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
  );
