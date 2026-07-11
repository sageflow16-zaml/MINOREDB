# A1-001 - Decision construction/proposal block

| Provenance field | Value |
|---|---|
| Artifact ID | A1-001 |
| Authority / Decision ID | A1 |
| Artifact Type | Decision construction/proposal block |
| Source File | 00_RAW_CHAT_HISTORY/old chat histoy .txt |
| Start Line | 14254 |
| End Line | 14363 |
| Origin / Speaker | Mixed export block; preserve source markers where supplied. |
| Historical Order | Chronological order uses descending source-line numbers in this reverse export. |
| Recovery Quality | A - VERBATIM RECOVERED |
| Completeness | Complete for exact source range. |
| Duplicate Occurrences | Exact recurrence and contextual mentions are reconciled in the candidate-occurrence audit. |
| Notes | Historical text is unedited; no status beyond direct wording is inferred. |

## Historical Text - verbatim source range

DECISION A1 — SOURCE INTAKE CRITERIA
Upstream Authority:

PROJECT MINORE — FOUNDING DEFINITION v0.1
DECISION D1 — CONCEPT UNDERSTANDING: RESEARCHER INTERPRETATION LIFECYCLE
1. Exact Semantic Distinctions
Concept	Meaning
Source admissibility	Whether material may enter the research system as input
Source authority	The credibility or expertise attributed to the source's origin
Source truth	Whether the source's claims are factually correct
Empirical validity	Whether claims are supported by market evidence
Provenance	What is known (or explicitly unknown) about a source's origin, identity, and conditions of production
Source registration	The act of admitting and recording a source before extraction begins
Claim extraction	The subsequent act of identifying and recording specific claims from an admitted source
These are not equivalent. Admitting a source makes no assertion about its truth, authority, or empirical validity.

2. Minimum Options
Option A — Reliability Filter
Only material judged sufficiently reliable or authoritative may enter.

Problem: Requires pre-judging source truth before research begins. Directly contradicts "ICT material is research input. Market evidence determines empirical support" — which explicitly defers truth judgment to empirical work, not intake. Eliminates the possibility of investigating why unreliable sources are unreliable.

Option B — Relevance with Preserved Uncertainty
Any material relevant to the research domain may enter, provided its origin, identity, and epistemic status are known or explicitly marked as uncertain or unknown.

Test against founding text: "ICT material is research input. Market evidence determines empirical support" — supports B exactly. Admissibility and truth-determination are explicitly separated.

Option C — A Separate Founding Requirement
Founding Definition does not require anything beyond B. No additional rule is needed.

Verdict: Option B is the minimum rule required by the founding text. Option A contradicts it. Option C is vacuous.

3. Adversarial Source Tests
Source	May Enter?	Epistemic/Provenance Condition	May Be Treated as Empirical Truth?
1. Official primary ICT video	Yes	Origin is identifiable; timestamp and content location should be recorded; authenticity is reasonably verifiable	No — source authority does not confer empirical validity
2. Unofficial third-party transcription	Yes	Must be admitted with explicit notation that it is a secondary representation; the original source is not directly attested; risk of transcription error must be recorded	No — and claims derived from it carry additional epistemic uncertainty relative to primary material
3. Researcher note summarizing remembered material without recoverable original	Yes — with restriction	May enter only if explicitly marked as researcher-recalled summary, origin unverifiable, original source unknown or lost. Must not be attributed as external source claims	No — and it must not be treated as an external source claim; it is a researcher-produced record of uncertain provenance
4. External academic study	Yes	Authorship, publication venue, date, and version should be recorded where available; if unavailable, must be explicitly marked unknown	No — empirical quality depends on the study's own methodology, which must itself be assessed, not assumed from admission
5. Raw market data	Yes	Data source, instrument, timeframe, and data provider must be recorded; gaps or reliability issues must be noted	Conditionally — raw market data is the primary empirical substrate, but its quality, completeness, and provenance still govern how much weight derived results carry
6. AI-generated explanation	Yes — with mandatory epistemic flag	Must be admitted as AI-generated; the generating system and prompt context should be noted where recoverable; no author in the traditional sense exists	No — and it carries a specific risk: AI outputs may silently blend source claims with fabricated elaboration; this must be explicitly recorded as a source-type caveat
Cross-cutting finding: None of the above are excluded from entry. All require explicit, honest representation of what is and is not known about their origin and nature. The methodology's admission standard is epistemic transparency, not reliability pre-judgment.

4. Recommended Decision
Option B — Relevance with Preserved Uncertainty.

Any material relevant to the research domain may be admitted as a research source, provided:

its origin, identity, and nature are recorded to the extent knowable;
gaps in provenance are explicitly marked as unknown rather than silently omitted;
its admission carries no implication of truth, authority, or empirical validity.
This is the minimum rule consistent with the founding text.

5. Binding Methodology Rules
Admissibility does not imply truth. A source may be admitted for investigation without any judgment about whether its claims are correct.

Admissibility does not imply authority. A source's origin, reputation, or claimed expertise does not substitute for empirical validation.

Uncertain provenance does not disqualify a source. Material with incomplete or unverifiable provenance may be admitted, provided the uncertainty is explicitly recorded.

Provenance gaps must never be silently filled. If origin, authorship, or date is unknown, it must be marked as unknown — not omitted, estimated without basis, or inferred without warrant.

Researcher-produced material is not an external source. Researcher notes, summaries, and recollections are a distinct category. If admitted, they must be explicitly identified as researcher-produced and must not be attributed as external source claims.

AI-generated material is a distinct source type. Its generative nature and associated epistemic risks (blending, fabrication, absence of author) must be explicitly recorded at intake.

Source registration precedes extraction. No claims may be extracted from material that has not first been admitted and had its provenance recorded.

Admission is not endorsement. The research system must be able to contain material it will later determine to be wrong, misleading, or low-quality.

6. Minimum Provenance Requirements — Semantic, Not Schema
Before extraction may begin, the following must be known or explicitly declared unknown:

Provenance Dimension	Minimum Requirement
Source identity	What is this source? (Name, title, series, or description sufficient to identify it)
Origin type	What kind of source is it? (Primary authored, third-party secondary, researcher-recalled, AI-generated, market data, academic, other)
Attribution	Who or what produced it, to the extent knowable? If unknown, explicitly marked.
Temporal reference	When was it produced or accessed, to the extent knowable? If unknown, explicitly marked.
Location or access path	Where was it obtained or accessed? If unrecoverable, explicitly marked.
Provenance confidence	Is the above information verified, estimated, or unknown? This must be stated, not assumed.
No minimum provenance dimension may be silently omitted. An unknown value must be recorded as unknown.

These are semantic requirements — what the methodology demands be known. How they are stored is an architecture decision.

7. What A1 Unlocks
A2 — Claim Extraction Procedure may now be defined, because the methodology knows what constitutes an admitted source and what provenance accompanies it.
Extraction provenance attribution is possible (claims can reference their source's recorded identity and provenance confidence).
The distinction between external source claims and researcher-produced material is now formally established, enabling D1's epistemic separation rules to be applied.
8. Remaining Questions — Classified Only
Question	Classification
How sources are stored and indexed	DEFER TO ARCHITECTURE
Metadata schema and field definitions	DEFER TO ARCHITECTURE
Source deduplication (same content, multiple formats)	DEFER TO REQUIREMENTS
Source versioning (updated content at same location)	DEFER TO REQUIREMENTS
Whether AI assists in source intake	DEFER TO REQUIREMENTS
Procedure for re-assessing provenance confidence after new information	Methodology content (not blocking A2)
9. Final Verdict
DECISION A1 RESOLVED.

Admissibility standard: Relevance with explicitly preserved uncertainty.

Provenance standard: Record what is known; explicitly declare what is unknown; never silently omit.

Core separation established: Admissibility ≠ truth, authority, or empirical validity.

No contradiction with Founding Definition v0.1 or Decision D1 detected.

A2 — Claim Extraction Procedure is now unblocked.

10. Stop Statement
Decision A1 is resolved.
