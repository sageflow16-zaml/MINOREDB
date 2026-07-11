# A1-002 - Semantic consistency audit

| Provenance field | Value |
|---|---|
| Artifact ID | A1-002 |
| Authority / Decision ID | A1 |
| Artifact Type | Semantic consistency audit |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 14069 |
| End Line | 14158 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

SEMANTIC CONSISTENCY AUDIT — DECISION A1
Upstream Authority:

PROJECT MINORE — FOUNDING DEFINITION v0.1
DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE
Decision A1 — Source Intake Criteria (under audit)
1. Point 1 Finding — Research Input vs. Research Source
Exact tension:
A1 admits four materially different kinds of input under a single category label "research source":

Authored external material (claim-bearing, attributable to an external agent)
Researcher recollections (produced by the researcher; no external author)
AI-generated explanations (produced by a generative system; no author in the traditional sense)
Raw market data (empirical substrate; bears no claims, only values)
The Founding Definition uses "research input" as a broader, undifferentiated term and explicitly defers "entity names" to later layers. It does not require these to be unified under one category — it only requires that each is handled with honest provenance and epistemic separation.

Necessity test:
Does A1 need to resolve whether all four are "sources," or only that each may enter under an explicitly identified epistemic/provenance condition?

A researcher recollection cannot bear external source claims by definition — calling it a "source" while simultaneously requiring that it not be attributed as an external source is internally contradictory. The methodological protection already required is "mark as researcher-produced"; the word "source" adds nothing and risks confusion.
AI-generated material has no author, no stable identity, and no claims traceable to an external agent — calling it a "source" conflates it with authored material in a way that undermines the very epistemic distinctions A1 is designed to preserve.
Raw market data bears no claims — it is the empirical substrate against which claims are tested. Treating it as a "source" in the same sense as claim-bearing material collapses the distinction between "source claims" and "empirical evidence" that the Core Principle explicitly requires to remain separate.
Verdict:
A1 has prematurely collapsed distinct kinds of research input into the single label "research source." The minimum methodology rule required is only: relevant material may enter the research process under an explicitly identified epistemic and provenance condition appropriate to its kind. The taxonomy of input kinds is a downstream concern (Requirements or Architecture), but the methodology must not silently assert all inputs are semantically equivalent by calling them all "sources."

Classification: CORRECTION REQUIRED — Remove the conflation. A1's admissibility rule should govern research inputs broadly; the label "source" should be reserved for claim-bearing external authored material, with other input kinds explicitly noted as distinct without being named or enumerated as a formal taxonomy.

2. Point 2 Finding — Registration Before Extraction
Exact tension:
Rule 7 states: "No claims may be extracted from material that has not first been admitted and had its provenance recorded."

This reads as a strict temporal sequencing rule (registration must be a completed prior step before extraction begins). The question is whether the founding provenance promises require this as a separate prior step, or only require that no extracted claim may exist without provenance.

Necessity test:
The founding promise is: "Preserving provenance of extracted source material" (Capability 2). This requires that provenance accompanies extracted claims — it does not specify that provenance recording must be a temporally distinct preceding act.

The real risk the rule addresses is: an extracted claim existing without any provenance. That risk is fully addressed by requiring that provenance and extraction be inseparable — i.e., no claim may be recorded without simultaneously recording its provenance — without mandating a strict two-step sequential procedure.

The strict sequencing version (register fully, then extract) is a workflow/implementation preference, not a semantic necessity. It also fails edge cases: a researcher may identify a claim and its provenance simultaneously in a single act. Prohibiting this would be an unnecessary procedural constraint with no founding-text basis.

Verdict:
The minimum semantic rule is: No extracted claim may exist without an associated provenance record. The requirement that registration be a fully completed prior step is a procedural over-commitment not required by the founding promises.

Classification: CORRECTION REQUIRED — Restate Rule 7 as inseparability (provenance and extraction must be linked), not strict prior sequencing.

3. Point 3 Finding — Provenance Confidence Classification
Exact tension:
A1 requires provenance confidence to be stated as one of: "verified / estimated / unknown."

Two sub-questions:

Is some representation of provenance uncertainty required?
Is this exact three-state classification required at A1?
Additionally: is "estimated" semantically safe given Rule 4's prohibition on inference without warrant?

Necessity test — sub-question 1:
Yes — representing provenance uncertainty is required. Rule 4 ("provenance gaps must never be silently filled") and Rule 3 ("uncertain provenance must be explicitly recorded") together require that the methodology distinguish between what is known and what is not. Some representation of confidence/uncertainty is semantically necessary.

Necessity test — sub-question 2:
The exact three-state schema ("verified / estimated / unknown") is not required at A1. A1 must establish that uncertainty must be represented — not what states that representation takes. The specific taxonomy is classification detail appropriately resolved within methodology content or Requirements, not as a prerequisite to proceeding.

"Estimated" safety test:
Rule 4 prohibits inferring provenance "without warrant." "Estimated" implies an inference has been made — which is permissible if warrant exists (e.g., inferring a recording date from contextual clues) but potentially misleading if "estimated" is used where the inference has no basis. The term does not cleanly distinguish warranted inference from guesswork. It is not semantically safe as stated.

Verdict:
The requirement to represent provenance uncertainty is correct and necessary. The exact three-state classification is premature and should not be fixed at A1. "Estimated" is not semantically safe as a defined provenance state given the prohibition on inference without warrant.

Classification: CORRECTION REQUIRED — Retain the requirement that provenance uncertainty must be explicitly represented. Remove the specific three-state taxonomy from A1. Note that the distinction between "known," "inferred with basis," and "unknown" must be resolved within methodology content but is not a prerequisite to proceeding to A2.

4. Minimum Corrections Required
Point	Correction
Point 1	Remove the uniform "research source" label from all input types. State that A1's admissibility rule governs research inputs broadly; "source" as a label applies to claim-bearing external authored material. Other input kinds are distinct and must not be implicitly equated. Their formal taxonomy is deferred.
Point 2	Replace Rule 7's strict prior-sequencing requirement with an inseparability requirement: no extracted claim may exist without an associated provenance record. The temporal ordering of registration and extraction is not fixed by the methodology.
Point 3	Remove the three-state provenance-confidence taxonomy ("verified / estimated / unknown") from A1's binding rules. Retain only the semantic requirement: provenance uncertainty must be explicitly represented, not silently omitted or silently assumed certain. The specific taxonomy is deferred to methodology content.
5. Ratification Verdict
DO NOT RATIFY A1 AS-IS.

Three corrections are required. All are minimal and do not alter A1's core decisions:

Admissibility standard (relevance with preserved uncertainty) — unchanged
Provenance standard (record what is known; declare what is unknown) — unchanged
Core epistemic separations — unchanged
The corrections remove: one premature category collapse, one over-strict sequencing commitment, and one premature taxonomy.

A1 is ready for ratification after minimum corrections are applied. No further analysis required.




Perform a narrow semantic consistency audit of Decision A1 only.
