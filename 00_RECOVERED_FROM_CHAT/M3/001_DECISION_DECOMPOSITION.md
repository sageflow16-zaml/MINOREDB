# M3 - Methodology decision decomposition

| Provenance field | Value |
|---|---|
| Artifact ID | M3-001 |
| Authority / Decision ID | M3 |
| Artifact Type | Methodology decision decomposition |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 14824 |
| End Line | 14860 |
| Origin / Speaker | Mixed export block; preserve source marker where supplied. |
| Historical Order | 001 |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Reconciled in M3_COMPLETE_HISTORY.md and the candidate reconciliation. |
| Notes | No status beyond direct wording is inferred. |

## Historical Text - verbatim source range

4. Merged Decisions
Original Candidates	Merged Into	Rationale
A2 (Knowledge Extraction) + A3 (Claim Classification)	M1 — Claim Extraction and Classification	These are a single procedural act: extracting claims from sources while classifying them. Cannot extract without categorizing; cannot categorize without extracting.
B2 (Testability Criteria) + B3 (Hypothesis Formulation) + B4 (Operationalization)	M2 — Hypothesis Formation and Operationalization	These form a continuous procedure: determining testability, formulating the hypothesis, and defining measurable variables. Separating them creates artificial boundaries in a unified intellectual step.
C1 (Experiment Design Principles) + C4 (Evidence-Strength Grading)	M3 — Experimental Rigor and Evidence Assessment	Both concern validity/reliability of empirical work; grading criteria depend on design principles. Unified statistical methodology decision.
5. Minimum Dependency-Ordered Decision Set
ID	Decision	Dependency	Classification
M1	Claim Extraction and Classification	Foundation + D1	Semantic + Procedural
A1	Source Intake Criteria	Foundation	Procedural
A4	Concept Association	M1 (requires classified claims)	Procedural
A5	Contradiction Handling Procedure	D1 Rule 5	Procedural
A6	Researcher Interpretation Construction	D1 + A4 (requires concept-claim associations)	Procedural
A7	Interpretation Evolution Triggers	D1 + A6	Procedural
B1	Research-Question Identification	A6 (requires interpretations)	Procedural
M2	Hypothesis Formation and Operationalization	B1 (requires questions)	Semantic + Procedural
C2	Pre-registration	M2 (requires hypotheses)	Procedural
M3	Experimental Rigor and Evidence Assessment	M2 (requires testable hypotheses)	Statistical Methodology
C3	Negative-Result Preservation	M3 (requires evidence assessment)	Procedural
D1	Trading-Model Admission Criteria	M3 (requires evidence grading)	Semantic + Procedural
D2	Model Revision Procedure	D1 (requires admission criteria)	Procedural
6. NEXT MINIMUM DECISION
Decision M1 — Claim Extraction and Classification

Selected (not solved):

What procedure does the researcher follow to extract claims from source material, and by what criteria are claims classified (definition, mechanism, prediction, heuristic, etc.)?

This is the earliest dependency-blocking decision and feeds into all downstream concept/interpretation work.

7. Stop Statement
Decision decomposition complete.

13 decisions identified and dependency-ordered.

Next minimum decision (M1) selected but not solved.

Research Methodology construction has not begun.
