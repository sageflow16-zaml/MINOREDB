"""Liquidity Engine - detection of liquidity zones, sweeps, and pools."""

from typing import Optional
from .schemas import OHLCBar, LiquidityAnalysis, LiquidityResult
from .structure_engine import detect_swing_points, SwingPoint


def _find_consecutive_levels(
    swings: list[SwingPoint],
    threshold_pct: float = 0.001,
    swing_type: str = "swing_high",
) -> list[list[SwingPoint]]:
    """Group consecutive swing points within threshold of each other."""
    filtered = [s for s in swings if s.type == swing_type]
    if len(filtered) < 2:
        return []

    groups: list[list[SwingPoint]] = []
    current_group: list[SwingPoint] = [filtered[0]]

    for i in range(1, len(filtered)):
        prev = filtered[i - 1]
        curr = filtered[i]
        diff_pct = abs(curr.price - prev.price) / prev.price if prev.price > 0 else 0

        if diff_pct <= threshold_pct:
            current_group.append(curr)
        else:
            if len(current_group) >= 2:
                groups.append(current_group)
            current_group = [curr]

    if len(current_group) >= 2:
        groups.append(current_group)

    return groups


def detect_equal_highs_lows(
    swings: list[SwingPoint],
    threshold_pct: float = 0.001,
) -> list[LiquidityResult]:
    """Detect equal highs and equal lows within a price threshold."""
    results: list[LiquidityResult] = []

    # Equal Highs
    high_groups = _find_consecutive_levels(swings, threshold_pct, "swing_high")
    for group in high_groups:
        avg_price = sum(s.price for s in group) / len(group)
        first = group[0]
        last = group[-1]
        results.append(LiquidityResult(
            type="equal_high",
            top_price=avg_price * 1.001,
            bottom_price=avg_price * 0.999,
            peak_price=max(s.price for s in group),
            timestamp=last.timestamp,
            bar_index=last.index,
            strength_score=min(len(group) * 2.0, 10.0),
        ))

    # Equal Lows
    low_groups = _find_consecutive_levels(swings, threshold_pct, "swing_low")
    for group in low_groups:
        avg_price = sum(s.price for s in group) / len(group)
        first = group[0]
        last = group[-1]
        results.append(LiquidityResult(
            type="equal_low",
            top_price=avg_price * 1.001,
            bottom_price=avg_price * 0.999,
            peak_price=min(s.price for s in group),
            timestamp=last.timestamp,
            bar_index=last.index,
            strength_score=min(len(group) * 2.0, 10.0),
        ))

    return results


def detect_liquidity_zones(
    swings: list[SwingPoint],
    bars: list[OHLCBar],
) -> list[LiquidityResult]:
    """Detect buy-side and sell-side liquidity zones based on swing points."""
    zones: list[LiquidityResult] = []
    if len(swings) < 2 or len(bars) < 5:
        return zones

    current_price = bars[-1].high if bars else 0

    # Buy-side liquidity: above recent swing highs (stop hunts above highs)
    high_swings = [s for s in swings if s.type == "swing_high"]
    if high_swings and len(high_swings) >= 2:
        # Find highest swing
        highest = max(high_swings, key=lambda s: s.price)
        if highest.price > current_price:
            zones.append(LiquidityResult(
                type="buy_side",
                top_price=highest.price * 1.002,
                bottom_price=highest.price * 0.998,
                peak_price=highest.price,
                timestamp=highest.timestamp,
                bar_index=highest.index,
                strength_score=min(len(high_swings) * 1.5, 10.0),
            ))

        # Additional buy-side targets: very recent swing highs
        recent_highs = high_swings[-3:] if len(high_swings) >= 3 else high_swings
        for sh in recent_highs:
            if sh.price > current_price * 0.99:
                zones.append(LiquidityResult(
                    type="buy_side",
                    top_price=sh.price * 1.002,
                    bottom_price=sh.price * 0.998,
                    peak_price=sh.price,
                    timestamp=sh.timestamp,
                    bar_index=sh.index,
                    strength_score=6.0,
                ))

    # Sell-side liquidity: below recent swing lows
    low_swings = [s for s in swings if s.type == "swing_low"]
    if low_swings and len(low_swings) >= 2:
        lowest = min(low_swings, key=lambda s: s.price)
        if lowest.price < current_price:
            zones.append(LiquidityResult(
                type="sell_side",
                top_price=lowest.price * 1.002,
                bottom_price=lowest.price * 0.998,
                peak_price=lowest.price,
                timestamp=lowest.timestamp,
                bar_index=lowest.index,
                strength_score=min(len(low_swings) * 1.5, 10.0),
            ))

        recent_lows = low_swings[-3:] if len(low_swings) >= 3 else low_swings
        for sl in recent_lows:
            if sl.price < current_price * 1.01:
                zones.append(LiquidityResult(
                    type="sell_side",
                    top_price=sl.price * 1.002,
                    bottom_price=sl.price * 0.998,
                    peak_price=sl.price,
                    timestamp=sl.timestamp,
                    bar_index=sl.index,
                    strength_score=6.0,
                ))

    return zones


def detect_liquidity_pools(
    bars: list[OHLCBar],
    lookback: int = 20,
) -> list[LiquidityResult]:
    """Detect liquidity pools and voids in price action.

    Pools: areas of concentrated trading activity (high volume nodes).
    Voids: areas with minimal trading activity (low volume nodes).
    """
    pools: list[LiquidityResult] = []
    if len(bars) < lookback:
        return pools

    recent = bars[-lookback:]
    price_levels: dict[float, int] = {}

    for bar in recent:
        price_range = bar.high - bar.low
        if price_range == 0:
            continue
        step = price_range / 5
        for pct in range(5):
            level = bar.low + step * pct
            key = round(level, 4)
            price_levels[key] = price_levels.get(key, 0) + int(bar.volume) if bar.volume > 0 else 1

    if not price_levels:
        return pools

    max_volume = max(price_levels.values())
    min_volume = min(price_levels.values())
    avg_volume = sum(price_levels.values()) / len(price_levels)

    for price_level, volume in price_levels.items():
        if volume > avg_volume * 1.5 and max_volume > 0:
            pools.append(LiquidityResult(
                type="pool",
                top_price=price_level * 1.001,
                bottom_price=price_level * 0.999,
                peak_price=price_level,
                timestamp=recent[-1].timestamp,
                bar_index=len(bars) - 1,
                strength_score=min(volume / max_volume * 10, 10),
            ))
        elif volume < avg_volume * 0.3 and len(pools) > 0 and avg_volume > 0:
            pools.append(LiquidityResult(
                type="void",
                top_price=price_level * 1.001,
                bottom_price=price_level * 0.999,
                peak_price=price_level,
                timestamp=recent[-1].timestamp,
                bar_index=len(bars) - 1,
                strength_score=min(avg_volume / (volume + 0.01), 10),
            ))

    return pools


def detect_sweeps(
    zones: list[LiquidityResult],
    bars: list[OHLCBar],
) -> list[LiquidityResult]:
    """Detect liquidity sweeps and failed sweeps.

    Sweep: price briefly breaks through a liquidity zone then reverses.
    Failed sweep: price breaks through but continues in the sweep direction.
    """
    sweeps: list[LiquidityResult] = []
    if not zones or len(bars) < 3:
        return sweeps

    last_bar = bars[-1]
    prev_bar = bars[-2] if len(bars) >= 2 else bars[-1]

    for zone in zones:
        zone_zone = LiquidityResult(**zone.model_dump() if hasattr(zone, 'model_dump') else zone.__dict__)
        is_buy_zone = zone.type in ("buy_side", "equal_high")
        is_sell_zone = zone.type in ("sell_side", "equal_low")

        if is_buy_zone:
            # Price breaks above then closes back
            if prev_bar.high > zone.peak_price and last_bar.close < zone.peak_price:
                sweeps.append(LiquidityResult(
                    type="sweep",
                    top_price=zone.peak_price * 1.002,
                    bottom_price=zone.bottom_price,
                    peak_price=zone.peak_price,
                    timestamp=last_bar.timestamp,
                    bar_index=len(bars) - 1,
                    is_swept=True,
                    strength_score=8.0,
                ))
            # Failed sweep: breaks and stays above
            elif prev_bar.high > zone.peak_price and last_bar.close > zone.peak_price:
                sweeps.append(LiquidityResult(
                    type="failed_sweep",
                    top_price=zone.peak_price * 1.005,
                    bottom_price=zone.peak_price * 0.995,
                    peak_price=zone.peak_price,
                    timestamp=last_bar.timestamp,
                    bar_index=len(bars) - 1,
                    is_swept=True,
                    strength_score=6.0,
                ))

        if is_sell_zone:
            if prev_bar.low < zone.peak_price and last_bar.close > zone.peak_price:
                sweeps.append(LiquidityResult(
                    type="sweep",
                    top_price=zone.top_price,
                    bottom_price=zone.peak_price * 0.998,
                    peak_price=zone.peak_price,
                    timestamp=last_bar.timestamp,
                    bar_index=len(bars) - 1,
                    is_swept=True,
                    strength_score=8.0,
                ))
            elif prev_bar.low < zone.peak_price and last_bar.close < zone.peak_price:
                sweeps.append(LiquidityResult(
                    type="failed_sweep",
                    top_price=zone.peak_price * 1.005,
                    bottom_price=zone.peak_price * 0.995,
                    peak_price=zone.peak_price,
                    timestamp=last_bar.timestamp,
                    bar_index=len(bars) - 1,
                    is_swept=True,
                    strength_score=6.0,
                ))

    return sweeps


def analyze_liquidity(
    bars: list[OHLCBar],
    swing_bars: int = 5,
    threshold_pct: float = 0.001,
) -> LiquidityAnalysis:
    """Run full liquidity analysis on OHLC bars."""
    result = LiquidityAnalysis()

    if not bars:
        return result

    swings = detect_swing_points(bars, swing_bars)

    # Equal highs/lows
    equal_zones = detect_equal_highs_lows(swings, threshold_pct)
    result.equal_highs = [z for z in equal_zones if z.type == "equal_high"]
    result.equal_lows = [z for z in equal_zones if z.type == "equal_low"]
    result.zones.extend(equal_zones)

    # Buy/Sell side liquidity
    zones = detect_liquidity_zones(swings, bars)
    result.buy_side_liquidity = [z for z in zones if z.type == "buy_side"]
    result.sell_side_liquidity = [z for z in zones if z.type == "sell_side"]
    result.zones.extend(zones)

    # Pools
    pools = detect_liquidity_pools(bars)
    result.zones.extend(pools)

    # Sweeps
    sweeps = detect_sweeps(result.zones, bars)
    result.recent_sweeps = sweeps
    result.zones.extend(sweeps)

    return result
