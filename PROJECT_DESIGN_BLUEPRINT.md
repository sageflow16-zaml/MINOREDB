# PROJECT DESIGN BLUEPRINT
## Project Minore

**Status:** PROPOSED  
**Ratification Status:** NOT RATIFIED  

---

## 1. PROJECT MISSION

Project Minore exists as a personal research system to transform raw, highly distributed, and often ambiguous trading knowledge into structured, testable, and evidence-based trading knowledge. 

The system arises from a critical problem in trading education: source material often blends definitions, personal beliefs, mechanical claims, and trading heuristics without clear epistemological separation. Project Minore is designed to preserve these boundaries and create a traceable, scientific lineage from raw input to trading model rules.

---

## 2. CORE OBJECTIVES

The system is designed to solve the following conceptual problems:
- **Absence of Dependency Structure**: Trading knowledge is typically distributed across scattered sources without a reliable dependency hierarchy.
- **Uncontrolled Research Process**: Traders struggle to trace what a source claimed, what those claims mean, which claims are testable, and how strong the empirical support is for any given trading belief.
- **Epistemological Conflation**: Overcoming the tendency to confuse source authority (the reputation of a source) with empirical validity (support from market data).

---

## 3. SCOPE

### Included:
- Registration and organization of research sources with explicit provenance tracking.
- Extraction of atomic source claims with strict fidelity (preserving verbatim text or faithful paraphrase).
- Multi-dimensional semantic classification of claims (Definitional, Mechanistic, Predictive, Prescriptive, Relational, Attributional).
- Association of claims with researcher-defined conceptual entities.
- Context-mediated contradiction and tension determination without forced reconciliation.
- Construction and tracking of reference interpretations and their evolution triggers.
- Substantive research-question identification and hypothesis formulation.
- Empirical test-adequacy evaluation (overfitting risk, look-ahead controls, sample splitting, and data quality).
- Multi-dimensional evidence-strength grading and synthesis.
- Lineage traceability from active trading model rules back to their originating source claims and test results.

### Excluded:
- Public trading platform capabilities.
- Public signal services or copy-trading functionality.
- Broker integration or trade execution.
- Social networking or community platforms.
- Public course hosting or educational material distribution.
- Automated money management or capital allocation.

### Future:
- Integration of raw price and market databases.
- Integration of macroeconomic, yield, interest rate, seasonal, and Commitment of Traders (COT) datasets.
- AI-assisted analysis, extraction, classification, and contradiction flagging (subject to final researcher review).

---

## 4. PRIMARY USERS

- **Who will use it**: A single independent trader-researcher conducting personal research and developing evidence-backed trading models.
- **Who will never use it**: Public users, group members, copy-traders, retail course consumers, brokers, or automated trading systems.

---

## 5. CORE CAPABILITIES

The system must conceptually support the following thirteen foundational capabilities:
1. **Source Registry**: Register and organize research inputs.
2. **Provenance Protection**: Trace and preserve the origin, nature, and identity of source material.
3. **Taxonomic Structuring**: Organize trading concepts and their logical relationships.
4. **Epistemic Separation**: Keep source assertions strictly separate from researcher interpretations.
5. **Evolutionary Understanding**: Formulate, version, and track reference understandings of concepts over time.
6. **Inquiry Discovery**: Uncover and isolate gaps, ambiguities, and contradictions to formulate research questions.
7. **Falsifiable Operationalization**: Convert open questions into falsifiable, testable hypotheses.
8. **Reproducible Test Specification**: Define rigorous, structured test criteria.
9. **Experimentation Logging**: Record the parameters, scope, and execution details of backtests and experiments.
10. **Outcome Preservation**: Log the quantitative results and statistical metrics of executed tests.
11. **Evidential Grading**: Weight and synthesize empirical evidence along design, sample, and robustness axes.
12. **Lineage-Backed Adaptation**: Evolve active trading model rules based strictly on graded evidence.
13. **Lineage Auditability**: Re-run and audit the entire reasoning chain behind any model rule.

---

## 6. INPUTS

The system ingests the following conceptual categories:
- **Research Sources**: Authoritative primary videos, secondary transcriptions, researcher notes of recalled material, academic publications, and AI-generated summaries (each accompanied by an explicit provenance profile).
- **Market Substrait**: Raw price series, volume data, macroeconomic variables, interest rates, seasonal indices, COT records, and prior external quantitative studies.

---

## 7. OUTPUTS

The system emits:
- **Linage-Certified Trading Rules**: Active rules admitted into the user's trading model, each bearing an unbroken traceability chain.
- **Historical Evidentiary Records**: Replicable test specifications, quantitative outcomes, and multi-dimensional evidence-strength grades.
- **Semantic Landscape Maps**: Extracted claims, classification tags, concept associations, and documented contradictions.
- **Evolutionary Provenance Trees**: Prior versions of researcher interpretations and the specific triggers that led to their revision.

---

## 8. INTERNAL KNOWLEDGE LIFECYCLE

The conceptual flow of knowledge within the system follows an order-controlled lifecycle:

```
[SOURCE ADMISSION] → [CLAIM EXTRACTION] → [SEMANTIC CLASSIFICATION] → 
[CONCEPT ASSOCIATION] → [CONTRADICTION ANALYSIS] → [REFERENCE INTERPRETATION] → 
[RECONSIDERATION TRIGGER] → [RESEARCH INQUIRY] → [HYPOTHESIS OPERATIONALIZATION] → 
[RIGOROUS TESTING] → [EVIDENTIARY SYNTHESIS] → [MODEL ADMISSION]
```

1. **Admission**: Ingest source and establish an explicit provenance confidence level.
2. **Extraction**: Extract atomic, immutable propositions preserving context and fidelity.
3. **Classification**: Assign multi-dimensional tags capturing what kind of assertion the source made.
4. **Association**: Group classified claims under conceptual entities.
5. **Contradiction Analysis**: Compare claims for variations, tensions, or genuine mutual exclusivity.
6. **Interpretation Construction**: Formulate a single, current reference understanding of the concept with explicit reasoning.
7. **Reconsideration**: Trigger re-evaluation of the reference understanding when new claims, contexts, or empirical results affect its foundation.
8. **Inquiry**: Formulate open research questions based on gaps, unresolved contradictions, or anomalies.
9. **Hypothesis Formation**: Operationalize questions into specific, falsifiable predictive propositions.
10. **Rigor Testing**: Design and execute tests under strict look-ahead, sample split, and data-quality controls.
11. **Evidential Synthesis**: Grade result uncertainty, practical significance, and robustness into an evidence strength profile.
12. **Model Revision**: Evaluate whether findings meet the admission criteria to revise active model rules.

---

## 9. MAJOR DOMAINS

The conceptual model is partitioned into eight major domains:
1. **Source Intake & Provenance**: Governs origin, authenticity, and temporal metadata.
2. **Assertion & Taxonomy**: Governs atomic claim extraction, fidelity, and multi-dimensional tagging.
3. **Concept & Interpretation**: Governs conceptual clustering, reference interpretations, and reasoning traceability.
4. **Epistemic Conflict**: Governs variation mapping, tension bracketing, and genuine contradiction preservation.
5. **Inquiry & Operationalization**: Governs gap discovery, question formulation, and falsifiable hypothesis design.
6. **Experimental Design**: Governs data-quality verification, sample split controls, parameter tuning transparency, and look-ahead/survivorship bias prevention.
7. **Statistical & Practical Evidence**: Governs statistical significance, practical effect-size metrics, robustness checks, and evidentiary grading.
8. **Trading Model Lifecycle**: Governs model admission rules, lineage tracking, and historical rule preservation.

---

## 10. SUCCESS CRITERIA

The system is successful if and only if:
- **Traceability Guarantee**: The user can select any active rule in their trading model and trace its exact lineage back to its originating source claims, the reference interpretations it relied on, its operationalized hypotheses, its empirical test design, its exact quantitative results, and its synthesized evidence-strength grade.
- **Rule Legitimacy**: No rule may exist within the trading model unless it possesses a complete, auditable Project Minore research lineage.

---

## 11. EXPLICIT NON-GOALS

The following boundaries have been explicitly established by authority and must not be reopened or decided at this stage:
- **No System Architecture**: This blueprint does not select or design system structure.
- **No Database Schema or Tables**: Data storage structures and entity names remain completely outside this scope.
- **No Bounded Context Boundaries**: No software context boundaries are decided.
- **No Knowledge Graph Design**: Semantic graph architectures are excluded.
- **No AI Agent Design**: Agent communication, prompting, or execution models are excluded.
- **No Statistical Architecture**: Specific statistical tests, distributions, or calculations are excluded.
- **No Frontend Design**: User interfaces, layouts, or workflows are excluded.
- **No Technology Stack**: Programming languages, database engines, or frameworks are completely outside this scope.
- **No Deployment Architecture**: Server, container, or cloud topologies are excluded.
- **No Entity Names or Cardinalities**: Quantitative entity relationships are excluded.

---

## 12. OPEN QUESTIONS

The following questions have been explicitly deferred by ratified decisions and must be resolved before software architecture may begin:

### Source & Provenance (Deferred by A1)
- How sources are stored and indexed.
- Metadata schema and field definitions.
- Source deduplication strategies for identical content across multiple formats.
- Source versioning for updated content at the same location.
- Whether AI assists in source intake.
- Procedures for re-assessing provenance confidence when new information appears.

### Claim Extraction (Deferred by A2)
- How claims are stored and indexed.
- Claim identifier structure.
- Whether AI assists in claim extraction.
- Procedures for extraction from non-linguistic sources (charts, diagrams).
- Procedures for superseding an incorrectly extracted claim.
- Criteria for defining a "faithful paraphrase" in edge cases.

### Claim Classification (Deferred by A3)
- Whether AI assists in claim classification.
- How classifications are stored (fields, tags, enums).
- Classification confidence or uncertainty representation.
- Re-classification procedures if initial classification is determined to be incorrect.
- Multi-annotator agreement rules for ambiguous classifications.

### Concept Association (Deferred by A4)
- Mechanisms for recording association ambiguity.
- Whether AI assists in concept association.
- How concept associations are stored or indexed.
- Confidence or strength metrics for associations.
- Concept identifier or naming conventions.
- Rules for multi-researcher association assignment conflicts.
- Treatment of typos, synonyms, or variant terminology referring to the same concept.

### Contradiction Handling (Deferred by A5)
- Mechanism or syntax for recording a contradiction relationship between claims.
- Whether a contradiction between an extraction error and a source claim is handled differently.
- Whether AI automatically flags potential contradictions for researcher review.
- How contradictions are stored, linked, or flagged in database records.
- Whether contradiction status itself can be revised.
- Criteria for quantitative evidence resolving a source contradiction.
- Whether researcher reconciliation in A6 permanently closes a contradiction.

### Interpretation Construction (Deferred by A6)
- Procedures for formally revising an interpretation.
- Conditions triggering interpretation revision (new source material, researcher judgment shift, empirical contradiction).
- How interpretations are stored or versioned.
- Whether AI assists in interpretation construction.
- Weighting or confidence metrics for interpretations.
- Whether multiple competing researcher interpretations may coexist.
- Mechanisms for formally adopting an interpretation as authoritative.
- Treatment of interpretations for association-pending claims.

### Reconsideration Triggers (Deferred by A7)
- The exact revision procedure once reconsideration is triggered.
- How reconsideration outcomes are recorded.
- Evidence-strength grading that informs reconsideration outcomes.
- Whether reconsideration must occur within a time bound.
- How to detect that a research-state change has occurred.
- Whether AI may flag potential triggers.
- Treatment of triggers for association-pending claims.
- Whether multiple simultaneous triggers change reconsideration priority.

### Research Inquiry (Deferred by B1)
- How research questions are documented, stored, or tracked.
- Whether research questions have statuses, lifecycle states, or workflows.
- Prioritization or sequencing of research questions.
- Whether AI assists in identifying research questions.
- Criteria for formally retiring or resolving research questions.
- Whether research questions have confidence levels or uncertainty metrics.

### Hypothesis Formation (Deferred by M2)
- Specific statistical methods for testing hypotheses.
- Sample size requirements or power analysis.
- In-sample vs. out-of-sample validation procedures.
- How to document hypotheses, operational definitions, and test specifications.
- Whether hypotheses have statuses or lifecycle states.
- Prioritization or sequencing of hypothesis testing.
- Whether AI assists in hypothesis formation or operationalization.
- How to handle failed operationalization attempts.

### Rigor & Evidence (Deferred by M3)
- Specific statistical tests or methods appropriate to particular hypothesis types.
- Formal criteria for trading-model admission (evidence-strength thresholds for practical adoption).
- How negative/contradicting results are formally documented and preserved long-term.
- Whether AI assists in experimental design review or evidence synthesis.
- How conflicting adequate studies are eventually reconciled, if ever, at the trading-model level.
- Specific data quality standards or validation checklists for market data.
- Whether formal pre-registration of hypotheses (before data examination) is required or merely encouraged.

---

*This blueprint defines the project boundaries, capabilities, and open questions strictly under existing authority. It does not establish architecture or begin implementation.*