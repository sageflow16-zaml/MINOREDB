-- 1. Concept: Enforce unique constraint and add index
ALTER TABLE concept ADD CONSTRAINT unique_conceptual_term UNIQUE (conceptual_term);

-- 2. Association: Enforce unique constraint
ALTER TABLE association ADD CONSTRAINT unique_claim_concept_association UNIQUE (claim_id, concept_id);

-- 3. ResearchQuestion: Enforce unique constraint for conflict link
ALTER TABLE research_question ADD CONSTRAINT unique_rq_conflict UNIQUE (conflict_id);

-- 4. Hypothesis: Enforce unique constraint for RQ link
ALTER TABLE hypothesis ADD CONSTRAINT unique_hypothesis_rq UNIQUE (research_question_id);

-- 5. Additional Indexes (if not already present from hardening)
CREATE INDEX IF NOT EXISTS idx_claim_source_id ON claim(source_id);
CREATE INDEX IF NOT EXISTS idx_association_claim_id ON association(claim_id);
CREATE INDEX IF NOT EXISTS idx_association_concept_id ON association(concept_id);
CREATE INDEX IF NOT EXISTS idx_interpretation_concept_id ON interpretation(concept_id);
CREATE INDEX IF NOT EXISTS idx_reconsideration_trigger_interpretation_id ON reconsideration_trigger(interpretation_id);
CREATE INDEX IF NOT EXISTS idx_research_question_conflict_id ON research_question(conflict_id);
CREATE INDEX IF NOT EXISTS idx_hypothesis_research_question_id ON hypothesis(research_question_id);
