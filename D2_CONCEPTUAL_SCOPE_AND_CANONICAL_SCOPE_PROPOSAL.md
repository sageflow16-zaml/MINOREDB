# DECISION D2 — CONCEPTUAL SCOPE AND CANONICAL SCOPE

**Status:** PROPOSED  
**Ratification Status:** NOT RATIFIED

---

## 1. PURPOSE

This decision establishes the constitutional roles and the relationship between the **Project Domain Model** and the **Canonical Object Catalog**. It resolves the discrepancy between the conceptual breadth of the research system and the operational inventory of authorized information objects.

---

## 2. CONSTITUTIONAL ROLES

### 2.1 PROJECT_DOMAIN_MODEL.md (The Conceptual Map)
- **Role**: The authoritative map of the project's logical landscape.
- **Purpose**: To define the full theoretical scope, conceptual domains, and high-level relationships of the research system across its entire intended lifecycle.
- **Scope of Content**: May include conceptual entities, domains, and relationships that belong to future project phases or are not yet operationalized.
- **Authority**: Represents the "Conceptual Target."

### 2.2 CANONICAL_OBJECT_CATALOG.md (The Operational Inventory)
- **Role**: The authoritative register of authorized information objects.
- **Purpose**: To provide a strictly limited inventory of information objects that have been formally defined and are authorized for use in technical specifications and system design.
- **Scope of Content**: Restricted to objects that are currently canonical. It must not contain speculative or future-phase objects that have not yet been formally established.
- **Authority**: Represents the "Operational Baseline."

---

## 3. GOVERNANCE AND PRECEDENCE

### 3.1 Implementation Governance
All subsequent information system design and technical implementation must derive strictly from the `CANONICAL_OBJECT_CATALOG.md`. No object may be utilized in a technical specification if it is not present in the Canonical Object Catalog, regardless of its presence in the Project Domain Model.

### 3.2 Precedence of Discrepancies
In the event of a discrepancy between the two artifacts, the following rules apply:

1. **Domain Model $ightarrow$ Catalog**: If a concept exists in the `PROJECT_DOMAIN_MODEL.md` but is absent from the `CANONICAL_OBJECT_CATALOG.md`, that concept is classified as a **Conceptual Target**. It is acknowledged as part of the system's logic but is not yet authorized for operational use.
2. **Catalog $ightarrow$ Domain Model**: If an object exists in the `CANONICAL_OBJECT_CATALOG.md` but is not supported by the `PROJECT_DOMAIN_MODEL.md` or a ratified project-control decision, it is considered **unauthorized** and must be removed from the catalog.

---

## 4. SUMMARY OF BOUNDARIES

| Feature | Project Domain Model | Canonical Object Catalog |
|---|---|---|
| **Perspective** | Theoretical / Logical | Operational / Authorized |
| **Temporal Scope** | Full Lifecycle (Current $ightarrow$ Future) | Current Phase Only |
| **Future Concepts** | Allowed | Prohibited |
| **Design Authority** | Conceptual Guide | Implementation Gate |
