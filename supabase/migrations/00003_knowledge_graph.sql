-- Migration 00003: Knowledge Graph tables
-- Source, Claim, Concept, Association, Conflict, Interpretation, etc.

-- ============= SOURCE =============
CREATE TABLE IF NOT EXISTS public.source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  raw_text TEXT,
  normalized_text TEXT,
  origin_type TEXT,
  attribution TEXT,
  admissibility_status TEXT,
  source_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_source_project_id ON public.source(project_id);
CREATE INDEX IF NOT EXISTS idx_source_deleted_at ON public.source(deleted_at);

ALTER TABLE public.source ENABLE ROW LEVEL SECURITY;

-- ============= CLAIM =============
CREATE TABLE IF NOT EXISTS public.claim (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.source(id) ON DELETE CASCADE,
  verbatim_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_claim_project_id ON public.claim(project_id);
CREATE INDEX IF NOT EXISTS idx_claim_source_id ON public.claim(source_id);
CREATE INDEX IF NOT EXISTS idx_claim_deleted_at ON public.claim(deleted_at);

ALTER TABLE public.claim ENABLE ROW LEVEL SECURITY;

-- ============= CONCEPT =============
CREATE TABLE IF NOT EXISTS public.concept (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  conceptual_term TEXT NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_concept_project_id ON public.concept(project_id);
CREATE INDEX IF NOT EXISTS idx_concept_deleted_at ON public.concept(deleted_at);

ALTER TABLE public.concept ENABLE ROW LEVEL SECURITY;

-- ============= ASSOCIATION =============
CREATE TABLE IF NOT EXISTS public.association (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES public.claim(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.concept(id) ON DELETE CASCADE,
  association_state TEXT,
  ambiguity_metric TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_association_project_id ON public.association(project_id);
CREATE INDEX IF NOT EXISTS idx_association_claim_id ON public.association(claim_id);
CREATE INDEX IF NOT EXISTS idx_association_concept_id ON public.association(concept_id);
CREATE INDEX IF NOT EXISTS idx_association_deleted_at ON public.association(deleted_at);

ALTER TABLE public.association ENABLE ROW LEVEL SECURITY;

-- ============= CONFLICT =============
CREATE TABLE IF NOT EXISTS public.conflict (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  conflict_classification TEXT NOT NULL,
  contextual_applicability_check TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_conflict_project_id ON public.conflict(project_id);
CREATE INDEX IF NOT EXISTS idx_conflict_deleted_at ON public.conflict(deleted_at);

ALTER TABLE public.conflict ENABLE ROW LEVEL SECURITY;

-- ============= CLAIM_CONFLICT (join) =============
CREATE TABLE IF NOT EXISTS public.claim_conflict (
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES public.claim(id) ON DELETE CASCADE,
  conflict_id UUID NOT NULL REFERENCES public.conflict(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  PRIMARY KEY (claim_id, conflict_id)
);

CREATE INDEX IF NOT EXISTS idx_claim_conflict_project_id ON public.claim_conflict(project_id);

CREATE INDEX IF NOT EXISTS idx_claim_conflict_claim_id ON public.claim_conflict(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_conflict_conflict_id ON public.claim_conflict(conflict_id);
CREATE INDEX IF NOT EXISTS idx_claim_conflict_deleted_at ON public.claim_conflict(deleted_at);

ALTER TABLE public.claim_conflict ENABLE ROW LEVEL SECURITY;

-- ============= INTERPRETATION =============
CREATE TABLE IF NOT EXISTS public.interpretation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.concept(id) ON DELETE CASCADE,
  interpretation_statement TEXT NOT NULL,
  reasoning_chain TEXT NOT NULL,
  interpretation_foundation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_interpretation_project_id ON public.interpretation(project_id);
CREATE INDEX IF NOT EXISTS idx_interpretation_concept_id ON public.interpretation(concept_id);
CREATE INDEX IF NOT EXISTS idx_interpretation_deleted_at ON public.interpretation(deleted_at);

ALTER TABLE public.interpretation ENABLE ROW LEVEL SECURITY;

-- ============= RESEARCH_QUESTION =============
CREATE TABLE IF NOT EXISTS public.research_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  conflict_id UUID NOT NULL REFERENCES public.conflict(id) ON DELETE CASCADE,
  question_statement TEXT NOT NULL,
  inquiry_origin TEXT NOT NULL,
  domain_relevance TEXT NOT NULL,
  substantive_grounding TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_question_project_id ON public.research_question(project_id);
CREATE INDEX IF NOT EXISTS idx_research_question_conflict_id ON public.research_question(conflict_id);
CREATE INDEX IF NOT EXISTS idx_research_question_deleted_at ON public.research_question(deleted_at);

ALTER TABLE public.research_question ENABLE ROW LEVEL SECURITY;

-- ============= HYPOTHESIS =============
CREATE TABLE IF NOT EXISTS public.hypothesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  research_question_id UUID NOT NULL REFERENCES public.research_question(id) ON DELETE CASCADE,
  hypothesis_statement TEXT NOT NULL,
  variable_specification TEXT NOT NULL,
  measurement_specification TEXT NOT NULL,
  substantive_departure TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_hypothesis_project_id ON public.hypothesis(project_id);
CREATE INDEX IF NOT EXISTS idx_hypothesis_research_question_id ON public.hypothesis(research_question_id);
CREATE INDEX IF NOT EXISTS idx_hypothesis_deleted_at ON public.hypothesis(deleted_at);

ALTER TABLE public.hypothesis ENABLE ROW LEVEL SECURITY;

-- ============= RECONSIDERATION_TRIGGER =============
CREATE TABLE IF NOT EXISTS public.reconsideration_trigger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.source(id),
  trigger_type TEXT NOT NULL,
  trigger_payload JSONB DEFAULT '{}',
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_reconsideration_trigger_project_id ON public.reconsideration_trigger(project_id);
CREATE INDEX IF NOT EXISTS idx_reconsideration_trigger_deleted_at ON public.reconsideration_trigger(deleted_at);

ALTER TABLE public.reconsideration_trigger ENABLE ROW LEVEL SECURITY;

-- ============= RLS POLICY GENERATION (applied to all project-scoped tables) =============
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['source', 'claim', 'concept', 'association', 'conflict', 'claim_conflict', 'interpretation', 'research_question', 'hypothesis', 'reconsideration_trigger'];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('
      CREATE POLICY "Users can view own project data" ON %I FOR SELECT
      USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()) AND deleted_at IS NULL);
    ', tbl);
    EXECUTE format('
      CREATE POLICY "Users can insert into own project" ON %I FOR INSERT
      WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
    ', tbl);
    EXECUTE format('
      CREATE POLICY "Users can update own project data" ON %I FOR UPDATE
      USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()) AND deleted_at IS NULL)
      WITH CHECK (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
    ', tbl);
    EXECUTE format('
      CREATE POLICY "Users can soft-delete own project data" ON %I FOR DELETE
      USING (project_id IN (SELECT id FROM public.project WHERE user_id = auth.uid()));
    ', tbl);
  END LOOP;
END;
$$;

-- ============= Updated_at triggers =============
CREATE TRIGGER set_source_updated_at BEFORE UPDATE ON public.source FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_claim_updated_at BEFORE UPDATE ON public.claim FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_concept_updated_at BEFORE UPDATE ON public.concept FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_association_updated_at BEFORE UPDATE ON public.association FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_conflict_updated_at BEFORE UPDATE ON public.conflict FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_interpretation_updated_at BEFORE UPDATE ON public.interpretation FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_research_question_updated_at BEFORE UPDATE ON public.research_question FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_hypothesis_updated_at BEFORE UPDATE ON public.hypothesis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
