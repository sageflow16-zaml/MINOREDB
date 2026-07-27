-- Migration 00031: Source table RLS policies + create sources bucket
-- Source table has RLS enabled (from 00003) but no policies exist,
-- causing default-deny for all operations. Also ensures the storage
-- bucket 'sources' actually exists (00030 only created policies).

-- ── Storage bucket ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('sources', 'sources', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- ── Source table RLS policies ──

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'source' AND policyname = 'Users can view own sources') THEN
    CREATE POLICY "Users can view own sources"
      ON public.source FOR SELECT
      USING (
        project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
        AND deleted_at IS NULL
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'source' AND policyname = 'Users can insert sources') THEN
    CREATE POLICY "Users can insert sources"
      ON public.source FOR INSERT
      WITH CHECK (
        project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'source' AND policyname = 'Users can update own sources') THEN
    CREATE POLICY "Users can update own sources"
      ON public.source FOR UPDATE
      USING (
        project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid())
        AND deleted_at IS NULL
      );
  END IF;
END;
$$;
