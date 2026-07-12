# INTEGRATION TEST CHECKLIST: DETERMINISTIC PIPELINE
## Project Minore

**Status:** PROPOSED

This checklist verifies the deterministic research pipeline from Source intake to Research Question generation.

---

## 1. TEST SETUP
- **Environment**: PostgreSQL running, FastAPI server started, Database clean.
- **Tools**: `curl`, `httpie`, or Swagger UI (`/docs`).

---

## 2. PIPELINE CHECKLIST

### Step 1: Upload Source
- **Endpoint**: `POST /api/v1/sources/upload`
- **Input**: Multipart form-data with `text` field (e.g., "The Fair Value Gap increases above the support.")
- **Expected API Response**: `201 Created` with `SourceRead` object (UUID present).
- **Expected DB Changes**: New row in `source` table with `raw_text` and `normalized_text` populated.
- **Failure Conditions**: Invalid file type, missing content.

### Step 2: Normalize Text (Implicit in Step 1)
- **Validation**: Verify `normalized_text` field in DB source record matches normalization rules (e.g., trimmed whitespace).

### Step 3: Extract Claims
- **Endpoint**: `POST /api/v1/sources/{source_id}/extract-claims`
- **Input**: `{source_id}` from Step 1.
- **Expected API Response**: `200 OK` with `{"source_id": "...", "claims_created": N}`.
- **Expected DB Changes**: N new rows in `claim` table associated with `source_id`.
- **Failure Conditions**: `source_id` not found, source has no text.

### Step 4: Extract Concepts
- **Endpoint**: `POST /api/v1/claims/{claim_id}/extract-concepts`
- **Input**: `{claim_id}` from Step 3.
- **Expected API Response**: `200 OK` with `{"claim_id": "...", "concepts_created": N}`.
- **Expected DB Changes**:
    - New rows in `concept` table (if new concepts found).
    - New rows in `association` table linking Claim to Concept.
- **Failure Conditions**: `claim_id` not found.

### Step 5: Generate Interpretation
- **Endpoint**: `POST /api/v1/claims/{claim_id}/interpret`
- **Input**: `{claim_id}` from Step 3.
- **Expected API Response**: `200 OK` with `{"claim_id": "...", "interpretation_id": "...", "status": "created"}`.
- **Expected DB Changes**: New row in `interpretation` table linked to associated concepts.
- **Failure Conditions**: No concepts associated with claim.

### Step 6: Detect Conflicts
- **Endpoint**: `POST /api/v1/sources/{source_id}/detect-conflicts`
- **Input**: `{source_id}` from Step 1.
- **Expected API Response**: `200 OK` with `{"source_id": "...", "conflicts_created": N}`.
- **Expected DB Changes**: New row in `conflict` table (if opposite polarity terms found across claims).
- **Failure Conditions**: `source_id` not found.

### Step 7: Generate Research Question
- **Endpoint**: `POST /api/v1/conflicts/{conflict_id}/generate-question`
- **Input**: `{conflict_id}` from Step 6.
- **Expected API Response**: `200 OK` with `{"conflict_id": "...", "research_question_id": "...", "status": "created"}`.
- **Expected DB Changes**: New row in `research_question` table linked to `conflict_id`.
- **Failure Conditions**: `conflict_id` not found.

---

## 3. FINAL VERIFICATION
After completing all steps, query the DB to ensure all linked entities exist:
`source -> claim -> association -> concept`
`claim -> interpretation`
`claim1 + claim2 -> conflict -> research_question`
