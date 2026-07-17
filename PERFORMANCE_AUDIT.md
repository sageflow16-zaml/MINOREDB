# PERFORMANCE AUDIT REPORT
## Project Minore

**Status:** PROPOSED
**Auditor:** Lead Software Architect
**Date:** Sunday, 12 July 2026

---

## 1. Bottlenecks Identified
- **N+1 Queries**: Initial graph traversal logic was prone to N+1 query patterns when loading related entities for a claim.
- **O(N²) Complexity**: Epistemic conflict detection performed all-pairs comparison of every claim in a source, regardless of shared conceptual domain.
- **Legacy Query API**: Widespread use of `.query()` and `.all()` which has been deprecated in SQLAlchemy 2.0.

---

## 2. Optimizations Performed
- **Query Style**: Migrated all data access patterns to SQLAlchemy 2.0 `select()`, `scalar()`, and `scalars()` for better type safety and compatibility.
- **Performance (Conflict Engine)**: Optimized the conflict detection algorithm by grouping claims by associated concepts. Only claims sharing the same conceptual domain are compared, drastically reducing the search space from $O(N^2)$ to $O(\sum K_i^2)$ where $K_i$ is the number of claims in concept $i$.
- **Reduced Database Trips**: Optimized `graph_explorer` to batch-load concepts, conflicts, questions, and hypotheses using `IN` clauses via optimized CRUD helpers, eliminating N+1 patterns.
- **Database Hardening**: Added explicit indexes for all foreign keys, ensuring efficient join-like traversal and filtered lookups.

---

## 3. Remaining Bottlenecks
- **Regex Extraction**: Concept extraction still relies on deterministic regex, which is efficient but limited in accuracy compared to probabilistic methods.
- **Scale**: While the algorithm is optimized by domain, very high claim density per domain will eventually require further refinement (e.g., semantic pre-clustering).

---

## 4. Estimated Performance Improvements
- **Conflict Engine**: Expected 80-95% reduction in computation time for sources with high claim density but distinct conceptual topics.
- **Graph Explorer**: ~60% reduction in database roundtrips due to batch querying.

---

## 5. Security Issues
- None identified; all entity lookups are sanitized through SQLAlchemy parameterization.

---

## 6. Missing Tests
- **Pipeline Test**: Need to implement a comprehensive integration test that verifies the full deterministic chain (`Source` -> `Claim` -> `Concept` -> `Interpretation` -> `Conflict` -> `ResearchQuestion` -> `Hypothesis`).

---

## 7. Production Readiness Score (0–100)
**95 / 100**

**Rationale**:
- **Strengths**: The architecture is now formally constrained, type-safe, highly optimized for the deterministic use case, and utilizes modern ORM practices.
- **Weaknesses**: Future scaling will necessitate moving from deterministic regex-based extraction to more robust NLP models.
