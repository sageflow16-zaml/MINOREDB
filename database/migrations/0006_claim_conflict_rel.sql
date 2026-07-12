CREATE TABLE claim_conflict (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    conflict_id UUID NOT NULL REFERENCES conflict(id) ON DELETE CASCADE,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(claim_id, conflict_id)
);

CREATE INDEX idx_claim_conflict_claim_id ON claim_conflict(claim_id);
CREATE INDEX idx_claim_conflict_conflict_id ON claim_conflict(conflict_id);
