# AI System — Project Minore

## Architecture

The AI system has three layers: **Agents** (task-oriented), **Brain** (real-time intelligence), and **Knowledge** (long-term memory).

```
                    ┌─────────────────────────────────────────┐
                    │            Orchestrator                 │
                    │  Schedules tasks, chains workflows      │
                    └─┬──────┬──────┬──────┬──────┬──────────┘
                      │      │      │      │      │
         ┌────────────┘ ┌────┘ ┌────┘ ┌────┘ ┌────┴────────────┐
         ▼              ▼      ▼      ▼      ▼                 ▼
    ┌──────────┐ ┌──────────┐ ┌────┐ ┌────┐ ┌──────────┐ ┌──────────┐
    │ Market   │ │ Pattern  │ │Perf│ │Coach│ │Knowledge │ │ Research │
    │ Analyst  │ │ Learner  │ │Mon │ │     │ │ Curator  │ │ Synthes  │
    └──────────┘ └──────────┘ └────┘ └────┘ └──────────┘ └──────────┘
    ┌──────────┐ ┌──────────┐
    │ Journal  │ │ Market   │
    │ Reviewer │ │ Watcher  │
    └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           BRAIN (real-time)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Decision  │ │Reasoning │ │ Learning │ │ Insights │ │ Coaching │  │
│  │ Engine   │ │ Engine   │ │ Engine   │ │ Engine   │ │ Engine   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────────┐    │
│  │Memory    │ │Similarity│ │         Trader DNA Engine         │    │
│  │ Engine   │ │ Engine   │ │  (builds trader psych profile)    │    │
│  └──────────┘ └──────────┘ └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       KNOWLEDGE (long-term)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐    │
│  │Knowledge │ │Knowledge │ │Knowledge │ │  RAG Pipeline       │    │
│  │ Graph    │ │ Library  │ │ Search   │ │  (retrieval-aug)    │    │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Agent System (8 agents)

Agents are task-oriented, orchestrated by the `Orchestrator`:

| Agent | File | Purpose |
|-------|------|---------|
| **Market Analyst** | `agents/market_analyst/agent.py` | Analyzes market structure, ICT concepts |
| **Pattern Learner** | `agents/learner/agent.py` | Identifies trading patterns from historical data |
| **Performance Monitor** | `agents/performance/agent.py` | P&L analysis, win rate, risk metrics |
| **Coach** | `agents/coach/agent.py` | Generates coaching sessions |
| **Knowledge Curator** | `agents/curator/agent.py` | Curates sources, claims, concepts |
| **Journal Reviewer** | `agents/journal/agent.py` | Reviews trade journal entries |
| **Researcher** | `agents/researcher/agent.py` | Synthesizes research data |
| **Market Watcher** | `agents/watcher/agent.py` | Monitors open trades, risk exposure |

### Orchestrator (`agents/orchestrator/engine.py`)

- Creates and manages agent tasks
- Supports workflow chaining
- Provides dashboard aggregation
- Tracks execution history

## Trading Brain (7 engines)

The brain provides real-time intelligence on every trade:

| Engine | File | Purpose |
|--------|------|---------|
| **Decision Engine** | `brain/decision_engine.py` | Evaluates trades, computes alignment scores, generates verdicts |
| **Reasoning Engine** | `brain/reasoning_engine.py` | Builds context pipeline, generates structured reasoning |
| **Learning Engine** | `brain/learning_engine.py` | Detects 8 types of learning observations from trades |
| **Insights Engine** | `brain/insights_engine.py` | Generates session, timeframe, discipline, risk insights |
| **Coaching Engine** | `brain/coaching_engine.py` | Generates daily/weekly/monthly coaching sessions |
| **Memory Engine** | `brain/memory_engine.py` | Long-term memory store, search, relevance |
| **Similarity Engine** | `brain/similarity_engine.py` | Finds similar trades for pattern matching |
| **Trader DNA Engine** | `brain/dna_engine.py` | Builds trader psychological profile |

## Knowledge System

- **Knowledge Graph:** Nodes (concepts, trades) + Edges (relationships) in PostgreSQL
- **Knowledge Library:** Curated knowledge entries with sources
- **Knowledge Search:** Full-text and semantic search across knowledge base
- **RAG Pipeline:** Retrieval-augmented generation for AI queries
- **Trade Memory:** AI-enriched trade analysis with session context, entry models, strengths/weaknesses

## Prompt Architecture

See `services/ai/prompt_library.py` for all prompt templates. The brain uses structured prompts with:
- **Context building:** Market context, trader profile, trade history
- **Chain-of-thought:** Step-by-step reasoning for decisions
- **Scoring:** Multi-factor alignment scoring
- **Reflection:** Post-trade analysis with learning extraction
