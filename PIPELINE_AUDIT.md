# PIPELINE AUDIT REPORT
## Project Minore

**Status:** PROPOSED
**Auditor:** Lead Software Architect
**Date:** Sunday, 12 July 2026

---

## 1. Architecture Overview
Project Minore utilizes a FastAPI-based REST API with SQLAlchemy 2.0 (declarative mapping) for ORM, Pydantic v2 for data validation, and PostgreSQL as the persistence layer. The architecture follows a strict separation of concerns:
- **API Routes**: Input validation and response orchestration.
- **Service Layer**: Deterministic, business-logic-free orchestration of research stages.
- **CRUD Layer**: Data access and duplication prevention.
- **Model Layer**: SQLAlchemy declarative mapping with PG_UUID and JSONB support.

---

## 2. Data Flow
`Source (Upload)` -> `Normalization` -> `Claim Extraction` -> `Concept Association` -> `Epistemic Conflict Detection` -> `Interpretation Generation` -> `Research Question Formulation` -> `Hypothesis Generation`.

---

## 3. Entity Relationships
- `Source` -> 1:N `Claim`
- `Claim` -> M:N `Concept` (via `Association`)
- `Claim` -> 1:1 `Interpretation`
- `Claim` -> M:N `Conflict`
- `Conflict` -> 1:1 `ResearchQuestion`
- `ResearchQuestion` -> 1:1 `Hypothesis`
- `Interpretation` -> 1:N `ReconsiderationTrigger`

---

## 4. Missing Constraints & Technical Debt
- **Missing Database Constraints**:
    - `Concept.conceptual_term` should have a `UNIQUE` constraint in the database schema. Currently, duplication prevention relies on the CRUD layer.
    - `Association` table lacks a `UNIQUE` constraint on `(claim_id, concept_id)`.
- **Technical Debt**:
    - **Regex Limitations**: The deterministic extraction (`extract_concept_candidates`) is fragile for complex phrasing and relies purely on capitalization.
    - **Performance**: Epistemic conflict detection uses an $O(N^2)$ algorithm (all-pairs comparison), which will degrade rapidly with large claim sets per source.
    - **Sync/Async**: FastAPI routes are synchronous, but `upload_source` is asynchronous. This mixture needs careful management in a production load.

---

## 5. Potential Bugs
- **Conflict detection**: The `has_polarity_conflict` rule might produce false positives in claims containing "buy" or "sell" as common verbs rather than trading positions.
- **Interpretation Generation**: The template is highly constrained; if `Association` concepts are empty, it defaults to "none", which may trigger invalid downstream logic.
- **Migrations**: Migrations are provided as raw SQL files. There is no automated management (e.g., Alembic `env.py` integration is not fully configured).

---

## 6. Recommended Fixes
1. **Database**: Implement `UNIQUE` indexes for `Concept.conceptual_term` and composite unique index for `Association(claim_id, concept_id)`.
2. **Conflict Engine**: Refine polarity detection to ignore common stop-words or idiomatic phrasing.
3. **Performance**: Implement a pre-filtering step in conflict detection (e.g., only compare claims sharing at least two concepts).
4. **Migrations**: Transition raw SQL migrations to an automated Alembic framework to track revision history correctly.

---

## 7. Production Readiness Score (0–100)
**75 / 100**

**Rationale**:
- **Strengths**: Solid deterministic architecture, clean separation of concerns, robust duplication prevention at the CRUD level.
- **Weaknesses**: Performance issues with the conflict engine, lack of automated schema management, and reliance on simple regex for complex NLP tasks.
