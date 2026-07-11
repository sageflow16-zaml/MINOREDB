# A2-004 - Post-ratification semantic audit

| Provenance field | Value |
|---|---|
| Artifact ID | A2-004 |
| Authority / Decision ID | A2 |
| Artifact Type | Post-ratification semantic audit |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 12861 |
| End Line | 12947 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

POST-RATIFICATION SEMANTIC CONSISTENCY AUDIT — DECISION A2
Upstream Authority:

PROJECT MINORE — FOUNDING DEFINITION v0.1 (RATIFIED)
DECISION D1 (RATIFIED)
DECISION A1 (RATIFIED)
DECISION A2 — CLAIM EXTRACTION PROCEDURE (RATIFIED)
Point 1 Finding — Research Relevance and Rhetorical Statements
Finding:

Test 5 rejects "Most traders will never understand what I'm about to share with you" as non-extractable because it is "purely rhetorical framing" with "no research-relevant proposition."

However, this statement is technically an independently assertable proposition — it makes a claim (about trader comprehension capacity) that could be attributed to the source. The rejection criterion is not rhetorical form but domain relevance.

A2's claim definition ("one complete, independently assertable proposition") does not mention research or domain relevance as a boundary condition. Yet Test 5 applies an unstated relevance filter: the statement is not about trading knowledge, market behavior, price mechanics, or trading methods — it is about audience and pedagogy.

The hidden criterion being applied is: does the proposition pertain to the research domain?

A2 conflates "rhetorical" with "domain-irrelevant," but these are separate axes:

A rhetorical statement about trading concepts would be extractable (e.g., "This is the most important pattern in all of price action").
A non-rhetorical statement outside the domain would not be extractable (e.g., "I recommend using a standing desk while trading").
Is there a real inconsistency?

Yes. Test 5's reasoning uses "rhetorical" as a proxy for domain-irrelevance, but A2 has not formally established domain relevance as an extraction boundary. The Founding Definition implicitly scopes the research domain (trading knowledge, ICT frameworks, market behavior), but A2 does not operationalize this scope as a claim-extraction criterion.

Minimum correction required:

Add one extraction boundary rule:

"A proposition is extractable only if it pertains to the research domain: trading knowledge, market behavior, price mechanics, trading methods, or concepts relevant to trading-model development."

Revise Test 5's reasoning: the statement is rejected not because it is rhetorical but because it makes no assertion about the research domain.

Classification: NARROW CLARIFICATION REQUIRED

Point 2 Finding — Procedural Instruction Atomicity
Finding:

Rule 5 states: "Steps in a procedure are not independently assertable without the sequence; they constitute one claim."

Test 6 extracts "Wait for the 8:30 news event, then look for a displacement candle, then enter at the 50% level of the displacement" as one unified claim.

Apply A2's atomicity test (Boundary Rule 1): "If removing one part of a passage leaves the other parts still assertable, they are separate claims."

Can these be independently asserted?

"Wait for the 8:30 news event before taking action" — independently assertable timing constraint
"Look for a displacement candle" — independently assertable pattern-identification instruction
"Enter at the 50% level of the displacement" — independently assertable entry rule
Each is independently assertable and independently evaluable. The fact that they form a recommended sequence does not make them ontologically inseparable — it makes them dependent but distinct claims (compare Test 3's corrected handling of causally related claims).

Contrast this with a genuinely atomic procedural claim: "If price sweeps the low and then closes above it, that is displacement." This is a single conditional definition — the if-then structure creates one indivisible propositional unit.

Rule 5 treats all procedures as atomic, but procedural passages contain both:

Atomic procedures — single conditional/definitional units
Sequential procedures — multiple independently assertable steps with sequential/causal relationships
Is there a real inconsistency?

Yes. Rule 5 and Test 6 contradict A2's general atomicity principle (Boundary Rule 1 and Rule 3 from the corrected Test 3). Procedural instructions are granted an exception from atomicity without justification. This creates a special case that undermines the methodology's ability to identify contradictions between procedural claims (e.g., "enter at 50%" vs. "enter at 61.8%" in different sources).

Minimum correction required:

Remove the blanket exception for procedures. Replace Rule 5 with:

"Procedural instructions follow the same atomicity rule as all other content. Where each procedural step is independently assertable, extract as separate claims with shared context preserving the stated sequence. Where a procedure forms a single conditional or definitional unit, extract as one claim."

Correct Test 6: extract as three claims with shared context noting they form a recommended sequential procedure.

Classification: NARROW CLARIFICATION REQUIRED

Verdict
B. A2 REMAINS RATIFIED WITH NARROW CLARIFICATIONS

Two narrow issues identified:

Domain-relevance boundary is applied but not formally stated
Procedural atomicity exception contradicts general atomicity principle
Both are resolvable with minimal additions/corrections that do not alter A2's core extraction standard or any other ratified content. Neither blocks A3.

The clarifications preserve A2's ratified status while removing two latent inconsistencies that would create downstream ambiguity.




Perform a narrow post-ratification semantic consistency audit of Decision A2.
