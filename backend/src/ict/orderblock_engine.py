"""Order Block Engine - detection and quality scoring of order blocks."""

from typing import Optional
from .schemas import OHLCBar, OrderBlockAnalysis, OrderBlockResult


def detect_order_blocks(bars: list[OHLCBar], min_impulse_pct: float = 0.002) -> list[OrderBlockResult]:
    """Detect order blocks from OHLC data.

    Bullish OB: The last bearish (or bearish-adjacent) candle before an impulsive up move.
    Bearish OB: The last bullish (or bullish-adjacent) candle before an impulsive down move.

    Breaker Blocks: Old OBs that have been broken and act as support/resistance flips.
    Mitigation Blocks: OBs that have been partially or fully mitigated.
    Rejection Blocks: OBs with strong rejection wicks.
    """
    blocks: list[OrderBlockResult] = []
    if len(bars) < 5:
        return blocks

    for i in range(2, len(bars) - 1):
        pre_bar = bars[i - 1]
        entry_bar = bars[i]
        conf_bar = bars[i + 1]

        avg_range = sum(
            abs(b.high - b.low) for b in bars[max(0, i - 5):i + 2]
        ) / min(len(bars[max(0, i - 5):i + 2]), 8)
        if avg_range == 0:
            continue

        # Bullish OB: pre_bar is bearish or ranging, entry_bar is bullish impulse
        pre_bearish = pre_bar.close <= pre_bar.open or pre_bar.close <= (pre_bar.high + pre_bar.low) / 2
        entry_impulse = (entry_bar.close - entry_bar.open) >= avg_range * 0.8 and entry_bar.close > entry_bar.open
        conf_bullish = conf_bar.close > conf_bar.open and conf_bar.close > entry_bar.high * 0.99

        if pre_bearish and entry_impulse and conf_bullish:
            touch_count = _count_touches(bars, i + 1, pre_bar.low, pre_bar.high)
            validity = _compute_validity(pre_bar, entry_bar, avg_range, "bullish")
            quality = _compute_quality(validity, touch_count)
            blocks.append(OrderBlockResult(
                type="bullish",
                top_price=max(pre_bar.high, pre_bar.open),
                bottom_price=min(pre_bar.low, pre_bar.close),
                midpoint=(max(pre_bar.high, pre_bar.open) + min(pre_bar.low, pre_bar.close)) / 2,
                timestamp=pre_bar.timestamp,
                bar_index=i - 1,
                touch_count=touch_count,
                validity_score=validity,
                quality_score=quality,
            ))

        # Bearish OB: pre_bar is bullish or ranging, entry_bar is bearish impulse
        pre_bullish = pre_bar.close >= pre_bar.open or pre_bar.close >= (pre_bar.high + pre_bar.low) / 2
        entry_impulse_down = (entry_bar.open - entry_bar.close) >= avg_range * 0.8 and entry_bar.close < entry_bar.open
        conf_bearish = conf_bar.close < conf_bar.open and conf_bar.close < entry_bar.low * 1.01

        if pre_bullish and entry_impulse_down and conf_bearish:
            touch_count = _count_touches(bars, i + 1, pre_bar.low, pre_bar.high)
            validity = _compute_validity(pre_bar, entry_bar, avg_range, "bearish")
            quality = _compute_quality(validity, touch_count)
            blocks.append(OrderBlockResult(
                type="bearish",
                top_price=max(pre_bar.high, pre_bar.open),
                bottom_price=min(pre_bar.low, pre_bar.close),
                midpoint=(max(pre_bar.high, pre_bar.open) + min(pre_bar.low, pre_bar.close)) / 2,
                timestamp=pre_bar.timestamp,
                bar_index=i - 1,
                touch_count=touch_count,
                validity_score=validity,
                quality_score=quality,
            ))

    # Detect Breaker Blocks (existing OBs that flipped polarity)
    blocks = _detect_breakers(blocks, bars)
    # Detect Rejection Blocks (strong wicks at OB levels)
    blocks = _detect_rejections(blocks, bars)

    return blocks


def _count_touches(bars: list[OHLCBar], start_idx: int, low: float, high: float) -> int:
    """Count how many times price has touched the order block zone."""
    count = 0
    for j in range(start_idx, len(bars)):
        bar = bars[j]
        if low <= bar.low <= high or low <= bar.high <= high:
            count += 1
    return count


def _compute_validity(pre_bar: OHLCBar, entry_bar: OHLCBar, avg_range: float, direction: str) -> float:
    """Compute validity score based on entry impulse strength."""
    if direction == "bullish":
        impulse = entry_bar.close - entry_bar.open
    else:
        impulse = entry_bar.open - entry_bar.close

    body_ratio = impulse / avg_range if avg_range > 0 else 0
    range_mult = (entry_bar.high - entry_bar.low) / avg_range if avg_range > 0 else 1

    score = body_ratio * 0.6 + range_mult * 0.4
    return min(score * 10, 10.0)


def _compute_quality(validity: float, touch_count: int) -> float:
    """Compute overall quality score for an order block."""
    validity_score = validity * 0.5
    touch_score = min(touch_count * 1.5, 5.0)
    return min(validity_score + touch_score, 10.0)


def _detect_breakers(blocks: list[OrderBlockResult], bars: list[OHLCBar]) -> list[OrderBlockResult]:
    """Detect breaker blocks from existing order blocks that got broken."""
    new_blocks = list(blocks)
    if len(bars) < 2:
        return new_blocks

    last_bar = bars[-1]
    for block in blocks:
        if block.type == "bullish":
            # Bullish OB broken = price dropped below it, now acts as resistance
            if last_bar.low < block.bottom_price:
                new_blocks.append(OrderBlockResult(
                    type="breaker_bearish",
                    top_price=block.top_price,
                    bottom_price=block.bottom_price,
                    midpoint=block.midpoint,
                    timestamp=last_bar.timestamp,
                    bar_index=len(bars) - 1,
                    touch_count=block.touch_count,
                    validity_score=block.validity_score * 0.8,
                    quality_score=block.quality_score * 0.7,
                    parent_block_id="breaker",
                ))
        elif block.type == "bearish":
            # Bearish OB broken = price broke above it, now acts as support
            if last_bar.high > block.top_price:
                new_blocks.append(OrderBlockResult(
                    type="breaker_bullish",
                    top_price=block.top_price,
                    bottom_price=block.bottom_price,
                    midpoint=block.midpoint,
                    timestamp=last_bar.timestamp,
                    bar_index=len(bars) - 1,
                    touch_count=block.touch_count,
                    validity_score=block.validity_score * 0.8,
                    quality_score=block.quality_score * 0.7,
                    parent_block_id="breaker",
                ))

    return new_blocks


def _detect_rejections(blocks: list[OrderBlockResult], bars: list[OHLCBar]) -> list[OrderBlockResult]:
    """Detect rejection blocks - OBs where price showed strong wick rejection."""
    new_blocks = list(blocks)
    if len(bars) < 3:
        return new_blocks

    for i in range(len(bars) - 2, max(0, len(bars) - 10), -1):
        bar = bars[i]
        body = abs(bar.close - bar.open)
        range_total = bar.high - bar.low
        if range_total == 0:
            continue

        # Strong wick rejection
        upper_wick = bar.high - max(bar.open, bar.close)
        lower_wick = min(bar.open, bar.close) - bar.low
        total_wick = upper_wick + lower_wick

        if total_wick > body * 1.5 and total_wick > range_total * 0.6:
            for block in blocks:
                if block.bottom_price <= bar.low <= block.top_price or block.bottom_price <= bar.high <= block.top_price:
                    if bar.close < bar.open and upper_wick > body:  # Bearish rejection at OB
                        new_blocks.append(OrderBlockResult(
                            type="rejection",
                            top_price=block.top_price,
                            bottom_price=block.bottom_price,
                            midpoint=block.midpoint,
                            timestamp=bar.timestamp,
                            bar_index=i,
                            validity_score=9.0,
                            quality_score=8.0,
                        ))
                    elif bar.close > bar.open and lower_wick > body:  # Bullish rejection at OB
                        new_blocks.append(OrderBlockResult(
                            type="rejection",
                            top_price=block.top_price,
                            bottom_price=block.bottom_price,
                            midpoint=block.midpoint,
                            timestamp=bar.timestamp,
                            bar_index=i,
                            validity_score=9.0,
                            quality_score=8.0,
                        ))
                    break

    return new_blocks


def detect_bpr(bars: list[OHLCBar]) -> list[OrderBlockResult]:
    """Detect Balanced Price Ranges (BPR) - overlapping bullish and bearish OBs."""
    bpr_blocks: list[OrderBlockResult] = []
    if len(bars) < 10:
        return bpr_blocks

    # Get initial OBs
    blocks = detect_order_blocks(bars)

    # Group nearby bullish and bearish OBs
    bullish_obs = [b for b in blocks if b.type == "bullish"]
    bearish_obs = [b for b in blocks if b.type == "bearish"]

    for b_o in bullish_obs:
        for be_o in bearish_obs:
            overlap_top = min(b_o.top_price, be_o.top_price)
            overlap_bottom = max(b_o.bottom_price, be_o.bottom_price)
            if overlap_top > overlap_bottom:
                overlap_pct = (overlap_top - overlap_bottom) / (b_o.top_price - b_o.bottom_price) * 100
                if overlap_pct > 50:
                    bpr_blocks.append(OrderBlockResult(
                        type="bpr",
                        top_price=overlap_top,
                        bottom_price=overlap_bottom,
                        midpoint=(overlap_top + overlap_bottom) / 2,
                        timestamp=b_o.timestamp if b_o.timestamp < be_o.timestamp else be_o.timestamp,
                        bar_index=min(b_o.bar_index, be_o.bar_index),
                        validity_score=8.0,
                        quality_score=min(b_o.quality_score + be_o.quality_score, 10.0),
                    ))

    return bpr_blocks


def analyze_order_blocks(bars: list[OHLCBar]) -> OrderBlockAnalysis:
    """Run full order block analysis on OHLC bars."""
    result = OrderBlockAnalysis()

    if not bars:
        return result

    blocks = detect_order_blocks(bars)
    bprs = detect_bpr(bars)
    all_blocks = blocks + bprs

    result.bullish_count = len([b for b in all_blocks if b.type in ("bullish", "breaker_bullish")])
    result.bearish_count = len([b for b in all_blocks if b.type in ("bearish", "breaker_bearish")])
    result.order_blocks = all_blocks

    if all_blocks:
        result.best_block = max(all_blocks, key=lambda b: b.quality_score)

    return result
