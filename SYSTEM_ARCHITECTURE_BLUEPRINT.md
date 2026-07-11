# SYSTEM ARCHITECTURE BLUEPRINT
## Project Minore

**Status:** PROPOSED  
**Ratification Status:** NOT RATIFIED  

---

## 1. PURPOSE

This System Architecture Blueprint transforms the approved Conceptual Domain Model of Project Minore into a technology-independent, logical system architecture. It answers only one question: *"What major system components are required to realize the conceptual model?"*

The primary goal of this blueprint is to establish the core structural components and their boundaries before any database, code, or framework selection begins, ensuring that any future software design strictly preserves Project Minore's core principles of epistemic separation, evidence-backed reasoning, and auditable research lineage.

---

## 2. ARCHITECTURAL PRINCIPLES

Every component within this architecture must be designed to adhere to the following principles, regardless of future technology selections:

- **Separation of Concerns**: Each system component must own a distinct layer of the research-to-evidence pipeline. No component may bleed into the responsibilities of another (e.g., claim extraction must be logically isolated from researcher interpretation).
- **Single Source of Truth**: Every conceptual entity (Source, Claim, Concept, Interpretation, Hypothesis, Evidence, Rule) must have exactly one component that serves as its authoritative registrar.
- **Traceability (Unbroken Upstream Chains)**: The system must enforce a continuous, auditable link from downstream rules back to their upstream dependencies. No rule can exist in the model without a complete, unbroken upstream chain.
- **Immutability of Evidence**: Once recorded, source claims and empirical test results must be treated as logically immutable. Gaps, errors, or updates must be addressed via version-level supersession with explicit audit trails, never via in-place modifications.
- **Explicit State and Transitions**: All entities must possess explicit lifecycle states (e.g., proposed, ratified, unresolved, binding, active, retired) with strict, auditable transition rules.
- **Auditability**: All actions must be historically verifiable. The system must conceptually support the traversal of its entire relationship landscape for audit purposes.

---

## 3. SYSTEM COMPONENTS

To realize the Conceptual Domain Model, the system is divided into eleven logical components. No software modules, classes, databases, or microservices are assumed.

```
+-----------------------------------------------------------------------------------+
|                            LINEAGE AUDIT COMPONENT                                |
+-----------------------------------------------------------------------------------+
                                          ↑ (Transversal Auditing)
+-----------------------+      +-----------------------+      +---------------------+
|    SOURCE INTAKE      |      |   CLAIM EXTRACTION    |      |  CONCEPT REGISTRY   |
|       REGISTRY        | ---->|    & CATEGORIZATION   | ---->|    & ASSOCIATION    |
+-----------------------+      +-----------------------+      +---------------------+
                                                                         |
                                                                         v
+-----------------------+      +-----------------------+      +---------------------+
|   RESEARCHER REF.     |      |   EPISTEMIC CONFLICT  |      |  EPISTEMIC CONFLICT |
|    INTERPRETATION     | <----|     & RESOLUTION      | <----|    & CONTRADICTION  |
+-----------------------+      +-----------------------+      +---------------------+
            |
            v
+-----------------------+      +-----------------------+      +---------------------+
|    RESEARCH INQUIRY   |      |  HYPOTHESIS FORMATION |      |  EXPERIMENTAL RIGOR |
|   & QUESTION REGISTRY | ---->|  & OPERATIONALIZATION | ---->|   & ADEQUACY VERIF. |
+-----------------------+      +-----------------------+      +---------------------+
                                                                         |
                                                                         v
+------------------------------------------------------+      +---------------------+
|                 TRADING MODEL                        |      |    RESULT LOGGING   |
|                  RULE ENGINE                         | <----|   & EVIDENTIARY SYN. |
+------------------------------------------------------+      +---------------------+
```

### 1. Source Intake & Provenance Registry
- **Purpose**: Governs the entry, registration, and metadata verification of all external sources.
- **Responsibilities**: Ingest research inputs, enforce admissibility criteria, record source identity, map temporal and attribution metadata, and calculate provenance confidence ratings.
- **What it owns**: Source metadata, temporal references, authorship mappings, location parameters, and provenance confidence logs.
- **What it never owns**: Extracted claim content, claim classifications, or concepts.

### 2. Claim Extraction & Categorization Component
- **Purpose**: Records, tracks, and classifies atomic propositions in the source's own terms.
- **Responsibilities**: Isolate atomic propositions (claim boundaries), preserve source location details, track paraphrase-to-verbatim fidelity, and apply multi-dimensional classification tags.
- **What it owns**: Atomic claim text, parent source mappings, location coordinates within sources, paraphrase flags, and classification profiles.
- **What it never owns**: Conceptual vocabularies, reference interpretations, or backtest designs.

### 3. Concept Registry & Association Component
- **Purpose**: Maps extracted claims to the project's conceptual vocabulary.
- **Responsibilities**: Maintain the conceptual vocabulary, manage term definitions, map claims to concepts, assign association metrics (primary vs. secondary), and track association ambiguity.
- **What it owns**: Concept terms, term definitions, claim-to-concept maps, and association metrics.
- **What it never owns**: Source claims, reference interpretations, or research questions.

### 4. Epistemic Conflict & Contradiction Component
- **Purpose**: Identifies and tracks variations, tensions, and logical contradictions.
- **Responsibilities**: Perform context-mediated mutual exclusivity testing, determine conflict classification (Difference, Variation, Tension, Apparent Contradiction, Genuine Contradiction), and maintain the unresolved contradiction registry.
- **What it owns**: Conflict definitions, context-exclusion rules, and contradiction relations.
- **What it never owns**: Claim modification, concept definitions, or interpretive reconciliations.

### 5. Researcher Reference Interpretation Component
- **Purpose**: Manages the construction, tracking, and evolution of reference understandings.
- **Responsibilities**: Formulate reference interpretations, map interpretation foundations (supporting claims), preserve reasoning trees, record prior interpretation history, and classify trigger events.
- **What it owns**: Reference interpretation statements, reasoning trees, foundation maps, historical version trees, and trigger definitions.
- **What it never owns**: Empirical testing execution, source claims, or active trading model rules.

### 6. Research Inquiry & Question Registry Component
- **Purpose**: Tracks open research questions arising from gaps, tensions, and anomalies.
- **Responsibilities**: Maintain the registry of research questions, evaluate domain relevance, record inquiry origins (gaps, unresolved contradictions, anomalies), and track question states.
- **What it owns**: Research question statements, domain-relevance flags, and inquiry origin maps.
- **What it never owns**: Hypothesis operationalizations, test outcomes, or reference interpretations.

### 7. Hypothesis Formation & Operationalization Component
- **Purpose**: Models falsifiable empirical hypotheses and operational definitions.
- **Responsibilities**: Formulate empirical hypotheses, define operational variables based on observable market phenomena, and record substantive departures.
- **What it owns**: Hypothesis statements, operational variables, and departure logs.
- **What it never owns**: Backtest results, look-ahead controls, or evidence synthesis.

### 8. Experimental Rigor & Adequacy Verification Component
- **Purpose**: Conducts pre-test design adequacy checks.
- **Responsibilities**: Enforce rigor constraints on test designs (data quality standards, sample size, look-ahead bias prevention, survivorship bias prevention, parameter transparency, in-sample/out-of-sample data splitting controls).
- **What it owns**: Rigor verification checklists, data quality scores, sample separation parameters, and adequacy validation outcomes.
- **What it never owns**: Hypothesis statements, empirical results, or evidence-strength grades.

### 9. Result Logging & Evidential Synthesis Component
- **Purpose**: Logs raw outcomes and synthesizes multi-dimensional evidence-strength grades.
- **Responsibilities**: Ingest test outputs, log parameter uncertainty, record statistical and practical significance, evaluate robustness, and compile evidence-strength profiles.
- **What it owns**: Raw test execution logs, outcome variables, uncertainty parameters, robustness check outcomes, and graded evidence strength profiles.
- **What it never owns**: Design adequacy verification, or trading-model admission rules.

### 10. Trading Model Rule Engine Component
- **Purpose**: Governs the admission, revision, and retirement of active trading model rules.
- **Responsibilities**: Maintain active trading model rules, enforce admission criteria, execute model revision procedures, record revision histories, and link rules to their evidence-strength profiles.
- **What it owns**: Active trading model rules, rule revision histories, and rule-to-evidence links.
- **What it never owns**: Reference interpretations, test outcomes, or statistical calculations.

### 11. Traceability & Lineage Audit Component
- **Purpose**: Implements horizontal, transversal lineage tracking and compliance auditing.
- **Responsibilities**: Traverse the entire downstream-to-upstream relationship hierarchy, reconstruct the exact research lineage of any model rule, and verify compliance with constitutional rules.
- **What it owns**: Lineage traversal trees, dependency verification logs, and compliance audit reports.
- **What it never owns**: It is a read-only transversal component and owns no primary research or metadata records.

---

## 4. COMPONENT RELATIONSHIPS

The interactions between components are defined conceptually as follows:
- **Source Intake** feeds **Claim Extraction** by passing registered sources with provenance metadata.
- **Claim Extraction** feeds **Concept Registry** by presenting classified claims with parent location context.
- **Concept Registry** triggers **Epistemic Conflict** whenever multiple claims are associated with the same concept, prompting a mutual exclusivity assessment.
- **Epistemic Conflict** and **Concept Registry** together feed the **Researcher Reference Interpretation** component, which constructs reference understandings based on claim clusters and resolved or bracketed contradictions.
- **Researcher Reference Interpretation** feeds **Research Inquiry** by exposing gaps, provisional assumptions, or bracketing decisions that require further investigation.
- **Research Inquiry** feeds **Hypothesis Formation** by passing open research questions that need operationalization.
- **Hypothesis Formation** feeds **Experimental Rigor & Adequacy Verification** by passing operational variable parameters and hypotheses.
- **Experimental Rigor & Adequacy Verification** authorizes **Result Logging & Evidential Synthesis** to ingest and process test results only after verifying design adequacy.
- **Result Logging & Evidential Synthesis** compiles evidence profiles and feeds them to the **Trading Model Rule Engine**.
- **Trading Model Rule Engine** accepts evidence profiles and evaluates whether they satisfy admission criteria to update active model rules.
- **Traceability & Lineage Audit** reads the state of all components to verify audit trail compliance.

---

## 5. INFORMATION FLOW

The flow of information through the system is strictly ordered and uni-directional, with designated feedback loops:

1. **Intake Pass**: External Source documents/media are ingested, verified, and locked in the **Source Intake Registry**.
2. **Extraction Pass**: Registered Sources are parsed to isolate atomic claims. Each claim is assigned classification tags and locked as immutable in the **Claim Extraction Component**.
3. **Clustering Pass**: Claims are mapped to Concepts in the **Concept Registry**. If conflict is detected, the **Epistemic Conflict Component** performs mutual exclusivity testing and records a conflict state.
4. **Synthesis Pass**: The researcher uses the Concept Registry and Epistemic Conflict states to formulate reference understandings and document reasoning chains in the **Researcher Reference Interpretation Component**.
5. **Inquiry Pass**: Unresolved contradictions, gaps, or anomalies are pushed to the **Research Inquiry Component** as open questions.
6. **Operationalization Pass**: Open questions are translated into falsifiable propositions in the **Hypothesis Formation Component**.
7. **Rigor Pass**: Hypotheses are bound to specific test designs. The **Experimental Rigor Component** validates data quality and bias prevention parameters.
8. **Logging & Synthesis Pass**: Upon successful validation, the test is executed, and outcomes are recorded and evaluated in the **Result Logging & Evidential Synthesis Component** to produce an evidence-strength grade.
9. **Admission Pass**: The **Trading Model Rule Engine** evaluates the graded evidence strength against admission criteria to update, add, or retire active rules.
10. **Feedback Loop (A7)**: The compiled evidence-strength profile is pushed back to the **Researcher Reference Interpretation Component** as a potential trigger event to re-evaluate the reference understanding.

---

## 6. ARCHITECTURAL CONSTRAINTS

This logical architecture is bound by the following constraints inherited from existing authority:
- **No Direct Entry**: No trading rule may enter the **Trading Model Rule Engine** unless its upstream lineage (source claims, interpretations, hypotheses, adequacy validations, and synthesized evidence) is complete and verified.
- **Immutability Barrier**: Source claims and empirical test logs must never be overwritten, modified, or deleted. All updates must be recorded via new versions with parent-child links.
- **No Silent Merging**: The **Epistemic Conflict Component** must explicitly preserve conflicting claims as unresolved. It is strictly forbidden to merge or suppress conflicting source assertions at the storage or logical layers.
- **Pre-Test Adequacy Block**: No test results may be logged in the **Result Logging Component** if the test's design fails the adequacy check in the **Experimental Rigor Component**. Inadequate tests carry zero evidentiary weight.
- **Provenance Inseparability**: Every claim must remain permanently linked to its parent source record and its calculated provenance confidence rating.

---

## 7. ARCHITECTURAL INVARIANTS

Regardless of the database or programming technology chosen for implementation, the following must always remain true:
- **In-Sample Fit is Not Evidence**: The system must conceptually isolate and flag test results that did not use out-of-sample data.
- **No Authority-Based Grading**: The **Result Logging Component** must not allow the authority or reputation of a source to influence the calculated empirical evidence-strength grade.
- **Reconsideration is Not Automatic Revision**: Reconsideration triggers (A7) may mandate re-evaluation of an interpretation, but the interpretation is updated only through an explicit, documented reasoning change by the researcher.
- **One Reference Understanding**: For any given concept, the system must recognize exactly one current, authoritative reference interpretation at any single point in time.

---

## 8. DEPENDENCY ORDERING

The logical components depend on each other in the following strict order. No component may be built or operated unless its upstream dependency is established:

```
[Source Intake Registry]
            ↓
[Claim Extraction Component]
            ↓
[Concept Registry & Association]
            ↓
[Epistemic Conflict Component]
            ↓
[Researcher Reference Interpretation]
            ↓
[Research Inquiry Component]
            ↓
[Hypothesis Formation Component]
            ↓
[Experimental Rigor Component]
            ↓
[Result Logging & Evidential Synthesis]
            ↓
[Trading Model Rule Engine]
```

Transversal auditing (**Traceability & Lineage Audit Component**) depends conceptually on all components and must be designed to traverse the entire dependency graph.

---

## 9. NON-GOALS

The following details are explicitly excluded from this System Architecture Blueprint and must not be resolved at this stage:
- **No Database Schemas**: Storage tables, fields, document schemas, and indices are completely outside this scope.
- **No APIs**: REST, GraphQL, gRPC, or custom communication specifications are excluded.
- **No User Interfaces (UI)**: Layouts, frontends, component states, and workflow interfaces are excluded.
- **No Programming Languages or Frameworks**: No backend languages, libraries, or frameworks are selected.
- **No Infrastructure or Deployment Specifications**: No cloud providers, servers, containers, or orchestration systems are specified.
- **No Performance Optimizations**: Execution speeds, latency, and throughput considerations are excluded.

---

## 10. OPEN QUESTIONS

The following architectural questions must be answered before database or code design may begin:

### Storage & Serialization (Explicitly Deferred)
- What serialization formats are appropriate for preserving rich text and location context in claims?
- How to store version-level trees for evolved researcher interpretations without data corruption risk?
- How to represent multi-dimensional claim classifications (Definitional, Mechanistic, etc.) in a scalable data structure.
- How to record and store unresolved contradiction relationships between multiple claims.

### Lineage Traversal & Querying (Explicitly Deferred)
- What logical query structure is required to traverse from active trading rules back to source claims across multiple dependency-ordered domains?
- How to query and verify the audit state of the entire system in real-time.
- How to model and query the "provenance confidence rating" of a claim's lineage.

### Verification & Checklists (Explicitly Deferred)
- How to represent the "rigor checklists" and "adequacy checklists" in the Experimental Rigor component as structured, auditable validation rules.
- How to parameterize the results of backtests (such as drawdowns, win-rates, sample sizes) in the Result Logging component so they can be parsed for evidence-strength synthesis.
- How to represent and track "substantive departures" and "faithful measurement specifications" at the system level.

---

*This blueprint defines the system structure, components, and constraints strictly under existing authority. It does not select database schemas, APIs, or technologies, and does not begin implementation.*