# ICT Smart Engine — Project Minore

## Overview

The ICT (Inner Circle Trader) Smart Engine detects institutional market structures and generates trading setups based on ICT concepts. It has 8 independent detection engines and a scoring system.

## Engines

```
ICT Smart Engine
├── Structure Engine      → Swing points, BOS, MSS, CHOCH, displacement
├── FVG Engine            → Fair Value Gaps (FVG, IFVG)
├── Order Block Engine    → Order blocks, breaker blocks, rejection blocks
├── Liquidity Engine      → Liquidity zones, pools, sweeps
├── Session Engine        → Asia/London/NY sessions, kill zones, silver bullet
├── Multi-Timeframe Engine→ Premium/discount, alignment scoring
├── Scoring Engine        → Setup scoring, confluence, execution decisions
└── Models                → Silver Bullet, Judas Swing, Turtle Soup, Power of Three
```

## Structure Engine (`ict/structure_engine.py`)

Detects market structures from OHLC data:

- **Swing Points:** Highs/lows with configurable left/right confirmation
- **BOS (Break of Structure):** Price breaks through swing high/low
- **MSS (Market Structure Shift):** Structure break with close beyond level
- **CHOCH (Change of Character):** Momentum-based structure change
- **Displacement:** Aggressive directional movement detection

## FVG Engine (`ict/fvg_engine.py`)

Detects Fair Value Gaps:

- **FVG:** Three-candle gap where high < low with gap between wicks
- **IFVG:** Implied FVG from overlapping candle ranges
- **Scoring:** Gap size ratio, gap distance, reaction strength, mitigated status
- **Status tracking:** Open, partially_mitigated, fully_mitigated, invalidated

## Order Block Engine (`ict/orderblock_engine.py`)

Detects institutional order blocks:

- **Order Blocks:** Last down/up candle before a strong move
- **Breaker Blocks:** Failed order blocks that reverse
- **Rejection Blocks:** Candles with long wicks at key levels
- **BPR (Balanced Price Range):** Two-way liquidity sweeps
- **Mitigation:** Tracks whether price has returned to the block

## Liquidity Engine (`ict/liquidity_engine.py`)

Detects liquidity zones:

- **Liquidity Pools:** Buyside/sellside clusters above highs / below lows
- **Liquidity Sweeps:** Price spikes into liquidity zones with reversal
- **Failed Sweeps:** Liquidity sweep that continues in sweep direction
- **Scoring:** Zone strength based on cluster density + touches

## Session Engine (`ict/session_engine.py`)

Identifies trading sessions and key windows:

- **Asia Session:** 00:00-09:00 UTC
- **London Session:** 07:00-16:00 UTC
- **New York Session:** 12:00-21:00 UTC
- **London Kill Zone:** 07:00-10:00 UTC
- **New York Kill Zone:** 12:00-15:00 UTC
- **Silver Bullet:** Specific high-probability windows
- **Session overlaps:** London-NY overlap (12:00-16:00 UTC)

## Multi-Timeframe Engine (`ict/multi_timeframe.py`)

Provides multi-timeframe confluence:

- Aligns structures across 4 timeframes (e.g., 15m, 1h, 4h, 1d)
- Premium/discount zone calculation (0.0-1.0 Fibonacci range)
- Directional alignment scoring across timeframes
- Displacement, gap, and imbalance detection per timeframe

## Scoring Engine (`ict/scoring_engine.py`)

Converts detected structures into actionable scores:

- **Setup Scoring:** Combines structure, FVG, order block, liquidity, session, premium/discount
- **Confluence Scoring:** Weights and combines multiple factors
- **Execution Decision:** Generates bias (bullish/bearish/neutral), entry model, confidence level
- **Risk parameters:** Stop loss placement, take profit targets based on detected levels

## ICT Models (`ict/ict_models.py`)

Advanced pattern recognition models:

- **Silver Bullet:** Specific session-based reversal pattern
- **Judas Swing:** False breakout before reversal
- **Turtle Soup:** Stop hunt at obvious levels
- **Power of Three (PO3):** Accumulation, Manipulation, Distribution
- **Liquidity Sweep Reversal:** Sweep + reversal entry
- **Displacement Entry:** Aggressive move entry
- **OTE (Optimal Trade Entry):** 61.8-79% Fibonacci retracement entries

## Data Flow

```
OHLC Data → Structure Engine → Swing/BOS/MSS/CHOCH
         → FVG Engine → FVG/IFVG zones
         → Order Block Engine → Order blocks
         → Liquidity Engine → Liquidity zones
         → Session Engine → Session context
         → Multi-Timeframe → Alignment scores
         → Scoring Engine → Setup scores + execution decisions
         → Persistence → PostgreSQL tables
         → API → Frontend display
```
