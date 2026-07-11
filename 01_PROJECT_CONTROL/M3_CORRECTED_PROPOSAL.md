# DECISION M3 — EXPERIMENTAL RIGOR AND EVIDENCE ASSESSMENT

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
14. DECISION M2 — HYPOTHESIS FORMATION AND OPERATIONALIZATION
15. M2-C1 (BINDING)

---

## 1. Exact Semantic Distinctions

| Term | Meaning |
|------|---------|
| **Experimental design** | The plan governing how a hypothesis will be empirically investigated: what data is used, how samples are selected, what procedures are followed, and what conditions apply. |
| **Methodological adequacy** | The property of an experimental design being sufficiently rigorous to produce interpretable evidence, independent of whether the result is favorable or unfavorable to the hypothesis. |
| **Data quality** | The completeness, accuracy, and reliability of the market data used in a test, distinct from data provenance (A1). |
| **Data provenance** | The origin and admissibility conditions of market data as a research input, governed by A1 principles applied to empirical data sources. |
| **Sample selection** | The criteria and procedure by which specific instances (time periods, instruments, market conditions) are chosen for testing. |
| **Sample size** | The quantity of independent observations available for empirical assessment. |
| **In-sample data** | Data used to develop, discover, or calibrate a hypothesis or its parameters. |
| **Out-of-sample data** | Data not used in hypothesis development or parameter calibration, used instead to test whether findings generalize. |
| **Overfitting** | A condition where a model or rule fits in-sample data well by capturing noise or idiosyncrasies rather than genuine underlying patterns, resulting in poor generalization. |
| **Data-snooping** | The risk of finding spurious patterns by testing many hypotheses, parameters, or variations against the same dataset until one appears significant by chance. |
| **Look-ahead bias** | A methodological error where information not actually available at the decision point in real time is used in testing, artificially inflating apparent performance. |
| **Survivorship bias** | A methodological error where the sample excludes instances that failed, ceased to exist, or were delisted, artificially inflating apparent performance. |
| **Parameter selection** | The choice of specific numeric or categorical values used in an operationalized hypothesis (e.g., threshold levels, lookback periods). |
| **Parameter tuning** | The process of adjusting parameters to improve in-sample performance, which carries inherent overfitting risk. |
| **Robustness** | The degree to which a result holds across variations in parameters, market conditions, time periods, instruments, or methodological choices. |
| **Reproducibility** | The property of a result being obtainable again by another researcher applying the same method to the same data. |
| **Empirical result** | The specific quantitative or qualitative outcome produced by executing a test, prior to interpretation or evidentiary weighting. |
| **Statistical uncertainty** | The degree of confidence or margin of error associated with an empirical result, arising from sample variability. |
| **Statistical significance** | A measure of whether an observed result is unlikely to have occurred by chance under a specified null hypothesis, given the sample. |
| **Practical significance** | The real-world relevance or magnitude of an effect, independent of whether it is statistically significant. |
| **Evidence strength** | An assessment of how much a given empirical result should influence confidence in a hypothesis, integrating design adequacy, robustness, sample characteristics, and practical significance. |
| **Hypothesis support** | A characterization that empirical evidence is consistent with and favors a hypothesis, without implying proof. |
| **Hypothesis contradiction** | A characterization that empirical evidence is inconsistent with and disfavors a hypothesis, without implying the hypothesis or its originating claims are false. |
| **Source-claim truth** | Whether a source's original claim (A1–A2) accurately describes reality. Distinct from hypothesis status; a hypothesis is a researcher-operationalized construct that may imperfectly represent the source claim. |
| **Current researcher interpretation** | The authoritative interpretation of a concept (A6). Distinct from hypothesis status; empirical results bear on interpretation only through the reconsideration process (A7). |
| **Exploratory analysis** | Investigation conducted to discover patterns, generate hypotheses, or search parameter space, without pre-specified confirmatory intent. |
| **Confirmatory testing** | Investigation conducted to test a hypothesis specified in advance of examining the relevant data, using a design intended to assess that specific hypothesis. |

---

## 2. Minimum Options

### Option A — Single Universal Experimental Standard
M3 mandates one fixed experimental design (e.g., always requiring out-of-sample validation with specific split ratios, specific statistical tests, specific significance thresholds) for all empirical work.

**Problem:** Different hypotheses, data availability, and research questions require different designs. A universal standard would be either too permissive for some cases or impossibly restrictive for others (e.g., requiring large out-of-sample sets when data is inherently limited, such as rare market events). Contradicts the task constraint against imposing one experimental paradigm.

### Option B — No Methodological Standards, Results Accepted at Face Value
Any empirical result is accepted as evidence without assessing design adequacy, sample characteristics, or robustness.

**Problem:** Directly enables overfitting, data-snooping, and spurious findings to be treated as evidence. Contradicts Founding Definition Capability 11 ("Evaluating evidence without confusing source authority with empirical validation") since it provides no mechanism to evaluate evidence at all. Undermines the entire empirical research pipeline.

### Option C — Principled Multi-Dimensional Assessment Framework
M3 establishes principles for assessing methodological adequacy and evidence strength along multiple independent dimensions (design adequacy, sample characteristics, robustness, statistical and practical significance), without mandating one specific design, statistical method, or universal numeric threshold. Evidence strength is a qualitative-to-quantitative judgment informed by these dimensions, not a single score derived from one criterion (e.g., not statistical significance alone, not source authority, not a single successful test).

**Test against upstream:** Consistent with Founding Definition Capability 11 (evaluate evidence without conflating authority and validation); consistent with the Core Principle's requirement to keep epistemic states distinct; does not mandate a single paradigm, satisfying the task constraint; allows different valid designs across different hypotheses per M2's acknowledgment that hypotheses vary in scope and testability.

**Verdict:** Option C is the minimum viable and founding-consistent standard.

---

## 3. Experimental Rigor and Evidence Assessment Framework

The following framework governs how empirical tests are assessed for methodological adequacy and how resulting evidence is evaluated.

**Layer 1 — Design Adequacy Assessment**

Before evaluating results, assess the test's design against relevant rigor principles:

- **Data quality and provenance:** Is the market data reliable, complete, and appropriately sourced? Are gaps, errors, or provenance uncertainties documented?
- **Sample selection:** Is the sample selection criterion clearly defined and free from circular reasoning (e.g., selecting instances because they are known to support the hypothesis)?
- **Sample size:** Is the sample size sufficient to draw the type of conclusion being drawn, given the effect being investigated? (Not a universal number — context-dependent.)
- **In-sample/out-of-sample separation:** Was the hypothesis or its parameters developed using the same data being used to test it? If so, this must be disclosed and treated as exploratory, not confirmatory.
- **Overfitting and data-snooping exposure:** Were multiple parameter combinations, variations, or hypotheses tested against the same dataset before arriving at the reported result? If so, this must be disclosed.
- **Look-ahead bias:** Does the test use only information that would have been actually available at each decision point?
- **Survivorship bias:** Does the sample exclude failed, delisted, or discontinued instances in a way that could distort results?
- **Parameter selection transparency:** Are parameter choices documented, including whether they were fixed in advance or tuned to the data?

Design adequacy is assessed independently of whether the result is favorable or unfavorable to the hypothesis.

**Layer 2 — Result Characterization**

Report the empirical result together with:

- **Statistical uncertainty:** margin of error, confidence considerations, or equivalent characterization of result variability
- **Statistical significance:** where applicable, whether the result is unlikely under a relevant null hypothesis
- **Practical significance:** the real-world magnitude of the effect and whether it is meaningful for trading-model purposes, independent of statistical significance

**Layer 3 — Robustness Assessment**

Where feasible, assess whether the result holds:

- Across different time periods
- Across different market instruments (if the hypothesis claims general applicability)
- Across reasonable parameter variations (not just the single tuned parameter set)
- Under out-of-sample conditions if in-sample results were initially obtained

A result that only holds under one narrow, specific configuration carries different evidentiary weight than one that holds broadly.

**Layer 4 — Evidence Strength Determination**

Evidence strength is a synthesis judgment considering:
- Design adequacy (Layer 1)
- Result characterization (Layer 2)
- Robustness (Layer 3)
- Whether the test was confirmatory (hypothesis specified before data examination) or exploratory (hypothesis emerged from or was refined by examining the data)

Evidence strength is not determined by any single factor in isolation (not statistical significance alone, not source authority, not a single successful backtest).

**Layer 5 — Relationship to Hypothesis, Source Claim, and Interpretation**

- Evidence may support or contradict a **hypothesis**. This is a statement about the specific operationalized proposition tested.
- Evidence bearing on a hypothesis does not automatically establish the truth or falsity of the **originating source claim**, because the hypothesis is a researcher-constructed operationalization (M2) that may imperfectly represent the source claim.
- Evidence bearing on a hypothesis does not automatically revise the **current researcher interpretation** (A6). It may create conditions for interpretation reconsideration under A7, subject to A7's trigger framework.

---

## 4. Binding Methodology Rules

1. **Methodological adequacy is assessed independently of result favorability.** A well-designed test that contradicts a hypothesis is not thereby methodologically inadequate. A poorly designed test that supports a hypothesis is not thereby methodologically adequate. Design quality and result direction are independent axes.

2. **In-sample fit is not out-of-sample evidence.** Results obtained using data that informed hypothesis or parameter development must be explicitly distinguished from results obtained on data not used in that development. In-sample-only results carry substantially limited evidentiary weight for generalization claims and must be disclosed as such.

3. **Exploratory discovery is not confirmatory testing.** A hypothesis discovered by examining data (including through parameter search, pattern-mining, or post-hoc observation) must be disclosed as exploratory. Exploratory findings require independent confirmatory testing (on different data) before being treated as having the evidentiary weight of confirmatory results.

4. **Statistical significance is not practical significance.** A statistically significant result may have negligible real-world relevance; a practically significant result may not achieve conventional statistical significance thresholds, particularly with limited sample sizes. Both must be reported and considered separately in evidence strength determination.

5. **Reproducibility is not robustness.** A result that is reproducible (another researcher obtains the same output using the same method and data) may still be fragile (dependent on narrow, specific parameter choices) or non-generalizable (failing under different conditions). Reproducibility and robustness must be assessed separately.

6. **Overfitting and data-snooping exposure must be disclosed, not assumed absent.** Any test involving parameter tuning, multiple comparisons, or hypothesis search against a single dataset must document the extent of that search. Absence of disclosure does not establish absence of the risk.

7. **Evidence strength integrates multiple dimensions and is not reducible to any single criterion.** No single factor — statistical significance, sample size, source authority, robustness alone, or one successful test — determines evidence strength independently of the others.

8. **Source authority does not determine or substitute for empirical evidence strength.** Consistent with A5 Rule 8 and Founding Definition Capability 11, the reputation or authority of the source from which a hypothesis originated has no bearing on the strength of empirical evidence for or against that hypothesis.

9. **Except as stated in Rule 13 for a valid counterexample to a properly specified universal hypothesis, a single empirical result does not conclusively prove or disprove a hypothesis.** One favorable result constitutes supporting evidence, not proof. One unfavorable result constitutes contradicting evidence, not disproof. Evidence accumulates and is weighted; it is not binary.

10. **Evidence against a hypothesis does not automatically establish the falsity of the originating source claim.** The hypothesis is a specific operationalization (M2) of a concept that may relate to the source claim through faithful measurement specification or substantive departure (M2 Rule 9, M2-C1). A failed hypothesis test may indicate the operationalization was inadequate, the specific parameters were wrong, the sample was atypical, or the source claim itself does not hold — these possibilities must be distinguished, not conflated.

11. **Evidence for a hypothesis based on a substantive departure from the current interpretation does not automatically revise that interpretation.** Strong empirical results for a departure-based hypothesis may provide a substantive basis for A7 classification, but A7 determines that classification: a result materially affecting the documented interpretation foundation is Mandatory; a relevant non-foundational result is Permissive only if it provides substantive basis; otherwise it is Insufficient. The interpretation is revised only through the A6/A7 process, not automatically by M3 evidence alone.

12. **Failed operationalization is distinct from failed concept.** If a specific operational definition produces no empirical support, this may reflect: (a) the operationalization was inadequate or misspecified, (b) the sample or design was inadequate, (c) the underlying concept does not correspond to observable market behavior as currently understood, or (d) genuine absence of the claimed phenomenon. These must be distinguished; failure of one operationalization does not by itself establish failure of the concept.

13. **A universal claim may be falsified by a single valid, well-documented counterexample.** Because universal claims (e.g., "always fills") assert that no counterexample exists, one methodologically sound counterexample is sufficient to contradict the universal claim, even though no finite sample can conclusively verify a universal claim as true (M2 Test 10, M2 Rule 3).

14. **Probabilistic or bounded claims require accumulated evidence across samples, not single instances.** Unlike universal claims, a claim asserting a frequency or tendency (e.g., "fills in more than 75% of instances") is not falsified or confirmed by any single instance; evidence must be assessed across the sample as a whole, with attention to sample size and characteristics (Rule 1, Layer 1).

15. **Conflicting results from methodologically adequate studies do not automatically indicate that one study is invalid.** Two adequate studies reaching different conclusions may reflect genuine differences in sample, market regime, time period, or scope. This is itself a research-relevant finding (analogous to A5's treatment of unresolved contradictions) and must be preserved and disclosed rather than resolved by discarding one study without methodological justification.

16. **No universal numeric threshold is mandated for sample size, significance level, or effect size.** What constitutes adequate sample size or an appropriate significance threshold depends on the nature of the hypothesis, the phenomenon under investigation, and data availability. The researcher must provide reasoned justification for the standards applied in a given test, rather than defaulting to an unstated universal convention.

17. **M3 does not determine trading-model admission.** Evidence strength assessment informs, but does not itself constitute, the decision of whether a finding is admitted into the trading model. That determination belongs to a later, not-yet-decided methodology stage for Trading-Model Admission Criteria.

18. **M3 does not itself trigger interpretation reconsideration.** Empirical results are inputs to A7's trigger framework. A result that materially affects the documented interpretation foundation is Mandatory; a relevant non-foundational result is Permissive only if it provides substantive basis; otherwise it is Insufficient. M3 does not make that classification, modify A7's trigger framework, or bypass it.

---

## 5. Adversarial Tests

**Test 1 — Highly profitable in-sample backtest with no out-of-sample validation**

A backtest shows 300% returns over 5 years, but the strategy's parameters were tuned using that same 5-year dataset, and no separate out-of-sample data was tested.

- M3 may conclude: The in-sample result is documented and shows a pattern within the tested data.
- M3 must not conclude: The strategy will perform similarly on unseen data; the hypothesis is confirmed for general use.
- Layer: Design adequacy (Rule 2 — in-sample fit is not out-of-sample evidence) and evidence strength (limited, pending out-of-sample validation).

---

**Test 2 — Statistically significant result with negligible practical effect**

A test on 50,000 trades shows a statistically significant edge (p < 0.01) but the effect size is a 0.02% average return improvement per trade, potentially smaller than realistic transaction costs.

- M3 may conclude: The result is statistically significant and the pattern is unlikely due to random chance alone.
- M3 must not conclude: The result is practically meaningful for trading-model purposes without separately assessing practical significance.
- Layer: Rule 4 (statistical significance ≠ practical significance); both must be reported.

---

**Test 3 — Large effect from a very small sample**

A hypothesis about behavior during a rare market event (e.g., a specific type of flash crash) shows a large effect, but only 3 historical instances exist.

- M3 may conclude: A large effect was observed in the available instances; this is a preliminary and low-confidence finding given the extremely limited sample.
- M3 must not conclude: The effect is reliable or generalizable; that statistical significance testing is meaningful with n=3.
- Layer: Design adequacy (sample size, Layer 1) — no universal threshold is mandated (Rule 16), but sample-size limitations must be disclosed and evidence strength correspondingly limited.

---

**Test 4 — Strategy discovered after testing hundreds of parameter combinations on the same dataset**

A researcher tests 500 parameter combinations on one dataset and reports the best-performing combination as a hypothesis confirmation.

- M3 may conclude: One combination performed best among those tested on this dataset; this is an exploratory finding.
- M3 must not conclude: This combination represents a confirmed, generalizable edge without independent out-of-sample testing; the result is confirmatory.
- Layer: Rule 3 (exploratory ≠ confirmatory), Rule 6 (data-snooping exposure must be disclosed). This is a textbook data-snooping scenario requiring explicit disclosure and independent validation before being treated as strong evidence.

---

**Test 5 — A result that disappears when tested on another market regime**

A hypothesis supported in a trending market (2017-2019) shows no effect when tested in a ranging market (2020-2022).

- M3 may conclude: The effect may be regime-dependent; the hypothesis's scope may need to be narrowed to trending conditions, or the original claim may not hold generally.
- M3 must not conclude: The original test was invalid, or that the concept underlying the hypothesis is entirely without merit — regime-dependence is itself a finding.
- Layer: Robustness (Layer 3) — the result's failure to generalize across regimes is evidence about scope, not necessarily about the validity of the initial test.

---

**Test 6 — A failed test caused by poor or incomplete market data**

A backtest shows no support for a hypothesis, but subsequent review reveals the price data had significant gaps and errors during the tested period.

- M3 may conclude: The test result is unreliable due to documented data quality issues; the test does not provide meaningful evidence either for or against the hypothesis.
- M3 must not conclude: The hypothesis is contradicted; the underlying concept is invalid.
- Layer: Design adequacy (data quality, Layer 1) — inadequate design invalidates the evidentiary value of the result regardless of directionality (Rule 1).

---

**Test 7 — A faithful operationalization of an interpretation that produces no empirical support**

A researcher faithfully operationalizes "Order Block" per the current interpretation (M2 Rule 9) and tests whether it predicts reversals. The test, well-designed with adequate sample and out-of-sample validation, shows no meaningful predictive power.

- M3 may conclude: This specific faithful operationalization, under this test design, does not show the claimed predictive relationship.
- M3 must not conclude: The concept of "Order Block" is entirely without merit, or that the current interpretation is false; other faithful operationalizations (M2-C1) might yield different results, and the interpretation itself is not directly falsified by one hypothesis test.
- Layer: Rule 12 (failed operationalization ≠ failed concept), Rule 10 (evidence against hypothesis ≠ automatic source-claim falsity). This may generate a research question (B1) about alternative operationalizations or create conditions for A7 reconsideration.

---

**Test 8 — A substantive departure from the current interpretation that produces strong empirical results**

A researcher tests an operational definition that substantively departs from the current interpretation of "Liquidity Sweep" (per M2 Rule 9, documented as a departure) and finds strong, robust, out-of-sample-validated support.

- M3 may conclude: Strong evidence supports this alternative (departure) operationalization under rigorous testing conditions.
- M3 must not conclude: The current interpretation is automatically revised to match the departure-based definition.
- Layer: Rule 11 (evidence for departure ≠ automatic interpretation revision). This is exactly the kind of finding that may constitute a mandatory or permissive A7 trigger (empirical evidence bearing materially on the interpretation foundation), routed through A7's existing framework, not decided by M3 itself.

---

**Test 9 — Two methodologically adequate studies reaching conflicting results**

Study A (rigorous design, adequate sample, out-of-sample validated) finds support for a hypothesis on EUR/USD. Study B (equally rigorous) finds no support for the same hypothesis on GBP/USD.

- M3 may conclude: Both results are valid within their respective scopes; the conflicting results may indicate instrument-specific behavior, requiring further investigation into why the effect differs.
- M3 must not conclude: One study must be wrong or invalid merely because it conflicts with the other, absent identified methodological flaws.
- Layer: Rule 15 (conflicting adequate studies are preserved, not automatically resolved) — analogous to A5's treatment of unresolved contradictions at the source-claim level, now applied at the evidence level.

---

**Test 10 — A source claim contradicted by one empirical test but supported by another**

Source claim: "Fair Value Gaps always fill." Test A (specific operationalization, specific market) contradicts this. Test B (different operationalization, different market) supports it.

- M3 may conclude: The evidence is currently mixed; different operationalizations or market conditions produce different results, which is itself informative about the claim's scope or the adequacy of specific operationalizations.
- M3 must not conclude: The source claim is definitively true or false based on either test alone.
- Layer: Rule 10 (evidence-hypothesis-source-claim distinctions), Rule 9 (single results are not conclusive proof or disproof).

---

**Test 11 — A universal claim falsified by one valid counterexample**

Hypothesis: "Fair Value Gaps always fill." One methodologically sound, well-documented instance is found where a clearly identified FVG did not fill even after an extended, clearly concluded price sequence.

- M3 may conclude: The universal claim, as stated, is contradicted by this counterexample; the claim cannot be sustained in its unqualified universal form.
- M3 must not conclude: The underlying concept is meritless; a bounded or probabilistic reformulation of the claim is also contradicted.
- Layer: Rule 13 (universal claims are falsifiable by single valid counterexamples) — this is a direct application of M2 Test 10's falsifiability principle at the evidence-assessment stage.

---

**Test 12 — A probabilistic claim receiving mixed evidence across samples**

Hypothesis: "FVGs fill within 20 candles in more than 75% of instances." Sample A shows 78% fill rate; Sample B (different period) shows 68% fill rate.

- M3 may conclude: The evidence is mixed across samples; aggregate or pooled analysis, along with investigation of what differs between samples, is warranted before drawing a strong conclusion.
- M3 must not conclude: The hypothesis is definitively confirmed (from Sample A alone) or definitively contradicted (from Sample B alone).
- Layer: Rule 14 (probabilistic claims require accumulated evidence across samples, not single-sample judgments).

---

**Test 13 — A test whose hypothesis was formulated only after the researcher observed the result**

A researcher notices, while exploring data, that a certain candle pattern appears to precede reversals 80% of the time in the observed dataset, and then writes this up as a "hypothesis" confirmed by that same dataset.

- M3 may conclude: This is an exploratory finding; the described pattern is a candidate for further investigation.
- M3 must not conclude: The hypothesis has been confirmed; the same dataset that generated the hypothesis cannot also serve as independent confirmatory evidence for it.
- Layer: Rule 3 (exploratory discovery ≠ confirmatory testing) — this is the same underlying issue as Test 4 (data-snooping) but framed at the level of the entire hypothesis rather than parameter tuning; the hypothesis-generation process itself must be disclosed.

---

**Test 14 — A result that is reproducible but depends on one highly specific parameter set**

Another researcher, applying the exact same method and one specific parameter combination (e.g., exactly 17-candle lookback, exactly 23-pip threshold) to the same data, obtains the identical result. However, adjacent parameter values (16 or 18 candles, 22 or 24 pips) produce no effect.

- M3 may conclude: The result is reproducible (Rule 5) using the specified exact method; however, its extreme sensitivity to precise parameter values raises robustness concerns.
- M3 must not conclude: Because the result is reproducible, it is therefore robust or reliable for general application.
- Layer: Rule 5 (reproducibility ≠ robustness) — this is a direct, explicit demonstration of the two properties diverging.

---

**Test 15 — A backtest with strong headline returns but unrealistic execution assumptions**

A backtest shows a 150% annual return, but assumes zero transaction costs, zero slippage, fills at exact theoretical prices, and uses closing prices for signals that would only be known intra-candle (a form of look-ahead bias).

- M3 may conclude: The reported headline return reflects the backtest's stated assumptions, which do not correspond to achievable real-world execution conditions.
- M3 must not conclude: The strategy would achieve similar real-world performance; the result constitutes strong evidence for the hypothesis's practical validity.
- Layer: Design adequacy (Rule 1, look-ahead bias, unrealistic execution modeling) — this is a design-adequacy failure that limits the evidentiary value of the result regardless of the favorable direction of the headline figure.

---

## 6. Recommended Decision

**Option C — Principled Multi-Dimensional Assessment Framework**

M3 establishes a layered framework for assessing:
1. Design adequacy (data quality, sample selection/size, in-sample/out-of-sample separation, overfitting/data-snooping exposure, look-ahead bias, survivorship bias, parameter transparency) — independent of result favorability
2. Result characterization (statistical uncertainty, statistical significance, practical significance) — reported separately
3. Robustness (across time, instruments, parameters, and in/out-of-sample conditions)
4. Evidence strength — a multi-dimensional synthesis judgment, not reducible to any single factor
5. The relationship between evidence, hypothesis status, source-claim truth, and current interpretation — explicitly preserved as distinct layers

No universal experimental design, statistical method, or numeric threshold is mandated. The researcher exercises judgment within the framework's required disclosures and distinctions.

---

## 7. What M3 Unlocks

According to the ratified dependency structure and the Founding Definition mission pipeline:

- A future **Trading-Model Admission Criteria** stage (governing which findings are reliable enough to influence the user's trading model, per Founding Definition Core Problem Q7) may draw on M3's evidentiary vocabulary and assessment principles. M3 does not establish or begin that future stage.
- **Negative-result preservation** procedures (methodology content identified as unresolved in earlier decisions) can now be operationalized, since M3 establishes that contradicting evidence is meaningful and must be preserved rather than discarded.
- **A7 reconsideration triggers** involving empirical evidence (A7 Rule 8) can now be evaluated using M3's evidence-strength framework, without M3 itself deciding whether reconsideration is mandatory or permissive (that remains A7's determination).

---

## 8. Remaining Questions — Classified Only

| Question | Classification |
|----------|---------------|
| Specific statistical tests or methods appropriate to particular hypothesis types | Methodology/implementation content — not blocking downstream decisions |
| Formal criteria for trading-model admission (evidence-strength thresholds for practical adoption) | DEFER TO future Trading-Model Admission Criteria stage |
| How negative/contradicting results are formally documented and preserved long-term | DEFER TO ARCHITECTURE / Methodology content |
| Whether AI assists in experimental design review or evidence synthesis | DEFER TO REQUIREMENTS |
| How conflicting adequate studies are eventually reconciled, if ever, at the trading-model level | DEFER TO future Trading-Model Admission Criteria stage |
| Specific data quality standards or validation checklists for market data | DEFER TO ARCHITECTURE / Implementation |
| Whether formal pre-registration of hypotheses (before data examination) is required or merely encouraged | Methodology content — not blocking downstream decisions |

---

## 9. Final Verdict

**DECISION M3 PROPOSED.**

Experimental rigor and evidence assessment model: A layered, multi-dimensional framework separating design adequacy, result characterization, robustness, and evidence-strength synthesis, while explicitly preserving the ten required distinctions between methodological adequacy, statistical/practical significance, evidence strength, hypothesis status, source-claim truth, and interpretation status.

No single experimental paradigm, statistical method, or universal numeric threshold is mandated. Source authority is explicitly excluded as a determinant of evidence strength. Single results (favorable or unfavorable) are treated as contributory evidence, never as conclusive proof or disproof, except in the specific case of universal claims falsified by valid counterexamples (a logical necessity, not a discretionary threshold).

Relationship to ratified upstream: Consistent with the Founding Definition (Capability 11 — evidence vs. authority; Core Principle — epistemic state separation), A5 (contradiction preservation without forced reconciliation, extended to empirical-evidence-level conflicts), A6 (interpretation is not empirical validation), A7 (evidence may trigger reconsideration but does not itself revise interpretation), and M2/M2-C1 (hypothesis and operationalization are researcher constructs distinct from source claims and interpretations).

No contradiction with any ratified upstream decision detected.

Trading-model admission remains outside M3 and is not begun here.

---

## 10. Stop Statement

M3 proposed.

The next methodology decision has not begun.

Research Methodology has not been constructed.
