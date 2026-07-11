# M3 - Methodology decomposition audit

| Provenance field | Value |
|---|---|
| Artifact ID | M3-010 |
| Authority / Decision ID | M3 |
| Artifact Type | Methodology decomposition audit |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 14523 |
| End Line | 14594 |
| Origin / Speaker | Mixed export block; preserve source marker where supplied. |
| Historical Order | 010 |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Reconciled in M3_COMPLETE_HISTORY.md and the candidate reconciliation. |
| Notes | No status beyond direct wording is inferred. |

## Historical Text - verbatim source range

3. Point 3 Finding — M3 Merge Validity
Semantic Distinction Test
Aspect	Experiment Design Principles	Evidence-Strength Grading
What it governs	How a test is constructed and executed before running it	How resulting evidence is assessed after test completion
Temporal position	Pre-test	Post-test
Example concern	"Must use out-of-sample validation to avoid overfitting"	"Evidence from tests with out-of-sample validation receives higher strength rating"
Dependency test:
Can evidence grading be defined without knowing design principles? No — grading criteria directly reference design quality (e.g., "stronger evidence if properly out-of-sample").

However, can design principles be defined without knowing grading criteria? Yes — design principles can be stated independently (e.g., "use train/test split") without yet defining how that affects evidence weight.

Conclusion: Design principles are prerequisite to grading, but they are conceptually distinct stages in the research process (pre-test vs. post-test evaluation).

Merge harmfulness test:
Does merging these hide important structure or create ambiguity?

Answer: Partially — the merge obscures the temporal boundary (design happens before execution; grading happens after). However, both are "statistical methodology content" addressing experimental validity, and defining them together ensures consistency (grading criteria should align with design principles).

Pragmatic test:
Would separating them require restating the same underlying validity concepts twice?

Answer: Likely yes — both concern sample size, overfitting, robustness, bias prevention. Defining design principles and then separately defining grading using the same concepts is redundant.

Verdict
C. The merge is harmless and should remain.

While conceptually distinct (pre-test vs. post-test), design principles and evidence grading are tightly coupled in practice — they form a unified statistical-methodology position on experimental validity. Separating them risks inconsistency (e.g., design principles permit small samples but grading penalizes them). The merge does not hide a blocking decision.

No correction required for M3.

4. Minimum Corrections to the Dependency-Ordered Decision Set
Corrected Decision Set
ID	Decision	Dependency	Classification
A1	Source Intake Criteria	Foundation	Procedural
A2	Claim Extraction Procedure	A1 (requires sources)	Procedural
A3	Claim Classification	A2 (requires extracted claims)	Semantic + Procedural
A4	Concept Association	A3 (requires classified claims)	Procedural
A5	Contradiction Handling Procedure	D1 Rule 5 + A4	Procedural
A6	Researcher Interpretation Construction	D1 + A4	Procedural
A7	Interpretation Evolution Triggers	D1 + A6	Procedural
B1	Research-Question Identification	A6 (requires interpretations)	Procedural
M2	Hypothesis Formation and Operationalization	B1 (requires questions)	Semantic + Procedural
C2	Pre-registration	M2 (requires hypotheses)	Procedural
M3	Experimental Rigor and Evidence Assessment	M2 (requires testable hypotheses)	Statistical Methodology
C3	Negative-Result Preservation	M3 (requires evidence assessment)	Procedural
D1	Trading-Model Admission Criteria	M3 (requires evidence grading)	Semantic + Procedural
D2	Model Revision Procedure	D1 (requires admission criteria)	Procedural
Changes:

Moved A1 before A2 (was incorrectly after M1)
Un-merged M1 into A2 and A3 with correct dependency (A2 → A3)
Retained M2 (merge valid)
Retained M3 (merge valid)
Total decisions: 14 (increased by 1 due to un-merging M1)

5. Correct NEXT MINIMUM DECISION
Decision A1 — Source Intake Criteria

Selected (not solved):

What qualifies as a valid research source, and what metadata must be captured at intake to satisfy provenance requirements?

This is the true earliest dependency — no extraction, classification, or concept work can proceed without defining what material enters the research system and what provenance is preserved.

6. Stop Statement
Dependency and merge audit complete.

3 findings:

A1/M1 ordering corrected
M1 merge invalidated and split
M3 merge validated and retained
