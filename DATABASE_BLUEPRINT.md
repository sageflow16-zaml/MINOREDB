# DATABASE BLUEPRINT
## Project Minore

**Status:** PROPOSED

---

## 1. Purpose

This Database Blueprint defines the logical storage responsibilities for Project Minore. It serves as an architectural bridge between the `LOGICAL_INFORMATION_MODEL.md` and the future Physical Data Model. Its primary goal is to identify the logical entities that must be persisted to ensure the project's core principles—specifically provenance integrity and epistemic separation—are maintained.

---

## 2. Logical Storage Entities

### 2.1 Source Entity
- **Name**: Source Entity
- **Purpose**: To persist the identity and provenance of research inputs.
- **Logical Responsibility**: Store source metadata, origin types, and admissibility status.
- **Authority Sources**: `CANONICAL_OBJECT_CATALOG.md`, `PROJECT_DOMAIN_MODEL.md`

### 2.2 Claim Entity
- **Name**: Claim Entity
- **Purpose**: To persist atomic propositions extracted from Sources.
- **Logical Responsibility**: Store verbatim text, source location markers, and semantic classification tags.
- **Authority Sources**: `CANONICAL_OBJECT_CATALOG.md`, `PROJECT_DOMAIN_MODEL.md`

### 2.3 Concept Entity
- **Name**: Concept Entity
- **Purpose**: To persist the project's conceptual vocabulary.
- **Logical Responsibility**: Store conceptual terms and their associated definitions.
- **Authority Sources**: `CANONICAL_OBJECT_CATALOG.md`, `PROJECT_DOMAIN_MODEL.md`

### 2.4 Association Entity
- **Name**: Association Entity
- **Purpose**: To persist the mapping between Claims and Concepts.
- **Logical Responsibility**: Store the linkage between a specific Claim and a specific Concept.
- **Authority Sources**: `CANONICAL_OBJECT_CATALOG.md`, `PROJECT_DOMAIN_MODEL.md`

### 2.5 Conflict Entity
- **Name**: Conflict Entity
- **Purpose**: To persist the identification of semantic divergence.
- **Logical Responsibility**: Store the relationship between conflicting Claims and the classification of the conflict.
- **Authority Sources**: `CANONICAL_OBJECT_CATALOG.md`, `PROJECT_DOMAIN_MODEL.md`

### 2.6 Interpretation Entity
- **Name**: Interpretation Entity
- **Purpose**: To persist the authoritative reference understanding of a Concept.
- **Logical Responsibility**: Store the interpretation statement, the associated reasoning chain, and the supporting foundation of Claims.
- **Authority Sources**: `CANONICAL_OBJECT_CATALOG.md`, `PROJECT_DOMAIN_MODEL.md`

### 2.7 Reconsideration Trigger Entity
- **Name**: Reconsideration Trigger Entity
- **Purpose**: To persist the events that prompt interpretation revision.
- **Logical Responsibility**: Store the trigger event details and its classification.
- **Authority Sources**: `CANONICAL_OBJECT_CATALOG.md`, `PROJECT_DOMAIN_MODEL.md`

### 2.8 Research Question Entity
- **Name**: Research Question Entity
- **Purpose**: To persist formalized inquiries.
- **Logical Responsibility**: Store the research question statement and its inquiry origins.
- **Authority Sources**: `CANONICAL_OBJECT_CATALOG.md`, `PROJECT_DOMAIN_MODEL.md`

### 2.9 Hypothesis Entity
- **Name**: Hypothesis Entity
- **Purpose**: To persist operationalized predictive propositions.
- **Logical Responsibility**: Store the hypothesis statement and its operational variable specifications.
- **Authority Sources**: `CANONICAL_OBJECT_CATALOG.md`, `PROJECT_DOMAIN_MODEL.md`

---

## 3. Explicit Non-Goals

The following are strictly excluded from this blueprint:
- **Physical Schema**: Definition of tables, columns, primary keys, or indices.
- **Technology Selection**: Choice of database engine, language, or storage format.
- **Implementation Mechanisms**: Versioning strategies, append-only logic, or specific link types.
- **Cardinality/Multiplicity**: Definition of the numerical relationship between entities.
