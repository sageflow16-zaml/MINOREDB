# A2-001 - Proposed decision block

| Provenance field | Value |
|---|---|
| Artifact ID | A2-001 |
| Authority / Decision ID | A2 |
| Artifact Type | Proposed decision block |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 13600 |
| End Line | 13800 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

DECISION A2 — CLAIM EXTRACTION PROCEDURE
Status: PROPOSED — awaiting audit and ratification
Upstream Authority:

PROJECT MINORE — FOUNDING DEFINITION v0.1
DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE
DECISION A1 — RESEARCH INPUT ADMISSIBILITY AND PROVENANCE
1. Exact Semantic Distinctions
Concept	Meaning
Source claim	A proposition that can be attributed to the source in the source's own terms
Extractable claim	A source claim that is sufficiently self-contained to be recorded and later evaluated independently
Claim boundary	The minimum unit of source content that constitutes one complete, independently evaluable proposition
Fidelity	The degree to which an extracted claim preserves the source's actual wording and meaning without distortion
Context	Surrounding source content required to prevent a claim from being misread when separated from its original location
Researcher inference	Any meaning added, implied, or derived by the researcher that is not present in the source's own terms
Illustration or example	Source content that demonstrates a principle without explicitly asserting it as a general rule
Rhetorical statement	Source content whose communicative purpose is motivational, stylistic, or relational rather than propositional
2. Minimum Options
Option A — Verbatim-Only Extraction
Extract only exact verbatim quotations. No paraphrase permitted.

Problem: Verbatim extraction from transcribed, translated, or summarized material is often impossible. This standard excludes large classes of legitimate research input without founding justification. Verbatim is a fidelity mechanism, not the only one.

Option B — Faithful Paraphrase Permitted with Fidelity Constraints
Extraction may use faithful paraphrase where verbatim is unavailable or impractical, provided the paraphrase is clearly marked as paraphrase, the original wording is preserved where available, and no meaning is added or altered.

Test against D1: Source claims must remain immutable and attributable. Immutability applies to the recorded claim once extracted — it does not require verbatim capture, only that what is recorded is not subsequently altered. Faithful paraphrase, clearly marked, satisfies attributability and immutability.

Option C — Liberal Interpretation Permitted
The researcher may extract the "intended meaning" of source content even when that meaning is not explicitly stated.

Problem: Directly violates D1's separation of source claims from researcher interpretation and the Core Principle's requirement to preserve "what a source said." Rejected.

Verdict: Option B is the minimum viable and founding-consistent standard.

3. Adversarial Extraction Tests
Test 1 — One sentence, one explicit assertion
"Price always returns to the mean."

Extract: Yes
Claim boundary: The full sentence as stated
Preserve: Exact wording; source location
Context required: Minimal — proposition is self-contained
Outside the claim: Any researcher judgment about whether "always" is accurate
Test 2 — One sentence, multiple independent assertions
"Fair Value Gaps form on three-candle structures and are always filled before continuation."

Extract: Yes — as two separate claims
Claim 2a: "Fair Value Gaps form on three-candle structures"
Claim 2b: Fair Value Gaps "are always filled before continuation"
Claim boundary: Each independently evaluable proposition is a separate extractable claim; they must not be fused into one
Preserve: Original sentence preserved as shared source context for both claims
Context required: Note that both claims appeared in one sentence
Outside the claims: Any inference about the relationship between the two assertions
Test 3 — Meaning depends on surrounding context
Paragraph: "In the London session, price will often seek liquidity above the previous day's high. This move creates the conditions for the reversal. You want to be positioned for that reversal."

Extract: Yes — one claim with required context
Claim: In the London session, price will often seek liquidity above the previous day's high, and this move creates conditions for a reversal
Claim boundary: The two propositional sentences together; the third sentence ("You want to be positioned...") is procedural instruction, not a general assertion about price behavior
Preserve: All three sentences as source context; extracted claim draws from first two only
Context required: Session context (London) is load-bearing and must accompany the claim
Outside the claim: What "often" means quantitatively; whether "conditions" implies certainty; researcher trading intention
Test 4 — Example demonstrating a rule without stating it
"For instance, if price sweeps the 3am low and then closes back above it on a five-minute candle, that's your displacement."

Extract: Conditional — with explicit epistemic flag
Claim boundary: The example may be extracted as: "Source illustrates displacement as: price sweeps a prior low then closes back above it on a five-minute candle"
Preserve: The source content as an illustration, not as a stated general rule
Context required: Must be accompanied by notation that this is an example, not an explicit general definition; the general rule is implied, not asserted
Outside the claim: Any researcher generalization such as "therefore displacement always requires a close above the swept level" — this is interpretation, not extraction
Note: The implied general rule is a candidate for researcher interpretation (A6), not extraction
Test 5 — Rhetorical or motivational statement
"Most traders will never understand what I'm about to share with you."

Extract: No
Reason: No research-relevant proposition present; purely rhetorical framing
Claim boundary: Not applicable
Preserve: May be noted as surrounding context if adjacent propositional content requires it
Outside the claim: Everything — this sentence makes no falsifiable or descriptive assertion about price, markets, or trading mechanics
Test 6 — Procedural instruction
"Wait for the 8:30 news event, then look for a displacement candle, then enter at the 50% level of the displacement."

Extract: Yes — as a procedural claim
Claim boundary: The full three-step sequence as one unit; the steps are not independently evaluable without the sequence
Preserve: Exact wording or faithful paraphrase marked as such; all three steps
Context required: Session/timing context if stated; that this is presented as a trading procedure
Outside the claim: Whether the procedure is effective; researcher judgment about what "displacement" means (A4/A6 territory)
Test 7 — Ambiguous statement supporting multiple interpretations
"The market makers will take price to where the orders are."

Extract: Yes — with ambiguity explicitly preserved
Claim boundary: The sentence as stated
Preserve: Exact wording; the ambiguity must not be resolved at extraction
Context required: Any surrounding content that constrains interpretation; if none exists, the ambiguity is recorded as a property of the extracted claim
Outside the claim: Any researcher resolution of whether "market makers" refers to institutional participants, a metaphor, or a mechanical process — this is interpretation (A6)
Note: Multiple interpretations of one extracted claim are legitimate; they must not be collapsed into one reading at extraction
Test 8 — Transcription with uncertain or damaged wording
"Price will [inaudible] the previous high before [unclear: reversing / continuing]."

Extract: Yes — with damage explicitly marked
Claim boundary: The recoverable content as stated; gaps marked as gaps
Preserve: Recoverable wording verbatim; damaged or uncertain portions marked explicitly (e.g., "[inaudible]", "[unclear]"); competing readings noted where they exist
Context required: That this originates from a transcription with known uncertainty
Outside the claim: Any researcher completion of the gap ("I think the source meant 'reverse'") — this is interpretation and must be separated
Test 9 — Repeated claim across multiple source locations
Same claim: "Fair Value Gaps are always filled" appears in Source A at timestamp 14:32 and in Source B in chapter 3.

Extract: Yes — as two separate extractions, one per source location
Claim boundary: Identical or near-identical propositional content does not merge into one claim; source location is part of the claim's identity
Preserve: Each instance independently, with its own provenance
Context required: Each instance's surrounding context recorded separately
Outside the claim: Any researcher synthesis noting they agree or disagree; that is interpretation (A6)
Note: Repetition across sources is research-relevant (convergence or independent origination); collapsing instances loses this information
Test 10 — Statement containing both source assertion and researcher inference risk
"When ICT says 'the algorithm targets liquidity,' he means that price is mechanically driven to stop-loss clusters."

Extract: Partially — with mandatory separation
Source claim extractable: "The algorithm targets liquidity" (attributed to ICT, source location required)
Not extractable as source claim: "he means that price is mechanically driven to stop-loss clusters" — this is researcher interpretation of the source's meaning, not the source's own words
Claim boundary: The quoted or paraphrased source assertion only; the interpretive gloss is outside the boundary
Preserve: Source assertion in source terms; the interpretive addition must be separately recorded as researcher interpretation
Outside the claim: The entire explanatory clause following "he means"
4. Recommended Decision
Option B — faithful paraphrase permitted under explicit fidelity constraints — is the minimum viable extraction standard.

The extraction procedure must:

Identify the minimum self-contained propositional unit
Preserve source wording where available; use faithful paraphrase only where necessary, marked explicitly
Draw claim boundaries at the level of independently evaluable propositions
Separate each independent assertion within a single source passage into distinct claims
Carry required context without importing interpretation
Explicitly mark ambiguity, damage, and uncertainty rather than resolving them
Never add researcher meaning to a source claim
5. Binding Methodology Rules
An extractable claim is the minimum source content that constitutes one independently evaluable proposition. A passage containing multiple independent propositions must yield multiple extracted claims.

Extraction preserves what the source said, not what the researcher believes the source meant. Meaning added by the researcher is interpretation, not extraction.

Verbatim wording must be preserved where available. Where verbatim is unavailable or impractical, faithful paraphrase is permitted and must be explicitly marked as paraphrase.

An extracted claim must not be altered after extraction. Once recorded, a source claim is immutable (per D1). Correction of an error in extraction requires creating a new extraction with a note superseding the prior one, not silent overwriting.

Ambiguity in source content must be preserved, not resolved, at extraction. Multiple readings of an ambiguous statement must be recorded as properties of the claim, not collapsed into one interpretation.

Damaged or uncertain wording must be explicitly marked. Gaps must not be completed by the researcher at the extraction stage.

Repeated claims must be extracted once per source location. Source repetition is a research-relevant fact; instances must not be merged.

Each extracted claim must carry its provenance. Per A1 Rule 8 — provenance and extraction are inseparable.

6. Claim Boundary Rules
The atomic unit is one independently evaluable proposition. If removing one part of a passage leaves the other parts still evaluable, they are separate claims.

Context-dependent claims carry their required context. Load-bearing context (session, timeframe, condition) is part of the claim's minimum content, not surrounding noise.

Examples are not general rules. An example may be extracted as an illustration of a possible rule; the general rule itself is not extractable unless the source explicitly states it.

Procedural instructions are extracted as unified sequences. Steps in a procedure are not independently evaluable without the sequence; they constitute one claim.

Rhetorical and motivational statements are not extracted. They contain no independently evaluable proposition about price, markets, or trading mechanics.

Implied meaning does not cross the extraction boundary. If a proposition is implied but not stated, it is a candidate for researcher interpretation (A6), not extraction.

7. Fidelity and Context Rules
Fidelity means the extracted claim accurately represents what the source said in the source's own terms. It does not mean agreement with the source.

Paraphrase must not alter meaning. A paraphrase that changes emphasis, scope, or logical force is not faithful and must not be used.

Context is included to prevent misreading, not to enrich meaning. Only context necessary to preserve the claim's meaning when separated from its source location is required.

Context is not part of the claim. It accompanies the claim but must remain distinguishable from the claim itself.

The researcher's explanatory additions must be recorded separately. No explanatory gloss may be embedded within the source claim record.

8. What A2 Unlocks
A3 — Claim Classification may now be defined, because the methodology establishes what a claim is, where its boundaries lie, and that its content is fixed before classification occurs.
The separation between source claims and researcher interpretation is now procedurally enforced, enabling D1's epistemic rules to operate at the claim level.
Repeated claims, ambiguous claims, and damaged-source claims each have defined handling, preventing silent distortion in downstream concept and interpretation work.
9. Remaining Questions — Classified Only
Question	Classification
How claims are stored and indexed	DEFER TO ARCHITECTURE
Claim identifier structure	DEFER TO ARCHITECTURE
Whether AI assists in claim extraction	DEFER TO REQUIREMENTS
Extraction from non-linguistic sources (charts, diagrams)	Methodology content — not blocking A3
Procedure for superseding an incorrectly extracted claim	Methodology content — not blocking A3
Criteria for what makes paraphrase "faithful" in edge cases	Methodology content — not blocking A3
10. Final Verdict
DECISION A2 PROPOSED.

Extraction standard: faithful minimum-unit proposition extraction with explicit fidelity, provenance inseparability, ambiguity preservation, and strict separation of source content from researcher interpretation.

No contradiction with Founding Definition v0.1, Decision D1, or Decision A1 detected.

A3 — Claim Classification is now unblocked.

11. Stop Statement
Decision A2 is proposed and awaiting audit and ratification.

A3 has not begun. Research Methodology has not been constructed.
