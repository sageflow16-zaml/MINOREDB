# A4-002 - Semantic consistency audit block

| Provenance field | Value |
|---|---|
| Artifact ID | A4-002 |
| Authority / Decision ID | A4 |
| Artifact Type | Semantic consistency audit block |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 10801 |
| End Line | 10978 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

DECISION A4 — CONCEPT ASSOCIATION (PROPOSED)
Point 1 Finding — Concept Definition and Hidden Ontology
Exact finding:

A4's semantic-distinctions table defines Concept as:

"A trading-domain entity representing a distinct idea, pattern, mechanism, or method."

This definition specifies what a Concept ontologically is (an entity type, with internal structure/categorization: idea, pattern, mechanism, method).

However, A4's stated scope excludes:

"formal definition of every possible trading concept"
"hidden concept ontology"
The definition answers "what is a Concept?" — which is an ontological/structural question, not a procedural question about association rules.

Test whether A4 actually requires this definition:

A4's core decision concerns only: Under what conditions may a claim be associated with a concept?

This question can be answered without defining what a Concept ontologically is. The methodology only needs to refer to "a concept" (whatever it is) and establish rules for when a claim pertains to it.

The definition conflates two separate questions:

(Required) How do we determine whether a claim is about a concept?
(Not required) What ontologically constitutes a concept?
Is there a real inconsistency or premature commitment?

Yes. A4 has introduced a concept definition that exceeds its task scope and contradicts the prohibition on hidden ontology.

Minimum correction required:

Remove the ontological definition. Replace with minimal semantic reference:

"Concept: A subject of substantive concern within the research domain — what a claim is substantively about. Concepts are recognized during the research process; A4 establishes rules for associating claims with them."

This references concepts without defining them ontologically.

Classification: CORRECTION REQUIRED

Point 2 Finding — Primary Subject Removal Test
Exact finding:

A4 defines Primary Subject partly via:

"The claim would not make sense or lose essential meaning if the concept were removed."

Adversarial test:

Claim: "Fair Value Gaps form in the morning session before London opens."

If "Fair Value Gaps" is removed: claim becomes meaningless (Fair Value Gaps is primary subject)
If "morning session" is removed: claim becomes "Fair Value Gaps form before London opens" (still meaningful, but loses specificity)
If "London" is removed: claim becomes "Fair Value Gaps form in the morning session before it opens" (odd but not meaningless)
But apply the test differently:

Claim: "To understand Fair Value Gaps, study how institutions sweep liquidity above key levels."

If "Fair Value Gaps" is removed: becomes "To understand [?], study how institutions sweep liquidity" — the sentence is incomplete, Fair Value Gaps seems necessary
Yet the claim's substantive subject is institutions' behavior and liquidity sweeping, not Fair Value Gaps itself
The removal test yields false positives: Fair Value Gaps appears necessary for grammatical/logical completeness but is not the primary subject.

Is there a real inconsistency?

Yes. The removal test conflates grammatical/logical necessity with substantive subject-matter primacy. A concept can be logically necessary to a claim without being what the claim is substantively about.

Minimum correction required:

The removal test is insufficient alone. Clarify the primary subject rule:

"A concept is a primary subject of a claim if the claim's substantive assertion concerns that concept. Use both: (1) whether the claim would be meaningless if the concept were removed, AND (2) what the claim's assertion is fundamentally addressing. Secondary mentions are concepts necessary to the claim's logical structure but not its substantive focus."

This combines logical necessity with focus assessment.

Classification: CLARIFICATION REQUIRED

Point 3 Finding — Association-Pending and A6
Exact finding:

A4 Test 5 states: "the claim is domain-relevant and extractable but association-pending — it awaits concept creation in A6 (researcher interpretation construction)."

This assigns concept creation to A6, but no ratified decision establishes:

That A6 creates concepts
When/whether domain-relevant unclaimed claims trigger concept creation
What status an association-pending claim has
A4 is making a claim about A6's role without ratified authority.

Test against ratified dependency:

The ratified decision set does not include A6's full scope. A4 is predicting A6 will create concepts, but this is speculative.

What is A4's actual authority?

A4 should establish: What does A4 do with a domain-relevant claim that has no established concept?

Not: Where does that claim go next?

Is there a real inconsistency?

Yes. A4 is assigning downstream responsibility without ratified delegation.

Minimum correction required:

Replace the A6 forward-assignment with a neutral statement:

"A domain-relevant claim that lacks clear concept association is recorded as such. The treatment of association-pending claims remains unresolved methodology content."

Do not specify that A6 creates concepts. Do not imply a mandatory lifecycle.

Classification: CORRECTION REQUIRED

Point 4 Finding — Downstream Unlock Claims
Exact finding:

A4 states: "A5 — Contradiction Handling, A6 — Researcher Interpretation Construction, and B1 — Research-Question Identification are now unblocked."

Test against ratified decision dependency:

From Research Methodology Decision Decomposition (Stage 2):

ID	Decision	Dependency
A5	Contradiction Handling Procedure	D1 Rule 5 + A4
A6	Researcher Interpretation Construction	D1 + A4
B1	Research-Question Identification	A6 (requires interpretations)
Verdict:

A5 depends on A4 ✓ (Contradiction Handling requires concepts to identify contradictions about the same concept)
A6 depends on A4 ✓ (Interpretation requires claims associated with concepts)
B1 depends on A6, not directly on A4 ✓ (Research questions require interpretations, not just claims)
A4 unlocks A5 and A6. A4 does not directly unlock B1.

Is there a real inconsistency?

Partial. A4 claims to unlock B1, but B1's dependency is on A6, not A4. B1 is transitively unblocked (once A4 → A6), but not directly unblocked by A4.

Minimum correction required:

Revise the What A4 Unlocks section:

"A5 — Contradiction Handling and A6 — Researcher Interpretation Construction are now unblocked. B1 — Research-Question Identification is transitively unblocked (depends on A6, which depends on A4) but is not directly blocked by A4."

Classification: NARROW CLARIFICATION

5. Minimum Corrections Required
Point	Correction
Point 1	Remove ontological definition of Concept. Replace with minimal semantic reference: "Concept: A subject of substantive concern within the research domain — what a claim is substantively about. Concepts are recognized during the research process; A4 establishes rules for associating claims with them."
Point 2	Clarify Primary Subject rule: primary subjects are concepts whose subject matter the claim's assertion fundamentally addresses, determined by both logical necessity and substantive focus.
Point 3	Remove the forward assignment to A6. State: "A domain-relevant claim that lacks clear concept association is recorded as such. The treatment of association-pending claims remains unresolved methodology content."
Point 4	Clarify downstream unlocks: A5 and A6 are directly unblocked; B1 is transitively unblocked via A6.
6. Ratification Verdict
A4 IS SEMANTICALLY SOUND WITH CORRECTIONS

Four issues identified:

Hidden ontology definition — premature, requires removal and replacement with minimal reference
Primary subject removal test — insufficient alone, requires clarification combining logic and substantive focus
Concept creation assignment — exceeds A4's authority, should be deferred
Downstream unlock accuracy — B1 is not directly unblocked, should be clarified as transitive
All corrections are minimal and do not alter A4's core concept-association methodology.

A4 is ready for correction and ratification.




Perform a narrow semantic consistency audit of proposed Decision A4 only.

AUTHORITATIVE INPUTS

PROJECT MINORE — FOUNDING DEFINITION v0.1 (RATIFIED)
DECISION D1 (RATIFIED)
DECISION A1 (RATIFIED)
DECISION A2 (RATIFIED)
A2-C1 and A2-C2 (BINDING)
DECISION A3 (RATIFIED)
A3-C1 (BINDING)
DECISION A4 — CONCEPT ASSOCIATION (PROPOSED)
