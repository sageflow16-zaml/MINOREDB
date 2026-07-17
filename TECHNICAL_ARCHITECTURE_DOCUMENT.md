# Technical Architecture Document

## Project Minore — AI-Powered Institutional Trading Intelligence Platform

**Version:** 1.0  
**Status:** Ratified  
**Classification:** Permanent Architectural Reference

---

## Table of Contents

1. [System Vision](#1-system-vision)
2. [System Architecture](#2-system-architecture)
3. [Domain Model](#3-domain-model)
4. [Entity Relationship Diagram](#4-entity-relationship-diagram)
5. [Database Design](#5-database-design)
6. [AI Knowledge Pipeline](#6-ai-knowledge-pipeline)
7. [Trading Intelligence Pipeline](#7-trading-intelligence-pipeline)
8. [Continuous Learning Pipeline](#8-continuous-learning-pipeline)
9. [Recommendation Engine](#9-recommendation-engine)
10. [AI Boundaries](#10-ai-boundaries)
11. [Future Roadmap](#11-future-roadmap)
12. [Coding Standards](#12-coding-standards)
13. [Scalability](#13-scalability)

---

## 1. System Vision

### 1.1 Purpose

Project Minore is an AI-powered Institutional Trading Intelligence Platform. Its singular purpose is to learn **one trader's existing methodology** through continuous data collection, historical research, macroeconomic analysis, market structure analysis, execution history, and statistical learning.

### 1.2 Core Tenets

| Tenet | Description |
|---|---|
| **AI Learns, Does Not Create** | The AI never invents a strategy. It learns, models, and supports the trader's existing methodology. |
| **Trader Remains Sovereign** | The trader is always the final decision maker. The AI provides evidence-grounded recommendations, never commands. |
| **Evidence-Bound Reasoning** | Every AI output must be traceable to specific historical data, research evidence, or statistical fact. No black-box reasoning. |
| **Continuous Learning** | Every completed trade feeds back into statistics, pattern recognition, and knowledge, compounding the system's intelligence over time. |
| **Deterministic by Default** | All pipelines produce reproducible outputs for identical inputs. Probabilistic models are used only in clearly designated components. |

### 1.3 Long-Term Vision

The platform evolves through six phases, each building on the last:

1. **Knowledge Engine** — Ingest research documents, extract claims, build a knowledge graph of concepts, detect conflicts, generate research questions and hypotheses.
2. **Trading Engine** — Record every trade with full market context (structure, macro, sessions), building an execution history database.
3. **Statistics Engine** — Compute win rates, expectancy, risk metrics, average R:R, and performance distributions across all dimensions (pair, direction, bias, session, market phase).
4. **Pattern Discovery Engine** — Identify recurring trade setups by clustering market conditions, structure patterns, and execution parameters. Discover what conditions historically produce the highest expectancy.
5. **Decision Support Engine** — Combine pattern recognition, historical similarity, and statistical evidence to produce ranked, evidence-backed trade recommendations for the trader's review.
6. **Institutional Intelligence** — Dashboard of systemic metrics: trader discipline score, methodology drift detection, market regime adaptation, and long-term equity curve analytics.

The platform never replaces the trader. It makes the trader more informed, more consistent, and more objective.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    React SPA (TypeScript)                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │Dashboard │ │  Trades  │ │Research  │ │Knowledge │ │  Analytics   │ │ │
│  │  │  Page    │ │  Page    │ │  Page    │ │Graph Page│ │    Page      │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │         TanStack Query (React Query) Cache Layer                   │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │              Axios HTTP Client → API Service Layer                 │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ HTTP / REST (JSON)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API LAYER (FastAPI)                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Middleware: Logging │ Security │ Rate Limit │ CORS │ Error Handling    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  /api/v1/                                                               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │ Projects │ │ Sources  │ │ Claims   │ │ Concepts │ │Associations  │ │ │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤ │ │
│  │  │Conflicts │ │ Interp.  │ │ Questions│ │Hypoth.   │ │   Trades     │ │ │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤ │ │
│  │  │Market    │ │ Search   │ │Dashboard │ │ Triggers │ │              │ │ │
│  │  │Structure │ │          │ │          │ │          │ │              │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
┌─────────────────────────┐ ┌──────────────┐ ┌─────────────────────────┐
│    SERVICE LAYER         │ │   CRUD LAYER │ │    SERVICE LAYER        │
│  (Pipelines & Engines)   │ │              │ │  (Pipelines & Engines)  │
│ ┌─────────────────────┐  │ │ ┌──────────┐ │ │ ┌─────────────────────┐│
│ │ Claim Extractor     │  │ │ │ project  │ │ │ │ Conflict Engine     ││
│ │ Claim Pipeline      │  │ │ │ source   │ │ │ │ Hypothesis Engine   ││
│ │ Concept Extractor   │  │ │ │ claim    │ │ │ │ Knowledge Search    ││
│ │ Research Engine     │  │ │ │ concept  │ │ │ │ Graph Explorer      ││
│ │ Interpretation Eng. │◄─┼─┼─┤ ...      │ │ │ │ (Future) Pattern    ││
│ │ (Future) Statistics │  │ │ │          │ │ │ │ (Future) Similarity ││
│ │ (Future) Rec Engine │  │ │ │          │ │ │ │ (Future) Decision   ││
│ └─────────────────────┘  │ │ └──────────┘ │ │ └─────────────────────┘│
└─────────────────────────┘ └──────┬───────┘ └─────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DATA LAYER (PostgreSQL 16)                               │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Tables: project │ source │ claim │ concept │ association │ conflict   │ │
│  │  claim_conflict │ interpretation │ reconsideration_trigger             │ │
│  │  research_question │ hypothesis │ trade │ market_structure              │ │
│  │  (Future) macro_snapshot │ economic_event │ pattern │ statistic        │ │
│  │  (Future) recommendation │ decision_session                            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Indexes: project_id FK indexes │ created_at (sort) │ pair+timeframe   │ │
│  │  unique constraints │ composite indexes for pipeline queries           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Migrations: Alembic (auto-detect) + raw SQL (for complex changes)     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Descriptions

#### Frontend (React 18 + TypeScript + Vite)
- Single-page application with lazy-loaded route-based code splitting.
- State management via TanStack Query (server state) and React Context (auth, project selection).
- Tailwind CSS for styling, Recharts for analytics, Reactflow for knowledge graph visualization.
- Axios-based API service layer with Bearer token authentication.

#### Backend (FastAPI + Python 3.12)
- RESTful API under `/api/v1` prefix.
- Three-layer architecture: Routes (HTTP) → Services (Business Logic) → CRUD (Data Access).
- Pydantic v2 for request/response validation, SQLAlchemy 2.x for ORM.
- Uvicorn ASGI server with middleware stack: logging, security headers, rate limiting, CORS.

#### Database (PostgreSQL 16)
- All entities use UUID primary keys with `pgcrypto` extension.
- Every entity scoped to a project via `project_id` foreign key with CASCADE delete.
- JSONB columns for flexible metadata storage where schema is variable.
- Alembic for migration management.

#### Service Layer (Pipelines & Engines)
- **Claim Extractor** — Parses source text into individual claims.
- **Claim Pipeline** — Orchestrates claim extraction from sources with deduplication.
- **Concept Extractor** — Extracts conceptual terms from claims.
- **Conflict Engine** — Detects polarity conflicts between claims sharing concepts.
- **Interpretation Engine** — Generates deterministic interpretations from claim-concept associations.
- **Research Question Engine** — Generates research questions from conflicts.
- **Hypothesis Engine** — Generates testable hypotheses from research questions.
- **Graph Explorer** — Builds and serves knowledge graph data for visualization.
- **Knowledge Search** — Full-text search across all knowledge entities.

---

## 3. Domain Model

### 3.1 Project

| Aspect | Description |
|---|---|
| **Purpose** | Root organizational entity. Every piece of data belongs to exactly one project. Projects isolate trading methodologies, research contexts, and execution histories. |
| **Attributes** | `id` (UUID PK), `name`, `description`, `status`, `created_at`, `updated_at` |
| **Relationships** | Parent to all entities: Source, Claim, Concept, Association, Conflict, Interpretation, Trigger, ResearchQuestion, Hypothesis, Trade, MarketStructure |
| **Lifecycle** | Created → Active → (Archived) → Deleted. Deleting a project cascades to all child entities. |

### 3.2 Trade

| Aspect | Description |
|---|---|
| **Purpose** | Records a completed or open forex trade with full execution details, market context, and psychological state. The atomic unit of the trader's methodology. |
| **Attributes** | `id`, `project_id`, `market_structure_id`, `pair`, `direction` (BUY/SELL), `entry_price`, `stop_loss`, `take_profit`, `exit_price`, `position_size`, `risk_percent`, `rr` (risk-to-reward ratio), `pnl` (profit/loss), `result` (WIN/LOSS/BE), `status` (OPEN/CLOSED), `weekly_bias`, `daily_bias`, `h4_bias`, `liquidity_sweep`, `bos` (break of structure), `mss` (market structure shift), `order_block`, `fvg` (fair value gap), `asian_session`, `london_session`, `newyork_session`, `dxy`, `us10y`, `us02y`, `news_event`, `emotion`, `notes`, `before_image`, `after_image`, `created_at`, `updated_at` |
| **Relationships** | Belongs to Project. Optionally linked to a MarketStructure record. Future: linked to MacroSnapshot, EconomicEvent, Pattern, DecisionSession. |
| **Lifecycle** | Draft → Open → Closed → (Archived). Open trades are active positions. Closed trades update statistics, patterns, and learning pipelines. |

### 3.3 MarketStructure

| Aspect | Description |
|---|---|
| **Purpose** | Captures a complete snapshot of market structure analysis for a given pair, timeframe, and date. Models ICT/SMC concepts including biases, liquidity, order flow, and kill zones. |
| **Attributes** | `id`, `project_id`, `trade_id`, `date`, `pair`, `timeframe`, `weekly_bias`, `daily_bias`, `h4_bias`, `market_phase` (accumulation/markup/distribution/markdown), `trend` (uptrend/downtrend/ranging), `premium_discount`, `external_liquidity`, `internal_liquidity`, `equal_highs`, `equal_lows`, `buy_side_liquidity`, `sell_side_liquidity`, `bos`, `mss`, `choch` (change of character), `order_block`, `breaker`, `mitigation`, `fvg`, `ifvg` (inverted FVG), `asian_high`, `asian_low`, `london_open`, `newyork_open`, `london_killzone`, `newyork_killzone` |
| **Relationships** | Belongs to Project. Linked to zero or more Trades. Future: linked to MacroSnapshot for composite market context. |
| **Lifecycle** | Created → (Referenced by trades) → Deleted. Records are typically created per trading session per pair. |

### 3.4 MacroSnapshot

| Aspect | Description |
|---|---|
| **Purpose** | (Future) Captures the macroeconomic environment at a point in time: interest rates, employment data, central bank policy stances, geopolitical risk level, and overall market regime. |
| **Attributes** | `id`, `project_id`, `date`, `dxy_level`, `us10y_yield`, `us02y_yield`, `yield_curve_slope`, `cpi_last`, `employment_last`, `central_bank_bias` (Fed/ECB/BOE/BOJ), `geopolitical_risk_level`, `risk_on_off`, `vix_level`, `notes` |
| **Relationships** | Belongs to Project. Linked to Trades and MarketStructure records active during its window. |
| **Lifecycle** | Created periodically (daily/weekly). Referenced by trade analysis and pattern discovery. Read-only after creation. |

### 3.5 EconomicEvent

| Aspect | Description |
|---|---|
| **Purpose** | (Future) Records an economic event (news release, central bank decision, geopolitical event) that may impact trading decisions. Events are categorized by expected impact and actual outcome. |
| **Attributes** | `id`, `project_id`, `date_time`, `event_name`, `country`, `category` (interest_rate/cpi/employment/gdp/central_bank/geopolitical), `forecast`, `previous`, `actual`, `deviation`, `impact_level` (high/medium/low), `market_reaction`, `notes` |
| **Relationships** | Belongs to Project. Linked to Trades that were influenced by or reacted to the event. |
| **Lifecycle** | Created before or after the event. Updated with actual data after release. Archived after relevance window expires. |

### 3.6 Source

| Aspect | Description |
|---|---|
| **Purpose** | The foundational input to the knowledge engine. A source is any piece of research material (article, analysis, book excerpt, video transcript, audio memo) that contains claims about the market. |
| **Attributes** | `id`, `project_id`, `admissibility_status`, `origin_type`, `attribution`, `temporal_reference`, `location`, `provenance_confidence`, `source_metadata` (JSONB), `provenance_metadata` (JSONB), `raw_text`, `normalized_text`, `created_at`, `updated_at` |
| **Relationships** | Belongs to Project. Parent to Claims. |
| **Lifecycle** | Ingested → Normalized → Claims Extracted → (Archived). Sources are immutable after ingestion. |

### 3.7 Claim

| Aspect | Description |
|---|---|
| **Purpose** | An atomic factual statement extracted from a source. Claims are the smallest unit of knowledge in the system. They are extracted deterministically and preserved verbatim. |
| **Attributes** | `id`, `project_id`, `source_id`, `verbatim_text`, `source_location`, `semantic_classification`, `paraphrase_representation`, `contextual_boundary`, `created_at`, `updated_at` |
| **Relationships**** | Belongs to Source. Linked to Concepts via Association. Linked to Conflicts via ClaimConflict join table. Parent to Interpretations (indirectly via Concepts). |
| **Lifecycle** | Extracted → Associated with Concepts → (Conflict Detection) → Archived. Claims are immutable after creation. |

### 3.8 Concept

| Aspect | Description |
|---|---|
| **Purpose** | A conceptual term or idea extracted from claims. Concepts form the vocabulary of the trader's research domain. They are building blocks for interpretations and knowledge graph construction. |
| **Attributes** | `id`, `project_id`, `conceptual_term`, `definition`, `created_at`, `updated_at` |
| **Relationships** | Belongs to Project. Linked to Claims via Association. Linked to Interpretations. |
| **Lifecycle** | Extracted → (Refined) → Used in Interpretations. Concepts are accumulated and cross-referenced across sources. |

### 3.9 Association

| Aspect | Description |
|---|---|
| **Purpose** | Links a Claim to a Concept, establishing that the claim references or relates to the concept. Each association has a state (supporting/contradictory/neutral) and an ambiguity metric. |
| **Attributes** | `id`, `project_id`, `claim_id`, `concept_id`, `association_state`, `ambiguity_metric`, `created_at`, `updated_at` |
| **Relationships** | Links Claim and Concept. Both parent entities must exist. |
| **Lifecycle** | Created during concept extraction. Updated if association state changes. Deleted if either parent is removed. |

### 3.10 Conflict

| Aspect | Description |
|---|---|
| **Purpose** | Records a detected contradiction between two or more claims that share a concept. Conflicts trigger research questions and drive the knowledge refinement process. |
| **Attributes** | `id`, `project_id`, `conflict_classification`, `contextual_applicability_check`, `created_at`, `updated_at` |
| **Relationships** | Belongs to Project. Linked to Claims via ClaimConflict join table. Linked to ResearchQuestion. |
| **Lifecycle** | Detected → (Resolved by research) → Archived. Resolution may involve obtaining additional sources. |

### 3.11 ResearchQuestion

| Aspect | Description |
|---|---|
| **Purpose** | A question generated from a conflict that, when answered, resolves the contradiction. Research questions drive the research workflow and focus investigation efforts. |
| **Attributes** | `id`, `project_id`, `conflict_id`, `question_statement`, `inquiry_origin`, `domain_relevance`, `substantive_grounding`, `created_at`, `updated_at` |
| **Relationships** | Belongs to Conflict. Linked to Hypothesis. |
| **Lifecycle** | Generated from Conflict → (Investigated) → (Resolved by Hypothesis) → Closed. |

### 3.12 Hypothesis

| Aspect | Description |
|---|---|
| **Purpose** | A testable proposition that attempts to resolve a research question. Hypotheses specify variables, measurement criteria, and the expected relationship. |
| **Attributes** | `id`, `project_id`, `research_question_id`, `hypothesis_statement`, `variable_specification`, `measurement_specification`, `substantive_departure`, `created_at`, `updated_at` |
| **Relationships** | Belongs to ResearchQuestion. Future: linked to supporting/contradicting Evidence. |
| **Lifecycle** | Generated → (Tested) → Validated or Refuted. Validated hypotheses strengthen the knowledge base. |

### 3.13 Interpretation

| Aspect | Description |
|---|---|
| **Purpose** | A synthesized statement that combines a claim's verbatim text with its associated concepts into a coherent interpretation. Interpretations form the basis for knowledge graph nodes. |
| **Attributes** | `id`, `project_id`, `concept_id`, `interpretation_statement`, `reasoning_chain`, `interpretation_foundation`, `created_at`, `updated_at` |
| **Relationships** | Belongs to Project. Linked to Concept. May trigger ReconsiderationTriggers when contradicted by new evidence. |
| **Lifecycle** | Generated → (Re-evaluated on new evidence) → Updated or Archived. |

### 3.14 Pattern

| Aspect | Description |
|---|---|
| **Purpose** | (Future) A recurring set of market conditions that historically preceded a trade with known expectancy. Patterns are discovered by the Pattern Engine, not manually created. |
| **Attributes** | `id`, `project_id`, `name`, `description`, `conditions` (JSONB — the feature vector describing the pattern), `pair`, `timeframe`, `market_phase`, `trend`, `bias_alignment`, `sample_size`, `win_rate`, `avg_rr`, `expectancy`, `first_observed`, `last_observed`, `confidence_score`, `created_at`, `updated_at` |
| **Relationships** | Belongs to Project. Linked to Trades that match the pattern. Linked to Recommendations. |
| **Lifecycle** | Discovered → Validated (minimum sample) → Active → (Stale if not observed) → Archived. |

### 3.15 Statistic

| Aspect | Description |
|---|---|
| **Purpose** | (Future) A computed statistical metric over a well-defined slice of trade data. Statistics are the foundation of evidence-based recommendations. Every statistic stores its computation parameters, so it is fully reproducible. |
| **Attributes** | `id`, `project_id`, `name`, `category` (win_rate/expectancy/rr_distribution/risk_metrics/consistency), `dimension` (JSONB — the slice: pair/direction/bias/session/phase/month), `value` (Float), `sample_size`, `confidence_interval_lower`, `confidence_interval_upper`, `computed_at`, `computation_params` (JSONB — reproducible parameters), `created_at` |
| **Relationships** | Belongs to Project. Referenced by Recommendations as evidence. |
| **Lifecycle** | Computed on demand or scheduled. Cached and refreshed when new trade data is available. Immutable historical snapshots preserved. |

### 3.16 Recommendation

| Aspect | Description |
|---|---|
| **Purpose** | (Future) An evidence-backed suggestion produced by the Recommendation Engine for the trader's review. Every recommendation must cite specific historical evidence (trades, statistics, patterns) and explain its reasoning. |
| **Attributes** | `id`, `project_id`, `type` (setup_alert/risk_warning/methodology_drift/pattern_emerging), `pair`, `direction`, `confidence_level`, `reasoning_summary`, `evidence_chain` (JSONB — list of referenced entities with explanations), `supporting_stats` (JSONB), `supporting_patterns` (JSONB), `supporting_trades` (JSONB — similar historical trades), `status` (pending/reviewed/accepted/rejected), `trader_feedback`, `created_at`, `expires_at` |
| **Relationships** | Belongs to Project. References Statistics, Patterns, and Trades as evidence. Linked to DecisionSession. |
| **Lifecycle** | Generated → Presented to Trader → Reviewed → Accepted/Rejected → Archived. Every recommendation is permanent for auditability. |

### 3.17 DecisionSession

| Aspect | Description |
|---|---|
| **Purpose** | (Future) Captures the complete context of a trading decision: the recommendations presented, the trader's decision, the resulting trades, and the outcome. Decision sessions enable methodology drift detection and decision quality analysis. |
| **Attributes** | `id`, `project_id`, `session_start`, `session_end`, `recommendations_presented` (JSONB), `trader_decisions` (JSONB — which recommendations were accepted/rejected, and any unaided trades), `trades_opened` (JSONB), `trades_closed` (JSONB), `session_pnl`, `methodology_alignment_score`, `notes`, `created_at` |
| **Relationships** | Belongs to Project. Links Recommendations and Trades into a cohesive decision unit. |
| **Lifecycle** | Started at session open → Trades recorded → Session closed at end of session → Analyzed post-session. |

---

## 4. Entity Relationship Diagram

### 4.1 Core Knowledge Graph

```
Project 1 ──┬── * Source
            ├── * Claim ──┬── *── Association ── *── Concept
            │             │                        │
            │             │                        └── * Interpretation
            │             └── *── ClaimConflict    │
            │                        │             └── * ReconsiderationTrigger
            │                        └── * Conflict 1 ── * ResearchQuestion 1 ── * Hypothesis
            │
            ├── * Trade ── *── MarketStructure
            │
            ├── * MacroSnapshot
            ├── * EconomicEvent
            ├── * Pattern
            ├── * Statistic
            ├── * Recommendation ── * DecisionSession
            └── * DecisionSession ── * Trade
```

### 4.2 Cardinality Table

| Entity A | Relationship | Entity B | Cardinality | Explanation |
|---|---|---|---|---|
| Project | has | Source | 1:N | A project has many sources; each source belongs to one project |
| Source | contains | Claim | 1:N | A source yields many claims; each claim comes from one source |
| Claim | references | Concept | M:N | A claim can reference many concepts; a concept appears in many claims (mediated via Association) |
| Claim | participates in | Conflict | M:N | A claim can be part of many conflicts; a conflict involves at least two claims (mediated via ClaimConflict) |
| Conflict | generates | ResearchQuestion | 1:1 | Each conflict generates exactly one research question |
| ResearchQuestion | motivates | Hypothesis | 1:1 | Each research question generates exactly one hypothesis |
| Concept | interpreted by | Interpretation | 1:N | A concept can have many interpretations across different claims |
| Interpretation | triggers | ReconsiderationTrigger | 0:N | An interpretation may be flagged for reconsideration zero or more times |
| Project | contains | Trade | 1:N | A project has many trades; each trade belongs to one project |
| MarketStructure | analyzed in | Trade | 1:N | A market structure analysis can be referenced by many trades; a trade optionally references one MS |
| Trade | influenced by | MacroSnapshot | M:N (future) | A trade occurs within a macro context; a macro context covers many trades |
| Trade | matches | Pattern | M:N (future) | A trade can match multiple patterns; a pattern can match multiple trades |
| Pattern | supports | Recommendation | 1:N (future) | A pattern can support many recommendations |
| Statistic | supports | Recommendation | M:N (future) | A recommendation cites multiple statistics; a statistic supports many recommendations |
| Recommendation | part of | DecisionSession | M:N (future) | A session presents many recommendations; a recommendation may appear in many sessions |

### 4.3 Key Foreign Key Constraints

| FK Column | Source Table | Target Table | Delete Rule |
|---|---|---|---|
| `project_id` | All entities | `project.id` | CASCADE |
| `source_id` | `claim` | `source.id` | SET NULL |
| `claim_id` | `association` | `claim.id` | CASCADE |
| `concept_id` | `association` | `concept.id` | CASCADE |
| `concept_id` | `interpretation` | `concept.id` | SET NULL |
| `claim_id` | `claim_conflict` | `claim.id` | CASCADE |
| `conflict_id` | `claim_conflict` | `conflict.id` | CASCADE |
| `conflict_id` | `research_question` | `conflict.id` | SET NULL |
| `research_question_id` | `hypothesis` | `research_question.id` | SET NULL |
| `market_structure_id` | `trade` | `market_structure.id` | SET NULL |
| `interpretation_id` | `reconsideration_trigger` | `interpretation.id` | SET NULL |

---

## 5. Database Design

### 5.1 Normalization

The schema follows **Third Normal Form (3NF)** with deliberate denormalization only where performance requires it.

| Principle | Application |
|---|---|
| **Atomic columns** | Every column stores a single value. No multi-valued attributes. |
| **No transitive dependencies** | Non-key attributes depend only on the primary key, not on other non-key attributes. |
| **UUID primary keys** | All entities use UUID v4 primary keys, generated application-side. This enables offline-capable creation and avoids sequential ID exposure. |
| **Project scoping** | Every entity includes `project_id` as a FK, making project-level queries efficient without joins. This is a deliberate denormalization for multi-tenancy performance. |
| **JSONB for variable schema** | `source_metadata` and `provenance_metadata` use JSONB because their structure varies by source type (article, transcript, memo). Future entities may also use JSONB for flexible attribute storage where appropriate. |

### 5.2 Index Strategy

| Index Type | Target | Rationale |
|---|---|---|
| **FK indexes** | Every `project_id` column | Every query scoped by project; without these indexes, CASCADE operations would cause table scans. |
| **FK indexes** | All foreign key columns (`source_id`, `claim_id`, `concept_id`, etc.) | Join performance for knowledge graph traversal. |
| **Composite index** | `(project_id, created_at DESC)` on all entities | Dashboard and recent-item queries. |
| **Composite index** | `(project_id, pair, timeframe)` on `market_structure` | Primary lookup pattern for market structure analysis. |
| **Composite index** | `(project_id, pair, created_at DESC)` on `trade` | Trade history browsing per pair. |
| **Composite index** | `(project_id, result)` on `trade` | Win/loss statistics aggregation. |
| **Composite index** | `(project_id, status)` on `trade` | Open vs closed trade queries. |
| **Composite index** | `(project_id, date)` on `market_structure` | Time-range queries for market structure snapshots. |
| **Future indexes** | `(project_id, market_phase, trend)` on `trade` | Pattern discovery queries grouping by market regime. |

### 5.3 Constraints

| Constraint Type | Implementation |
|---|---|
| **Primary Key** | UUID v4, PK on every table. |
| **Foreign Key** | Every relationship enforced by FK constraints with explicit ON DELETE rules. No orphan data. |
| **Unique Constraints** | Applied to natural business keys where they exist (e.g., project name within an organization context — enforced application-level for now). |
| **Check Constraints** | Future: Enum-like CHECK constraints on `direction` (BUY/SELL), `result` (WIN/LOSS/BE), `status` (OPEN/CLOSED), `market_phase` (ACCUMULATION/MARKUP/DISTRIBUTION/MARKDOWN), `trend` (UPTREND/DOWNTREND/RANGING). |
| **NOT NULL** | Applied to all core entity fields that are semantically required (e.g., `project_id`, `id`, `created_at`). |

### 5.4 Future Scalability Considerations

| Strategy | Description |
|---|---|
| **Table partitioning** | Trade and MarketStructure tables can be partitioned by `created_at` (monthly/quarterly ranges) when row counts exceed 10 million. |
| **Materialized views** | Dashboard statistics and common aggregation queries can be served from materialized views refreshed on a schedule or via triggers. |
| **Read replicas** | The knowledge graph and historical analysis queries can be directed to read replicas, with writes going to the primary. |
| **Connection pooling** | PgBouncer or built-in SQLAlchemy pooling with `pool_pre_ping=True`. Pool size scales with expected concurrent users. |
| **Archival strategy** | Projects older than a configurable threshold can be moved to a cold storage schema or separate archival database, with application-level routing. |
| **Full-text search** | PostgreSQL `tsvector` columns on `claim.verbatim_text`, `source.normalized_text`, and `concept.conceptual_term` for efficient knowledge search without external search services. |

---

## 6. AI Knowledge Pipeline

### 6.1 Pipeline Overview

```
SOURCE
  │
  ▼
NORMALIZATION
  │  Text normalization, deduplication, admissibility check
  ▼
CLAIM EXTRACTION
  │  Parse normalized text into atomic factual statements
  ▼
CONCEPT EXTRACTION
  │  Identify conceptual terms within each claim
  ▼
ASSOCIATION
  │  Link claims to concepts with state (supporting/contradictory/neutral)
  ▼
CONFLICT DETECTION
  │  Within a shared concept, detect polarity contradictions between claims
  │  Conflict = opposite-direction claims about the same concept
  ▼
RESEARCH QUESTIONS
  │  Each conflict spawns a research question
  ▼
HYPOTHESIS GENERATION
  │  Each question generates a testable hypothesis
  ▼
KNOWLEDGE GRAPH
  │  All entities + relationships form a traversable knowledge graph
  ▼
PATTERN DISCOVERY (Future)
  │  Identify recurring claim patterns, concept clusters, conflict resolutions
  ▼
DECISION SUPPORT (Future)
  │  Knowledge-derived evidence cited in trade recommendations
```

### 6.2 Pipeline Rules

| Rule | Description |
|---|---|
| **Deterministic Extraction** | Claim and concept extraction produce identical outputs for identical inputs. No LLM calls or probabilistic models in the extraction path. |
| **Verbatim Preservation** | Claim text is preserved verbatim from the source. Paraphrase representation is stored separately and marked as derived. |
| **Deduplication** | Identical claims from the same source are stored once. Claims with identical verbatim text from different sources are preserved as separate records (different provenance). |
| **Conflict Polarity Pairs** | The conflict engine uses curated polarity pairs (increase/decrease, bullish/bearish, buy/sell, etc.) rather than semantic understanding. This is deterministic and auditable. |
| **No Speculative Inference** | The pipeline never invents claims, concepts, or relationships not explicitly present in the source material. |

### 6.3 Current Implementation

The pipeline is fully implemented through the existing service layer:

- `claim_extractor.py` — Parses text into structured claim segments
- `claim_pipeline.py` — Orchestrates extraction with deduplication
- `concept_extractor.py` — Extracts conceptual terms from claim text
- `conflict_engine.py` — Detects polarity conflicts via pattern matching
- `interpretation_engine.py` — Generates deterministic interpretations
- `research_question_engine.py` — Generates research questions from conflicts
- `hypothesis_engine.py` — Generates testable hypotheses from research questions

---

## 7. Trading Intelligence Pipeline

### 7.1 Pipeline Overview

```
TRADE EXECUTION
  │  Record every trade with full metadata
  ▼
MARKET STRUCTURE ANALYSIS
  │  Capture biases, phases, trends, liquidity, order flow
  ▼
MACRO CONTEXT (Future)
  │  Attach macroeconomic snapshot (rates, yields, risk sentiment)
  ▼
TRADING SESSIONS (Future)
  │  Group trades into coherent decision sessions
  ▼
STATISTICS ENGINE (Future)
  │  Compute performance metrics across all dimensions
  ▼
PATTERN ENGINE (Future)
  │  Discover recurring setups with statistical significance
  ▼
SIMILARITY ENGINE (Future)
  │  Find historically analogous market conditions
  ▼
DECISION SUPPORT (Future)
  │  Produce evidence-backed recommendations
```

### 7.2 Entity Flow

```
Trade ───────────► MarketStructure
  │                     │
  │                     ▼
  │               MacroSnapshot (Future)
  │
  ├──► DecisionSession (Future)
  │       │
  │       ├──► Recommendation
  │       └──► Statistics
  │
  └──► Pattern (Future)
          │
          └──► Statistic (Future)
```

### 7.3 Current Implementation

Currently implemented:
- **Trade model** — Full execution record with market context fields (biases, session, macro indicators, structure concepts)
- **MarketStructure model** — Complete ICT/SMC analysis snapshot
- **Trade ↔ MarketStructure relationship** — trades can optionally reference a market structure record

Future components (phased):
- **MacroSnapshot** — Macroeconomic environment capture
- **DecisionSession** — Session-level grouping of decisions and outcomes
- **Statistics Engine** — Multi-dimensional performance computation
- **Pattern Engine** — Unsupervised pattern discovery
- **Similarity Engine** — Historical nearest-neighbor search
- **Recommendation Engine** — Evidence-grounded suggestions

---

## 8. Continuous Learning Pipeline

### 8.1 Learning Loop

Every time a trade is closed, the following update cascade is triggered:

```
TRADE CLOSED
  │
  ├──► 1. STATISTICS UPDATE
  │       Recompute win rate, expectancy, avg RR, risk metrics
  │       for every dimension: pair, direction, bias, session,
  │       market phase, trend, emotion, news context
  │       Store as Statistic records with full computation params
  │       for auditability
  │
  ├──► 2. PATTERN UPDATE (Future)
  │       Does this trade match any existing patterns?
  │       Yes → Update pattern win/loss count, recalculate expectancy
  │       No → Could this trade form the seed of a new pattern?
  │             Flag for pattern discovery engine
  │
  ├──► 3. EXPECTANCY RECALCULATION (Future)
  │       Running expectancy = (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
  │       Per dimension, per combination of dimensions
  │       Detect statistically significant changes vs historical baseline
  │
  ├──► 4. RISK METRICS UPDATE (Future)
  │       Max drawdown, recovery factor, profit factor, Sharpe ratio
  │       Rolling windows: 10 trades, 50 trades, all-time
  │       Position sizing recommendations based on current equity curve
  │
  ├──► 5. HISTORICAL SIMILARITY (Future)
  │       Index this trade's feature vector in the similarity engine
  │       Nearest neighbors: "Show me the 20 most similar trades"
  │       Cluster analysis: "Which market regimes produce similar outcomes?"
  │
  └──► 6. KNOWLEDGE UPDATE (Future)
        Did this trade confirm or contradict any existing knowledge?
        Flag any interpretations or hypotheses affected by the outcome
        Surface to trader: "A trade under conditions X just resulted in Y,
        which aligns with / contradicts the knowledge that..."
```

### 8.2 Learning Principles

| Principle | Description |
|---|---|
| **Every trade counts** | No trade is too small or too insignificant to update the learning system. All data compounds. |
| **Immutable history** | Historical statistics are never overwritten. New computations create new Statistic records with timestamps. The full history of the system's learning is preserved. |
| **Minimum sample thresholds** | Patterns and statistics require minimum sample sizes before they are surfaced. The system does not draw conclusions from insufficient data. |
| **Concept drift detection** | The system monitors whether recent performance deviates significantly from historical baselines, flagging potential methodology drift or market regime change. |
| **Trader feedback loop** | The trader can accept, reject, or modify recommendations. These decisions are recorded and factored into future recommendations. |

---

## 9. Recommendation Engine

### 9.1 Design Philosophy

The Recommendation Engine is designed with a single non-negotiable rule: **no black-box reasoning**. Every recommendation must be fully transparent, with every claim of fact backed by a reference to specific historical evidence.

### 9.2 Recommendation Types

| Type | Description | Trigger |
|---|---|---|
| **Setup Alert** | Current market conditions match a historically profitable pattern | Real-time, on market condition detection |
| **Risk Warning** | Current conditions historically produce low expectancy or high drawdown | Pre-trade, on session open |
| **Methodology Drift** | Recent trading behavior deviates from historical methodology patterns | Post-session analysis |
| **Pattern Emerging** | A new pattern is approaching statistical significance | On pattern discovery |
| **Knowledge Relevance** | Existing knowledge (interpretations, hypotheses) is relevant to current market conditions | On market structure analysis |

### 9.3 Recommendation Structure

Every recommendation contains:

```
RECOMMENDATION
├── Header
│   ├── Type: Setup Alert
│   ├── Pair: EURUSD
│   ├── Direction: BUY
│   ├── Confidence: 72%  (based on sample size and consistency)
│   └── Generated: 2026-07-17T14:30:00Z
│
├── Current Conditions
│   ├── Market Phase: Markup
│   ├── Trend: Uptrend
│   ├── Bias Alignment: Weekly/Daily/H4 all bullish
│   └── Session: London
│
├── Evidence Chain  ← Every claim here references specific records
│   ├── Statistic: "When bias alignment = ALL_BULLISH and phase = MARKUP,
│   │              win rate is 68.3% over 187 trades"
│   │   └── Reference: Statistic.id = "abc-123" (computed 2026-07-16)
│   │
│   ├── Pattern: "London session after Asian range breakout in markup phase"
│   │   └── Win Rate: 72.1% (43 trades)
│   │   └── Avg RR: 1:2.8
│   │   └── Reference: Pattern.id = "def-456"
│   │
│   ├── Similar Trades: Top 5 most similar historical trades
│   │   ├── Trade #1421: WIN, RR 1:3.1 (2026-06-28)
│   │   ├── Trade #1387: LOSS, RR 1:1.2 (2026-06-14)
│   │   ├── Trade #1352: WIN, RR 1:2.5 (2026-06-01)
│   │   └── ...
│   │
│   └── Knowledge: "EURUSD bullish bias aligns with Fed dovish posture"
│       └── Source: FOMC Minutes June 2026
│       └── Reference: Source.id = "ghi-789"
│
├── Trader Review
│   ├── Status: Pending
│   ├── Trader Decision: [Accept / Reject / Modify]
│   ├── Trader Notes: (free text)
│   └── Reviewed At: (timestamp)
│
└── Outcome (recorded after session closes)
    ├── Trade(s) Opened: [Trade IDs]
    ├── Result: WIN / LOSS / BE
    └── Post-hoc Analysis: (statistical update confirming or challenging the recommendation)
```

### 9.4 Confidence Scoring

Confidence is computed from:

| Factor | Weight | Description |
|---|---|---|
| Sample Size | 40% | More trades = higher confidence. Logarithmic scale: 30+ trades = full weight |
| Consistency | 25% | Low variance in outcomes across similar conditions |
| Recency | 20% | More weight to recent trades (last 6 months) |
| Specificity | 15% | Narrower condition match = higher specificity = higher confidence |

### 9.5 Non-Recommendation Rules

The Recommendation Engine explicitly **will not**:

- Recommend a trade direction without citing historical evidence for that exact condition set
- Produce recommendations from fewer than 10 historical trades in the matched condition
- Suggest position sizing beyond the trader's established risk parameters
- Claim certainty where statistical confidence is low (< 60%)
- Hide contradictory evidence (if 5 similar trades won and 4 lost, both are shown)

---

## 10. AI Boundaries

### 10.1 Absolute Prohibitions

The AI **must never**:

| # | Prohibition | Rationale |
|---|---|---|
| 1 | **Invent a strategy** | The platform learns the trader's methodology. It never creates, suggests, or implies new strategies not already present in the trader's execution history. |
| 2 | **Override the trader** | The trader is always the final decision maker. The AI may recommend, suggest, and inform — but never execute, override, or automate trading decisions. |
| 3 | **Fabricate statistics** | Every statistic must be computed from real trade data with explicit computation parameters. No simulated, extrapolated, or inferred statistics. |
| 4 | **Hide contradictory evidence** | When presenting evidence for a recommendation, the AI must also present evidence against it if it exists. Cherry-picking is prohibited. |
| 5 | **Claim false precision** | Statistics must be presented with sample sizes and confidence intervals. "72.3% win rate" without "(43 trades, CI: 58-84%)" is prohibited. |
| 6 | **Make predictions** | The AI may state "in similar historical conditions, the outcome was X in Y% of cases." It must never state "the market will do X." |
| 7 | **Operate without data** | If insufficient historical data exists for a given condition, the AI must state "insufficient data" rather than extrapolating from related conditions. |
| 8 | **Modify its own boundaries** | These prohibitions are hard-coded and cannot be altered by the AI, by configuration, or by any learned behavior. |
| 9 | **Merge methodologies** | If the trader's methodology changes over time, the AI must treat old and new methodology as separate statistical populations unless the trader explicitly states they are compatible. |
| 10 | **Confuse correlation with causation** | The AI may state "condition X correlates with outcome Y in the historical record." It must never state "condition X causes outcome Y" without explicit causal evidence from the knowledge base. |

### 10.2 Permitted Behaviors

The AI **must** always:

| # | Mandate | Description |
|---|---|---|
| 1 | **Cite evidence** | Every factual claim in a recommendation must reference a specific database record. |
| 2 | **Show reasoning** | The chain of reasoning from evidence to recommendation must be fully transparent and human-readable. |
| 3 | **Quantify uncertainty** | Every statistic must include sample size and, where appropriate, confidence intervals. |
| 4 | **Preserve history** | All recommendations, statistics, and decisions are permanently recorded. Nothing is overwritten. |
| 5 | **Flag data insufficiency** | When sample sizes are too small for statistical significance, clearly state this. |
| 6 | **Respect methodology boundaries** | Treat the trader's methodology as defined by their execution history. Do not generalize beyond it. |

---

## 11. Future Roadmap

### 11.1 Phase 1 — Knowledge Engine (Current)

**Status:** Implemented
**Goal:** Ingest research, extract knowledge, build graph, detect conflicts

| Component | Status |
|---|---|
| Source ingestion | ✅ Complete |
| Claim extraction | ✅ Complete |
| Concept extraction | ✅ Complete |
| Association mapping | ✅ Complete |
| Conflict detection | ✅ Complete |
| Interpretation generation | ✅ Complete |
| Research question generation | ✅ Complete |
| Hypothesis generation | ✅ Complete |
| Knowledge graph visualization | ✅ Complete |
| Full-text search | ✅ Complete |
| Reconsideration triggers | ✅ Complete |

### 11.2 Phase 2 — Trading Engine (Current)

**Status:** Implemented
**Goal:** Record trades with full market context

| Component | Status |
|---|---|
| Trade CRUD | ✅ Complete |
| Market structure analysis | ✅ Complete |
| Trade ↔ MS linkage | ✅ Complete |
| Dashboard stats | ✅ Complete |
| Frontend trades page | ✅ Complete |
| Frontend MS page | ✅ Complete |
| Image upload for trade charts | Complete (UI fields exist) |
| Session analysis fields | Complete (session fields exist on Trade) |

### 11.3 Phase 3 — Statistics Engine

**Status:** Planned
**Goal:** Compute multi-dimensional performance metrics

| Component | Description |
|---|---|
| Statistic model | Pydantic/SQLAlchemy entity for computed metrics |
| Dimension definitions | Pair, direction, bias combo, session, market phase, trend, emotion, news context |
| Computation engine | Reproducible metric computation with sample sizes and confidence intervals |
| Rolling windows | 10-trade, 50-trade, 100-trade, all-time |
| Risk metrics | Max drawdown, profit factor, Sharpe ratio, recovery factor |
| Equity curve | Cumulative P&L tracking with time-weighted returns |
| Statistic caching | Computed statistics cached with invalidation on new trade close |
| Frontend analytics | Analytics page with statistical visualizations |

### 11.4 Phase 4 — Pattern Discovery Engine

**Status:** Planned
**Goal:** Discover recurring profitable setups from trade history

| Component | Description |
|---|---|
| Pattern model | Entity to store discovered patterns with conditions and performance |
| Feature vector definition | What dimensions define a pattern (pair, bias, phase, session, etc.) |
| Clustering engine | Unsupervised clustering to group similar trades |
| Pattern validation | Minimum sample size and statistical significance testing |
| Pattern lifecycle | Discovered → Validated → Active → Stale → Archived |
| Pattern overlap detection | Prevent redundant or near-identical patterns |
| Frontend pattern browser | View, filter, and explore discovered patterns |

### 11.5 Phase 5 — Decision Support Engine

**Status:** Planned
**Goal:** Produce evidence-backed trade recommendations

| Component | Description |
|---|---|
| Recommendation model | Entity for recommendations with full evidence chain |
| Similarity engine | Find historically analogous market conditions using feature vector matching |
| Real-time condition monitoring | Watch for pattern-matching market conditions |
| Recommendation generation | Combine pattern matches, statistics, and knowledge into structured recommendations |
| Confidence scoring | Sample size × consistency × recency × specificity |
| Trader feedback capture | Accept/reject/modify with notes |
| Recommendation history | Permanent record of all recommendations for audit |

### 11.6 Phase 6 — Institutional Intelligence

**Status:** Planned
**Goal:** Systemic analytics and methodology integrity monitoring

| Component | Description |
|---|---|
| Trader discipline score | How consistently does the trader follow their own methodology? |
| Methodology drift detection | Statistical comparison of recent vs historical execution patterns |
| Market regime adaptation | Does the trader's methodology perform differently across market regimes? |
| Decision quality analysis | Quantify the impact of following vs deviating from recommendations |
| Long-term equity analytics | Rolling performance, underwater periods, recovery analysis |
| Knowledge confidence scoring | How well has knowledge (interpretations, hypotheses) held up against actual trading outcomes? |
| Executive dashboard | High-level view of all systemic metrics for strategic review |

---

## 12. Coding Standards

### 12.1 Architecture Rules

```
┌──────────────────────────────────────────────┐
│                LAYER RULES                    │
├──────────────────────────────────────────────┤
│ Routes layer may ONLY call Services or CRUD.  │
│ Services layer may ONLY call CRUD or other    │
│   Services.                                   │
│ CRUD layer may ONLY call the database.        │
│ No layer may skip the layer below it.         │
│ No circular dependencies between services.    │
│                                              │
│ Frontend: Pages → Hooks → API Services       │
│ Pages call hooks. Hooks call API services.    │
│ API services call Axios. No direct HTTP from  │
│   pages.                                      │
└──────────────────────────────────────────────┘
```

### 12.2 Backend Folder Structure

```
backend/
├── alembic/                    # Database migrations
│   ├── versions/               # Migration scripts
│   └── env.py                  # Alembic environment
├── src/
│   ├── main.py                 # FastAPI app entry
│   ├── api/
│   │   ├── router.py           # Master router
│   │   ├── deps.py             # Dependencies (get_db, get_project_or_404, auth)
│   │   ├── handlers.py         # Exception handlers
│   │   ├── middleware.py        # Custom middleware
│   │   └── routes/             # Route modules (one per entity)
│   ├── core/
│   │   ├── config.py           # Settings (pydantic-settings)
│   │   ├── logging.py          # Logging configuration
│   │   └── security.py         # CORS, HSTS, GZip middleware setup
│   ├── crud/                   # CRUD modules (one per entity)
│   ├── db/
│   │   ├── base.py             # Model imports for Alembic
│   │   └── session.py          # Engine and session factory
│   ├── models/                 # SQLAlchemy models (one per entity)
│   ├── schemas/                # Pydantic schemas (one per entity)
│   └── services/               # Business logic / pipelines
├── tests/
│   ├── conftest.py             # Test fixtures
│   ├── test_api.py             # API integration tests
│   └── test_pipeline.py        # Pipeline unit tests
├── requirements.txt
├── Dockerfile
└── alembic.ini
```

### 12.3 Frontend Folder Structure

```
frontend/
├── src/
│   ├── main.tsx                # React root with providers
│   ├── App.tsx                 # Top-level routing
│   ├── api/                    # API service functions (one per entity)
│   ├── auth/                   # Authentication (context, token storage)
│   ├── components/             # Shared components
│   │   ├── ui/                 # Primitive UI components (Button, Card, etc.)
│   │   ├── graph/              # Knowledge graph components
│   │   └── ...                 # Domain-specific components
│   ├── context/                # React contexts (ProjectContext)
│   ├── hooks/                  # Custom React Query hooks (one per entity)
│   ├── layouts/                # Layout components (MainLayout)
│   ├── lib/                    # Utility libraries (queryClient, utils)
│   ├── pages/                  # Page components (one per route)
│   ├── routes/                 # Route configuration
│   ├── services/               # Axios instance and interceptors
│   ├── theme/                  # Theme provider (dark/light mode)
│   └── types/                  # TypeScript type definitions
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── Dockerfile
```

### 12.4 Naming Conventions

| Layer | Convention | Examples |
|---|---|---|
| **Python files** | `snake_case.py` | `market_structure.py`, `claim_extractor.py` |
| **Python classes** | `PascalCase` | `MarketStructure`, `ClaimExtractor` |
| **Python functions** | `snake_case` | `extract_claims()`, `get_multi()` |
| **Python variables** | `snake_case` | `db_obj`, `project_id` |
| **TypeScript files** | `PascalCase.ts` | `MarketStructure.tsx`, `useMarketStructures.ts` |
| **TypeScript types/interfaces** | `PascalCase` | `MarketStructureRead`, `TradeCreate` |
| **TypeScript functions** | `camelCase` | `useMarketStructures`, `createTrade` |
| **TypeScript variables** | `camelCase` | `formData`, `projectId` |
| **Database tables** | `snake_case` | `market_structure`, `research_question` |
| **Database columns** | `snake_case` | `created_at`, `market_structure_id` |
| **API routes** | `kebab-case` | `/market-structures`, `/research-questions` |
| **Frontend routes** | `kebab-case` | `/market-structure`, `/research-questions` |

### 12.5 Database Conventions

| Convention | Rule |
|---|---|
| **Table names** | Singular lowercase snake_case (e.g., `market_structure`, not `market_structures`) |
| **Primary keys** | `id` column of type UUID with default `uuid4()` |
| **Foreign keys** | `<referenced_table>_id` (e.g., `project_id`, `market_structure_id`) |
| **Timestamps** | `created_at` and `updated_at` on every entity, `DateTime(timezone=True)`, server default `CURRENT_TIMESTAMP` |
| **Soft delete** | Not used. Deletion is actual (CASCADE or SET NULL). Archival is explicit (status field). |
| **JSONB** | Only for truly variable schema data. Must be documented with expected keys. |
| **Indexes** | Every FK column indexed. Composite indexes for common query patterns. |

### 12.6 API Conventions

| Convention | Rule |
|---|---|
| **Base URL** | `/api/v1` |
| **Resource naming** | Plural nouns, kebab-case: `/api/v1/projects/{project_id}/market-structures` |
| **HTTP methods** | GET (list/retrieve), POST (create), PUT (update), DELETE (delete) |
| **Action endpoints** | POST for actions: `/trades/{id}/close` (future) |
| **Pagination** | `skip` and `limit` query parameters. Default limit 100, max configurable. |
| **Response format** | Standard JSON. Errors follow `{"detail": "..."}` format. |
| **Status codes** | 200 (success), 201 (created), 204 (deleted), 400 (bad request), 404 (not found), 422 (validation error), 500 (server error) |
| **Authentication** | Bearer token in Authorization header. Optional X-API-Key for machine-to-machine. |

### 12.7 React Conventions

| Convention | Rule |
|---|---|
| **Component type** | Default export function components: `export default function DashboardPage()` |
| **Hooks** | Custom hooks in `hooks/` directory, one per domain entity |
| **Data fetching** | Always through TanStack Query hooks, never direct axios calls in components |
| **Forms** | react-hook-form with zod validation for complex forms; controlled components for simple forms |
| **Styling** | Tailwind CSS utility classes. No CSS modules or styled-components. |
| **State** | Server state: TanStack Query. App state: React Context. Form state: react-hook-form. Local UI state: useState. |
| **Code splitting** | All page components loaded via `React.lazy()` with `<Suspense>` |
| **Error boundaries** | `react-error-boundary` wrapping each route |

### 12.8 Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| **Backend unit** | pytest | CRUD operations, schema validation, service logic |
| **Backend integration** | pytest + TestClient | Full API route testing with test database |
| **Backend pipeline** | pytest | End-to-end pipeline tests (source → claim → concept → conflict → question → hypothesis) |
| **Frontend unit** | vitest + React Testing Library | Component rendering, hook behavior |
| **Frontend integration** | Playwright or Cypress | Critical user flows (login, browse projects, view trades) |
| **Database** | Alembic | Migration up/down testing, data integrity after migrations |

---

## 13. Scalability

### 13.1 Horizontal Scaling

| Component | Strategy |
|---|---|
| **Frontend** | Stateless SPA served from CDN or load-balanced nginx. Multiple instances behind a load balancer. Session affinity not required. |
| **Backend** | Stateless FastAPI instances behind a load balancer. No in-memory session state. Rate limiting uses a shared Redis store in production. |
| **Database** | PostgreSQL read replicas for query-heavy workloads. Primary handles writes. Application-level read/write splitting via SQLAlchemy. |

### 13.2 Data Volume Projections

| Entity | Year 1 (est.) | Year 3 (est.) | Year 5 (est.) |
|---|---|---|---|
| Sources | 1,000 | 10,000 | 50,000 |
| Claims | 50,000 | 500,000 | 2,500,000 |
| Concepts | 5,000 | 25,000 | 100,000 |
| Associations | 100,000 | 1,000,000 | 5,000,000 |
| Trades | 1,000 | 10,000 | 100,000 |
| Market Structures | 2,000 | 20,000 | 200,000 |
| Statistics (computed) | 10,000 | 100,000 | 1,000,000 |
| Patterns (discovered) | 50 | 500 | 2,000 |
| Recommendations | 1,000 | 10,000 | 50,000 |

### 13.3 Performance Targets

| Metric | Target |
|---|---|
| API response time (p95) | < 200ms for CRUD operations, < 500ms for pipeline operations |
| Dashboard load | < 1s for 10,000 trades |
| Knowledge graph render | < 500 nodes, < 1000 edges visible at once |
| Full-text search | < 300ms across all knowledge entities |
| Recommendation generation | < 2s per recommendation |
| Pattern discovery batch | < 5min for 10,000 trade analysis |

### 13.4 Long-Term Strategies

| Challenge | Strategy |
|---|---|
| **Millions of trades** | Table partitioning by month/quarter. Materialized views for common aggregations. Asynchronous statistics computation via background tasks. |
| **Thousands of research documents** | Full-text search with PostgreSQL tsvector. Document chunking for large sources. Claim deduplication across sources reduces noise. |
| **Continuous learning over years** | Immutable historical snapshots preserve the ability to recompute any metric as of any date. Methodology drift detection segments the trade history into statistically distinct periods. Rolling windows ensure recent data has appropriate weight. |
| **Knowledge graph growth** | Graph traversal optimized with recursive CTEs. Node degree limiting in visualization (show clusters, not individual nodes when density exceeds threshold). Periodic graph compaction (merge duplicate concepts, archive stale interpretations). |
| **Pattern explosion** | Minimum sample size thresholds prevent noise from becoming patterns. Pattern staleness detection removes patterns not observed recently. Pattern similarity clustering prevents near-identical patterns. |
| **Cold start** | All recommendation and pattern engines have explicit "insufficient data" states. The system is transparent about its confidence level at every data volume. |
| **Multi-user/multi-trader** | Each trader operates their own Project with complete data isolation. No cross-project data leakage. Future: cross-project anonymized pattern discovery with explicit opt-in. |

### 13.5 Infrastructure

| Component | Development | Production |
|---|---|---|
| **Database** | Docker PostgreSQL 16 | Managed PostgreSQL (RDS / Cloud SQL), multi-AZ |
| **Backend** | Uvicorn (hot-reload) | Gunicorn + Uvicorn workers, auto-scaling |
| **Frontend** | Vite dev server (HMR) | nginx, CDN-cached static assets |
| **Cache** | In-memory (local dev) | Redis / ElastiCache |
| **Task Queue** | Synchronous (dev) | Celery / ARQ with Redis broker |
| **File Storage** | Local filesystem | S3-compatible object storage |
| **Monitoring** | Console logs | Structured logging (JSON) + APM |
| **CI/CD** | GitHub Actions | GitHub Actions → Docker Registry → Deploy |

---

*This document is the permanent architectural reference for Project Minore. All future development must conform to the architecture, domain model, pipelines, and standards defined herein. Amendments require explicit ratification through the project's governance process.*
