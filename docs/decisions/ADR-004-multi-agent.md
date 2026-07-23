# ADR-004: Multi-Agent Architecture for AI

**Status:** Accepted
**Date:** 2026

## Context

Need AI capabilities that cover diverse trading domains: market analysis, journal review, performance monitoring, coaching, research synthesis, knowledge curation, and trade pattern learning. Each domain has different expertise requirements.

## Decision

Implement a **multi-agent architecture** with 8 specialized agents and an orchestrator.

## Consequences

**Positive:**
- Each agent focuses on one domain (single responsibility)
- Agents can run independently or in orchestrated workflows
- Easy to add new agent types without modifying existing ones
- Orchestrator manages task sequencing and dependency resolution
- Agent registry enables dynamic discovery

**Negative:**
- Coordination overhead between agents
- Shared context must be maintained across agent boundaries
- Orchestrator becomes a single point of coordination
- More complex deployment than a single monolithic AI

## Architecture

```
Orchestrator
├── Market Analyst Agent     → market structure, ICT analysis
├── Pattern Learner Agent   → historical pattern mining
├── Performance Monitor      → P&L, win rate, risk metrics
├── Coach Agent             → personalized coaching
├── Knowledge Curator       → source/claim/concept curation
├── Journal Reviewer         → trade journal analysis
├── Researcher Agent        → research synthesis
└── Market Watcher Agent    → real-time monitoring
```

## Agent Base Class

All agents extend `BaseAgent` with:
- `agent_id`, `agent_name`, `agent_version` for identification
- `execute(task)` for task processing
- `get_capabilities()` for capability discovery
- Structured `AgentResult` return type with success, data, error, metadata
