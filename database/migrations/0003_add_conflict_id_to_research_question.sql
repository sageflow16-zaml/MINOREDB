ALTER TABLE research_question
ADD COLUMN conflict_id UUID REFERENCES conflict(id);
