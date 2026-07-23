"""Multi-Timeframe Confluence Engine - synchronize bias across timeframes."""

from typing import Optional
from .schemas import (
    OHLCBar, MultiTimeframeBias, StructureAnalysis,
    ICTModelResult, SetupScore,
)
from .structure_engine import analyze_structure


TIMEFRAMES = ["1w", "1d", "4h", "1h", "15m", "5m", "1m"]


def determine_bias(structures: list[StructureAnalysis]) -> str:
    """Determine bias from structure analysis."""
    if not structures:
        return "neutral"

    # Aggregate trends from all analyzed timeframes
    trends = [s.trend for s in structures if s.trend != "neutral"]
    if not trends:
        return "neutral"

    bullish_count = sum(1 for t in trends if t == "bullish")
    bearish_count = sum(1 for t in trends if t == "bearish")

    if bullish_count > bearish_count:
        return "bullish"
    elif bearish_count > bullish_count:
        return "bearish"
    return "neutral"


def compute_htf_bias(
    weekly: str = "neutral",
    daily: str = "neutral",
    h4: str = "neutral",
) -> str:
    """Compute Higher Timeframe bias. Weekly dominates, then daily, then H4."""
    for bias in [weekly, daily, h4]:
        if bias in ("bullish", "bearish"):
            return bias
    return "neutral"


def compute_ltf_confirmation(
    h1: str = "neutral",
    m15: str = "neutral",
) -> str:
    """Compute Lower Timeframe confirmation."""
    for bias in [h1, m15]:
        if bias in ("bullish", "bearish"):
            return bias
    return "neutral"


def compute_confluence(
    htf_bias: str,
    ltf_confirmation: str,
) -> float:
    """Compute confluence score between HTF bias and LTF confirmation."""
    if htf_bias == "neutral" and ltf_confirmation == "neutral":
        return 0.0
    if htf_bias == ltf_confirmation:
        return 10.0
    if htf_bias == "neutral" or ltf_confirmation == "neutral":
        return 5.0
    return 2.0  # Divergent biases = low confluence


def compute_premium_discount(
    bars: list[OHLCBar],
    weekly_high: Optional[float] = None,
    weekly_low: Optional[float] = None,
) -> str:
    """Compute if price is in premium (upper half) or discount (lower half) of range."""
    if not bars:
        return "neutral"

    current_price = bars[-1].close
    high = weekly_high or max(b.high for b in bars[-20:])
    low = weekly_low or min(b.low for b in bars[-20:])

    if high == low:
        return "neutral"

    midpoint = (high + low) / 2
    if current_price >= midpoint:
        return "premium"
    return "discount"


def analyze_multi_timeframe(
    timeframe_datas: dict[str, list[OHLCBar]],
    weekly_high: Optional[float] = None,
    weekly_low: Optional[float] = None,
) -> MultiTimeframeBias:
    """Run multi-timeframe analysis on multiple timeframes of data."""
    result = MultiTimeframeBias()

    if not timeframe_datas:
        return result

    bias_map = {}
    for tf in TIMEFRAMES:
        if tf in timeframe_datas and timeframe_datas[tf]:
            structure = analyze_structure(timeframe_datas[tf])
            bias_map[tf] = structure.trend
        else:
            bias_map[tf] = "neutral"

    result.weekly = bias_map.get("1w", "neutral")
    result.daily = bias_map.get("1d", "neutral")
    result.h4 = bias_map.get("4h", "neutral")
    result.h1 = bias_map.get("1h", "neutral")
    result.m15 = bias_map.get("15m", "neutral")

    result.htf_bias = compute_htf_bias(result.weekly, result.daily, result.h4)
    result.ltf_confirmation = compute_ltf_confirmation(result.h1, result.m15)
    result.confluence_score = compute_confluence(result.htf_bias, result.ltf_confirmation)

    # Premium/Discount
    best_tf = "1h" if "1h" in timeframe_datas else next(iter(timeframe_datas.values()))
    result.premium_discount = compute_premium_discount(
        list(timeframe_datas.values())[0] if timeframe_datas else [],
        weekly_high,
        weekly_low,
    )

    return result
