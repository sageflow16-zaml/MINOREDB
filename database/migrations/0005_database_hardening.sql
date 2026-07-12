-- Add Unique Constraints
ALTER TABLE concept ADD CONSTRAINT unique_concept_term UNIQUE (conceptual_term);
ALTER TABLE association ADD CONSTRAINT unique_claim_concept UNIQUE (claim_id, concept_id);

-- Add Indexes for Foreign Keys and frequently queried columns
CREATE INDEX idx_claim_source_id ON claim(source_id);
CREATE INDEX idx_association_claim_id ON association(claim_id);
CREATE INDEX idx_association_concept_id ON association(concept_id);
CREATE INDEX idx_interpretation_concept_id ON interpretation(concept_id);
CREATE INDEX idx_research_question_conflict_id ON research_question(conflict_id);
CREATE INDEX idx_hypothesis_research_question_id ON hypothesis(research_question_id);

-- Enforce NOT NULL constraints on essential fields
ALTER TABLE claim ALTER COLUMN source_id SET NOT NULL;
ALTER TABLE association ALTER COLUMN claim_id SET NOT NULL;
ALTER TABLE association ALTER COLUMN concept_id SET NOT NULL;
ALTER TABLE interpretation ALTER COLUMN concept_id SET NOT NULL;
ALTER TABLE research_question ALTER COLUMN conflict_id SET NOT NULL;
ALTER TABLE hypothesis ALTER COLUMN research_question_id SET NOT NULL;
