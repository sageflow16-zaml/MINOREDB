"""Fair Value Gap Engine - detection, classification, and scoring of FVGs."""

from typing import Optional
from .schemas import OHLCBar, FVGAnalysis, FVGResult


def detect_fvgs(bars: list[OHLCBar]) -> list[FVGResult]:
    """Detect Fair Value Gaps from OHLC data.

    Bullish FVG: Low of candle i+2 > High of candle i (gap up between 3 candles).
    Bearish FVG: High of candle i+2 < Low of candle i (gap down between 3 candles).

    Inverse FVGs form when price fills a FVG and creates one in the opposite direction.
    """
    fvgs: list[FVGResult] = []
    if len(bars) < 3:
        return fvgs

    for i in range(len(bars) - 2):
        candle_1 = bars[i]
        candle_2 = bars[i + 1]
        candle_3 = bars[i + 2]

        # Bullish FVG: gap up
        if candle_3.low > candle_1.high:
            gap_size = candle_3.low - candle_1.high
            midpoint = (candle_1.high + candle_3.low) / 2
            avg_range = (candle_1.high - candle_1.low + candle_2.high - candle_2.low + candle_3.high - candle_3.low) / 3
            freshness = 1.0
            probability = min(gap_size / avg_range * 50, 95) if avg_range > 0 else 50

            # Check if this is an inverse FVG (formed inside a previous FVG area)
            for existing in fvgs:
                if (existing.status != "filled" and
                        existing.bottom_price <= midpoint <= existing.top_price and
                        existing.type == "bearish"):
                    fvgs.append(FVGResult(
                        type="inverse_bullish",
                        top_price=candle_3.high,
                        bottom_price=candle_1.low,
                        gap_size=gap_size,
                        midpoint=midpoint,
                        timestamp=candle_2.timestamp,
                        bar_index=i + 1,
                        freshness_score=freshness,
                        probability_score=probability + 10,
                        parent_fvg_id="fvg_inverse",
                    ))
                    continue

            fvgs.append(FVGResult(
                type="bullish",
                top_price=candle_3.high,
                bottom_price=candle_1.low,
                gap_size=gap_size,
                midpoint=midpoint,
                timestamp=candle_2.timestamp,
                bar_index=i + 1,
                freshness_score=freshness,
                probability_score=probability,
            ))

        # Bearish FVG: gap down
        if candle_3.high < candle_1.low:
            gap_size = candle_1.low - candle_3.high
            midpoint = (candle_1.low + candle_3.high) / 2
            avg_range = (candle_1.high - candle_1.low + candle_2.high - candle_2.low + candle_3.high - candle_3.low) / 3
            freshness = 1.0
            probability = min(gap_size / avg_range * 50, 95) if avg_range > 0 else 50

            for existing in fvgs:
                if (existing.status != "filled" and
                        existing.bottom_price <= midpoint <= existing.top_price and
                        existing.type == "bullish"):
                    fvgs.append(FVGResult(
                        type="inverse_bearish",
                        top_price=candle_1.high,
                        bottom_price=candle_3.low,
                        gap_size=gap_size,
                        midpoint=midpoint,
                        timestamp=candle_2.timestamp,
                        bar_index=i + 1,
                        freshness_score=freshness,
                        probability_score=probability + 10,
                        parent_fvg_id="fvg_inverse",
                    ))
                    continue

            fvgs.append(FVGResult(
                type="bearish",
                top_price=candle_1.high,
                bottom_price=candle_3.low,
                gap_size=gap_size,
                midpoint=midpoint,
                timestamp=candle_2.timestamp,
                bar_index=i + 1,
                freshness_score=freshness,
                probability_score=probability,
            ))

    return fvgs


def compute_reaction_strength(fvg: FVGResult, bars: list[OHLCBar]) -> float:
    """Calculate how price reacted at the FVG level after formation."""
    if not bars:
        return 0.0

    bars_after = [b for b in bars if b.timestamp > fvg.timestamp]
    if len(bars_after) < 2:
        return 0.0

    # Count touches
    touches = 0
    for bar in bars_after:
        if fvg.bottom_price <= bar.low <= fvg.top_price and fvg.type in ("bullish", "inverse_bullish"):
            touches += 1
        elif fvg.bottom_price <= bar.high <= fvg.top_price and fvg.type in ("bearish", "inverse_bearish"):
            touches += 1

    # Measure reaction after touch
    reaction = 0.0
    for i in range(len(bars_after) - 1):
        bar = bars_after[i]
        if fvg.bottom_price <= bar.low <= fvg.top_price:
            if fvg.type in ("bullish", "inverse_bullish"):
                next_bars = bars_after[i + 1:i + 4]
                if next_bars:
                    reaction = max(b.high for b in next_bars) - fvg.top_price
            break

    reaction_pct = reaction / (fvg.top_price - fvg.bottom_price) if (fvg.top_price - fvg.bottom_price) > 0 else 0
    return min(touches * 2.5 + reaction_pct * 0.5, 10.0)


def compute_freshness(fvg: FVGResult, current_bar_index: int) -> float:
    """Calculate freshness score based on how recently the FVG formed."""
    bars_since = current_bar_index - fvg.bar_index
    if bars_since <= 0:
        return 1.0
    decay = max(0, 1.0 - (bars_since * 0.05))
    return max(decay, 0.05)


def check_fvg_status(fvg: FVGResult, bars: list[OHLCBar]) -> tuple[str, Optional[float], Optional[float]]:
    """Check if a FVG has been filled, partially filled, or remains untouched."""
    if not bars:
        return "untouched", None, None

    bars_after = [b for b in bars if b.timestamp > fvg.timestamp]

    inside_count = 0
    total_after = len(bars_after)

    for bar in bars_after:
        if fvg.type in ("bullish", "inverse_bullish"):
            # FVG is filled when price drops back into it
            if bar.low < fvg.top_price and bar.high > fvg.bottom_price:
                inside_count += 1
        else:
            if bar.high > fvg.bottom_price and bar.low < fvg.top_price:
                inside_count += 1

    if total_after == 0:
        return "untouched", None, None

    fill_ratio = inside_count / total_after

    if fill_ratio >= 0.5:
        last_bar = bars_after[-1]
        fill_price = last_bar.close
        return "filled", fill_price, None
    elif inside_count > 0:
        last_bar = bars_after[-1]
        fill_price = last_bar.close
        return "partially_filled", fill_price, None
    else:
        return "untouched", None, None


def score_fvg(fvg: FVGResult, bars: list[OHLCBar], current_bar_index: int) -> FVGResult:
    """Update FVG with computed scores."""
    fvg.freshness_score = compute_freshness(fvg, current_bar_index)
    fvg.reaction_strength = compute_reaction_strength(fvg, bars)
    status, fill_price, _ = check_fvg_status(fvg, bars)
    fvg.status = status

    # Probability score: combination of freshness, size, and reaction
    gap_quality = min(fvg.gap_size * 100, 30) / 30 * 100
    fvg.probability_score = (
        fvg.freshness_score * 0.3 +
        fvg.reaction_strength * 0.3 +
        gap_quality * 0.2 +
        (50 if status == "untouched" else 10 if status == "partially_filled" else 0) * 0.2
    )
    fvg.probability_score = min(fvg.probability_score, 100)

    return fvg


def analyze_fvg(bars: list[OHLCBar]) -> FVGAnalysis:
    """Run full FVG analysis on OHLC bars."""
    result = FVGAnalysis()

    if not bars:
        return result

    raw_fvgs = detect_fvgs(bars)
    current_bar_index = len(bars) - 1

    scored_fvgs = [score_fvg(fvg, bars, current_bar_index) for fvg in raw_fvgs]

    result.bullish_count = len([f for f in scored_fvgs if f.type in ("bullish", "inverse_bullish")])
    result.bearish_count = len([f for f in scored_fvgs if f.type in ("bearish", "inverse_bearish")])
    result.fvgs = scored_fvgs

    if scored_fvgs:
        result.best_fvg = max(scored_fvgs, key=lambda f: f.probability_score)

    return result
