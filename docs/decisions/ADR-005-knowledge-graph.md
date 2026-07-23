# ADR-005: Knowledge Graph for Trade Intelligence

**Status:** Accepted
**Date:** 2026

## Context

Need to represent relationships between trades, concepts, claims, and strategies. A simple relational model doesn't capture the rich interconnected nature of trading knowledge.

## Decision

Build a **PostgreSQL-based knowledge graph** with nodes, edges, and snapshots, queried via CTE (Common Table Expressions) for graph traversal.

## Consequences

**Positive:**
- No additional infrastructure (uses existing PostgreSQL)
- ACID-compliant graph operations
- Snapshot capability enables graph versioning
- Integrates naturally with existing ORM models
- CTE queries handle path finding and neighborhood analysis
- Simpler operational overhead than dedicated graph DB

**Negative:**
- Graph queries are more complex than native graph DB (Neo4j)
- Recursive CTEs have performance limits at very large scales
- No built-in graph algorithms (PageRank, community detection)
- Graph visualization requires frontend implementation (React Flow)

## Graph Model

```
KnowledgeNode (id, type, label, metadata, project_id)
KnowledgeEdge (source_id, target_id, relationship, weight, metadata)
KnowledgeGraphSnapshot (id, name, nodes, edges, created_at)
```

## Node Types

- `trade` — Individual trade entries
- `concept` — Trading concepts (ICT, SMC, traditional)
- `claim` — Knowledge claims with evidence
- `strategy` — Trading strategies
- `pattern` — Detected patterns
- `insight` — Generated insights from brain
- `observation` — Learning observations

## Edge Relationships

- `related_to` — Generic relationship
- `caused` — Causal relationship
- `contradicts` — Conflicting relationship
- `supports` — Supporting evidence
- `instance_of` — Type relationship
- `follows` — Temporal sequence
