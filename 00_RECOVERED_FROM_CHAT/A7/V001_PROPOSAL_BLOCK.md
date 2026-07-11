# A7-001 - Proposed decision block

| Provenance field | Value |
|---|---|
| Artifact ID | A7-001 |
| Authority / Decision ID | A7 |
| Artifact Type | Proposed decision block |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 5995 |
| End Line | 6567 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

# DECISION A7 — INTERPRETATION EVOLUTION TRIGGERS

**Status:** PROPOSED — awaiting semantic consistency audit  
**Upstream Authority:**
1. PROJECT MINORE — FOUNDING DEFINITION v0.1 (RATIFIED)
2. DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE (RATIFIED)
3. DECISION A1 — RESEARCH INPUT ADMISSIBILITY AND PROVENANCE (RATIFIED)
4. DECISION A2 — CLAIM EXTRACTION PROCEDURE (RATIFIED)
5. A2-C1 and A2-C2 (BINDING)
6. DECISION A3 — CLAIM CLASSIFICATION (RATIFIED)
7. A3-C1 (BINDING)
8. DECISION A4 — CONCEPT ASSOCIATION (RATIFIED)
9. DECISION A5 — CONTRADICTION HANDLING PROCEDURE (RATIFIED)
10. DECISION A6 — RESEARCHER INTERPRETATION CONSTRUCTION (RATIFIED)

---

## 1. Exact Semantic Distinctions

| Term | Meaning |
|------|---------|
| **Current interpretation** | The current authoritative reference interpretation of a concept (D1; A6). |
| **Available research state** | The currently admitted and processed research inputs, extracted claims, preserved contexts, claim classifications, concept associations, and contradiction statuses (A1–A6). |
| **Reconsideration** | The act of re-evaluating whether the current interpretation remains justified given a change in the available research state. |
| **Interpretation evolution** | A change from the current interpretation to a revised interpretation. A7 governs when reconsideration/evolution is justified or required, not how revision is performed. |
| **Trigger** | A change in the available research state that justifies or requires reconsideration of the current interpretation. |
| **Mandatory trigger** | A trigger that requires the researcher to reconsider the interpretation (reconsideration is required, evolution is not guaranteed). |
| **Permissive trigger** | A trigger that allows reconsideration but does not require it. |
| **Insufficient trigger** | A change that does not justify reconsideration on its own. |
| **Materiality to interpretation foundation** | Whether a change impacts claims or reasoning that the current interpretation explicitly relied on as its foundation (A6). |
| **Downstream departure** | A downstream research step that explicitly departs from the current interpretation for a specific task without changing the interpretation itself (A6 Rule 12). |

---

## 2. Minimum Options

### Option A — Only new source claims trigger reconsideration
Reconsideration is justified only when a new claim is added.

**Problem:** Ignores other changes that alter meaning/structure of the same claim landscape (new context, reclassification, reassociation, contradiction re-status, empirical evidence). Too narrow to maintain provenance integrity.

### Option B — Any change triggers reconsideration
Any modification anywhere in the available research state requires reconsideration.

**Problem:** Overly sensitive; creates constant churn and procedural paralysis. Not aligned with “minimum decision” and does not distinguish material vs. immaterial changes.

### Option C — Material-change trigger model (foundation-sensitive)
Reconsideration is required or permitted based on whether a change materially affects:
- the interpretation foundation, or
- the contradiction/tension landscape relevant to the interpretation foundation, or
- empirical evidence that bears on claims the interpretation depends on.

This model distinguishes:
- mandatory triggers (foundation-impacting changes),
- permissive triggers (non-foundational but relevant changes),
- insufficient triggers (preference shifts without substantive reasoning).

**Verdict:** Option C is the minimum coherent model consistent with D1 (evolution + provenance) and A6 (explicit foundation + authoritative reference interpretation).

---

## 3. Trigger Determination Framework

A7 defines when reconsideration is **required**, **permitted**, or **not justified**, based on changes to the available research state.

### Step 1 — Identify the change type
Possible change types (not exhaustive ontology; procedural checklist):
- New source claim becomes available (A1–A2)
- Newly discovered preserved source context affecting an existing claim (A2/A3-C1)
- Change in claim classification or classification uncertainty (A3/A3-C1)
- Change in concept association (A4)
- Change in A5 status (Difference/Variation/Tension/Genuine Contradiction)
- New empirical evidence or results (later stages; may be recorded as research input/evidence)
- Researcher re-evaluation of unchanged landscape (A6 reasoning)
- Mere preference change without substantive reasoning
- Downstream research explicitly departing from the interpretation (A6 Rule 12)

### Step 2 — Determine materiality to interpretation foundation
Does the change affect claims, context, or contradiction statuses that the current interpretation explicitly relied on as its foundation?

- If **yes**: mandatory reconsideration trigger.
- If **no**, but the change concerns the same concept and is research-relevant: permissive reconsideration trigger.
- If **no**, and the change is unrelated or purely preference-based: insufficient trigger.

### Step 3 — Determine whether reconsideration is required, permitted, or not justified
- **Required** if the change:
  - introduces a new materially relevant claim that conflicts with or substantially refines the foundation, or
  - changes the meaning/applicability of a foundational claim via new preserved context, or
  - changes concept association/classification in a way that alters what claims are treated as foundational, or
  - changes A5 contradiction status involving foundational claims (e.g., tension → genuine contradiction), or
  - introduces empirical evidence that materially contradicts or undermines claims the interpretation relies on (without deciding evidence strength).

- **Permitted** if the change:
  - adds relevant claims that are supportive duplicates, peripheral refinements, or non-foundational extensions, or
  - adds empirical evidence that is weak/inconclusive but relevant, or
  - involves researcher re-reading/re-evaluating the same landscape with new reasoning (without new sources).

- **Not justified** if the change:
  - is a preference shift with no substantive re-evaluation or reasoning, or
  - attempts to silently substitute a different interpretation without explicit revision, or
  - consists only of downstream departure that is explicitly scoped and does not assert a change to the interpretation itself.

A7 does not decide whether reconsideration results in evolution; it decides when reconsideration is justified or required.

---

## 4. Binding Methodology Rules

1. **The current interpretation remains the authoritative reference interpretation until explicitly revised** (D1; A6). A7 defines when reconsideration is required or permitted; it does not itself revise the interpretation.

2. **Mandatory reconsideration triggers are foundation-sensitive.** If a change materially affects the interpretation foundation (claims, preserved context, or contradiction status the interpretation relied on), the researcher must reconsider the interpretation.

3. **New materially relevant conflicting claims require reconsideration, not automatic revision.** A new claim conflicting with the current interpretation triggers reconsideration, but the interpretation may remain unchanged after reconsideration with explicit reasoning.

4. **New preserved context affecting a foundational claim is a mandatory trigger.** If new context changes the meaning, scope, or applicability of a foundational claim, reconsideration is required.

5. **Changes in claim classification or classification uncertainty can be mandatory triggers** if they materially alter how a foundational claim should be understood (e.g., definitional vs. predictive role) or reveal that prior classification was uncertain in a way that affects the interpretation foundation.

6. **Changes in concept association can be mandatory triggers** if they add/remove substantively relevant claims from the concept’s available claim landscape in a way that materially affects the interpretation foundation.

7. **Changed A5 contradiction status is a mandatory trigger when it involves foundational claims.** If the contradiction landscape relevant to the foundation changes (e.g., tension → genuine contradiction), reconsideration is required.

8. **New empirical evidence can be a trigger without deciding evidential strength.** Empirical evidence that bears materially on claims the interpretation depends on triggers reconsideration; A7 does not decide whether evidence is strong enough to force evolution.

9. **Researcher re-evaluation without new research-state change is permitted, not mandatory.** The researcher may reconsider based on new reasoning applied to the unchanged available claim landscape, but such reconsideration must be grounded in explicit reasoning (A6) and is not forced.

10. **Preference change without substantive reasoning is insufficient.** A mere preference shift does not justify reconsideration or evolution.

11. **Downstream explicit departure does not itself change the interpretation.** Downstream research may explicitly depart from the current interpretation for a specific task (A6 Rule 12). This does not revise the current interpretation, but may serve as a permissive trigger for reconsideration if the departure reveals a substantive incompatibility or limitation.

12. **No completeness requirement beyond the available research state.** Triggers are evaluated against the bounded available research state (A6). The existence of unknown or undiscovered material is not itself a trigger.

---

## 5. Adversarial Tests

**Test 1 — New materially relevant claim directly conflicts with current interpretation (mandatory)**  
Current interpretation: “Order Blocks require bearish consolidation before bullish impulses.”  
New claim: “Order Blocks can be formed by any consolidation before any impulse direction.”  
- Change type: New claim available  
- Materiality: Impacts definition foundation  
- Trigger: **Mandatory reconsideration**  
- Outcome: Reconsideration required; evolution not automatic

**Test 2 — New claim duplicates existing support (permissive)**  
Current interpretation: “FVG is a three-candle imbalance (Claim A).”  
New claim: Another source repeats the same definition with similar scope.  
- Change type: New claim available  
- Materiality: Adds support but does not change foundation meaning  
- Trigger: **Permissive reconsideration** (update may be useful; not required)

**Test 3 — Newly discovered context changes meaning/applicability of a foundational claim (mandatory)**  
Foundational claim previously extracted: “FVGs always fill.”  
Newly recovered context: “...in non-trending conditions; in strong trends they may remain unfilled.”  
- Change type: Newly discovered preserved context affecting existing claim  
- Materiality: Directly modifies scope of foundational claim  
- Trigger: **Mandatory reconsideration**

**Test 4 — A5 reclassifies prior tension as genuine contradiction (mandatory when foundational)**  
Previously: two claims treated as Tension regarding OTE level.  
A5 update: after applying new preserved context, status becomes Genuine Contradiction for foundational claims.  
- Change type: A5 status change  
- Materiality: Contradiction landscape affecting foundation changed  
- Trigger: **Mandatory reconsideration**

**Test 5 — New empirical evidence contradicts the current interpretation (mandatory trigger for reconsideration)**  
Current interpretation includes predictive reliance: “FVGs tend to fill before continuation.”  
New empirical result: backtest shows no statistically meaningful fill tendency in the tested regime.  
- Change type: New empirical evidence  
- Materiality: Bears materially on claims interpretation relies on  
- Trigger: **Mandatory reconsideration** (A7 does not decide strength; only that reconsideration is required)

**Test 6 — Weak or inconclusive empirical results appear (permissive)**  
Empirical test produces mixed results with wide uncertainty.  
- Change type: New empirical evidence  
- Materiality: Relevant but inconclusive  
- Trigger: **Permissive reconsideration**

**Test 7 — Researcher changes mind after re-reading unchanged landscape (permissive)**  
No new claims/context/status changes; researcher develops a better synthesis of existing variations.  
- Change type: Researcher re-evaluation of unchanged landscape  
- Trigger: **Permissive reconsideration** (must be explicit reasoning; not mandatory)

**Test 8 — Preference change with no new reason (insufficient)**  
Researcher prefers a cleaner rule without re-evaluation or new information.  
- Change type: Preference shift only  
- Trigger: **Insufficient**

**Test 9 — Downstream research explicitly departs without changing interpretation (insufficient by itself; permissive if substantive)**  
A hypothesis test temporarily assumes an alternative definition for operationalization, explicitly noted as departure.  
- Change type: Downstream explicit departure  
- Trigger: **Not a revision trigger by itself**  
- May become **permissive** if the departure reveals a substantive limitation or incompatibility that warrants reconsideration

**Test 10 — New material affects a peripheral aspect only (permissive)**  
New claim concerns a niche session condition not referenced in the interpretation foundation.  
- Change type: New claim available  
- Materiality: Peripheral  
- Trigger: **Permissive reconsideration**

---

## 6. Recommended Decision

**Option C — Material-change trigger model (foundation-sensitive)**

A7 adopts a trigger framework where reconsideration of the current interpretation is:
- **mandatory** when the interpretation foundation (or its contradiction landscape) is materially affected,
- **permitted** when relevant changes occur without materially affecting the foundation,
- **not justified** when only preference shifts or silent substitutions are present.

A7 distinguishes reconsideration from actual interpretation evolution and does not define the revision procedure.

---

## 7. What A7 Unlocks

- Enables coherent, non-arbitrary evolution of interpretations consistent with D1 (evolution + historical provenance) and A6 (explicit foundation + authoritative reference interpretation).
- Enables downstream work to rely on a stable current interpretation while still supporting principled reconsideration when the research state materially changes.

---

## 8. Remaining Questions — Classified Only

| Question | Classification |
|----------|---------------|
| Procedure for performing an interpretation revision once reconsideration is triggered | Methodology content — outside A7 scope |
| How to document the reasoning for revision (format/structure) | DEFER TO REQUIREMENTS / Methodology detail |
| How to represent trigger events and their linkage to interpretations | DEFER TO ARCHITECTURE |
| How to decide whether empirical evidence is strong enough to require evolution | DEFER TO M3 / later methodology |
| Whether reconsideration deadlines or periodic review are needed | DEFER TO REQUIREMENTS |

---

## 9. Final Verdict

**DECISION A7 PROPOSED.**

A7 defines when reconsideration of the current interpretation is required, permitted, or not justified based on material changes to the available research state and to the interpretation foundation, while preserving the authoritative reference role of the current interpretation and deferring revision procedure to later methodology content.

---

## 10. Stop Statement

A7 proposed.

B1 has not begun.

Research Methodology has not been constructed.
claude-opus-4-8-thinking


Markdown

# DECISION A7 — INTERPRETATION EVOLUTION TRIGGERS

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

---

## 1. Exact Semantic Distinctions

| Term | Meaning |
|------|---------|
| **Current interpretation** | The researcher's authoritative reference interpretation of a concept per A6, in force until explicitly revised. |
| **Research state** | The current bounded set of admitted, extracted, classified, associated claims and their A5 contradiction statuses relevant to a concept, per A6's available claim landscape. |
| **Reconsideration** | The act of examining whether the current interpretation should be re-evaluated in light of a change in the research state. Reconsideration does not itself change the interpretation. |
| **Interpretation change (evolution)** | The actual replacement of the current interpretation with a revised interpretation. The revision procedure is A6/downstream territory; A7 governs only when reconsideration is triggered. |
| **Trigger** | A change in the research state that creates a condition for reconsideration of the current interpretation. |
| **Mandatory trigger** | A change that requires the researcher to reconsider the current interpretation. Reconsideration is compulsory; interpretation change is not guaranteed. |
| **Permissive trigger** | A change that permits but does not require reconsideration. |
| **Insufficient trigger** | A change or event that does not by itself justify reconsideration. |
| **Foundational claim** | A claim that materially informs the current interpretation's foundation per A6 Step 3. |
| **Peripheral claim** | A claim associated with the concept that does not materially inform the current interpretation's foundation. |

**Critical distinction:** A trigger initiates reconsideration, not interpretation change. A mandatory trigger compels the researcher to examine whether the interpretation should change; it does not compel the interpretation to change. The outcome of reconsideration may be that the interpretation is retained unchanged.

---

## 2. Minimum Options

### Option A — Any Research-State Change Triggers Mandatory Reconsideration
Every change to the research state (new claim, new context, changed status) requires reconsideration.

**Problem:** Overwhelms the researcher with reconsideration obligations for immaterial changes (e.g., a duplicate claim, a peripheral addition). Violates the minimum-decision principle. Fails to distinguish material from immaterial changes.

### Option B — No Automatic Triggers; Reconsideration Always Discretionary
The researcher reconsiders only when they choose to; no change compels reconsideration.

**Problem:** Permits the researcher to ignore a directly conflicting new claim or a changed A5 contradiction status. Violates A6 Rule 2 (must account for materially relevant claims) and undermines the integrity of the interpretation as accountable to the claim landscape.

### Option C — Materiality-Based Triggers with Mandatory/Permissive/Insufficient Distinction
A change triggers reconsideration based on whether it materially affects the interpretation foundation. Changes are classified as mandatory triggers (compel reconsideration), permissive triggers (allow reconsideration), or insufficient (do not justify reconsideration).

**Test against A6:** Preserves the current interpretation as authoritative until revised; requires accountability to material claims; does not force interpretation change.

**Test against D1:** Permits evolution (Rule 3); preserves the single current interpretation (Rule 2); does not mandate change.

**Verdict:** Option C is the minimum viable and founding-consistent standard.

---

## 3. Trigger Determination Framework

A change in the research state is evaluated for its trigger status using the following framework.

**Step 1 — Identify the nature of the change**
Determine what has changed in the research state:
- A new source claim has become available
- Newly discovered context affects an existing claim
- Concept association has changed (A4)
- Claim classification or classification uncertainty has changed (A3)
- A5 contradiction status has changed
- New empirical evidence has appeared
- The researcher seeks to re-evaluate an unchanged claim landscape

**Step 2 — Determine materiality to the interpretation foundation**
Assess whether the change affects a foundational claim (materially informs the current interpretation per A6 Step 3) or only a peripheral aspect.

- If the change affects a foundational claim or the foundational reasoning: material
- If the change affects only peripheral claims or aspects not informing the foundation: non-material

**Step 3 — Classify the trigger**
Based on the nature and materiality of the change:

- **Mandatory trigger:** The change materially affects the interpretation foundation in a way that could alter the interpretation. The researcher must reconsider.
- **Permissive trigger:** The change is relevant but does not clearly compel reconsideration. The researcher may reconsider.
- **Insufficient trigger:** The change does not justify reconsideration by itself.

**Step 4 — Reconsideration outcome (boundary marker only)**
If reconsideration is triggered, the researcher examines whether the interpretation should change. The outcome may be:
- Interpretation retained unchanged (with reasoning)
- Interpretation change initiated (revision procedure is A6/downstream territory, not A7)

A7 governs only whether reconsideration is triggered. A7 does not govern the revision itself.

---

## 4. Binding Methodology Rules

1. **A trigger initiates reconsideration, not interpretation change.** Reconsideration is the examination of whether the interpretation should change. The interpretation may be retained unchanged following reconsideration.

2. **Triggers are classified as mandatory, permissive, or insufficient.** Mandatory triggers compel reconsideration; permissive triggers allow it; insufficient triggers do not justify it.

3. **A new source claim that materially conflicts with or materially affects the foundation of the current interpretation is a mandatory trigger.** Per A6 Rule 2, materially relevant claims cannot be silently dismissed; a materially conflicting new claim compels reconsideration.

4. **A new source claim that merely duplicates existing foundational support is an insufficient trigger.** Duplication adds no new material consideration to the interpretation foundation.

5. **Newly discovered context that changes the meaning or applicability of a foundational claim is a mandatory trigger.** Per A2 and A3-C1, context determines claim meaning; a change in foundational claim meaning materially affects the interpretation.

6. **A change in A5 contradiction status affecting a foundational claim is a mandatory trigger.** A7 inherits contradiction status from A5 and does not re-perform contradiction determination. If A5 reclassifies a foundational tension as a genuine contradiction (or vice versa), reconsideration is compelled.

7. **A change in concept association (A4) affecting whether a foundational claim belongs to the concept is a mandatory trigger.** If a foundational claim is disassociated, or a new materially relevant claim is associated, reconsideration is compelled. A7 inherits association status from A4.

8. **A change in claim classification or classification uncertainty (A3) affecting a foundational claim is a permissive trigger.** A change in the semantic role of a foundational claim may warrant reconsideration but does not automatically compel it, since the interpretation may still hold under the revised classification. A7 inherits classification status from A3.

9. **New empirical evidence relevant to the current interpretation is a mandatory trigger for reconsideration.** A7 determines only that empirical evidence creates a reconsideration condition; it does not assess the evidence's strength. Evidence-strength grading is M3 territory. Whether the evidence actually changes the interpretation is determined during reconsideration, not by A7.

10. **Weak or inconclusive empirical results are a permissive trigger.** Their existence permits reconsideration but does not compel it, since A7 does not grade evidence strength (M3 territory). The researcher may reconsider in light of any empirical result.

11. **Researcher re-evaluation of an unchanged claim landscape is a permissive trigger only if accompanied by substantive reasoning.** Per D1 Rule 3, interpretation may evolve; per A6, changes require explicit reasoning. Re-examination with new substantive reasoning permits reconsideration.

12. **A preference change without new material or substantive reasoning is an insufficient trigger.** Mere preference does not justify reconsideration, consistent with A6's prohibition on silent or unreasoned interpretation change.

13. **Downstream research questioning, testing, contradicting, or explicitly departing from the current interpretation is a permissive trigger.** Per A6 Rule 12, downstream research may depart from the interpretation with documented reasoning. Such departure permits the researcher to reconsider but does not itself compel reconsideration or change the interpretation.

14. **A change affecting only peripheral claims or aspects not informing the interpretation foundation is an insufficient trigger.** Non-foundational changes do not compel reconsideration, though the researcher may reconsider at discretion.

15. **A7 does not govern the revision procedure.** A7 determines only whether reconsideration is triggered. How an interpretation is revised, versioned, or preserved is governed by A6 and downstream decisions.

---

## 5. Adversarial Tests

**Test 1 — New materially relevant claim directly conflicting with current interpretation**

Current interpretation: "Order Blocks require bearish consolidation before bullish impulses."
New claim (Source 4): "Order Blocks can form from bullish consolidation before bullish impulses."

- Nature: New source claim
- Materiality: Directly conflicts with a foundational claim of the interpretation
- Trigger classification: **Mandatory trigger** (Rule 3)
- Reconsideration outcome: The researcher must reconsider. Outcome may be retention (if the new claim is judged less foundational) or change (revision territory).
- Framework handling: ✓ Materially conflicting claim compels reconsideration without forcing change

---

**Test 2 — New claim that duplicates existing support**

Current interpretation: "A Fair Value Gap is a three-candle imbalance."
New claim (Source 5): "Fair Value Gaps are three-candle imbalance structures." (duplicates existing foundational claim)

- Nature: New source claim
- Materiality: Duplicates existing foundational support; adds no new material consideration
- Trigger classification: **Insufficient trigger** (Rule 4)
- Reconsideration outcome: No reconsideration compelled
- Framework handling: ✓ Duplicate support does not trigger reconsideration

---

**Test 3 — Newly discovered context changing meaning of a foundational claim**

Current interpretation: Foundation includes Claim A: "Optimal Trade Entry occurs at 62% retracement."
Newly discovered context: The source passage for Claim A continues: "...but only in trending markets; in ranging markets, use 50%."

- Nature: Newly discovered context affecting an existing foundational claim
- Materiality: Changes the meaning/applicability of a foundational claim (adds conditional scope)
- Trigger classification: **Mandatory trigger** (Rule 5)
- Reconsideration outcome: The researcher must reconsider, as the foundational claim's meaning has materially changed
- Framework handling: ✓ Context change to foundational claim compels reconsideration

---

**Test 4 — A5 reclassifies a prior tension as a genuine contradiction**

Current interpretation: Bracketed a tension between two foundational claims about Liquidity Voids, provisionally adopting one position.
A5 status change: A5 reclassifies the tension as a genuine contradiction after applying newly available context.

- Nature: Change in A5 contradiction status affecting foundational claims
- Materiality: Foundational; the tension the interpretation relied upon is now a genuine contradiction
- Trigger classification: **Mandatory trigger** (Rule 6)
- Reconsideration outcome: The researcher must reconsider. A7 inherits the A5 status; does not re-perform contradiction determination.
- Framework handling: ✓ A5 status change to foundational claims compels reconsideration; A5 authority preserved

---

**Test 5 — New empirical evidence contradicts current interpretation**

Current interpretation: "Fair Value Gaps always fill."
New empirical evidence: A backtest shows 30% of Fair Value Gaps remained unfilled over the test period.

- Nature: New empirical evidence relevant to the interpretation
- Materiality: Directly relevant to a foundational assertion
- Trigger classification: **Mandatory trigger** (Rule 9)
- Reconsideration outcome: The researcher must reconsider. A7 determines only that the evidence creates a reconsideration condition; the strength/validity of the backtest is M3 territory, assessed during reconsideration.
- Framework handling: ✓ Empirical evidence compels reconsideration without A7 grading its strength

---

**Test 6 — Weak or inconclusive empirical results appear**

Current interpretation: "Order Blocks precede reversals in most cases."
New empirical evidence: A small, inconclusive test with a wide confidence interval and insufficient sample size.

- Nature: New empirical evidence (weak/inconclusive)
- Materiality: Relevant but inconclusive
- Trigger classification: **Permissive trigger** (Rule 10)
- Reconsideration outcome: The researcher may reconsider but is not compelled. A7 does not grade the evidence (M3 territory).
- Framework handling: ✓ Weak evidence permits but does not compel reconsideration; A7 does not assess strength

---

**Test 7 — Researcher changes mind after re-reading the same unchanged claim landscape**

Current interpretation: "Order Blocks require bearish consolidation."
Change basis: The researcher re-reads the same claims and forms new substantive reasoning: "Claims B and C provide broader scope than Claim A; integration is more justified than single-source dependence."

- Nature: Researcher re-evaluation of an unchanged claim landscape, with new substantive reasoning
- Materiality: Affects the foundational synthesis
- Trigger classification: **Permissive trigger** (Rule 11)
- Reconsideration outcome: The researcher may reconsider, justified by the new substantive reasoning
- Framework handling: ✓ Re-evaluation with substantive reasoning permits reconsideration

---

**Test 8 — Researcher changes preference with no new reason or substantive re-evaluation**

Current interpretation: "Optimal Trade Entry is at 62%."
Change basis: The researcher simply prefers 50% now, with no new material and no substantive reasoning.

- Nature: Preference change without new material or substantive reasoning
- Materiality: None (no substantive basis)
- Trigger classification: **Insufficient trigger** (Rule 12)
- Reconsideration outcome: No reconsideration justified
- Framework handling: ✓ Mere preference does not trigger reconsideration; consistent with A6's prohibition on unreasoned change

---

**Test 9 — Downstream research explicitly departs from current interpretation without changing it**

Current interpretation: "Market Maker stop-loss hunting is intentional."
Downstream event: A hypothesis test in B1/M2 explicitly departs from this interpretation, testing the alternative that it is unintentional, with documented reasoning.

- Nature: Downstream research departing from the interpretation (permitted per A6 Rule 12)
- Materiality: The departure signals a research position questioning the interpretation
- Trigger classification: **Permissive trigger** (Rule 13)
- Reconsideration outcome: The researcher may reconsider in light of the documented departure but is not compelled. The current interpretation remains authoritative until explicitly revised (A6 preserved).
- Framework handling: ✓ Downstream departure permits but does not compel reconsideration; A6 authority preserved

---

**Test 10 — New material affects a peripheral aspect but not the interpretation foundation**

Current interpretation of Fair Value Gap: Foundation is the three-candle structural definition and price-inefficiency mechanism.
New claim (Source 6): "Fair Value Gaps are more commonly discussed in intraday than swing trading." (peripheral; concerns discussion frequency, not the concept's definition or mechanism)

- Nature: New source claim affecting a peripheral aspect
- Materiality: Non-foundational; does not affect the interpretation foundation
- Trigger classification: **Insufficient trigger** (Rule 14)
- Reconsideration outcome: No reconsideration compelled, though the researcher may reconsider at discretion
- Framework handling: ✓ Peripheral change does not trigger mandatory reconsideration

---

## 6. Recommended Decision

**Option C — Materiality-Based Triggers with Mandatory/Permissive/Insufficient Distinction**

A change in the research state triggers reconsideration of the current interpretation based on its materiality to the interpretation foundation:

- **Mandatory triggers:** materially conflicting new claims; context changes to foundational claims; A5 status changes to foundational claims; concept-association changes to foundational claims; new empirical evidence relevant to the interpretation
- **Permissive triggers:** classification/classification-uncertainty changes to foundational claims; weak/inconclusive empirical results; researcher re-evaluation with substantive reasoning; downstream departure from the interpretation
- **Insufficient triggers:** duplicate claims; preference changes without substantive reasoning; peripheral changes not affecting the foundation

A7 governs only whether reconsideration is triggered. It does not govern the revision procedure, does not grade empirical evidence, does not re-perform A5/A4/A3 determinations, and does not compel interpretation change.

---

## 7. What A7 Unlocks

- The interpretation lifecycle is now complete for the A-series: interpretations are constructed (A6) and their reconsideration is governed (A7), while D1 preserves prior interpretations and the single current authoritative interpretation.
- **B1 — Research-Question Identification** may now proceed on a stable footing, because the conditions under which interpretations are reconsidered are defined, allowing research questions to reference stable current interpretations while acknowledging when they may evolve.
- Downstream empirical work (M2, M3) can now feed back into the interpretation lifecycle through the empirical-evidence trigger without A7 pre-judging evidence strength.

---

## 8. Remaining Questions — Classified Only

| Question | Classification |
|----------|---------------|
| The revision procedure once reconsideration is triggered | Methodology content — A6/downstream, not A7 |
| How reconsideration outcomes are recorded | DEFER TO ARCHITECTURE |
| Evidence-strength grading that informs reconsideration outcomes | M3 territory — not A7 |
| Whether reconsideration must occur within a time bound | Methodology content — not blocking B1 |
| How to detect that a research-state change has occurred | DEFER TO REQUIREMENTS/ARCHITECTURE |
| Whether AI may flag potential triggers | DEFER TO REQUIREMENTS |
| Treatment of triggers for association-pending claims (no established concept) | Methodology content — not blocking B1 |
| Whether multiple simultaneous triggers change reconsideration priority | Methodology content — not blocking B1 |

---

## 9. Final Verdict

**DECISION A7 PROPOSED.**

Trigger model: Materiality-based classification of research-state changes into mandatory, permissive, and insufficient triggers for reconsideration of the current interpretation.

Core boundary: A7 governs when reconsideration is triggered, not how interpretation is revised. Reconsideration does not compel interpretation change; the interpretation may be retained unchanged.

Authority inheritance: A7 inherits contradiction status from A5, association status from A4, and classification status from A3 without re-performing those determinations. A7 responds to empirical evidence as a reconsideration condition without grading its strength (M3 territory).

Relationship to ratified upstream: Consistent with D1 (interpretation may evolve; single current interpretation preserved), A6 (current interpretation remains authoritative until explicitly revised; downstream may depart with reasoning; silent substitution prohibited), A5/A4/A3 (status inheritance), A2/A3-C1 (context determines claim meaning).

No contradiction with any ratified authority detected.

**B1 — Research-Question Identification is now unblocked.**

---

## 10. Stop Statement

A7 proposed.
