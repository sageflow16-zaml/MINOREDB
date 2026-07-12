CREATE TABLE source (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    admissibility_status TEXT,
    origin_type TEXT,
    attribution TEXT,
    temporal_reference TEXT,
    location TEXT,
    provenance_confidence TEXT,
    source_metadata JSONB,
    provenance_metadata JSONB
);

CREATE TABLE claim (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_id UUID REFERENCES source(id),
    verbatim_text TEXT,
    source_location TEXT,
    semantic_classification TEXT,
    paraphrase_representation TEXT,
    contextual_boundary TEXT
);

CREATE TABLE concept (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conceptual_term TEXT,
    definition TEXT
);

CREATE TABLE association (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claim_id UUID REFERENCES claim(id),
    concept_id UUID REFERENCES concept(id),
    association_state TEXT,
    ambiguity_metric TEXT
);

CREATE TABLE conflict (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conflict_classification TEXT,
    contextual_applicability_check TEXT
);

CREATE TABLE interpretation (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concept_id UUID REFERENCES concept(id),
    interpretation_statement TEXT,
    reasoning_chain TEXT,
    interpretation_foundation TEXT
);

CREATE TABLE reconsideration_trigger (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    interpretation_id UUID REFERENCES interpretation(id),
    trigger_detail TEXT,
    trigger_classification TEXT
);

CREATE TABLE research_question (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    question_statement TEXT,
    inquiry_origin TEXT,
    domain_relevance TEXT,
    substantive_grounding TEXT
);

CREATE TABLE hypothesis (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    research_question_id UUID REFERENCES research_question(id),
    hypothesis_statement TEXT,
    variable_specification TEXT,
    measurement_specification TEXT,
    substantive_departure TEXT
);
