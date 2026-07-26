-- Migration 00002: Project table
-- Foundation for all project-scoped data

CREATE TABLE IF NOT EXISTS public.project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_user_id ON public.project(user_id);
CREATE INDEX IF NOT EXISTS idx_project_deleted_at ON public.project(deleted_at);

ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.project FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can insert own projects"
  ON public.project FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON public.project FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can soft-delete own projects"
  ON public.project FOR DELETE
  USING (user_id = auth.uid());

CREATE TRIGGER set_project_updated_at
  BEFORE UPDATE ON public.project
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Soft delete trigger: BEFORE DELETE → SET deleted_at = NOW()
CREATE OR REPLACE FUNCTION public.soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: soft_delete trigger applied individually per table that needs it
