# CANONICAL OBJECT CATALOG
## Project Minore

**Status:** PROPOSED

---

## 1. SOURCE

- **Name**: Source
- **Purpose**: Registry of research inputs (e.g., videos, transcriptions, papers, researcher notes) used as the foundation for knowledge extraction.
- **Authority Source**: Decision A1 (Research Input Admissibility and Provenance)
- **Created By**: Researcher (Admission)
- **Consumed By**: Claim Extraction Domain
- **Lifecycle Stage**: [SOURCE ADMISSION]
- **Notes**: Includes provenance metadata and admissibility status.

---

## 2. CLAIM

- **Name**: Claim
- **Purpose**: Atomic, self-contained, and immutable propositions extracted from a Source.
- **Authority Source**: Decision A2 (Claim Extraction Procedure)
- **Created By**: Extraction Process
- **Consumed By**: Concept & Association Domain, Epistemic Conflict Domain
- **Lifecycle Stage**: [CLAIM EXTRACTION]
- **Notes**: Includes multi-dimensional semantic classification tags and source location details.

---

## 3. CONCEPT

- **Name**: Concept
- **Purpose**: Semantic terms and definitions used to cluster and organize related Claims.
- **Authority Source**: Decision A4 (Concept Association)
- **Created By**: Researcher (Association)
- **Consumed By**: Epistemic Conflict Domain, Researcher Interpretation Domain
- **Lifecycle Stage**: [CONCEPT ASSOCIATION]
- **Notes**: Forms the project's conceptual vocabulary.

---

## 4. ASSOCIATION

- **Name**: Association
- **Purpose**: The mapping between Claims and Concepts.
- **Authority Source**: Decision A4 (Concept Association)
- **Created By**: Researcher (Association)
- **Consumed By**: Epistemic Conflict Domain, Researcher Interpretation Domain
- **Lifecycle Stage**: [CONCEPT ASSOCIATION]
- **Notes**: Can exist in an "association-pending" state and may include ambiguity metrics.

---

## 5. CONFLICT

- **Name**: Conflict
- **Purpose**: Logical relationships of mutual exclusivity or semantic divergence (Variation, Tension, Contradiction) between Claims associated with the same Concept.
- **Authority Source**: Decision A5 (Contradiction Handling Procedure)
- **Created By**: Conflict Analysis
- **Consumed By**: Researcher Interpretation Domain
- **Lifecycle Stage**: [EPISTEMIC CONFLICT]
- **Notes**: Preserves semantic divergence without forcing immediate reconciliation.

---

## 6. INTERPRETATION

- **Name**: Interpretation
- **Purpose**: The current authoritative reference understanding of a Concept, including its reasoning and supporting claims.
- **Authority Source**: Decision A6 (Researcher Interpretation Construction)
- **Created By**: Researcher (Interpretation Construction)
- **Consumed By**: Research Inquiry Domain, Hypothesis Formation Domain
- **Lifecycle Stage**: [REFERENCE INTERPRETATION]
- **Notes**: Includes an explicit reasoning chain and an Interpretation Foundation (linked Claims).

---

## 7. RECONSIDERATION TRIGGER

- **Name**: Reconsideration Trigger
- **Purpose**: Events (e.g., new claims, empirical results, or contradictions) that mandate or permit the revision of an Interpretation.
- **Authority Source**: Decision A7 (Interpretation Evolution Triggers)
- **Created By**: Changes in the research state
- **Consumed By**: Researcher Interpretation Domain (for Revision)
- **Lifecycle Stage**: [RECONSIDERATION TRIGGER]
- **Notes**: Classified as Mandatory, Permissive, or Insufficient.

---

## 8. RESEARCH QUESTION

- **Name**: Research Question
- **Purpose**: Formalized inquiries arising from identified gaps, ambiguities, or unresolved contradictions.
- **Authority Source**: Decision B1 (Research-Question Identification)
- **Created By**: Inquiry Discovery
- **Consumed By**: Hypothesis Formation Domain
- **Lifecycle Stage**: [RESEARCH INQUIRY]
- **Notes**: Grounded in inquiry origins (gaps, contradictions, or anomalies).

---

## 9. HYPOTHESIS

- **Name**: Hypothesis
- **Purpose**: Falsifiable, operationalized predictive propositions derived from Research Questions.
- **Authority Source**: Decision M2 (Hypothesis Formation and Operationalization)
- **Created By**: Hypothesis Formation
- **Consumed By**: Experimental Rigor & Evidence Domain
- **Lifecycle Stage**: [HYPOTHESIS FORMATION]
- **Notes**: Includes operational definitions of variables and measurement specifications.
