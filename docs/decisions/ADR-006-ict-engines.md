# ADR-006: ICT Engine Architecture

**Status:** Accepted
**Date:** 2026

## Context

Need to detect and analyze ICT (Inner Circle Trader) concepts: market structure, fair value gaps, order blocks, liquidity zones, trading sessions, and multi-timeframe confluence. Each concept requires different detection algorithms.

## Decision

Implement **8 independent detection engines** with a unified scoring system.

## Consequences

**Positive:**
- Each engine is independently testable
- Engines can be enabled/disabled per analysis request
- New detection types can be added without modifying existing engines
- Scoring engine provides composable confidence ratings
- Multi-timeframe analysis is a separate concern

**Negative:**
- Cross-engine dependencies require careful orchestration
- Duplicate detection (same pattern from different angles) must be deduplicated
- Performance overhead from running all engines on every analysis

## Engine Design

Each engine follows this pattern:

```
Input: OHLC data + configuration
Process: algorithm-specific detection
Output: typed list of detected structures
Storage: persistence via ICTPersistenceService
API: exposed via /api/v1/projects/{id}/ict/ endpoints
```

## Scoring Architecture

```
Detected Structures → Setup Scoring → Confluence Scoring → Execution Decision
     (engines)        (per-setup)      (multi-factor)       (bias + entry)
```

## Models

The `ict_models.py` file contains higher-order pattern recognition:

- Silver Bullet: Time-specific reversal pattern
- Judas Swing: False breakout
- Turtle Soup: Stop hunt
- Power of Three: AMP cycle
- OTE Entry: 61.8-79% retracement
