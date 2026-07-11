# A3-001 - Proposed decision block

| Provenance field | Value |
|---|---|
| Artifact ID | A3-001 |
| Authority / Decision ID | A3 |
| Artifact Type | Proposed decision block |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 12313 |
| End Line | 12600 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

DECISION A3 — CLAIM CLASSIFICATION
Status: PROPOSED — awaiting semantic consistency audit
Upstream Authority:

PROJECT MINORE — FOUNDING DEFINITION v0.1
DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE
DECISION A1 — RESEARCH INPUT ADMISSIBILITY AND PROVENANCE
DECISION A2 — CLAIM EXTRACTION PROCEDURE
DECISION A2 — ADDITIONAL BINDING CLARIFICATIONS A2-C1 and A2-C2
1. Exact Semantic Purpose of Claim Classification
Classification exists to preserve what kind of assertion the source made, enabling different claim types to be handled appropriately in downstream research.

Classification serves three functions:

Preserves the Founding Definition's required distinctions (Core Problem Q4: "Which parts are definitions, mechanisms, predictions, or heuristics?")

Enables appropriate downstream processing:

Definitional and Relational claims → concept understanding construction (A6)
Mechanistic and Predictive claims → research question and hypothesis formation (B1, M2)
Prescriptive claims → trading procedure and rule development
Attributional claims → knowledge provenance tracking
Maintains epistemic separation: Classification records the source's assertion type without judging truth, authority, empirical support, or researcher agreement

2. Derivation of Minimum Necessary Categories
From Founding Definition Core Problem Q4:
Definitions → Definitional
Mechanisms → Mechanistic
Predictions → Predictive
Heuristics → Prescriptive (heuristics are practical rules/guidelines)
From A2 Extraction Scope:
A2 permits extraction of procedural instructions, examples, and relationship claims. Testing these against the four core categories reveals gaps:

Procedural instructions are Prescriptive (sequential action specifications)
Relationship claims (e.g., "X is a type of Y") are neither intrinsic definitions nor predictions — new category required: Relational
Attribution claims about knowledge origin (e.g., "ICT learned this from...") are research-relevant per A2-C1 but don't fit any core category — new category required: Attributional
Minimum Complete Set: Six Categories
Definitional — what a concept is or means
Mechanistic — how or why something works
Predictive — what happens or will happen
Prescriptive — rules, guidelines, or instructions for action
Relational — relationships between concepts
Attributional — knowledge origin and provenance
3. Category Definitions and Boundary Tests
Category 1: Definitional
Semantic boundary: The claim states what a concept or term is, what it means, or what intrinsic properties constitute it.

Distinguishes from:

Mechanistic: describes what something is, not how it works
Relational: defines intrinsic properties, not relationships to other concepts
Predictive: establishes meaning, not behavioral outcomes
Example: "A Fair Value Gap is a three-candle imbalance where the wicks of candles 1 and 3 do not overlap"

Ambiguous boundary case:
"An Order Block is the last consolidation before an impulse move that price reverses back into"

This is definitional (defines Order Block) but embeds predictive content ("reverses back into").

Resolution: Multiple classifications apply — Definitional ✓ (defines the pattern), Predictive ✓ (asserts reversal behavior as defining characteristic)

Category 2: Mechanistic
Semantic boundary: The claim explains how something works, why something happens, or describes a causal process or structural relationship underlying market behavior.

Distinguishes from:

Definitional: explains process/causation, not just what something is
Predictive: explains why outcomes occur, not merely that they occur
Prescriptive: explains how markets work, not how to act
Example: "Institutional traders accumulate positions by engineering stop-loss hunts that create liquidity for their large orders"

Ambiguous boundary case:
"Price respects Fair Value Gaps because institutions use them as reference points"

This explains why (mechanism) and implies what happens (prediction).

Resolution: Mechanistic ✓ (explains causal process); may also be Predictive ✓ if "respects" is treated as an outcome assertion rather than just explanation

Category 3: Predictive
Semantic boundary: The claim asserts that something happens, will happen, tends to happen, or occurred under specified or general conditions. Includes empirical regularities and expected outcomes.

Distinguishes from:

Mechanistic: asserts what happens, not necessarily why
Prescriptive: describes what does happen, not what one should do
Definitional: makes claims about events/behavior, not about concept meaning
Example: "Price will return to fill unfilled Fair Value Gaps before continuing the trend"

Ambiguous boundary case:
"Fair Value Gaps always fill"

Is "always fills" a defining property (Definitional) or an empirical prediction (Predictive)?

Resolution: Depends on context. If the source presents this as what FVGs intrinsically are/do, then Definitional ✓ + Predictive ✓. If presented as empirical observation, Predictive ✓ only. Ambiguity is preserved; both classifications may be applied.

Category 4: Prescriptive
Semantic boundary: The claim provides a rule, guideline, instruction, procedure, or recommendation for action or judgment. Includes heuristics (rules of thumb), sequential procedures, entry/exit rules, and decision criteria.

Distinguishes from:

Predictive: instructs what to do, not what happens
Mechanistic: prescribes action, not explains market causation
Definitional: action-oriented, not meaning-oriented
Example: "Wait for the New York session open, then look for a liquidity sweep above the Asian high, then enter on the first displacement candle back into the range"

Ambiguous boundary case:
"Don't enter trades during the lunch hour because volatility is low"

Prescriptive instruction ("don't enter") with mechanistic justification ("because volatility is low").

Resolution: Prescriptive ✓ (primary action instruction), Mechanistic ✓ (explains why via volatility claim)

Category 5: Relational
Semantic boundary: The claim establishes a relationship between two or more concepts, including taxonomic relationships (is-a, part-of, type-of), equivalence, or conceptual associations.

Distinguishes from:

Definitional: relates concepts to each other, not defines one in isolation
Mechanistic: describes conceptual structure, not causal processes
Predictive: about concept relationships, not event outcomes
Example: "Liquidity voids and Fair Value Gaps are the same thing"

Ambiguous boundary case:
"Order Blocks are a type of supply and demand zone"

This establishes a taxonomic is-a relationship but also partially defines Order Blocks via that relationship.

Resolution: Relational ✓ (taxonomic relationship), Definitional ✓ (definition via relationship is still definitional)

Category 6: Attributional
Semantic boundary: The claim makes an assertion about the origin, source, authorship, provenance, transmission, or historical development of trading knowledge, concepts, or methods.

Distinguishes from:

All other categories: concerns knowledge genealogy, not market behavior or trading methods
Not claims about what markets do, but about where knowledge came from
Example: "ICT learned this concept from a Chicago trading mentor in the 1990s"

Ambiguous boundary case:
"This entry technique was developed by observing institutional order flow in the futures market"

Describes origin (Attributional) and hints at mechanistic basis (institutional order flow observation).

Resolution: Attributional ✓ (describes technique origin). Mechanistic classification requires actual explanation of the mechanism, not just reference to observational basis.

4. Single vs. Multiple Classification Decision
Analysis of boundary cases reveals:
Many real-world claims contain multiple semantic aspects simultaneously. Examples:

Definitions that predict behavior
Mechanisms that also make predictions
Prescriptions that explain why
Three Options:

Option A — Single Classification Only
Each claim must fit exactly one category.

Problem: Forces artificial categorization; loses semantic information; fails to preserve what the source actually said (e.g., a definition that also predicts must be forced into one bucket).

Option B — Multiple Classifications Permitted
Each claim may receive zero or more classifications from the six categories.

Test: Preserves full semantic content; reflects source assertion accurately; enables nuanced downstream processing.

Option C — Primary + Secondary Classification
One primary category plus optional secondary characteristics.

Problem: Requires deciding which aspect is "primary" — an interpretive judgment not inherent in the source claim. Adds complexity without clear benefit over Option B.

Recommended Decision: Option B — Multiple Classifications Permitted

Semantic rule: A claim receives a classification if and only if it contains that semantic aspect, regardless of what other aspects it contains.

Lower bound: Every extracted claim should receive at least one classification. A claim fitting no category indicates either an extraction error (violates A2-C1 domain relevance) or an incomplete category set.

5. Adversarial Framework Tests
Test 1: Definition that also implies a prediction
"A Fair Value Gap is an imbalance that must be filled"

Classifications:

Definitional ✓ (defines what an FVG is)
Predictive ✓ ("must be filled" asserts future behavior)
Framework handling: ✓ Multiple classifications preserve both semantic aspects

Test 2: Mechanism explanation that contains a causal prediction
"Smart money accumulates by sweeping liquidity above obvious levels, which causes price reversals"

Classifications:

Mechanistic ✓ (explains how smart money operates)
Predictive ✓ (reversals occur as a result)
Framework handling: ✓ Both aspects captured

Test 3: Procedural instruction based on unstated mechanism
"Enter after price sweeps the high and closes back inside the range"

Classifications:

Prescriptive ✓ (entry instruction)
Note: The mechanism (why sweeps create entry opportunities) is implied but not stated in the claim → not classified as Mechanistic per classification rule (only classify what is present, not what is implied).

Framework handling: ✓ Correctly classifies only stated content

Test 4: Attribution claim about concept origin
"ICT learned optimal trade entry from his mentor in 1992"

Classifications:

Attributional ✓ (knowledge provenance)
Framework handling: ✓ Distinct category captures this appropriately

Test 5: Descriptive historical claim
"The 2022 mentorship program covered liquidity concepts over six months"

Classifications:

Attributional ✓ (about source material structure/transmission)
Note: Borderline case — metadata about the source itself rather than concept genealogy. Attributional is the closest fit for source-structure claims.

Framework handling: ✓ Handled, with noted ambiguity that this stretches Attributional slightly

Test 6: Claim relating two trading concepts
"Fair Value Gaps are essentially the same as liquidity voids"

Classifications:

Relational ✓ (establishes equivalence)
Definitional ✓ (partially defines FVG via equivalence)
Framework handling: ✓ Both aspects preserved

All six tests pass.

6. Recommended Classification Model
Six semantic categories:

Definitional
Mechanistic
Predictive
Prescriptive
Relational
Attributional
Multi-classification: Each claim may receive one or more classifications.

Lower bound: Every extracted claim should receive at least one classification.

Classification basis: What semantic aspects are present in the source's assertion, not what the researcher infers, believes, or judges to be true.

7. Binding Methodology Rules
Classification determines what kind of assertion the source made. It does not determine whether the claim is true, authoritative, empirically supported, testable, or belongs in the trading model.

Classification must not alter the extracted claim. The claim remains immutable per D1; classification is metadata about the claim, not modification of it.

A claim receives a classification if it contains that semantic aspect. Multiple classifications may apply to one claim.

Every extracted claim should receive at least one classification. If no category fits, this indicates either an extraction error or an incomplete category set requiring methodology revision.

Classification ambiguity is preserved, not resolved. Where a claim could reasonably fit multiple interpretations of a category, both/all applicable classifications may be applied.

Implied or unstated content is not classified. Only semantic aspects explicitly present in the claim receive classification.

Classification separates source assertion from researcher interpretation. The researcher classifies what the source said, not what the researcher believes the source meant or whether the claim is correct.

8. What A3 Unlocks
A4 — Concept Association may now proceed, because classified claims can be associated with concepts based on their semantic type (e.g., Definitional and Relational claims are strong signals for concept identification).
Downstream research pathways can differentiate claim handling based on classification (e.g., Predictive claims are candidates for hypothesis formation; Definitional claims inform concept understanding).
The Founding Definition's required distinction (Core Problem Q4) is now operationalized and enforceable.
9. Remaining Questions — Classified Only
Question	Classification
Whether AI assists in claim classification	DEFER TO REQUIREMENTS
How classifications are stored (fields, tags, enums)	DEFER TO ARCHITECTURE
Classification confidence or uncertainty representation	Methodology content — not blocking A4
Re-classification procedure if initial classification is incorrect	Methodology content — not blocking A4
Multi-annotator agreement for ambiguous classifications	Methodology content — not blocking A4
Whether some claim types should be weighted differently in concept association	A4 territory — not A3
10. Final Verdict
DECISION A3 PROPOSED.

Classification model: Six semantic categories (Definitional, Mechanistic, Predictive, Prescriptive, Relational, Attributional) with multi-classification support.

Classification basis: What kind of assertion the source made, preserving epistemic separation from truth, authority, or researcher interpretation.

No contradiction with Founding Definition v0.1, Decision D1, Decision A1, or Decision A2 detected.

A4 — Concept Association is now unblocked.

11. Stop Statement
A3 proposed.
