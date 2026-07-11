# A2-002 - Semantic consistency audit

| Provenance field | Value |
|---|---|
| Artifact ID | A2-002 |
| Authority / Decision ID | A2 |
| Artifact Type | Semantic consistency audit |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 13347 |
| End Line | 13473 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

SEMANTIC CONSISTENCY AUDIT — DECISION A2
Upstream Authority:

PROJECT MINORE — FOUNDING DEFINITION v0.1
DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE
DECISION A1 — RESEARCH INPUT ADMISSIBILITY AND PROVENANCE
Decision A2 — Claim Extraction Procedure (under audit)
1. Point 1 Finding — "Independently Evaluable Proposition"
Exact tension:
"Independently evaluable" imports a testability criterion. A source definition ("A Fair Value Gap is a three-candle imbalance"), an attribution ("ICT learned this from his mentor"), or a vague mechanism claim ("the algorithm hunts liquidity") may be a legitimate, meaningful source claim while being impossible to evaluate empirically in isolation, or not yet subject to any evaluation framework at this stage of the pipeline.

Necessity test:
Does A2 need "evaluable" to define claim atomicity, or does it need a weaker criterion?

The purpose of atomicity at extraction is to ensure claims can be:

recorded independently
attributed independently
later processed independently
None of these require the claim to be empirically evaluable. A definition or metaphor can be recorded, attributed, and processed independently without being testable. "Evaluable" conflates extractability with testability — a distinction the methodology explicitly defers to later stages (B2 — testability criteria, M2 — hypothesis formation).

Minimum formulation:
"Independently assertable proposition" — a unit of source content that makes one complete assertion, capable of being recorded and attributed on its own, regardless of whether it is testable or empirically evaluable.

Verdict:
"Independently evaluable" is semantically too narrow and prematurely imports testability. Replace with "independently assertable" throughout A2.

Classification: CORRECTION REQUIRED

2. Point 2 Finding — Test 3 vs. Atomicity Rule
Exact tension:
Test 3 extracts as one claim: "price often seeks liquidity above the previous day's high in the London session, and this move creates conditions for a reversal." This contains two propositions:

Price often seeks liquidity above PDH in the London session
That move creates conditions for reversal
A2 Rule 1 requires that multiple independent propositions yield multiple extracted claims. If applied strictly, Test 3 violates its own rule.

Necessity test:
Are these two independent propositions or one compound proposition?

Proposition 2 is causally conditioned on Proposition 1 — "that move" has no referent without Proposition 1. However, the causal relation itself ("move creates conditions for reversal") is a separate assertion from the price-behavior assertion. The causal link is not guaranteed by the description of the price move — it is an additional claim the source is making.

Conclusion: These are two propositions with a dependency, not one compound proposition. The correct handling is: extract as two claims sharing a context note that establishes the causal relationship the source asserts between them. This is consistent with Rule 1 but requires A2 to clarify the distinction between:

a compound proposition (one assertion expressed in multiple clauses, inseparable)
two dependent propositions (each assertable independently, but with a noted causal/contextual relationship)
Minimum correction:
Add one clarifying rule: where a passage contains propositions that are causally or conditionally related but each independently assertable, extract as separate claims with a shared context note preserving the stated relationship. Do not merge dependent propositions into one claim to preserve the relationship — preserve the relationship as context.

Verdict:
Test 3 incorrectly merges two dependent but independently assertable propositions. A2 needs one additional boundary rule to handle this case.

Classification: CORRECTION REQUIRED

3. Point 3 Finding — Immutability vs. Extraction Error Correction
Exact tension:
Rule 4 states that correcting an extraction error requires "creating a new extraction with a note superseding the prior one." Section 9 simultaneously classifies "procedure for superseding an incorrectly extracted claim" as deferred methodology content not blocking A3. These appear to contradict each other — Rule 4 partially defines a correction lifecycle while Section 9 defers it.

Semantic distinction test:

Entity	Nature
Source claim	The attributable source content itself — immutable (D1)
Extraction record	The researcher's recorded representation of that source content — may contain errors
Extraction error	A case where the extraction record misrepresents the source content
D1's immutability applies to source claims — what the source said. It does not govern the extraction record as an administrative artifact. An extraction record that misrepresents the source can be corrected without altering what the source said.

Necessity test:
What does A2 actually need to establish here?

The minimum semantic rule required is: extraction errors must not be silently corrected — because silent correction would destroy provenance of the erroneous record, which itself may be research-relevant (e.g., it may have influenced downstream interpretation). How the correction is recorded — supersession, annotation, versioning — is procedural lifecycle content properly deferred.

Rule 4 as written partially specifies a correction mechanism ("creating a new extraction with a note") that goes beyond the minimum semantic rule and is inconsistent with Section 9's deferral.

Verdict:
A. The minimum semantic rule (no silent overwriting) is correctly established.
B. The correction mechanism ("creating a new extraction with a note superseding the prior one") is prematurely specified and contradicts the Section 9 deferral.
C. The internal contradiction is real and requires correction.

Rule 4 should state only: extraction errors must not be silently corrected. The correction mechanism is deferred.

Classification: CORRECTION REQUIRED

4. Point 4 Finding — Implied Meaning and A6
Exact tension:
A2 states: "If a proposition is implied but not stated, it is a candidate for researcher interpretation (A6), not extraction." This assigns non-extractable implied meaning directly to A6. But A6 governs the researcher's authoritative interpretation of a concept — a higher-order act of synthesis across multiple claims and sources. A local passage inference is not the same thing as a concept-level interpretation.

Necessity test:
Does A2 need to assign implied meaning to A6, or only to exclude it from extraction?

Implied meaning from a single passage may be:

a local inference that never rises to concept-level interpretation
something the researcher notes but never formally adopts
later incorporated into concept interpretation (A6) or not
A2's job is to establish what stays outside the extracted source claim. Where that excluded content goes is downstream. Assigning it to A6 at A2 prematurely collapses the distinction between passage-level inference and concept-level interpretation, and assumes every implication will eventually become a formal researcher interpretation — which the methodology does not require.

Minimum correction:
Replace "it is a candidate for researcher interpretation (A6)" with "it remains outside the extracted source claim." No forward assignment required.

Verdict:
A2 should not assign implied meaning to A6. The exclusion from extraction is the only rule A2 needs here. Where excluded content goes is not an A2 decision.

Classification: CORRECTION REQUIRED

5. Minimum Corrections Required
Point	Correction
Point 1	Replace "independently evaluable proposition" with "independently assertable proposition" throughout A2. Remove any implication that extractability requires testability.
Point 2	Add one boundary rule: where a passage contains propositions that are causally or conditionally related but each independently assertable, extract as separate claims with a shared context note preserving the stated relationship. Correct Test 3 accordingly.
Point 3	Reduce Rule 4 to the minimum semantic rule: extraction errors must not be silently corrected. Remove the specified correction mechanism ("creating a new extraction with a note superseding the prior one") — this is deferred methodology content consistent with Section 9.
Point 4	Replace "it is a candidate for researcher interpretation (A6), not extraction" with "it remains outside the extracted source claim." Remove the forward assignment to A6.
6. Ratification Verdict
DO NOT RATIFY A2 AS-IS.

Four corrections are required. All are minimal and do not alter A2's core decisions:

Faithful minimum-unit extraction standard — unchanged
Provenance inseparability — unchanged
Ambiguity and damage preservation — unchanged
Separation of source content from researcher interpretation — unchanged
The corrections remove: one premature testability criterion, one unresolved atomicity boundary case, one internal contradiction on correction lifecycle, and one premature forward assignment to A6.

A2 is ready for ratification after minimum corrections are applied. No further analysis required.




Perform a narrow semantic consistency audit of Decision A2 only.
