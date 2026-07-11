# M2-001 - Proposed decision block

| Provenance field | Value |
|---|---|
| Artifact ID | M2-001 |
| Authority / Decision ID | M2 |
| Artifact Type | Proposed decision block |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 2552 |
| End Line | 2947 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

# DECISION M2 — HYPOTHESIS FORMATION AND OPERATIONALIZATION

**Status:** PROPOSED — awaiting semantic consistency audit
**Upstream Authority:**
1. PROJECT MINORE — FOUNDING DEFINITION v0.1
2. DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE
3. DECISION A1 — RESEARCH INPUT ADMISSIBILITY AND PROVENANCE
4. DECISION A2 — CLAIM EXTRACTION PROCEDURE
5. A2-C1 and A2-C2 (BINDING)
6. DECISION A3 — CLAIM CLASSIFICATION
7. A3-C1 (BINDING)
8. DECISION A4 — CONCEPT ASSOCIATION
9. DECISION A5 — CONTRADICTION HANDLING PROCEDURE
10. DECISION A6 — RESEARCHER INTERPRETATION CONSTRUCTION
11. DECISION A7 — INTERPRETATION EVOLUTION TRIGGERS
12. A7-C1 and A7-C2 (BINDING)
13. DECISION B1 — RESEARCH-QUESTION IDENTIFICATION

---

## 1. Exact Semantic Distinctions

| Term | Meaning |
|------|---------|
| **Research question** | A substantively grounded question identified as worth investigating (B1). May or may not be testable empirically. |
| **Hypothesis** | A testable, falsifiable proposition formulated in response to a research question. Asserts a specific relationship, pattern, behavior, or outcome that can be empirically investigated. |
| **Testability** | The property of being investigable through observation, measurement, or empirical analysis of market data. A testable hypothesis can be supported or contradicted by evidence. |
| **Falsifiability** | The property of being capable of being proven wrong by empirical evidence. A falsifiable hypothesis makes specific claims that observable outcomes could contradict. |
| **Operationalization** | The process of translating abstract trading concepts into specific, measurable variables or observable market phenomena that can be identified and evaluated in actual market data. |
| **Observable variable** | A specific, identifiable phenomenon in market data (price level, candle structure, time condition, volume threshold, etc.) that corresponds to an abstract concept. |
| **Empirical testability** | A hypothesis is empirically testable when it can be investigated using available or obtainable market data through observation, measurement, or backtesting. |
| **Conceptual research question** | A research question addressing definitional, structural, or interpretive issues that may not require empirical testing (e.g., "How should this concept be defined?"). |
| **Empirical research question** | A research question addressing behavior, patterns, relationships, or outcomes in markets that requires empirical investigation. |
| **Hypothesis scope** | The specific conditions, instruments, timeframes, or contexts to which a hypothesis applies. |

---

## 2. Minimum Options

### Option A — All Research Questions Must Become Testable Hypotheses
Every identified research question must be converted into an empirically testable hypothesis before proceeding.

**Problem:** Some research questions are conceptual, definitional, or structural rather than empirical (e.g., "How should overlapping consolidations be classified?" from B1 Test 4). Forcing empirical testability on all questions contradicts B1 Rule 5. Blocks legitimate conceptual research.

### Option B — Hypotheses Are Optional
Research questions may or may not generate hypotheses at the researcher's discretion without constraints.

**Problem:** Provides no guidance on when/how empirical investigation should proceed. No distinction between questions that can be empirically tested and those that cannot. No operationalization framework. Undermines the empirical research pipeline.

### Option C — Conditional Hypothesis Formation Based on Question Type and Testability
- Empirical research questions may generate testable hypotheses when the researcher judges empirical investigation is warranted and feasible
- Hypotheses require operationalization when abstract concepts must be translated into observable market phenomena
- Some research questions may be answered conceptually, through interpretation construction, or through further source investigation without hypothesis formation
- Testability and falsifiability are requirements for empirical hypotheses but not for all research questions

**Test against upstream:** Respects B1's allowance for non-empirical questions (B1 Rule 5); preserves researcher authority; connects research questions to empirical testing when appropriate; maintains epistemic boundaries.

**Verdict:** Option C is the minimum viable and founding-consistent standard.

---

## 3. Hypothesis Formation and Operationalization Procedure

The following procedure governs how the researcher forms testable hypotheses and operationalizes concepts.

**Step 1 — Assess research-question type and investigative approach**

For an identified research question (B1):

Determine whether the question:
- Requires empirical investigation of market data (empirical research question)
- Can be addressed through interpretation construction, conceptual analysis, or source investigation (conceptual research question)
- Requires both conceptual clarification and empirical testing

**Step 2 — Determine whether hypothesis formation is appropriate**

If the question is empirical or has empirical components:
- Can a testable proposition be formulated?
- Is empirical investigation warranted and feasible?
- Are the relevant concepts operationalizable into observable market phenomena?

If yes, proceed to Step 3. If no, the question may be addressed through other means (interpretation work, conceptual analysis, source investigation).

**Step 3 — Formulate the hypothesis**

Construct a testable, falsifiable proposition that:
- Addresses the research question
- Makes a specific claim about market behavior, patterns, relationships, or outcomes
- Can be supported or contradicted by empirical evidence
- Specifies scope (instruments, timeframes, conditions) when relevant

The hypothesis must be falsifiable: observable outcomes must be capable of contradicting it.

**Step 4 — Identify concepts requiring operationalization**

Determine which abstract concepts in the hypothesis must be translated into observable market phenomena.

Examples:
- "Fair Value Gap" → specific candle-wick non-overlap structure
- "Order Block" → specific consolidation-before-impulse pattern
- "Liquidity sweep" → specific price-level breach pattern
- "Fill" → price returning to a specified zone

**Step 5 — Operationalize abstract concepts**

For each concept requiring operationalization:

Define specific, measurable criteria:
- What observable market phenomena correspond to this concept?
- What price, time, volume, or structure conditions must be met?
- What are the identification rules?
- What edge cases or ambiguities require explicit handling?

Operationalization must be:
- **Specific:** clear identification criteria
- **Observable:** identifiable in actual market data
- **Reproducible:** another researcher could apply the same criteria and identify the same instances
- **Consistent with interpretation:** operational definitions should align with the current authoritative interpretation where one exists, or document departures explicitly

**Step 6 — Assess testability and feasibility**

Verify:
- Can the operationalized hypothesis be investigated with available or obtainable market data?
- Are the identification criteria sufficiently precise for empirical work?
- Are there known limitations, data constraints, or methodological challenges?

**Step 7 — Document the hypothesis and operationalization**

Preserve:
- The research question being addressed
- The hypothesis formulated
- Operationalized definitions of key concepts
- Scope and conditions
- Known limitations or ambiguities

---

## 4. Binding Methodology Rules

1. **Not all research questions require hypothesis formation.** Conceptual, definitional, or structural research questions may be addressed through interpretation construction, conceptual analysis, or source investigation without empirical testing. Per B1 Rule 5, research questions need not be immediately testable.

2. **Hypotheses are testable and falsifiable propositions.** An empirical hypothesis must make specific claims that observable market data can support or contradict. If a proposition cannot be contradicted by any possible empirical outcome, it is not a falsifiable hypothesis.

3. **Hypothesis formation is conditional on question type and researcher judgment.** The researcher determines whether a research question warrants empirical investigation and whether a testable hypothesis can be formulated. This judgment is constrained by testability and feasibility but not mechanically determined.

4. **Operationalization translates abstract concepts into observable market phenomena.** When a hypothesis contains abstract trading concepts (patterns, structures, behaviors), operationalization defines specific, measurable criteria for identifying them in market data.

5. **Operational definitions must be specific, observable, and reproducible.** Another researcher applying the same operational definition should identify the same instances in the same market data. Ambiguity in operational definitions undermines reproducibility.

6. **Operational definitions should align with the current authoritative interpretation where one exists.** If an operational definition departs from the current interpretation, the departure must be explicit and reasoned per A6 Rule 12. Operationalization for testing purposes does not modify the interpretation itself.

7. **Hypothesis scope must be specified when relevant.** A hypothesis may apply to specific instruments, timeframes, market conditions, or contexts. The scope constrains what the hypothesis claims and what evidence is relevant.

8. **Testability requires available or obtainable market data.** A hypothesis is empirically testable only if the relevant market data exists or can be obtained. Data availability constraints may limit testability without invalidating the hypothesis conceptually.

9. **Operationalization may reveal interpretive ambiguities or gaps.** When attempting to operationalize a concept, the researcher may discover that the current interpretation is ambiguous, incomplete, or insufficiently precise. This may generate new research questions (B1) or trigger interpretation reconsideration (A7) but does not itself revise the interpretation.

10. **Multiple operational definitions may correspond to one abstract concept.** Different researchers, or the same researcher at different times, may operationalize the same concept differently based on interpretation emphasis, data constraints, or research objectives. The operational definition is a research decision, not a canonical truth about the concept.

11. **Hypothesis formation does not require immediate testing.** Formulating a testable hypothesis does not create an obligation to test it immediately. Hypotheses may be documented, refined, prioritized, or deferred.

12. **M2 does not define test design, execution, or evidence evaluation.** M2 concerns formulating testable hypotheses and operationalizing concepts. Test design (sample selection, statistical methods, validation procedures) and evidence evaluation belong to later stages.

---

## 5. Adversarial Tests

**Test 1 — Empirical research question → testable hypothesis with operationalization**

Research question (from B1 Test 1): *"What is the empirically optimal retracement level for Optimal Trade Entry?"*

Hypothesis formulation:
- Hypothesis: "Optimal Trade Entry at the 61.8% retracement level produces higher win rates than entries at 50% retracement in bullish impulse reversals."
- Testable: Yes (can compare win rates empirically)
- Falsifiable: Yes (data could show 50% performs better, or no meaningful difference)
- Scope: Bullish impulse reversals (could be further specified by instrument/timeframe)

Operationalization required:
- "Impulse" → specific price-movement criteria (e.g., X% move in Y candles without Z% retracement)
- "Retracement level" → specific Fibonacci or percentage calculation from impulse high/low
- "Entry" → specific entry trigger and rules
- "Win rate" → specific win/loss definition (e.g., hits target before stop)

**Framework handling:** ✓ Empirical question → testable hypothesis with clear operationalization needs

---

**Test 2 — Conceptual research question not requiring hypothesis**

Research question (from B1 Test 4): *"How should overlapping consolidation structures be classified in Order Block identification?"*

Question type: Conceptual/definitional
- Not empirical (not asking what happens in markets)
- Asking how to classify/define a structure

Appropriate approach: Interpretation construction (A6), not hypothesis formation
- May involve examining source claims about overlapping structures
- May involve researcher synthesis of definitional principles
- May later enable empirical testing (once definition is settled)
- No hypothesis required at M2

**Framework handling:** ✓ Rule 1 permits non-empirical questions to bypass hypothesis formation

---

**Test 3 — Ambiguous concept requiring operationalization clarification**

Research question: *"Do Fair Value Gaps reliably fill before trend continuation?"*

Hypothesis formulation attempt: "Fair Value Gaps fill before trend continuation more than 70% of the time."

Operationalization challenges:
- "Fair Value Gap" → current interpretation provides structural definition (three-candle imbalance)
- "Fill" → What counts as a fill? (price touches the gap? closes within it? fully fills it?)
- "Trend continuation" → How is continuation defined vs. reversal?

Researcher discovers: The current interpretation is ambiguous about "fill" criteria.

Outcome per Rule 9:
- Operationalization reveals interpretive gap
- May generate new research question: "What constitutes a complete Fair Value Gap fill?"
- May be a B1-permissive trigger for interpretation reconsideration (A7-C1)
- Researcher must make an explicit operational definition choice for testing purposes, documented as a departure if it doesn't align with interpretation

**Framework handling:** ✓ Operationalization reveals gaps; researcher proceeds with explicit operational choice

---

**Test 4 — Hypothesis with clear scope specification**

Research question: *"Do Order Blocks and Fair Value Gaps interact in predictable ways when they occur in proximity?"* (from B1 Test 10)

Hypothesis: "When an Order Block and Fair Value Gap occur within 20 pips of each other on the 15-minute EUR/USD chart during London session, price fills the FVG before reversing from the Order Block in more than 60% of occurrences."

- Testable: Yes
- Falsifiable: Yes (data could show different percentage, different sequence, or no pattern)
- Scope: Highly specified (instrument, timeframe, session, proximity threshold)
- Operationalization: Both Order Block and FVG require operational definitions; "fills before reversing" requires sequence and identification rules

**Framework handling:** ✓ Scope specification constrains what the hypothesis claims and what evidence is relevant

---

**Test 5 — Multiple operational definitions for one concept**

Concept: "Liquidity Sweep"
Current interpretation: "Price briefly moves beyond a key level to trigger stop-losses before reversing."

Researcher A operational definition: "Price exceeds prior swing high by at least 5 pips, then closes below it within 3 candles."

Researcher B operational definition: "Price wicks above prior swing high without closing above it."

Both are:
- Attempts to operationalize the same concept
- Specific and observable
- Different in scope and strictness

Per Rule 10: Both are valid operational definitions reflecting different research choices. Neither is "correct" — they are research decisions. Results may differ based on operational definition used.

**Framework handling:** ✓ Multiple operational definitions permitted; choice is documented research decision

---

**Test 6 — Unfalsifiable proposition (not a valid hypothesis)**

Proposition: "Fair Value Gaps exist because markets seek efficiency."

- Is this testable? No — it's a metaphysical claim about market purpose/intent
- Is it falsifiable? No — no observable market outcome could contradict it (any price movement could be interpreted as "seeking efficiency")
- Is it a hypothesis? No — it's a conceptual assertion or interpretation, not an empirical hypothesis

Classification: Not a valid empirical hypothesis per Rule 2

**Framework handling:** ✓ Unfalsifiable propositions correctly excluded

---

**Test 7 — Testable but data-unavailable hypothesis**

Hypothesis: "In the 1987 stock market crash, Fair Value Gaps on the 5-minute S&P 500 chart filled within 2 hours in 80% of cases."

- Testable in principle: Yes (specific, falsifiable claim)
- Data available: Likely no (high-granularity intraday data from 1987 may not exist or be accessible)
- Per Rule 8: Testability requires available or obtainable data

Classification: Conceptually testable but empirically infeasible given data constraints. May remain as a documented hypothesis pending data availability.

**Framework handling:** ✓ Testability constrained by data availability

---

**Test 8 — Hypothesis formation deferred pending conceptual clarification**

Research question: *"Under what conditions do Liquidity Voids resolve without price filling them?"*

Researcher assessment:
- The current interpretation has unresolved tension about whether voids always fill (from A6 Test 5)
- "Resolve" and "fill" are not clearly distinguished in the interpretation
- Conceptual clarification needed before empirical hypothesis can be meaningfully formulated

Researcher decision: Defer hypothesis formation; first address conceptual question through interpretation work (A6)

**Framework handling:** ✓ Rule 3 permits conditional hypothesis formation; researcher may defer pending clarification

---

**Test 9 — Operationalization departing from interpretation**

Current interpretation: "Order Blocks are consolidations before impulses."

For testing purposes, researcher operationalizes: "Order Block = the final 3-candle consolidation (range < 20 pips on 1H chart) immediately before a 50+ pip impulse move."

This is more specific than the interpretation (adds candle count, range threshold, impulse magnitude).

Per Rule 6: Departure must be explicit and reasoned.
- Reason: "Testing requires specific thresholds; interpretation doesn't specify them. I'm using 3-candle/20-pip/50-pip as a starting operational definition for empirical work."
- The interpretation is not modified; the operational definition is a testing-specific choice

**Framework handling:** ✓ Explicit departure documented; interpretation unchanged

---

**Test 10 — Hypothesis refined based on operationalization feasibility**

Initial hypothesis: "Fair Value Gaps always fill."

Operationalization attempt: Researcher tries to define "always" empirically.
- "Always" = 100% of identified instances?
- Data collection reveals edge cases, incomplete data, ambiguous instances
- Researcher realizes "always" is empirically untestable (cannot prove universal claim from sample)

Refined hypothesis: "Fair Value Gaps fill within 20 candles in more than 75% of identified instances on the 1-hour EUR/USD chart during 2020-2023."

- Now testable (specific percentage, timeframe, sample period)
- Now falsifiable (data could show <75%)
- Operationalization drove hypothesis refinement

**Framework handling:** ✓ Operationalization informs hypothesis refinement; Rule 11 permits refinement before testing

---

## 6. Recommended Decision

**Option C — Conditional Hypothesis Formation Based on Question Type and Testability**

M2 establishes:
- Not all research questions require empirical hypotheses
- Empirical research questions may generate testable, falsifiable hypotheses
- Hypotheses require operationalization when abstract concepts must be translated into observable market phenomena
- Operationalization must be specific, observable, reproducible, and aligned with or explicitly departing from current interpretations
- Hypothesis formation is a researcher judgment constrained by testability and feasibility
- Multiple operational definitions may exist for one concept
- Testability requires available or obtainable data
- Operationalization may reveal interpretive gaps or ambiguities

---

## 7. What M2 Unlocks

According to the ratified dependency structure:

- **M3 — Experimental Rigor and Evidence Assessment** is the next stage. M3 determines principles for valid experiment/backtest design (sample selection, overfitting prevention, in-sample/out-of-sample validation) and evidence-strength grading criteria. M2 provides the testable hypotheses and operational definitions that M3 will use to design rigorous empirical tests.

---

## 8. Remaining Questions — Classified Only

| Question | Classification |
|----------|---------------|
| Specific statistical methods for testing hypotheses | DEFER TO M3 / Implementation |
| Sample size requirements or power analysis | DEFER TO M3 |
| In-sample vs. out-of-sample validation procedures | DEFER TO M3 |
| How to document hypotheses, operational definitions, and test specifications | DEFER TO ARCHITECTURE |
| Whether hypotheses have statuses or lifecycle states | DEFER TO REQUIREMENTS |
| Prioritization or sequencing of hypothesis testing | DEFER TO REQUIREMENTS |
| Whether AI assists in hypothesis formation or operationalization | DEFER TO REQUIREMENTS |
| How to handle failed operationalization attempts | Methodology content — not blocking M3 |

---

## 9. Final Verdict

**DECISION M2 PROPOSED.**

Hypothesis formation and operationalization model: Conditional formation based on research-question type and testability. Empirical questions may generate testable, falsifiable hypotheses with operationalized concepts. Conceptual questions may be addressed without hypothesis formation. Researcher authority applies within testability and feasibility constraints.

Preserves epistemic boundaries between conceptual and empirical research. Maintains connection to research questions (B1) while enabling empirical testing pipeline. Does not force all questions into empirical mold. Provides operationalization framework without dictating test design.

No contradiction with Founding Definition v0.1 or any ratified upstream decision detected.

**M3 — Experimental Rigor and Evidence Assessment is now unblocked.**

---

## 10. Stop Statement

