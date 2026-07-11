# A4 — Historical Artifact

| Provenance field | Value |
|---|---|
| Artifact ID | A4-001 |
| Authority / Decision ID | A4 |
| Artifact Type | Corrected and ratification block |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 10585 |
| End Line | 10760 |
| Origin / Speaker | Source export block |
| Historical Order | Source order is reverse chronological. |
| Recovery Quality | A — VERBATIM RECOVERED |
| Completeness | Complete for stated range. |
| Duplicate Occurrences | See global index. |
| Notes | Historical text preserved without rewriting. |

## Historical Text — verbatim source range

DECISION A4 — CONCEPT ASSOCIATION
Status: RATIFIED
Upstream Authority:

PROJECT MINORE — FOUNDING DEFINITION v0.1
DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE
DECISION A1 — RESEARCH INPUT ADMISSIBILITY AND PROVENANCE
DECISION A2 — CLAIM EXTRACTION PROCEDURE
A2-C1 and A2-C2 (BINDING)
DECISION A3 — CLAIM CLASSIFICATION
A3-C1 — CLASSIFICATION USES PRESERVED SOURCE CONTEXT (BINDING)
1. Exact Ratified Decision
Once a source claim has been validly extracted and classified, it is associated with one or more concepts based on substantive subject matter determined from the claim and its preserved source context.

A claim's subject matter is what it is substantively about. Mention of a concept-term does not constitute association unless the claim is substantively about that concept.

Relational and multi-concept claims are associated with all participating concepts when all are substantively involved in the claim's assertion.

Association is determined using extracted claims together with their preserved source context per A3-C1. Association ambiguity must not be manufactured by analyzing claims in isolation from available context.

2. Semantic Distinctions
Concept	Meaning
Concept	A subject of substantive concern within the research domain — what a claim is substantively about. Concepts are recognized during the research process; A4 establishes rules for associating claims with them.
Concept association	The relationship between an extracted source claim and one or more concepts to which it substantively pertains
Subject matter	What a claim is substantively about — determined by both explicit wording and available preserved context
Mention	A term appears in the claim but the claim is not substantively about that concept
Primary subject	A concept whose subject matter the claim's substantive assertion fundamentally addresses. Logical necessity to the claim's structure is supporting evidence but does not by itself establish subject-matter primacy.
Secondary mention	A concept referenced as supporting context or example, not the claim's primary focus
Relational association	Both or all concepts participating in a stated relationship are associated with the claim; the relationship itself is the subject matter
Association ambiguity	Uncertainty about which concept(s) a claim substantively pertains to, remaining after source context is fully considered
3. Binding Methodology Rules
Concept association identifies what a claim is substantively about. It is distinct from classification (what kind of assertion was made) and from researcher interpretation (what the researcher believes the concept means).

Mention is not association. A concept term appearing in a claim does not establish association unless the claim is substantively about that concept.

Source context determines substantive subject matter. Association is determined using the extracted claim together with its preserved source context. Association ambiguity must not be manufactured by isolating wording from available context.

Primary subject determination requires both structural and substantive assessment. A concept is a primary subject if the claim's substantive assertion fundamentally addresses it. Logical necessity to the sentence's structure is supporting evidence but does not alone establish subject-matter primacy.

Relational and multi-concept claims are associated with all substantively participating concepts. If a claim states a relationship between two or more concepts, or if multiple concepts are integral to its subject matter, association includes all.

A claim may have zero, one, or multiple concept associations. Each association is based on substantive subject matter, not on arbitrary cardinality constraints.

Association ambiguity is preserved when genuinely unresolved. If substantive subject matter remains ambiguous after context is considered, that ambiguity is recorded rather than resolved by guessing.

Domain-relevant claims without clear concept associations are recorded as such. The treatment of association-pending claims remains unresolved methodology content.

Association metadata does not alter the extracted claim. The claim remains immutable per D1; association is metadata about the claim's subject matter.

4. Corrected Adversarial Tests
Test 2 — Claim mentions multiple concepts, substantively about one
"Order Blocks act as supply and demand zones where institutional traders reverse their positions, creating Fair Value Gaps as they exit"

Claim classification: Mechanistic (explains market process)
Concepts mentioned: Order Blocks, supply/demand zones, institutional traders, Fair Value Gaps
Subject matter: How Order Blocks function as reversal zones
Primary subject determination:
Logical necessity: Fair Value Gaps appears but is not necessary to the core assertion; the claim would be complete as "Order Blocks act as supply/demand zones where traders reverse positions"
Substantive focus: The claim's assertion fundamentally addresses how Order Blocks work as reversal structures
Primary association: Order Blocks
Secondary mentions: Fair Value Gaps (mentioned as a consequence, not a substantive subject); supply/demand zones (supporting concept, not primary focus)
Association decision: Order Blocks (primary subject matter)
Framework handling: ✓ Distinguishes primary subject from secondary mentions using both logic and substantive focus
Test 4 — Claim whose concept association is uncertain after context review

Source: "The sweep to the high creates the condition for the reversal."

Preserved context: Prior passage discusses Order Blocks; current section focuses on entry timing patterns. The word "sweep" could refer to liquidity sweeps generally or specifically to the sweep component of Order Block formation.

Claim classification: Mechanistic (explains causation)
Concepts mentioned: high, reversal (and implicitly: sweep)
Subject matter assessment with full context: Context indicates discussion of Order Block timing patterns; "sweep to the high" substantively concerns Order Block mechanics
Association (with context): Order Blocks
Remaining ambiguity: Whether "reversal" is a distinct concept or merely a term for outcome
Association: Order Blocks (determined by context)
Uncertainty handling: Context resolves primary ambiguity. If uncertainty remains about secondary concepts (e.g., is "reversal" a concept?), that uncertainty is preserved as association ambiguity, not resolved by guessing.
Framework handling: ✓ Context is used; genuine remaining ambiguity is preserved
Test 5 — Domain-relevant claim that may not map cleanly to established concepts

"Price respects round numbers like 1.2000 and 1.3000 because traders use them as psychological references"

Claim classification: Mechanistic (explains why price behaves this way)
Concepts mentioned: round numbers, price behavior, traders
Subject matter: Why price respects round numbers; a psychological market mechanism
Concept association problem: "Round numbers" is not yet an established concept in the research domain
Association decision: If "round number levels" or "psychological price levels" is an established concept, associate with that. If no such concept exists, the claim is domain-relevant and extractable but lacks clear concept association.
Status: The claim is recorded as domain-relevant but association-pending. The treatment of such claims remains unresolved methodology content.
Framework handling: ✓ Permits claims to be domain-relevant without forcing premature concept association
5. What A4 Unlocks
A5 — Contradiction Handling is now directly unblocked, because claims are now organized by concept, enabling identification of contradictions between claims about the same concept.
A6 — Researcher Interpretation Construction is now directly unblocked, because the methodology can collect all claims relevant to a specific concept and organize them for interpretation work.
B1 — Research-Question Identification is not directly unblocked by A4; it depends on A6. Once A6 is complete, B1 becomes unblocked.
Concept understanding construction (D1) now has a defined pipeline for gathering relevant source material.
6. Remaining Questions — Classified Only
Question	Classification
Mechanism for recording association ambiguity	Methodology content — not blocking A5
Treatment of association-pending claims	Methodology content — not blocking A5
Whether AI assists in concept association	DEFER TO REQUIREMENTS
How concept associations are stored or indexed	DEFER TO ARCHITECTURE
Whether multiple researchers may assign different associations	Methodology content — not blocking A5
Treatment of typos, synonyms, or variant terminology referring to the same concept	Methodology content — not blocking A5
7. Ratification Record
Decision: A4 — Concept Association
Status: RATIFIED
Ratification basis: Semantic Consistency Audit — four corrections applied
Corrections applied:
Removed ontological concept definition; replaced with minimal semantic reference (a subject of substantive concern, recognized during research process)
Clarified primary subject determination to require both logical structure and substantive focus assessment; removal test alone is insufficient
Removed unsupported forward assignment of concept creation to A6; stated only that association-pending claims are recorded with treatment deferred
Corrected downstream unlock claims: A5 and A6 are directly unblocked; B1 is not directly unblocked (depends on A6)
No contradiction with Founding Definition v0.1, Decision D1, A1, A2, or A3 detected
Open methodology questions: 2 (association ambiguity recording; association-pending treatment) — neither blocks A5
8. Stop Statement
A4 — Concept Association is RATIFIED.

A5 — Contradiction Handling is now directly unblocked but has not begun.




Apply the completed Semantic Consistency Audit to Decision A4.

AUTHORITATIVE INPUTS

PROJECT MINORE — FOUNDING DEFINITION v0.1 (RATIFIED)
DECISION D1 (RATIFIED)
DECISION A1 (RATIFIED)
DECISION A2 (RATIFIED)
A2-C1 and A2-C2 (BINDING)
DECISION A3 (RATIFIED)
A3-C1 (BINDING)
DECISION A4 — CONCEPT ASSOCIATION (PROPOSED)
SEMANTIC CONSISTENCY AUDIT — DECISION A4 (COMPLETED)
TASK

Produce the corrected ratified Decision A4 by applying only the four audit findings.

REQUIRED CORRECTIONS

Remove the premature ontological definition of Concept.
Replace it with the minimum semantic reference necessary for A4:

“Concept: A subject of substantive concern within the research domain — what a claim is substantively about. Concepts are recognized during the research process; A4 establishes rules for associating claims with them.”

Do not define a Concept ontology.
Do not introduce concept types, entity structure, lifecycle, or creation procedure.

Correct the Primary Subject criterion.
Do not use the removal test as sufficient by itself.

Establish that:

a primary subject is a concept whose subject matter the claim’s substantive assertion fundamentally addresses;
logical necessity may be supporting evidence but does not by itself establish substantive subject-matter primacy;
a concept may be necessary to the sentence’s logical structure without being a primary subject.
Update any affected wording or tests minimally.

Remove the unsupported assignment of concept creation to A6.
For domain-relevant claims without clear concept association, state only:

“A domain-relevant claim that lacks clear concept association is recorded as such. The treatment of association-pending claims remains unresolved methodology content.”

Do not assign concept creation to A6.
Do not define a mandatory lifecycle for association-pending claims.

Correct the downstream unlock statement.
State exactly:

A5 — Contradiction Handling is directly unblocked by A4.
A6 — Researcher Interpretation Construction is directly unblocked by A4.
B1 — Research-Question Identification is not directly unblocked by A4; it depends on A6.
Do not invent an A5 → A6 dependency.

OUTPUT

DECISION A4 — CONCEPT ASSOCIATION
