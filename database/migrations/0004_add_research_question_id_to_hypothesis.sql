ALTER TABLE hypothesis
ADD COLUMN research_question_id UUID REFERENCES research_question(id);
