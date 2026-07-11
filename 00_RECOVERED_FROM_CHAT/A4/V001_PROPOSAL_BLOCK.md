# A4-001 - Proposed decision block

| Provenance field | Value |
|---|---|
| Artifact ID | A4-001 |
| Authority / Decision ID | A4 |
| Artifact Type | Proposed decision block |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 11070 |
| End Line | 11240 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

DECISION A4 — CONCEPT ASSOCIATION
Status: PROPOSED — awaiting semantic consistency audit
Upstream Authority:

PROJECT MINORE — FOUNDING DEFINITION v0.1
DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE
DECISION A1 — RESEARCH INPUT ADMISSIBILITY AND PROVENANCE
DECISION A2 — CLAIM EXTRACTION PROCEDURE
A2-C1 and A2-C2 (BINDING)
DECISION A3 — CLAIM CLASSIFICATION
A3-C1 — CLASSIFICATION USES PRESERVED SOURCE CONTEXT (BINDING)
1. Exact Semantic Distinctions
Concept	Meaning
Concept	A trading-domain entity representing a distinct idea, pattern, mechanism, or method (e.g., Fair Value Gap, Order Block, liquidity, reversal). Concepts are identified by the researcher during interpretation construction (A6), not pre-determined.
Concept association	The relationship between an extracted source claim and one or more concepts to which it substantively pertains
Subject matter	What a claim is substantively about — determined by both explicit wording and available preserved context
Mention	A term appears in the claim but the claim is not substantively about that concept
Primary subject	The concept(s) that the claim's assertion directly concerns; the claim would not make sense or lose essential meaning if the concept were removed
Secondary mention	A concept referenced as supporting context or example, not the claim's primary focus
Relational association	Both or all concepts participating in a stated relationship are associated with the claim; the relationship itself is the subject matter
Association ambiguity	Uncertainty about which concept(s) a claim substantively pertains to, remaining after source context is fully considered
2. Minimum Options
Option A — Mention-Based Association
A claim is associated with every concept-term mentioned in its wording.

Problem: Conflates terminological appearance with substantive subject matter. A claim explaining how Market Makers create Fair Value Gaps would be associated with both Market Makers and Fair Value Gaps, even if it's primarily about Fair Value Gap mechanisms. Creates false multiplicity and noise in concept development.

Option B — Primary Subject-Matter Association Only
A claim is associated only with the concept(s) that are its primary subject matter; secondary mentions are excluded.

Problem: Loses relationship information. A relational claim such as "Fair Value Gaps are liquidity voids" is about both concepts' relationship, not just one. Forcing a single primary association discards the claim's essential content.

Option C — Primary + Multiple Association with Context-Dependent Rules
A claim may be associated with one or more concepts based on substantive subject matter in context.

If the claim's subject matter is primarily one concept, associate it primarily with that concept.
If the claim substantively concerns multiple concepts (relational, comparative, or explicitly multi-concept claims), associate it with all relevant concepts.
Secondary mentions are excluded unless they constitute part of the claim's substantive subject matter.
Use preserved source context to determine substantive subject matter, not isolated wording.
Test against D1: Preserves claim immutability (claims are not altered); maintains epistemic separation (association is metadata, not interpretation); enables concept understanding construction to collect all substantively relevant claims.

Verdict: Option C is the minimum viable standard.

3. Adversarial Association Tests
Test 1 — Claim clearly about one concept
"A Fair Value Gap is a three-candle imbalance where the wicks of candles 1 and 3 do not overlap"

Claim classification: Definitional
Concept mentioned: Fair Value Gap (only)
Subject matter: Fair Value Gap exclusively
Association: Fair Value Gap
Reasoning: The claim defines Fair Value Gap; it is substantively about Fair Value Gap only
Framework handling: ✓ Correct
Test 2 — Claim mentions multiple concepts, substantively about one
"Order Blocks act as supply and demand zones where institutional traders reverse their positions, creating Fair Value Gaps as they exit"

Claim classification: Mechanistic (explains market process)
Concepts mentioned: Order Blocks, supply/demand zones, institutional traders, Fair Value Gaps
Subject matter: How Order Blocks function as reversal zones; Fair Value Gaps are secondary (mentioned as a consequence)
Primary association: Order Blocks
Secondary mentions: Fair Value Gaps, supply/demand zones (mentioned but not the claim's focus)
Association decision: Order Blocks (primary subject matter)
Note: Fair Value Gaps appears as a consequence example, not as the claim's subject. The claim would remain substantively complete without mentioning FVGs; it would be incomplete without discussing Order Blocks.
Framework handling: ✓ Distinguishes primary subject from secondary mentions
Test 3 — Genuinely relational claim
"Fair Value Gaps and liquidity voids are essentially the same market structure"

Claim classification: Relational (+ possibly Definitional if defining via equivalence)
Concepts mentioned: Fair Value Gaps, liquidity voids
Subject matter: The relationship between Fair Value Gaps and liquidity voids
Association: Both Fair Value Gaps AND liquidity voids
Reasoning: The claim's essential subject matter is the relationship itself. Removing either concept would destroy the claim's meaning. Both are primary subjects.
Framework handling: ✓ Relational claims are associated with all participating concepts
Test 4 — Claim whose concept association is uncertain after context review

Source: "The sweep to the high creates the condition for the reversal."

Preserved context: Prior passage discusses Order Blocks; current section focuses on entry timing patterns. The word "sweep" could refer to liquidity sweeps generally or specifically to the sweep component of Order Block formation.

Claim classification: Mechanistic (explains causation)
Concepts mentioned: high, reversal (and implicitly: sweep)
Subject matter (without full context): Unclear — does "sweep to the high" concern Order Blocks, liquidity sweeps, or a broader pattern?
Subject matter (with full context): Context indicates discussion of Order Block timing patterns
Association: Order Blocks (determined by context); reversal (a condition, not a concept association unless reversal is established as a distinct concept)
Uncertainty handling: Context resolves most ambiguity. If ambiguity remains (e.g., is "reversal" a distinct concept or just a term for outcome?), the uncertainty is preserved as association ambiguity, not resolved by guessing.
Framework handling: ✓ Context is used; genuine remaining ambiguity is preserved
Test 5 — Domain-relevant claim that may not map cleanly to established concepts

"Price respects round numbers like 1.2000 and 1.3000 because traders use them as psychological references"

Claim classification: Mechanistic (explains why price behaves this way)
Concepts mentioned: round numbers, price behavior, traders
Subject matter: Why price respects round numbers; a psychological market mechanism
Concept association problem: "Round numbers" is not yet an established trading concept in the research domain. It's domain-relevant (A2-C1) but may not yet have a corresponding concept entity.
Association decision: If "round number levels" or "psychological price levels" is an established concept, associate with that. If no such concept exists, the claim is domain-relevant and extractable but association-pending — it awaits concept creation in A6 (researcher interpretation construction).
Framework handling: ✓ Permits claims to be domain-relevant without forcing premature concept association; association may be pending concept definition
Test 6 — Claim where multiple concepts are genuinely substantive

"Institutional traders use Order Blocks as reference points to identify Fair Value Gaps they will fill, creating liquidity at multiple price levels"

Claim classification: Mechanistic (explains institutional trading behavior and its relationship to multiple patterns)
Concepts mentioned: Institutional traders, Order Blocks, Fair Value Gaps, liquidity
Subject matter: How Order Blocks, Fair Value Gaps, and liquidity are related in institutional trading behavior; all three are integral to the claim's substantive meaning
Association: Order Blocks, Fair Value Gaps, liquidity (all are substantively involved)
Reasoning: Removing any of these three concepts would remove essential subject matter. The claim is about their integrated relationship in market behavior.
Framework handling: ✓ Multi-concept association is valid when all are substantive
Test 7 — Classification vs. concept association distinction

"Price always fills Fair Value Gaps before continuing the trend" (Predictive claim)

What A3 answers (classification): This claim makes a Predictive assertion (something happens)
What A4 answers (concept association): This claim is substantively about Fair Value Gaps and trend continuation
Both answers are needed: Classification enables understanding what type of source assertion was made; concept association enables collecting all claims relevant to building understanding of Fair Value Gaps
Framework handling: ✓ Maintains the distinction between assertion type and subject matter
4. Recommended Decision
Option C — Primary + Multiple Association with Context-Dependent Rules

A claim is associated with one or more concepts based on substantive subject matter determined from the claim and its preserved source context.

Rules:

A claim's subject matter is what it is substantively about, determined from explicit wording plus preserved context
Mention of a concept-term does not constitute association unless the claim is substantively about that concept
Relational and multi-concept claims are associated with all participating concepts when all are substantively involved
Use preserved source context per A3-C1 to determine subject matter; do not manufacture ambiguity by isolated analysis
If a domain-relevant claim's concept association remains genuinely ambiguous after context review, preserve the ambiguity rather than forcing association
A domain-relevant claim may lack clear concept association if no established concept exists for its subject matter; such claims are association-pending, not excluded
5. Binding Methodology Rules
Concept association identifies what a claim is substantively about. It is distinct from classification (what kind of assertion was made) and from researcher interpretation (what the researcher believes the concept means).

Mention is not association. A concept term appearing in a claim does not establish association unless the claim is substantively about that concept.

Source context determines substantive subject matter. Association is determined using the extracted claim together with its preserved source context. Association ambiguity must not be manufactured by isolating wording from available context.

Relational and multi-concept claims are associated with all substantively participating concepts. If a claim states a relationship between two or more concepts, or if multiple concepts are integral to its subject matter, association includes all.

A claim may have zero, one, or multiple concept associations. Each association is based on substantive subject matter, not on arbitrary cardinality constraints.

Association ambiguity is preserved when genuinely unresolved. If substantive subject matter remains ambiguous after context is considered, that ambiguity is recorded rather than resolved by guessing.

Domain-relevant claims without clear concept associations are association-pending, not invalid. A claim addressing a subject area relevant to the research domain (A2-C1) may lack association if no established concept yet exists for that subject matter.

Association metadata does not alter the extracted claim. The claim remains immutable per D1; association is metadata about the claim's subject matter.

6. What A4 Unlocks
A5 — Contradiction Handling may now proceed, because claims are now organized by concept, enabling identification of contradictions between claims about the same concept.
A6 — Researcher Interpretation Construction may now proceed, because the methodology can collect all claims relevant to a specific concept and organize them for interpretation work.
B1 — Research-Question Identification may now proceed, because concepts with collected claims can be examined for unanswered research questions.
Concept understanding construction (D1) now has a defined pipeline for gathering relevant source material.
7. Remaining Questions — Classified Only
Question	Classification
Mechanism for recording association ambiguity	Methodology content — not blocking A5
Whether AI assists in concept association	DEFER TO REQUIREMENTS
How concept associations are stored or indexed	DEFER TO ARCHITECTURE
Confidence or strength metrics for associations	DEFER TO ARCHITECTURE/REQUIREMENTS
Concept identifier or naming conventions	DEFER TO REQUIREMENTS
Whether multiple researchers may assign different associations	Methodology content — not blocking A5
Treatment of typos, synonyms, or variant terminology referring to the same concept	Methodology content — not blocking A5
8. Final Verdict
DECISION A4 PROPOSED.

Concept association model: Primary and/or multiple substantive association based on context-determined subject matter.

Association basis: What a claim is substantively about, not what terms it mentions.

Relationship to ratified upstream: Consistent with D1 (claim immutability), A2 (context preservation), A3 (classification as distinct from association).

No contradiction with any ratified authority detected.

A5 — Contradiction Handling is now unblocked.

