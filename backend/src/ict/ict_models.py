"""ICT Model Engine - detection of institutional trading setups."""

from typing import Optional
from .schemas import OHLCBar, ICTModelResult, FVGResult, OrderBlockResult, LiquidityResult
from .structure_engine import detect_swing_points, classify_structures, detect_bos, detect_mss
from .fvg_engine import detect_fvgs
from .orderblock_engine import detect_order_blocks
from .liquidity_engine import detect_equal_highs_lows, detect_liquidity_zones


def detect_silver_bullet(
    bars: list[OHLCBar],
    fvgs: list[FVGResult],
    order_blocks: list[OrderBlockResult],
    liquidity: list[LiquidityResult],
) -> list[ICTModelResult]:
    """Detect Silver Bullet setup.

    Criteria:
    - Within Silver Bullet window (London/NY Kill Zone)
    - Liquidity sweep occurred
    - FVG present in the direction of the setup
    - Order Block nearby for entry
    - Clean structure alignment
    """
    models: list[ICTModelResult] = []
    if len(bars) < 10:
        return models

    from .session_engine import identify_session, is_silver_bullet_window

    last_bar = bars[-1]

    has_sweep = any(z.type in ("sweep", "failed_sweep") for z in liquidity)
    has_fvg = any(f.status == "untouched" for f in fvgs)
    has_ob = any(b.quality_score > 5 for b in order_blocks)

    if not (has_sweep and has_fvg and has_ob):
        return models

    # Find the best FVG for direction
    bullish_fvg = [f for f in fvgs if f.type in ("bullish", "inverse_bullish") and f.status == "untouched"]
    bearish_fvg = [f for f in fvgs if f.type in ("bearish", "inverse_bearish") and f.status == "untouched"]

    session = identify_session(last_bar.timestamp)
    kill_zone = session in ("london", "new_york") if session else False

    if not kill_zone:
        return models

    # Bullish Silver Bullet
    if bullish_fvg and has_sweep:
        best_fvg = max(bullish_fvg, key=lambda f: f.probability_score)
        models.append(ICTModelResult(
            model_type="silver_bullet",
            direction="bullish",
            entry_price_min=best_fvg.midpoint,
            entry_price_max=best_fvg.top_price,
            stop_loss=best_fvg.bottom_price * 0.998,
            take_profit=best_fvg.top_price * 1.02,
            risk_reward_ratio=2.0,
            timestamp=last_bar.timestamp,
            bar_index=len(bars) - 1,
            components=["liquidity_sweep", "fvg", "kill_zone"],
            quality_score=best_fvg.probability_score * 0.01,
        ))

    # Bearish Silver Bullet
    if bearish_fvg and has_sweep:
        best_fvg = max(bearish_fvg, key=lambda f: f.probability_score)
        models.append(ICTModelResult(
            model_type="silver_bullet",
            direction="bearish",
            entry_price_min=best_fvg.bottom_price,
            entry_price_max=best_fvg.midpoint,
            stop_loss=best_fvg.top_price * 1.002,
            take_profit=best_fvg.bottom_price * 0.98,
            risk_reward_ratio=2.0,
            timestamp=last_bar.timestamp,
            bar_index=len(bars) - 1,
            components=["liquidity_sweep", "fvg", "kill_zone"],
            quality_score=best_fvg.probability_score * 0.01,
        ))

    return models


def detect_judas_swing(
    bars: list[OHLCBar],
    liquidity: list[LiquidityResult],
) -> list[ICTModelResult]:
    """Detect Judas Swing setup.

    Criteria:
    - False break of structure (price breaks a level then reverses hard)
    - Usually accompanied by a liquidity grab
    - Wick or close back within the range
    """
    models: list[ICTModelResult] = []
    if len(bars) < 5:
        return models

    swings = detect_swing_points(bars, 3)
    events = detect_bos(swings, bars)
    last_bar = bars[-1]
    prev_bar = bars[-2] if len(bars) >= 2 else bars[-1]

    if not events:
        return models

    # Look for a BOS that reversed
    bos_events = [e for e in events if e.type == "bos"]
    if not bos_events:
        return models

    for bos_event in bos_events:
        # Check if price reversed after the BOS
        bos_idx = bos_event.bar_index
        if bos_idx >= len(bars) - 1 or bos_idx < 0:
            continue

        bos_bar = bars[bos_idx] if bos_idx < len(bars) else None
        if not bos_bar:
            continue

        # Bullish Judas Swing: price broke down (bearish BOS) then reversed up
        if prev_bar.low < bos_bar.low and last_bar.close > prev_bar.high:
            models.append(ICTModelResult(
                model_type="judas_swing",
                direction="bullish",
                entry_price_min=bos_bar.low,
                entry_price_max=bos_bar.close,
                stop_loss=bos_bar.low * 0.995,
                take_profit=bos_bar.high * 1.02,
                risk_reward_ratio=2.5,
                timestamp=last_bar.timestamp,
                bar_index=len(bars) - 1,
                components=["false_break", "liquidity_grab", "reversal"],
                quality_score=8.0 if any(z.type == "sweep" for z in liquidity) else 6.0,
            ))

        # Bearish Judas Swing: price broke up (bullish BOS) then reversed down
        elif prev_bar.high > bos_bar.high and last_bar.close < prev_bar.low:
            models.append(ICTModelResult(
                model_type="judas_swing",
                direction="bearish",
                entry_price_min=bos_bar.close,
                entry_price_max=bos_bar.high,
                stop_loss=bos_bar.high * 1.005,
                take_profit=bos_bar.low * 0.98,
                risk_reward_ratio=2.5,
                timestamp=last_bar.timestamp,
                bar_index=len(bars) - 1,
                components=["false_break", "liquidity_grab", "reversal"],
                quality_score=8.0 if any(z.type == "sweep" for z in liquidity) else 6.0,
            ))

    return models


def detect_turtle_soup(
    bars: list[OHLCBar],
    liquidity: list[LiquidityResult],
) -> list[ICTModelResult]:
    """Detect Turtle Soup setup.

    Criteria:
    - Price takes out equal highs or equal lows (liquidity grab)
    - Then reverses sharply
    - Classic reversal pattern from liquidity sweeps
    """
    models: list[ICTModelResult] = []
    if len(bars) < 5:
        return models

    last_bar = bars[-1]
    prev_bar = bars[-2] if len(bars) >= 2 else bars[-1]

    # Find equal highs/lows that were swept
    equal_highs = [z for z in liquidity if z.type == "equal_high"]
    equal_lows = [z for z in liquidity if z.type == "equal_low"]
    sweeps = [z for z in liquidity if z.type == "sweep"]

    if not sweeps and not (equal_highs or equal_lows):
        return models

    # Bullish Turtle Soup: sell-side liquidity swept (below equal lows), price reverses up
    if equal_lows:
        lowest_low = min(z.peak_price for z in equal_lows)
        if prev_bar.low < lowest_low and last_bar.close > lowest_low:
            models.append(ICTModelResult(
                model_type="turtle_soup",
                direction="bullish",
                entry_price_min=lowest_low,
                entry_price_max=lowest_low * 1.005,
                stop_loss=lowest_low * 0.995,
                take_profit=lowest_low * 1.03,
                risk_reward_ratio=3.0,
                timestamp=last_bar.timestamp,
                bar_index=len(bars) - 1,
                components=["equal_lows_swept", "reversal"],
                quality_score=7.5,
            ))

    # Bearish Turtle Soup: buy-side liquidity swept (above equal highs), price reverses down
    if equal_highs:
        highest_high = max(z.peak_price for z in equal_highs)
        if prev_bar.high > highest_high and last_bar.close < highest_high:
            models.append(ICTModelResult(
                model_type="turtle_soup",
                direction="bearish",
                entry_price_min=highest_high * 0.995,
                entry_price_max=highest_high,
                stop_loss=highest_high * 1.005,
                take_profit=highest_high * 0.97,
                risk_reward_ratio=3.0,
                timestamp=last_bar.timestamp,
                bar_index=len(bars) - 1,
                components=["equal_highs_swept", "reversal"],
                quality_score=7.5,
            ))

    return models


def detect_power_of_three(
    bars: list[OHLCBar],
    order_blocks: list[OrderBlockResult],
    liquidity: list[LiquidityResult],
) -> list[ICTModelResult]:
    """Detect Power of Three (AMD) setup.

    Accumulation, Manipulation, Distribution.
    - Accumulation: Price ranges in a zone (consolidation)
    - Manipulation: Price breaks out to grab liquidity, then reverses
    - Distribution: Price moves in the intended direction
    """
    models: list[ICTModelResult] = []
    if len(bars) < 15:
        return models

    swings = detect_swing_points(bars, 3)
    structures = classify_structures(swings, bars)
    last_bar = bars[-1]

    # Check for internal structure (ranging / consolidation)
    recent_struct = structures[-5:] if len(structures) >= 5 else structures
    internal_count = sum(1 for s in recent_struct if s.type == "internal_structure")
    external_count = sum(1 for s in recent_struct if s.type == "external_structure")

    if internal_count < 2:
        return models

    # Check for sweep
    has_sweep = any(z.type == "sweep" for z in liquidity)

    if has_sweep:
        # Determine direction based on sweep
        sell_sweep = any(z.type == "sweep" and z.is_swept and z.peak_price < last_bar.close
                         for z in liquidity)
        buy_sweep = any(z.type == "sweep" and z.is_swept and z.peak_price > last_bar.close
                        for z in liquidity)

        if sell_sweep and any(b.type in ("bullish", "breaker_bullish") for b in order_blocks):
            models.append(ICTModelResult(
                model_type="power_of_three",
                direction="bullish",
                timestamp=last_bar.timestamp,
                bar_index=len(bars) - 1,
                components=["accumulation", "manipulation_sweep", "distribution"],
                quality_score=8.0,
            ))

        if buy_sweep and any(b.type in ("bearish", "breaker_bearish") for b in order_blocks):
            models.append(ICTModelResult(
                model_type="power_of_three",
                direction="bearish",
                timestamp=last_bar.timestamp,
                bar_index=len(bars) - 1,
                components=["accumulation", "manipulation_sweep", "distribution"],
                quality_score=8.0,
            ))

    return models


def detect_liquidity_sweep_reversal(
    bars: list[OHLCBar],
    liquidity: list[LiquidityResult],
    swings: list,
) -> list[ICTModelResult]:
    """Detect Liquidity Sweep Reversal setup."""
    models: list[ICTModelResult] = []
    if len(bars) < 3:
        return models

    sweeps = [z for z in liquidity if z.type == "sweep"]
    if not sweeps:
        return models

    last_bar = bars[-1]
    recent_sweep = max(sweeps, key=lambda s: s.timestamp)

    # Bullish: sell-side swept, price moved up
    if recent_sweep.peak_price > last_bar.low and last_bar.close > recent_sweep.peak_price:
        models.append(ICTModelResult(
            model_type="liquidity_sweep_reversal",
            direction="bullish",
            entry_price_min=recent_sweep.peak_price * 0.998,
            entry_price_max=recent_sweep.peak_price,
            stop_loss=recent_sweep.peak_price * 0.99,
            take_profit=recent_sweep.peak_price * 1.03,
            risk_reward_ratio=3.0,
            timestamp=last_bar.timestamp,
            bar_index=len(bars) - 1,
            components=["liquidity_sweep", "reversal"],
            quality_score=7.0,
        ))

    # Bearish: buy-side swept, price moved down
    if recent_sweep.peak_price < last_bar.high and last_bar.close < recent_sweep.peak_price:
        models.append(ICTModelResult(
            model_type="liquidity_sweep_reversal",
            direction="bearish",
            entry_price_min=recent_sweep.peak_price,
            entry_price_max=recent_sweep.peak_price * 1.002,
            stop_loss=recent_sweep.peak_price * 1.01,
            take_profit=recent_sweep.peak_price * 0.97,
            risk_reward_ratio=3.0,
            timestamp=last_bar.timestamp,
            bar_index=len(bars) - 1,
            components=["liquidity_sweep", "reversal"],
            quality_score=7.0,
        ))

    return models


def detect_displacement_entry(
    bars: list[OHLCBar],
    fvgs: list[FVGResult],
    order_blocks: list[OrderBlockResult],
) -> list[ICTModelResult]:
    """Detect Displacement Entry setup.

    Strong impulse (displacement) + FVG + Order Block alignment.
    """
    models: list[ICTModelResult] = []
    if len(bars) < 5:
        return models

    last_bar = bars[-1]
    avg_range = sum(abs(b.high - b.low) for b in bars[-10:]) / min(len(bars[-10:]), 10)
    if avg_range == 0:
        return models

    # Check for displacement in last 3 bars
    for i in range(max(0, len(bars) - 3), len(bars)):
        bar = bars[i]
        range_ratio = abs(bar.high - bar.low) / avg_range
        body = abs(bar.close - bar.open)
        body_ratio = body / (bar.high - bar.low) if (bar.high - bar.low) > 0 else 0

        if range_ratio > 2.0 and body_ratio > 0.6:
            is_bullish = bar.close > bar.open

            # Check for FVG in displacement direction
            aligned_fvgs = [
                f for f in fvgs
                if (is_bullish and f.type in ("bullish", "inverse_bullish") and f.status == "untouched") or
                   (not is_bullish and f.type in ("bearish", "inverse_bearish") and f.status == "untouched")
            ]
            aligned_obs = [
                b for b in order_blocks
                if (is_bullish and b.type in ("bullish", "breaker_bullish")) or
                   (not is_bullish and b.type in ("bearish", "breaker_bearish"))
            ]

            if aligned_fvgs and aligned_obs:
                best_fvg = max(aligned_fvgs, key=lambda f: f.probability_score)
                models.append(ICTModelResult(
                    model_type="displacement_entry",
                    direction="bullish" if is_bullish else "bearish",
                    entry_price_min=best_fvg.midpoint * 0.995 if is_bullish else best_fvg.midpoint,
                    entry_price_max=best_fvg.midpoint if is_bullish else best_fvg.midpoint * 1.005,
                    stop_loss=best_fvg.bottom_price * 0.99 if is_bullish else best_fvg.top_price * 1.01,
                    take_profit=bar.high * 1.02 if is_bullish else bar.low * 0.98,
                    risk_reward_ratio=2.5,
                    timestamp=bar.timestamp,
                    bar_index=i,
                    components=["displacement", "fvg", "order_block"],
                    quality_score=min(best_fvg.probability_score * 0.01 * 10, 10),
                ))

    return models


def detect_ote(
    bars: list[OHLCBar],
    fvgs: list[FVGResult],
    order_blocks: list[OrderBlockResult],
) -> list[ICTModelResult]:
    """Detect Optimal Trade Entry setup.

    Retracement to FVG midpoint or Order Block zone within premium/discount.
    """
    models: list[ICTModelResult] = []
    if len(bars) < 5:
        return models

    last_bar = bars[-1]
    prev_bar = bars[-2] if len(bars) >= 2 else bars[-1]

    for fvg in fvgs:
        if fvg.status != "untouched":
            continue

        price_is_in_fvg = fvg.bottom_price <= last_bar.close <= fvg.top_price
        if not price_is_in_fvg:
            continue

        is_bullish = fvg.type in ("bullish", "inverse_bullish")

        aligned_ob = [
            b for b in order_blocks
            if (is_bullish and b.type in ("bullish", "breaker_bullish")) or
               (not is_bullish and b.type in ("bearish", "breaker_bearish"))
        ]

        if aligned_ob:
            models.append(ICTModelResult(
                model_type="ote",
                direction="bullish" if is_bullish else "bearish",
                entry_price_min=last_bar.close * 0.998 if is_bullish else last_bar.close,
                entry_price_max=last_bar.close if is_bullish else last_bar.close * 1.002,
                stop_loss=aligned_ob[0].bottom_price * 0.99 if is_bullish else aligned_ob[0].top_price * 1.01,
                take_profit=last_bar.close * 1.02 if is_bullish else last_bar.close * 0.98,
                risk_reward_ratio=2.0,
                timestamp=last_bar.timestamp,
                bar_index=len(bars) - 1,
                components=["fvg_retracement", "order_block_alignment", "ote"],
                quality_score=fvg.probability_score * 0.01 * 8,
            ))

    return models


def detect_all_models(
    bars: list[OHLCBar],
    fvgs: list[FVGResult],
    order_blocks: list[OrderBlockResult],
    liquidity: list[LiquidityResult],
) -> list[ICTModelResult]:
    """Run all ICT model detectors."""
    models: list[ICTModelResult] = []

    models.extend(detect_silver_bullet(bars, fvgs, order_blocks, liquidity))
    models.extend(detect_judas_swing(bars, liquidity))
    models.extend(detect_turtle_soup(bars, liquidity))
    models.extend(detect_power_of_three(bars, order_blocks, liquidity))
    models.extend(detect_liquidity_sweep_reversal(bars, liquidity, []))
    models.extend(detect_displacement_entry(bars, fvgs, order_blocks))
    models.extend(detect_ote(bars, fvgs, order_blocks))

    return models
