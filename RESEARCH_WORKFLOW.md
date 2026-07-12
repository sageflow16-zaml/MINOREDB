# RESEARCH WORKFLOW SPECIFICATION
## Project Minore

**Status:** PROPOSED

---

## 1. STAGE: SOURCE ADMISSION

*The entry point of the research pipeline where external materials are registered and verified.*

- **Inputs**: 
    - External research material (Video, PDF, Transcript, Researcher Notes).
    - Source metadata (Title, Author, Date, URL/Location).
- **Outputs**: 
    - `Source` entity (Status: ADMITTED).
- **Validation Rules**:
    - Provenance check: Source must have a verifiable origin and attribution.
    - Admissibility check: Material must be within the established research domain (e.g., ICT-related trading knowledge).
- **Transition Conditions**:
    - Source is successfully registered in the database.
    - Status is set to "ADMITTED".

---

## 2. STAGE: SOURCE PROCESSING

*Normalization of imported material into analyzable text regardless of origin.*

- **Inputs**: 
    - `Source` (ADMITTED).
- **Outputs**: 
    - Normalized text corpus / Processed transcript.
- **Validation Rules**:
    - Format integrity: Ensure text is cleaned of noise and properly structured for extraction.
    - Completeness: Verify that the entire admitted source is processed.
- **Transition Conditions**:
    - The source material is converted to a standardized textual format.

---

## 3. STAGE: CLAIM EXTRACTION

*Isolation of atomic propositions from the admitted source material.*

- **Inputs**: 
    - Processed source material.
- **Outputs**: 
    - `Claim` entities (Status: EXTRACTED).
- **Validation Rules**:
    - Atomic Fidelity: Claims must be self-contained and not combined.
    - Verbatim Integrity: Original wording must be preserved or faithfully paraphrased.
    - Classification: Every claim must be tagged (Definitional, Mechanistic, Predictive, etc.).
- **Transition Conditions**:
    - Claims are linked to the parent `Source.id`.
    - Contextual boundaries and source locations are recorded.

---

## 4. STAGE: CONCEPT ASSOCIATION

*Mapping extracted claims to the shared conceptual vocabulary.*

- **Inputs**: 
    - `Claim` (EXTRACTED).
    - `Concept` (Existing or New).
- **Outputs**: 
    - `Association` entities.
- **Validation Rules**:
    - Subject Matter Relevance: Association must be based on substantive context, not just shared terminology.
    - Ambiguity Assessment: Any uncertainty in the mapping must be recorded in the ambiguity metric.
- **Transition Conditions**:
    - `Claim` is linked to one or more `Concept` entities via an `Association` record.

---

## 5. STAGE: EPISTEMIC CONFLICT ANALYSIS

*Detecting and classifying variations or contradictions between associated claims.*

- **Inputs**: 
    - Multiple `Claim` entities associated with the same `Concept`.
- **Outputs**: 
    - `Conflict` entities.
- **Validation Rules**:
    - Contextual Exclusion: Test if the claims apply to the same market regime or condition before declaring a contradiction.
    - Conflict Classification: Must be categorized (Variation, Tension, or Genuine Contradiction).
- **Transition Conditions**:
    - `Conflict` relationship is recorded between conflicting claims.
    - Status is set to "UNRESOLVED" (conflicts are preserved, not deleted).

---

## 6. STAGE: INTERPRETATION CONSTRUCTION

*Formulating the authoritative reference understanding of a concept.*

- **Inputs**: 
    - `Concept`.
    - All associated `Claim` entities (Interpretation Foundation).
    - Any existing `Conflict` records.
- **Outputs**: 
    - `Interpretation` entity (Status: AUTHORITATIVE).
- **Validation Rules**:
    - Explicit Reasoning: The reasoning chain must account for all foundational claims.
    - Conflict Acknowledgment: If conflicts exist, the interpretation must explicitly state why certain claims were prioritized or how the tension is bracketed.
- **Transition Conditions**:
    - The interpretation statement is finalized and linked to its foundation of claims.

---

## 7. STAGE: RESEARCH INQUIRY

*Identifying gaps and formalizing open questions from the current research state.*

- **Inputs**: 
    - `Interpretation` (Gaps found in reasoning).
    - `Conflict` (Unresolved contradictions).
- **Outputs**: 
    - `Research Question` entity.
- **Validation Rules**:
    - Grounding: The question must be derived from a specific gap, anomaly, or conflict in the interpreted knowledge.
    - Domain Relevance: The question must be substantively relevant to trading-model development.
- **Transition Conditions**:
    - `Research Question` is registered and categorized.

---

## 8. STAGE: HYPOTHESIS FORMATION

*Translating research questions into falsifiable, testable propositions.*

- **Inputs**: 
    - `Research Question`.
- **Outputs**: 
    - `Hypothesis` entity.
- **Validation Rules**:
    - Falsifiability: The hypothesis must be testable against observable market phenomena.
    - Operational Precision: Variables (e.g., price, time, volume) must be clearly specified.
    - Departure Tracking: If the hypothesis deviates from the current `Interpretation`, it must be documented as a "Substantive Departure".
- **Transition Conditions**:
    - Hypothesis is linked to the `Research Question.id`.
    - Measurement specifications are finalized.

---

## 9. STAGE: EXPERIMENTAL DESIGN

*Defining the rigorous parameters for empirical testing of a hypothesis.*

- **Inputs**: 
    - `Hypothesis`.
- **Outputs**: 
    - Test design specifications (Data source, Sample size, In/Out-of-sample split).
- **Validation Rules**:
    - Bias Prevention: Design must explicitly account for look-ahead and survivorship bias.
    - Adequacy Check: The design must be sufficiently rigorous to produce interpretable evidence.
- **Transition Conditions**:
    - Test design is finalized and validated against rigor principles.

---

## 10. STAGE: EVIDENCE EVALUATION

*Synthesizing raw empirical results into graded evidence.*

- **Inputs**: 
    - Raw empirical results.
    - Experimental Design specifications.
- **Outputs**: 
    - Evidence strength profile.
- **Validation Rules**:
    - Robustness check: Verify if results hold across parameters and regimes.
    - Significance check: Distinguish between statistical and practical significance.
- **Transition Conditions**:
    - Evidence is graded and linked back to the `Hypothesis`.

---

## 11. RECONSIDERATION LOOP (A7)

*Triggering interpretation updates based on new research or external inputs.*

- **Inputs**: 
    - New `Claim` for an existing `Concept`.
    - New `Conflict` detection.
    - Empirical evidence outcomes.
- **Outputs**: 
    - `Reconsideration Trigger` entity.
- **Validation Rules**:
    - Necessity Classification: Must be graded as Mandatory, Permissive, or Insufficient based on the impact on the interpretation's foundation.
- **Transition Conditions**:
    - If "Mandatory", the workflow restarts at the **Interpretation Construction** stage for that concept.

---

## WORKFLOW DIAGRAM

`Source Admission` $ightarrow$ `Source Processing` $ightarrow$ `Claim Extraction` $ightarrow$ `Concept Association` $ightarrow$ `Epistemic Conflict Analysis` $ightarrow$ `Interpretation Construction` $ightarrow$ `Research Inquiry` $ightarrow$ `Hypothesis Formation` $ightarrow$ `Experimental Design` $ightarrow$ `Evidence Evaluation`

*(Feedback loop: Evidence Evaluation $ightarrow$ Reconsideration Loop $ightarrow$ Interpretation Construction)*
