"""Setup Scoring Engine - quality and confidence scoring for ICT setups."""

from typing import Optional
from .schemas import (
    StructureAnalysis, FVGAnalysis, OrderBlockAnalysis,
    LiquidityAnalysis, SessionAnalysis, ICTModelResult,
    SetupScore, ExecutionDecision,
)


def score_structure(structure: StructureAnalysis) -> float:
    """Score market structure quality (0-10)."""
    score = 5.0

    if not structure.swing_points:
        return 0.0

    # Trend clarity
    if structure.trend in ("bullish", "bearish"):
        score += 1.5

    # Structure count
    if len(structure.structures) >= 3:
        score += 1.0
    elif len(structure.structures) >= 1:
        score += 0.5

    # Recent structure events
    has_mss = structure.last_mss is not None
    has_bos = structure.last_bos is not None
    if has_mss:
        score += 2.0
    if has_bos and not has_mss:
        score += 1.0

    # Protected levels exist
    if structure.protected_high and structure.protected_low:
        score += 0.5

    return min(score, 10.0)


def score_liquidity(liquidity: LiquidityAnalysis) -> float:
    """Score liquidity setup quality (0-10)."""
    score = 5.0

    total_zones = len(liquidity.zones)
    if total_zones == 0:
        return 0.0

    # Zone diversity
    zone_types = set(z.type for z in liquidity.zones)
    if len(zone_types) >= 3:
        score += 1.5
    elif len(zone_types) >= 2:
        score += 1.0

    # Recent sweeps increase score
    if liquidity.recent_sweeps:
        score += 2.0
        fresh_sweeps = [s for s in liquidity.recent_sweeps if s.strength_score >= 6]
        if fresh_sweeps:
            score += 1.0

    # Equal highs/lows add structure
    if liquidity.equal_highs or liquidity.equal_lows:
        score += 1.0

    # Both buy and sell side liquidity
    if liquidity.buy_side_liquidity and liquidity.sell_side_liquidity:
        score += 0.5

    return min(score, 10.0)


def score_fvg(fvg: FVGAnalysis) -> float:
    """Score FVG setup quality (0-10)."""
    score = 5.0

    if not fvg.fvgs:
        return 0.0

    # Number of FVGs
    if fvg.bullish_count + fvg.bearish_count >= 3:
        score += 1.0
    elif fvg.bullish_count + fvg.bearish_count >= 1:
        score += 0.5

    # Untouched FVGs are more valuable
    untouched = [f for f in fvg.fvgs if f.status == "untouched"]
    if untouched:
        score += 1.5

        # High probability FVGs
        high_prob = [f for f in untouched if f.probability_score > 70]
        if high_prob:
            score += 1.0

    # Best FVG quality
    if fvg.best_fvg:
        if fvg.best_fvg.probability_score > 80:
            score += 1.0

    # Reaction strength
    strong_reactions = [f for f in fvg.fvgs if f.reaction_strength > 5]
    if strong_reactions:
        score += 0.5

    return min(score, 10.0)


def score_order_blocks(ob: OrderBlockAnalysis) -> float:
    """Score Order Block setup quality (0-10)."""
    score = 5.0

    if not ob.order_blocks:
        return 0.0

    # Quantity
    if len(ob.order_blocks) >= 4:
        score += 1.0
    elif len(ob.order_blocks) >= 2:
        score += 0.5

    # Both directions available
    if ob.bullish_count > 0 and ob.bearish_count > 0:
        score += 1.0

    # Quality blocks
    high_quality = [b for b in ob.order_blocks if b.quality_score > 6]
    if high_quality:
        score += 1.5

    # Best block
    if ob.best_block:
        if ob.best_block.validity_score > 7:
            score += 1.0
        if not ob.best_block.is_mitigated:
            score += 0.5

    return min(score, 10.0)


def score_session(session: SessionAnalysis) -> float:
    """Score session alignment quality (0-10)."""
    score = 5.0

    # Kill zone active
    if session.current_kill_zone:
        score += 2.0

    # Silver bullet window
    if session.is_silver_bullet_window:
        score += 2.0

    # Session clarity
    if session.current_session:
        score += 1.0

    # Opening range
    if session.opening_range_high and session.opening_range_low:
        score += 0.5

    return min(score, 10.0)


def score_risk(model: Optional[ICTModelResult] = None) -> float:
    """Score risk level (0-10, higher = better/lower risk)."""
    if not model:
        return 5.0

    score = 7.0

    # Has stop loss
    if model.stop_loss:
        score += 1.0

    # Has take profit
    if model.take_profit:
        score += 1.0

    # Risk-reward ratio
    if model.risk_reward_ratio:
        if model.risk_reward_ratio >= 3.0:
            score += 1.0
        elif model.risk_reward_ratio >= 2.0:
            score += 0.5

    return min(score, 10.0)


def compute_overall(scores: list[float], weights: list[float]) -> float:
    """Compute weighted overall score."""
    if not scores or not weights or len(scores) != len(weights):
        return 0.0
    total_weight = sum(weights)
    if total_weight == 0:
        return 0.0
    return sum(s * w for s, w in zip(scores, weights)) / total_weight


def score_setup(
    structure: Optional[StructureAnalysis] = None,
    fvg: Optional[FVGAnalysis] = None,
    ob: Optional[OrderBlockAnalysis] = None,
    liquidity: Optional[LiquidityAnalysis] = None,
    session: Optional[SessionAnalysis] = None,
    model: Optional[ICTModelResult] = None,
    htf_confluence: float = 0.0,
) -> SetupScore:
    """Compute comprehensive setup score."""
    scores = SetupScore()

    if structure:
        scores.structure_score = score_structure(structure)
    if liquidity:
        scores.liquidity_score = score_liquidity(liquidity)
    if fvg:
        scores.fvg_score = score_fvg(fvg)
    if ob:
        scores.order_block_score = score_order_blocks(ob)
    if session:
        scores.session_score = score_session(session)
    scores.risk_score = score_risk(model)

    # Confluence score: alignment across all factors
    component_scores = [
        scores.structure_score,
        scores.liquidity_score,
        scores.fvg_score,
        scores.order_block_score,
        scores.session_score,
    ]
    weights = [0.25, 0.20, 0.20, 0.20, 0.15]
    scores.confluence_score = compute_overall(component_scores, weights)

    # Overall quality: weighted combination of all scores
    overall_components = [
        scores.structure_score,
        scores.liquidity_score,
        scores.fvg_score,
        scores.order_block_score,
        scores.risk_score,
        scores.session_score,
        scores.confluence_score,
        htf_confluence * 10.0 if htf_confluence > 0 else 5.0,
    ]
    overall_weights = [0.15, 0.15, 0.15, 0.15, 0.10, 0.05, 0.15, 0.10]
    scores.overall_quality = compute_overall(overall_components, overall_weights)

    return scores


def evaluate_execution(
    scores: SetupScore,
    model: Optional[ICTModelResult] = None,
    htf_bias: str = "neutral",
    ltf_confirmation: str = "neutral",
    premium_discount: str = "neutral",
    confluences: Optional[list[str]] = None,
) -> ExecutionDecision:
    """Evaluate execution readiness based on all scores and context."""
    decision = ExecutionDecision()
    decision.scores = scores

    if confluences is None:
        confluences = []

    reasoning_parts: list[str] = []

    if scores.overall_quality >= 8.0:
        decision.status = "ready"
        reasoning_parts.append("Setup quality is excellent")
    elif scores.overall_quality >= 6.0:
        if model and model.risk_reward_ratio and model.risk_reward_ratio >= 2.0:
            if htf_bias == ltf_confirmation and htf_bias != "neutral":
                decision.status = "ready"
                reasoning_parts.append("Good setup with HTF/LTF alignment")
            else:
                decision.status = "wait"
                reasoning_parts.append("Good setup but waiting for confluence")
        else:
            decision.status = "wait"
            reasoning_parts.append("Setup quality is moderate, awaiting confirmation")
    elif scores.overall_quality >= 4.0:
        decision.status = "low_probability"
        reasoning_parts.append("Setup quality below confidence threshold")
    else:
        decision.status = "invalid"
        reasoning_parts.append("Insufficient structure for a valid setup")

    # Risk-based adjustments
    if scores.risk_score < 5.0 and decision.status == "ready":
        decision.status = "high_risk"
        reasoning_parts.append("High risk due to poor risk parameters")

    # Premium/Discount context
    if premium_discount == "premium" and model and model.direction == "bullish":
        reasoning_parts.append("Bullish entry in premium zone - caution advised")
    elif premium_discount == "discount" and model and model.direction == "bearish":
        reasoning_parts.append("Bearish entry in discount zone - caution advised")

    # Model details
    if model:
        decision.direction = model.direction
        decision.entry = (model.entry_price_min + model.entry_price_max) / 2 if model.entry_price_min and model.entry_price_max else None
        decision.stop_loss = model.stop_loss
        decision.take_profit = model.take_profit

    # Reasoning
    if reasoning_parts:
        decision.reasoning = ". ".join(reasoning_parts)

    return decision
