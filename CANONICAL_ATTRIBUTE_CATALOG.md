# CANONICAL_ATTRIBUTE_CATALOG.md
## Project Minore

**Status:** PROPOSED

---

## 1. SOURCE

| Object | Attribute | Purpose | Authority Source | Supporting Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Source | Admissibility Status | To record the evaluation of research input admissibility. | CANONICAL_OBJECT_CATALOG.md | Section 1: "Includes... admissibility status." |
| Source | Origin Type | To classify the nature of the source material. | PROJECT_DOMAIN_MODEL.md | Section 3.1: "Source origin types (primary authored, secondary transcriptions, researcher summaries, academic, market data, AI-generated)" |
| Source | Attribution | To identify the source creator or author. | PROJECT_DOMAIN_MODEL.md | Section 3.1: "...attribution, temporal references, location..." |
| Source | Temporal Reference | To record time-related metadata of the source. | PROJECT_DOMAIN_MODEL.md | Section 3.1: "...attribution, temporal references, location..." |
| Source | Location | To record the physical or logical location of the source. | PROJECT_DOMAIN_MODEL.md | Section 3.1: "...attribution, temporal references, location..." |
| Source | Provenance Confidence | To record the evaluated reliability of source provenance. | PROJECT_DOMAIN_MODEL.md | Section 3.1: "...evaluation of provenance confidence." |
| Source | Source Metadata | To store generic metadata about the source entity. | DATABASE_BLUEPRINT.md | Section 2.1: "Store source metadata..." |
| Source | Provenance Metadata | To store metadata regarding source origin and handling. | CANONICAL_OBJECT_CATALOG.md | Section 1: "Includes provenance metadata..." |

---

## 2. CLAIM

| Object | Attribute | Purpose | Authority Source | Supporting Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Claim | Verbatim Text | To preserve the exact wording of the source proposition. | DATABASE_BLUEPRINT.md | Section 2.2: "Store verbatim text..." |
| Claim | Source Location | To record the specific location within the source. | CANONICAL_OBJECT_CATALOG.md | Section 2: "Includes... source location details." |
| Claim | Semantic Classification | To assign multi-dimensional classification tags. | CANONICAL_OBJECT_CATALOG.md | Section 2: "Includes multi-dimensional semantic classification tags..." |
| Claim | Paraphrase Representation | To store a faithful paraphrase of the claim. | PROJECT_DOMAIN_MODEL.md | Section 3.2: "...faithful paraphrase representation..." |
| Claim | Contextual Boundary | To define the scope of the claim's applicability. | PROJECT_DOMAIN_MODEL.md | Section 3.2: "...contextual boundaries of claims..." |

---

## 3. CONCEPT

| Object | Attribute | Purpose | Authority Source | Supporting Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Concept | Conceptual Term | To record the name of the conceptual entity. | DATABASE_BLUEPRINT.md | Section 2.3: "Store conceptual terms..." |
| Concept | Definition | To provide the definition of the concept. | DATABASE_BLUEPRINT.md | Section 2.3: "...associated definitions." |

---

## 4. ASSOCIATION

| Object | Attribute | Purpose | Authority Source | Supporting Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Association | Association State | To track the status of the mapping (e.g., pending). | CANONICAL_OBJECT_CATALOG.md | Section 4: "Can exist in an 'association-pending' state..." |
| Association | Ambiguity Metric | To record the uncertainty level of the association. | CANONICAL_OBJECT_CATALOG.md | Section 4: "...may include ambiguity metrics." |

---

## 5. CONFLICT

| Object | Attribute | Purpose | Authority Source | Supporting Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Conflict | Conflict Classification | To categorize the semantic divergence type. | DATABASE_BLUEPRINT.md | Section 2.5: "...classification of the conflict." |
| Conflict | Contextual Applicability Check | To record the mutual exclusivity test results. | PROJECT_DOMAIN_MODEL.md | Section 3.4: "...applying contextual applicability checks..." |

---

## 6. INTERPRETATION

| Object | Attribute | Purpose | Authority Source | Supporting Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Interpretation | Interpretation Statement | To record the researcher's reference understanding. | DATABASE_BLUEPRINT.md | Section 2.6: "Store the interpretation statement..." |
| Interpretation | Reasoning Chain | To document the logic behind the interpretation. | CANONICAL_OBJECT_CATALOG.md | Section 6: "Includes an explicit reasoning chain..." |
| Interpretation | Interpretation Foundation | To identify the supporting set of claims. | CANONICAL_OBJECT_CATALOG.md | Section 6: "...an Interpretation Foundation (linked Claims)." |

---

## 7. RECONSIDERATION TRIGGER

| Object | Attribute | Purpose | Authority Source | Supporting Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Reconsideration Trigger | Trigger Detail | To record specific event details prompting revision. | DATABASE_BLUEPRINT.md | Section 2.7: "Store the trigger event details..." |
| Reconsideration Trigger | Trigger Classification | To categorize the trigger necessity level. | CANONICAL_OBJECT_CATALOG.md | Section 7: "Classified as Mandatory, Permissive, or Insufficient." |

---

## 8. RESEARCH QUESTION

| Object | Attribute | Purpose | Authority Source | Supporting Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Research Question | Question Statement | To record the formalized research inquiry. | DATABASE_BLUEPRINT.md | Section 2.8: "Store the research question statement..." |
| Research Question | Inquiry Origin | To record the grounding (gap, contradiction, anomaly). | CANONICAL_OBJECT_CATALOG.md | Section 8: "Grounded in inquiry origins (gaps, contradictions, or anomalies)." |
| Research Question | Domain Relevance | To record the assessment of inquiry relevance. | PROJECT_DOMAIN_MODEL.md | Section 3.6: "...assessment of domain relevance..." |
| Research Question | Substantive Grounding | To record the grounding justification. | PROJECT_DOMAIN_MODEL.md | Section 3.6: "...substantive grounding." |

---

## 9. HYPOTHESIS

| Object | Attribute | Purpose | Authority Source | Supporting Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Hypothesis | Hypothesis Statement | To record the operationalized predictive proposition. | DATABASE_BLUEPRINT.md | Section 2.9: "Store the hypothesis statement..." |
| Hypothesis | Variable Specification | To provide operational definitions of variables. | CANONICAL_OBJECT_CATALOG.md | Section 9: "Includes operational definitions of variables..." |
| Hypothesis | Measurement Specification | To define measurement parameters. | CANONICAL_OBJECT_CATALOG.md | Section 9: "...measurement specifications." |
| Hypothesis | Substantive Departure | To track departures from reference interpretations. | PROJECT_DOMAIN_MODEL.md | Section 3.7: "...tracking substantive departures." |
