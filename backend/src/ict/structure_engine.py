"""Market Structure Engine - swing point detection and structure analysis."""

from typing import Optional
from .schemas import OHLCBar, StructureAnalysis, StructureResult, SwingPoint


def detect_swing_points(
    bars: list[OHLCBar],
    lookback: int = 5,
    min_strength_pct: float = 0.001,
) -> list[SwingPoint]:
    """Detect swing highs and lows using zigzag algorithm.

    A swing high occurs when high[i] >= all highs in [i-lookback, i+lookback].
    A swing low occurs when low[i] <= all lows in [i-lookback, i+lookback].
    """
    swings: list[SwingPoint] = []
    n = len(bars)
    if n < lookback * 2 + 1:
        return swings

    for i in range(lookback, n - lookback):
        # Swing High
        is_high = True
        for j in range(1, lookback + 1):
            if (
                bars[i].high < bars[i - j].high or
                bars[i].high <= bars[i + j].high
            ):
                is_high = False
                break
        if is_high:
            avg_range = sum(
                abs(bars[k].high - bars[k].low) for k in range(i - lookback, i + lookback + 1)
            ) / (lookback * 2 + 1)
            strength = (bars[i].high - bars[i].low) / avg_range if avg_range > 0 else 1.0
            swings.append(SwingPoint(
                index=i,
                timestamp=bars[i].timestamp,
                price=bars[i].high,
                type="swing_high",
                strength=min(strength, 3.0),
            ))

        # Swing Low
        is_low = True
        for j in range(1, lookback + 1):
            if (
                bars[i].low > bars[i - j].low or
                bars[i].low >= bars[i + j].low
            ):
                is_low = False
                break
        if is_low:
            avg_range = sum(
                abs(bars[k].high - bars[k].low) for k in range(i - lookback, i + lookback + 1)
            ) / (lookback * 2 + 1)
            strength = (bars[i].high - bars[i].low) / avg_range if avg_range > 0 else 1.0
            swings.append(SwingPoint(
                index=i,
                timestamp=bars[i].timestamp,
                price=bars[i].low,
                type="swing_low",
                strength=min(strength, 3.0),
            ))

    return swings


def classify_structures(
    swings: list[SwingPoint],
    bars: list[OHLCBar],
) -> list[StructureResult]:
    """Classify higher highs, lower highs, higher lows, lower lows."""
    structures: list[StructureResult] = []
    if len(swings) < 2:
        return structures

    for i in range(1, len(swings)):
        prev = swings[i - 1]
        curr = swings[i]

        if curr.type == "swing_high" and prev.type == "swing_high":
            str_type = "higher_high" if curr.price >= prev.price else "lower_high"
            confidence = min(abs(curr.price - prev.price) / prev.price * 100, 100) if prev.price > 0 else 50
            structures.append(StructureResult(
                type=str_type,
                price=curr.price,
                timestamp=curr.timestamp,
                bar_index=curr.index,
                strength_score=min(curr.strength, 10),
                confidence_score=min(confidence, 100),
            ))
        elif curr.type == "swing_low" and prev.type == "swing_low":
            str_type = "higher_low" if curr.price >= prev.price else "lower_low"
            confidence = min(abs(curr.price - prev.price) / prev.price * 100, 100) if prev.price > 0 else 50
            structures.append(StructureResult(
                type=str_type,
                price=curr.price,
                timestamp=curr.timestamp,
                bar_index=curr.index,
                strength_score=min(curr.strength, 10),
                confidence_score=min(confidence, 100),
            ))
        elif curr.type == "swing_high" and prev.type == "swing_low" and curr.price > prev.price:
            structures.append(StructureResult(
                type="external_structure",
                price=curr.price,
                timestamp=curr.timestamp,
                bar_index=curr.index,
                strength_score=min(curr.strength, 10),
                confidence_score=60,
            ))
        elif curr.type == "swing_low" and prev.type == "swing_high" and curr.price < prev.price:
            structures.append(StructureResult(
                type="internal_structure",
                price=curr.price,
                timestamp=curr.timestamp,
                bar_index=curr.index,
                strength_score=min(curr.strength, 10),
                confidence_score=60,
            ))

    return structures


def detect_bos(swings: list[SwingPoint], bars: list[OHLCBar]) -> list[StructureResult]:
    """Detect Break of Structure events.

    BOS occurs when price breaks through a previous swing point
    in the direction of the current trend.
    """
    events: list[StructureResult] = []
    if len(swings) < 3 or len(bars) < 2:
        return events

    # Determine trend based on last few swings
    recent_swings = swings[-6:] if len(swings) > 6 else swings
    high_swings = [s for s in recent_swings if s.type == "swing_high"]
    low_swings = [s for s in recent_swings if s.type == "swing_low"]

    if len(high_swings) < 2 or len(low_swings) < 2:
        return events

    last_high = high_swings[-1]
    prev_high = high_swings[-2]
    last_low = low_swings[-1]
    prev_low = low_swings[-2]
    last_bar = bars[-1]

    # Bullish BOS: price breaks above previous swing high
    if last_bar.high > prev_high.price and last_high.price > prev_high.price:
        bos_price = prev_high.price
        for bar in reversed(bars):
            if bar.high > bos_price:
                strength = abs(bar.high - bos_price) / bos_price * 100 if bos_price > 0 else 0
                events.append(StructureResult(
                    type="bos",
                    price=bar.high,
                    timestamp=bar.timestamp,
                    bar_index=bars.index(bar),
                    strength_score=min(strength, 10),
                    confidence_score=min(strength * 10, 100),
                ))
                break

    # Bearish BOS: price breaks below previous swing low
    if last_bar.low < prev_low.price and last_low.price < prev_low.price:
        bos_price = prev_low.price
        for bar in reversed(bars):
            if bar.low < bos_price:
                strength = abs(bos_price - bar.low) / bos_price * 100 if bos_price > 0 else 0
                events.append(StructureResult(
                    type="bos",
                    price=bar.low,
                    timestamp=bar.timestamp,
                    bar_index=bars.index(bar),
                    strength_score=min(strength, 10),
                    confidence_score=min(strength * 10, 100),
                ))
                break

    return events


def detect_mss(swings: list[SwingPoint], bars: list[OHLCBar]) -> list[StructureResult]:
    """Detect Market Structure Shift events.

    MSS occurs when price breaks a structure level, indicating a potential trend change.
    - Bullish MSS: Price makes a lower low, then breaks above previous swing high
    - Bearish MSS: Price makes a higher high, then breaks below previous swing low
    """
    events: list[StructureResult] = []
    if len(swings) < 4 or len(bars) < 2:
        return events

    last_three = swings[-4:]
    high_swings = [s for s in last_three if s.type == "swing_high"]
    low_swings = [s for s in last_three if s.type == "swing_low"]

    if len(high_swings) < 2 or len(low_swings) < 2:
        return events

    last_bar = bars[-1]

    # Bearish MSS: HH then breaks below last swing low
    if (high_swings[-1].price > high_swings[-2].price and
            last_bar.low < low_swings[-1].price):
        events.append(StructureResult(
            type="mss",
            price=last_bar.low,
            timestamp=last_bar.timestamp,
            bar_index=len(bars) - 1,
            strength_score=5.0,
            confidence_score=80,
        ))

    # Bullish MSS: LL then breaks above last swing high
    if (low_swings[-1].price < low_swings[-2].price and
            last_bar.high > high_swings[-1].price):
        events.append(StructureResult(
            type="mss",
            price=last_bar.high,
            timestamp=last_bar.timestamp,
            bar_index=len(bars) - 1,
            strength_score=5.0,
            confidence_score=80,
        ))

    return events


def detect_choch(swings: list[SwingPoint], bars: list[OHLCBar]) -> list[StructureResult]:
    """Detect Change of Character events.

    CHOCH is a more subtle structure shift, often on lower timeframes,
    indicating a change in market behavior before a full MSS.
    """
    events: list[StructureResult] = []
    if len(swings) < 3 or len(bars) < 5:
        return events

    last_bar = bars[-1]
    prev_bar = bars[-3] if len(bars) >= 3 else bars[0]

    # A CHOCH is often preceded by a strong impulse then an aggressive retracement
    # that breaks the last swing point aggressively
    recent_high = max(s.price for s in swings[-3:] if s.type == "swing_high") if swings else 0
    recent_low = min(s.price for s in swings[-3:] if s.type == "swing_low") if swings else 0

    range_5 = abs(bars[-1].high - bars[-5].low) if len(bars) >= 5 else 0
    if range_5 == 0:
        return events

    # Bearish CHOCH: aggressive break of a swing low with momentum
    if last_bar.close < prev_bar.low and last_bar.low < recent_low:
        impulse = abs(last_bar.low - prev_bar.high) / range_5 * 100
        if impulse > 60:
            events.append(StructureResult(
                type="choch",
                price=last_bar.low,
                timestamp=last_bar.timestamp,
                bar_index=len(bars) - 1,
                strength_score=min(impulse / 10, 10),
                confidence_score=min(impulse * 1.2, 100),
            ))

    # Bullish CHOCH: aggressive break of a swing high with momentum
    if last_bar.close > prev_bar.high and last_bar.high > recent_high:
        impulse = abs(last_bar.high - prev_bar.low) / range_5 * 100
        if impulse > 60:
            events.append(StructureResult(
                type="choch",
                price=last_bar.high,
                timestamp=last_bar.timestamp,
                bar_index=len(bars) - 1,
                strength_score=min(impulse / 10, 10),
                confidence_score=min(impulse * 1.2, 100),
            ))

    return events


def detect_displacement(bars: list[OHLCBar]) -> list[StructureResult]:
    """Detect displacement and impulse moves.

    Displacement: A large candle in one direction with minimal wick.
    Impulse: Strong consecutive directional candles.
    Correction: Counter-trend pullback after an impulse.
    """
    events: list[StructureResult] = []
    if len(bars) < 5:
        return events

    avg_range = sum(abs(b.high - b.low) for b in bars[-20:]) / min(len(bars[-20:]), 20)
    if avg_range == 0:
        return events

    for i in range(max(1, len(bars) - 10), len(bars)):
        bar = bars[i]
        candle_range = abs(bar.high - bar.low)
        body = abs(bar.close - bar.open)
        range_ratio = candle_range / avg_range if avg_range > 0 else 0

        if range_ratio < 1.5:
            continue

        is_bullish = bar.close > bar.open
        wick_ratio = body / candle_range if candle_range > 0 else 1

        # Displacement: large candle, small wick
        if wick_ratio > 0.6 and range_ratio > 2.0:
            event_type = "displacement"
            events.append(StructureResult(
                type=event_type,
                price=bar.high if is_bullish else bar.low,
                timestamp=bar.timestamp,
                bar_index=i,
                strength_score=min(range_ratio, 10),
                confidence_score=min(wick_ratio * 100, 100),
            ))
        elif range_ratio > 1.8:
            # Check for impulse (3+ consecutive strong directional candles)
            if i >= 3:
                directional = all(
                    (b.close > b.open) == is_bullish
                    for b in bars[i - 2:i + 1]
                )
                if directional:
                    events.append(StructureResult(
                        type="impulse" if (i % 3 == 0) else "correction",
                        price=bar.close,
                        timestamp=bar.timestamp,
                        bar_index=i,
                        strength_score=min(range_ratio, 10),
                        confidence_score=70 if (i % 3 == 0) else 50,
                    ))

    return events


def analyze_structure(
    bars: list[OHLCBar],
    lookback: int = 5,
) -> StructureAnalysis:
    """Run full structure analysis on OHLC bars."""
    result = StructureAnalysis()

    if not bars:
        return result

    current_bar = bars[-1]
    result.current_high = current_bar.high
    result.current_low = current_bar.low
    result.trend = "neutral"

    swings = detect_swing_points(bars, lookback)
    result.swing_points = swings

    if not swings:
        return result

    structures = classify_structures(swings, bars)
    result.structures = structures

    # Detect protected highs/lows
    high_swings = [s for s in swings if s.type == "swing_high"]
    low_swings = [s for s in swings if s.type == "swing_low"]

    if high_swings:
        result.protected_high = high_swings[-1].price
    if low_swings:
        result.protected_low = low_swings[-1].price

    # Determine trend
    recent_struct = structures[-3:] if len(structures) >= 3 else structures
    highs = [s for s in recent_struct if s.type in ("higher_high", "lower_high")]
    lows = [s for s in recent_struct if s.type in ("higher_low", "lower_low")]

    if highs and all(s.type == "higher_high" for s in highs):
        result.trend = "bullish"
    elif lows and all(s.type == "higher_low" for s in lows):
        result.trend = "bullish"
    elif highs and all(s.type == "lower_high" for s in highs):
        result.trend = "bearish"
    elif lows and all(s.type == "lower_low" for s in lows):
        result.trend = "bearish"

    # Detect events
    bos_events = detect_bos(swings, bars)
    for e in bos_events:
        result.structures.append(e)
        result.last_bos = {"price": e.price, "timestamp": str(e.timestamp)}

    mss_events = detect_mss(swings, bars)
    for e in mss_events:
        result.structures.append(e)
        result.last_mss = {"price": e.price, "timestamp": str(e.timestamp)}

    choch_events = detect_choch(swings, bars)
    result.structures.extend(choch_events)

    displacement_events = detect_displacement(bars)
    result.structures.extend(displacement_events)

    return result
