# CONCEPTUAL DOMAIN MODEL
## Project Minore

**Status:** PROPOSED  
**Ratification Status:** NOT RATIFIED  

---

## 1. PURPOSE

This Conceptual Domain Model defines the fundamental, technology-independent conceptual domains of Project Minore. It answers only one question: *"What are the fundamental conceptual domains that exist inside Project Minore?"* 

This model serves to:
- Establish a shared, unambiguous vocabulary of the research system before software design begins.
- Enforce the boundaries of the system's core capabilities as established by ratified project-control authority.
- Provide a rigorous framework for tracking semantic, logical, and epistemic states of trading knowledge without prematurely committing to database schemas, programming languages, or software architectures.

---

## 2. DOMAIN IDENTIFICATION

Based strictly on existing project-control authority (Founding Definition, Decisions A1–A7, B1, M2, and M3), the system is partitioned into the following nine major conceptual domains:

1. **Source Intake Domain** (Admission & Provenance)
2. **Claim Extraction Domain** (Fidelity, Atomic Propositions, & Multi-Dimensional Classification)
3. **Concept & Association Domain** (Semantic Clustering)
4. **Epistemic Conflict Domain** (Variation, Tension, & Contradiction)
5. **Researcher Interpretation Domain** (Reference Understandings, Reasoning, & Reconsideration Triggers)
6. **Research Inquiry Domain** (Gaps & Research Questions)
7. **Hypothesis Formation Domain** (Falsifiable Operationalization)
8. **Experimental Rigor & Evidence Domain** (Methodological Adequacy & Evidentiary Synthesis)
9. **Trading Model Domain** (Rule Admission & Research Lineage)

---

## 3. DOMAIN RESPONSIBILITIES

### 1. Source Intake Domain
- **What it owns**: Evaluation of source admissibility, tracking of source identity, source origin types (primary authored, secondary transcriptions, researcher summaries, academic, market data, AI-generated), attribution, temporal references, location, and the evaluation of provenance confidence.
- **What it never owns**: The extraction of specific claims, semantic classification of claims, reference interpretations, or the determination of empirical truth.

### 2. Claim Extraction Domain
- **What it owns**: Extraction of atomic, self-contained source claims; preservation of verbatim text and source locations; faithful paraphrase representation; contextual boundaries of claims; and the assignment of multi-dimensional classification tags (Definitional, Mechanistic, Predictive, Prescriptive, Relational, Attributional).
- **What it never owns**: Conception of terms, construction of reference interpretations, contradiction resolution, hypothesis formation, or testing.

### 3. Concept & Association Domain
- **What it owns**: Definition of conceptual terms (ideas, patterns, methods), semantic mapping of claims to one or more concepts (primary subject vs. secondary mention), mapping relational concept associations, tracking association ambiguity, and the "association-pending" state.
- **What it never owns**: Claim classification, contradiction status determination, or reference interpretation construction.

### 4. Epistemic Conflict Domain
- **What it owns**: Assessment of semantic divergence among claims associated with the same concept, applying contextual applicability checks, logically testing mutual exclusivity, and classifying conflicts (Difference, Variation, Tension, Apparent Contradiction, Genuine Contradiction).
- **What it never owns**: Claim modification, concept definition, interpretation construction, or researcher reconciliation.

### 5. Researcher Interpretation Domain
- **What it owns**: Formulation of the researcher's current reference understanding of a concept, explicit documentation of the interpretation foundation and reasoning chain, tracking historical interpretations, and the classification of reconsideration triggers (Mandatory, Permissive, Insufficient).
- **What it never owns**: The raw content of source claims, statistical testing of hypotheses, or trading-model admission rules.

### 6. Research Inquiry Domain
- **What it owns**: Identification of open research questions arising from gaps, unresolved contradictions, tensions, or anomalies in the current research state; and the assessment of domain relevance and substantive grounding.
- **What it never owns**: Operationalization of test parameters, backtesting, or modifying reference interpretations.

### 7. Hypothesis Formation Domain
- **What it owns**: Empirical hypotheses, operational definitions of variables, faithful measurement specifications, and tracking substantive departures.
- **What it never owns**: System architecture design, reference interpretations, experimental execution, or evidence-strength calculations.

### 8. Experimental Rigor & Evidence Domain
- **What it owns**: Assessment of experimental design adequacy (data quality, sample size, in-sample/out-of-sample separation, look-ahead and survivorship controls, parameter transparency), characterization of results (uncertainty, statistical and practical significance), robustness evaluation, and evidence-strength grading.
- **What it never owns**: Formulation of hypotheses, or the ultimate decision of whether a finding is admitted into the trading model.

### 9. Trading Model Domain
- **What it owns**: Rules currently admitted into the user's trading model, model revision rules, and tracking/verifying the unbroken research lineage of active rules.
- **What it never owns**: Experimental design, statistical calculations, or evidence-strength synthesis.

---

## 4. DOMAIN BOUNDARIES

Conceptual boundaries are strictly enforced to preserve the system's core principles:
- **Source vs. Claim**: A source is a registered document or media input; a claim is an atomic proposition extracted from that source. A source may yield many claims, but a claim's semantic content remains bound to its source's recorded provenance.
- **Extraction vs. Interpretation**: Extraction captures only what the source explicitly asserted in its own terms. Interpretation is what the researcher currently believes the concept means. These are separated by an epistemic barrier; the researcher cannot modify a source claim to fit an interpretation.
- **Contradiction vs. Reconciliation**: Contradiction (A5) is a logical relationship of mutual exclusivity between source claims, determined from context. Reconciliation (A6) is an interpretive choice made by the researcher. Identifying a contradiction is a factual statement about source content; resolving it is an interpretive act.
- **Hypothesis vs. Interpretation**: An interpretation is a conceptual reference understanding. A hypothesis is a specific operationalized prediction designed to test that understanding. A failed hypothesis test discredits the operationalization or specific parameters, but does not automatically invalidate the underlying concept or interpretation.
- **Adequacy vs. Outcome**: Methodological adequacy is an attribute of a test's design (rigor, data quality, bias prevention). Test outcome is the empirical result. A well-designed test that disproves a hypothesis is highly adequate; a poorly designed test with look-ahead bias that supports a hypothesis is inadequate.

---

## 5. DOMAIN RELATIONSHIPS

Conceptual associations among domains are defined as follows:
- **Source and Claim**: One-to-Many. A registered Source yields multiple extracted Claims. Every Claim belongs to exactly one Source and inherits its provenance.
- **Claim and Concept**: Many-to-Many. A Claim may be associated with zero, one, or multiple Concepts based on substantive subject-matter context.
- **Conflict and Claim**: Many-to-Many. An Epistemic Conflict relationship exists between two or more Claims associated with the same Concept.
- **Interpretation and Concept**: One-to-One. A Concept has exactly one current Reference Interpretation, which links back to a subset of Claims as its Interpretation Foundation.
- **Interpretation and Reconsideration Trigger**: One-to-Many. An Interpretation’s current state is linked to multiple potential Trigger events arising from changes in the available research state.
- **Research Question and Inquiry Origin**: One-to-Many. A Research Question is grounded in one or more Inquiry Origins (gaps, unresolved contradictions, or anomalies).
- **Hypothesis and Research Question**: Many-to-One. A falsifiable Hypothesis is formulated in response to exactly one Research Question.
- **Hypothesis and Experimental Design**: One-to-Many. An empirical Hypothesis may be tested by one or more Experimental Designs.
- **Experimental Design and Result**: One-to-Many. An Experimental Design, when executed, produces one or more Empirical Results.
- **Result and Evidence Strength**: One-to-One. An Empirical Result, assessed against its Design Adequacy and Robustness, is synthesized into exactly one Evidence Strength Profile.
- **Trading Model Rule and Evidence**: One-to-Many. A Trading Model Rule is admitted or revised based on one or more Evidence Strength Profiles and their supporting research lineage.

---

## 6. DOMAIN LIFECYCLE

Knowledge flows conceptually through the domains via the following stages:

```
[SOURCE INTAKE] 
       ↓ (Provenance verified, Source registered)
[CLAIM EXTRACTION] 
       ↓ (Propositions isolated, classified, & location preserved)
[CONCEPT & ASSOCIATION] 
       ↓ (Claims grouped by subject matter under Concepts)
[EPISTEMIC CONFLICT] 
       ↓ (Claims evaluated for variations, tensions, or contradictions)
[RESEARCHER INTERPRETATION] 
       ↓ (Reference understanding constructed with explicit reasoning)
[RESEARCH INQUIRY] 
       ↓ (Open questions formulated from gaps or unresolved conflicts)
[HYPOTHESIS FORMATION] 
       ↓ (Questions operationalized into falsifiable propositions)
[RIGOR & EVIDENCE] 
       ↓ (Tests designed, data checked, and evidence strength graded)
[TRADING MODEL]
         (Linage-certified rules admitted, revised, or retired)
```

---

## 7. DOMAIN INVARIANTS

### 1. Source Intake Invariants
- Admissibility does not imply truth, authority, or empirical validity.
- Provenance gaps must never be silently filled; unknown values must be explicitly recorded as unknown.

### 2. Claim Extraction Invariants
- Atomic source claims are immutable once recorded; correction of an extraction error requires a new version with an explicit audit trail.
- Extraction preserves what the source said, not what the researcher believes it meant.

### 3. Concept & Association Invariants
- Association is based strictly on substantive subject matter in context, not on the mere appearance of terminology.

### 4. Epistemic Conflict Invariants
- Preserved source context must be evaluated before assigning genuine contradiction status.
- Genuine contradictions must be preserved in an unresolved state; forced source-level reconciliation is prohibited.

### 5. Researcher Interpretation Invariants
- The current interpretation is authoritative and binding on downstream work until explicitly revised.
- Prior interpretations are preserved as historical provenance, not overwritten.

### 6. Research Inquiry Invariants
- Research-question identification is conceptually distinct from answering the question.
- A research question already adequately answered by the current reference interpretation without acknowledged gaps is invalid.

### 7. Hypothesis Formation Invariants
- A hypothesis is a specific operationalization of a concept that may imperfectly represent the source claim or interpretation.
- Hypotheses must be falsifiable and defined using observable market phenomena.

### 8. Experimental Rigor & Evidence Invariants
- Methodological adequacy is independent of result favorability.
- In-sample fit is not out-of-sample evidence.
- Source authority does not determine or substitute for empirical evidence strength.

### 9. Trading Model Invariants
- A trading rule must possess a complete, auditable research lineage (source claims, interpretations, test designs, and graded evidence strength) to remain in the active trading model.

---

## 8. DOMAIN DEPENDENCIES

The conceptual domains depend strictly on upstream domains to establish their validity:

```
Source Intake
      ↓
Claim Extraction
      ↓
Concept & Association
      ↓
Epistemic Conflict
      ↓
Researcher Interpretation
      ↓
Research Inquiry
      ↓
Hypothesis Formation
      ↓
Experimental Rigor & Evidence
      ↓
Trading Model
```

No downstream domain may operate or alter the state of an upstream domain outside of explicitly defined feedback loops (such as empirical results acting as reconsideration triggers in the Interpretation Domain under A7 rules).

---

## 9. EXPLICIT NON-GOALS

The following exclusions have been established by authority and must remain outside this domain model:
- **No Software Architecture Design**: This model defines conceptual boundaries, not software modules, services, bounded contexts, classes, or code structure.
- **No Database Schema Design**: No entities, tables, foreign keys, or storage formats are defined.
- **No UI/Workflow Design**: User interface states, layouts, and automation workflows are excluded.
- **No Statistical Paradigm Selection**: No specific statistical algorithms, distributions, or calculations are mandated.
- **No Technology Stack Commitment**: No programming languages, databases, or runtime environments are specified.

---

## 10. OPEN QUESTIONS

The following conceptual, unresolved questions must be answered before software architecture design may begin:

- **Provenance Scale (Founding Definition Open Question #1)**: The exact scope of "full reasoning and provenance chain" with respect to superseded or evolved researcher interpretations remains undefined.
- **Non-Linguistic Extraction (Deferred by A2)**: How claim extraction applies conceptually to non-linguistic source material, such as hand-drawn charts, annotations, or diagrams.
- **Attribution Boundaries (Deferred by A3)**: Conceptual boundaries for classifying structural metadata about the source material itself (e.g., mentorship structures) versus direct conceptual origin claims.
- **Typo & Variant Reconciliation (Deferred by A4)**: How the system conceptually handles term variants, synonyms, or typos referring to the same conceptual entity before association occurs.
- **Error-Source Contradictions (Deferred by A5)**: Whether a contradiction arising between a known extraction error (subsequently flagged) and a valid source claim is handled differently from inter-source contradictions.
- **Coexisting reference interpretations (Deferred by A6)**: Whether the system conceptually permits multiple, competing reference interpretations to coexist simultaneously for a single concept under the same user.
- **Evidence-Trigger Weighting (Deferred by A7)**: The conceptual rules for deciding when empirical evidence is strong enough to mandate interpretation evolution versus when it remains permissive or insufficient.
- **Inquiry Retirement (Deferred by B1)**: The formal criteria for conceptually retiring, scoping, or resolving a research question without running empirical tests.
- **Failed Operationalization Handling (Deferred by M2)**: Conceptual rules for identifying whether a failed test represents a failed hypothesis, a failed measurement specification, or a failed underlying concept.
- **Conflicting Adequate Evidence (Deferred by M3)**: The conceptual rules for how the system handles two methodologically adequate studies reaching directly conflicting results when presenting evidence to the Trading Model domain.

---

*This domain model defines conceptual boundaries and invariants strictly under existing authority. It creates no software architecture, schema, or implementation.*