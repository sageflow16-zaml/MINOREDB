# PROJECT-CONTROL DECISION M4 — GOVERNANCE AND SEQUENCING AUTHORITY

**Status:** PROPOSED  
**Ratification Status:** NOT RATIFIED  
**Upstream Authority:**  
1. PROJECT MINORE — FOUNDING DEFINITION v0.1  
2. DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE  
3. DECISION A1 — RESEARCH INPUT ADMISSIBILITY AND PROVENANCE  
4. DECISION A2 — CLAIM EXTRACTION PROCEDURE  
5. A2-C1 and A2-C2 (BINDING CLARIFICATIONS)  
6. DECISION A3 — CLAIM CLASSIFICATION  
7. A3-C1 (BINDING CLARIFICATION)  
8. DECISION A4 — CONCEPT ASSOCIATION  
9. DECISION A5 — CONTRADICTION HANDLING PROCEDURE  
10. DECISION A6 — RESEARCHER INTERPRETATION CONSTRUCTION  
11. DECISION A7 — INTERPRETATION EVOLUTION TRIGGERS  
12. A7-C1 and A7-C2 (BINDING CLARIFICATIONS)  
13. DECISION B1 — RESEARCH-QUESTION IDENTIFICATION  
14. DECISION M2 — HYPOTHESIS FORMATION AND OPERATIONALIZATION  
15. M2-C1 (BINDING CLARIFICATION)  
16. DECISION M3 — EXPERIMENTAL RIGOR AND EVIDENCE ASSESSMENT  

---

## 1. AUTHORITY GAP RESOLUTION

With the ratification of Decision M3, the core Research Methodology sequence (Decisions A1 through M3) is structurally complete. Although a robust engineering and infrastructure baseline has already been established, there is a remaining governance sequencing gap: no project-control decision has formally declared the Research Methodology phase complete, integrated it with the established engineering artifacts, or defined the sequencing authority required for subsequent transitions.

This Decision M4 resolves this specific gap by:
1. Recognizing and preserving the established engineering artifacts and approved implementation baseline.
2. Establishing the minimum governance authority and sequencing rules required to authorize future transitions and development from this baseline.

---

## 2. RECOGNITION AND PRESERVATION OF THE ENGINEERING BASELINE

This decision formally recognizes and preserves the established engineering artifacts and approved implementation baseline of Project Minore. This baseline comprises:
- **Docker Configuration:** The existing `docker-compose.yml` and container configurations.
- **PostgreSQL Schema and SQL Migrations:** The approved PostgreSQL database schema and the implemented SQL migration files.
- **Canonical Entities:** The defined canonical entities and database table structures mapped to the system's core domains.
- **Implementation Artifacts:** All source code, environment templates, and configuration files constituting the existing engineering workspace.

All existing infrastructure configurations, database schemas, SQL migrations, canonical entities, and implementation authority are fully preserved. This decision does not revoke, invalidate, or alter any established engineering artifacts or the approved implementation baseline.

---

## 3. GOVERNANCE AND SEQUENCING AUTHORITY FOR FUTURE TRANSITIONS

To ensure the orderly progression of the project from its current established baseline, the following sequencing and governance rules are enacted:

1. **Explicit Phase Authorization:** Any future transition to a new project phase, or the initiation of major development cycles beyond the current baseline, requires a formal, dedicated Project-Control Decision.
2. **Sequencing Rule for Future Modifications:** Future modifications to the core database schema, PostgreSQL table definitions, or the introduction of new architectural modules must be authorized by a ratified Project-Control Decision.
3. **The Governance Baseline Checkpoint:** The project's governance state is recognized as structurally complete up to the boundary of the current methodology and approved implementation baseline. It remains paused at this checkpoint until a subsequent project-control decision explicitly defines the parameters, goals, and boundaries of the next stage.

---

## 4. PRESERVATION OF PRIOR DECISIONS

All previously ratified decisions and their binding clarifications are fully preserved without modification or redefinition:
- **Methodology Decisions:** The definitions, procedures, rules, and adversarial tests set forth in Decisions A1–A7, B1, M2, and M3 (along with their binding clarifications A2-C1/C2, A3-C1, A7-C1/C2, and M2-C1) remain active and binding.
- **Epistemic Distinctions:** Future development must continue to strictly maintain the separation of distinct epistemic states as defined in the Founding Definition and core methodology decisions.

---

## 5. EXCLUSIONS AND SCOPE CONSTRAINTS

The scope of this decision is strictly limited to governance and sequencing authority. To prevent premature commitments or unauthorized alterations, the following areas are excluded:

- **No Redefinition of Methodology:** No changes, additions, or redefinitions are made to the 15 core methodology decisions or their associated procedures.
- **No Software Architecture Alterations:** No new software modules, services, API definitions, or UI flows are designed or authorized beyond the established Docker and PostgreSQL schema baseline.
- **No Implementation of Trading Logic:** No rules, models, thresholds, or admission criteria for trading strategies are defined or introduced.
- **No Authorization of Future Development:** No future, non-baseline features or code implementations are authorized by this document.

---

*This decision is proposed under the governance authority of Project Minore. It recognizes the existing engineering artifacts and approved implementation baseline and establishes the sequencing authority for future transitions, but does not authorize any subsequent work or modifications until formally ratified.*