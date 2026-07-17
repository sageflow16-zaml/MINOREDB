from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.db.base import Trade, MarketStructure, Pattern, PatternTrade
from src.services import similarity, statistics
from src.crud import pattern as pattern_crud


SIMILARITY_WEIGHT = 0.25
PATTERN_WEIGHT = 0.25
SAMPLE_WEIGHT = 0.15
STATS_WEIGHT = 0.20
EVIDENCE_WEIGHT = 0.15


def evaluate_current(db: Session, project_id: UUID, env: dict) -> dict:
    """Evaluate current environment against historical methodology."""
    market_alignment = _evaluate_market_alignment(env)
    ict_components = _evaluate_ict_components(env)
    session_alignment = _evaluate_session(env)

    pattern_match = _get_pattern_match(db, project_id, env)
    similarity_result = similarity.compare_current(db, project_id=project_id, env=env)
    sim_summary = similarity_result.get("summary", {})
    sim_matches = similarity_result.get("matches", [])

    stats_context = _get_statistics_context(db, project_id, env)

    confidence = _compute_confidence(
        pattern_match=pattern_match,
        similarity_summary=sim_summary,
        stats_context=stats_context,
        market_alignment=market_alignment,
        ict_components=ict_components,
        session_alignment=session_alignment,
    )

    execution = _evaluate_execution(
        market_alignment=market_alignment,
        pattern_match=pattern_match,
        sim_summary=sim_summary,
        stats_context=stats_context,
    )

    explanation = _generate_explanation(
        market_alignment=market_alignment,
        ict_components=ict_components,
        session_alignment=session_alignment,
        pattern_match=pattern_match,
        sim_summary=sim_summary,
        stats_context=stats_context,
        execution=execution,
        confidence=confidence,
    )

    return {
        "market_alignment": market_alignment,
        "ict_components": ict_components,
        "session_alignment": session_alignment,
        "pattern_match": pattern_match,
        "similarity": {
            "matches_found": sim_summary.get("matches_found", 0),
            "average_win_rate": sim_summary.get("average_win_rate", 0),
            "average_rr": sim_summary.get("average_rr", 0),
            "average_pnl": sim_summary.get("average_pnl", 0),
            "average_drawdown": sim_summary.get("average_drawdown", 0),
            "top_matches": sim_matches[:10],
        },
        "statistics": stats_context,
        "confidence": confidence,
        "execution": execution,
        "explanation": explanation,
    }


def evaluate_trade(db: Session, project_id: UUID, trade_id: UUID) -> dict:
    """Evaluate a specific trade against historical data."""
    target = db.scalar(
        select(Trade).where(Trade.id == trade_id, Trade.project_id == project_id)
    )
    if not target:
        return _empty_result()

    target_ms = None
    if target.market_structure_id:
        target_ms = db.scalar(
            select(MarketStructure).where(MarketStructure.id == target.market_structure_id)
        )

    env = _trade_to_env(target, target_ms)
    return evaluate_current(db, project_id, env)


def get_history(db: Session, project_id: UUID, limit: int = 20) -> list[dict]:
    """Get recent decision evaluations."""
    trades = db.scalars(
        select(Trade).where(
            Trade.project_id == project_id, Trade.status == "CLOSED"
        ).order_by(Trade.created_at.desc()).limit(limit)
    ).all()

    result = []
    for trade in trades:
        ms = None
        if trade.market_structure_id:
            ms = db.scalar(
                select(MarketStructure).where(MarketStructure.id == trade.market_structure_id)
            )
        env = _trade_to_env(trade, ms)
        alignment = _evaluate_market_alignment(env)
        result.append({
            "trade_id": str(trade.id),
            "pair": trade.pair,
            "direction": trade.direction,
            "result": trade.result,
            "rr": trade.rr,
            "pnl": trade.pnl,
            "market_alignment": alignment.get("score", 0),
            "created_at": trade.created_at.isoformat() if trade.created_at else None,
        })

    return result


def _trade_to_env(trade: Trade, ms: MarketStructure | None) -> dict:
    return {
        "pair": trade.pair,
        "direction": trade.direction,
        "weekly_bias": trade.weekly_bias,
        "daily_bias": trade.daily_bias,
        "h4_bias": trade.h4_bias,
        "market_phase": ms.market_phase if ms else None,
        "trend": ms.trend if ms else None,
        "asian_session": bool(trade.asian_session),
        "london_session": bool(trade.london_session),
        "newyork_session": bool(trade.newyork_session),
        "liquidity_sweep": trade.liquidity_sweep,
        "bos": trade.bos,
        "mss": trade.mss,
        "order_block": trade.order_block,
        "fvg": trade.fvg,
    }


def _evaluate_market_alignment(env: dict) -> dict:
    """Evaluate how well biases align with each other."""
    biases = {
        "weekly_bias": env.get("weekly_bias"),
        "daily_bias": env.get("daily_bias"),
        "h4_bias": env.get("h4_bias"),
    }
    trend = env.get("trend")
    phase = env.get("market_phase")

    set_biases = {v for v in biases.values() if v}
    if not set_biases:
        return {"score": 0, "details": "No bias data available", "aligned_biases": [], "conflicting_biases": []}

    aligned = []
    conflicting = []
    vals = list(biases.values())
    non_null = [v for v in vals if v]
    if non_null and len(set(non_null)) == 1:
        aligned = [f"All biases: {non_null[0]}"]
    else:
        for name, val in biases.items():
            if val:
                others = [v for k, v in biases.items() if k != name and v]
                if all(o == val for o in others):
                    aligned.append(f"{name}: {val}")
                else:
                    conflicting.append(f"{name}: {val}")

    if trend:
        if non_null and trend.upper() in ("UPTREND", "DOWNTREND"):
            if (trend.upper() == "UPTREND" and non_null[0].upper() == "BULLISH") or \
               (trend.upper() == "DOWNTREND" and non_null[0].upper() == "BEARISH"):
                aligned.append(f"Trend {trend} aligns with bias")
            else:
                conflicting.append(f"Trend {trend} conflicts with bias")

    total_factors = len(set_biases) + (1 if trend else 0) + (1 if phase else 0)
    score = round((len(aligned) / max(total_factors, 1)) * 100, 1) if total_factors > 0 else 0

    return {
        "score": score,
        "details": f"{len(aligned)} aligned, {len(conflicting)} conflicting",
        "aligned_biases": aligned,
        "conflicting_biases": conflicting,
    }


def _evaluate_ict_components(env: dict) -> dict:
    """Evaluate ICT/SMC component presence."""
    components = {
        "liquidity_sweep": env.get("liquidity_sweep"),
        "bos": env.get("bos"),
        "mss": env.get("mss"),
        "order_block": env.get("order_block"),
        "fvg": env.get("fvg"),
    }

    present = {k: v for k, v in components.items() if v}
    missing = {k: v for k, v in components.items() if not v}

    score = round((len(present) / max(len(components), 1)) * 100, 1)

    return {
        "score": score,
        "present": list(present.keys()),
        "missing": list(missing.keys()),
        "details": f"{len(present)}/{len(components)} components detected",
    }


def _evaluate_session(env: dict) -> dict:
    """Evaluate session alignment."""
    sessions = []
    if env.get("asian_session"):
        sessions.append("Asian")
    if env.get("london_session"):
        sessions.append("London")
    if env.get("newyork_session"):
        sessions.append("NewYork")

    active = len(sessions)
    score = min(100, active * 33.3) if active > 0 else 0

    return {
        "score": round(score, 1),
        "active_sessions": sessions,
        "details": f"{active} session(s) active: {', '.join(sessions)}" if sessions else "No sessions active",
    }


def _get_pattern_match(db: Session, project_id: UUID, env: dict) -> dict:
    """Find the best matching pattern for the environment."""
    patterns = pattern_crud.get_multi(db, project_id=project_id, skip=0, limit=100)
    if not patterns:
        return {"found": False, "name": None, "win_rate": 0, "expectancy": 0, "occurrences": 0, "confidence": 0}

    best = None
    best_score = 0

    for pattern in patterns:
        sig = pattern.signature or {}
        score = 0
        compare_fields = ["weekly_bias", "daily_bias", "h4_bias", "pair", "market_phase", "trend",
                          "liquidity_sweep", "mss", "fvg"]
        matches = 0
        total = 0
        for field in compare_fields:
            ev = env.get(field)
            sv = sig.get(field)
            if ev and sv:
                total += 1
                if ev == sv:
                    matches += 1
        if total > 0:
            score = matches / total

        if score > best_score:
            best_score = score
            best = pattern

    if best and best_score > 0.3:
        return {
            "found": True,
            "name": best.name,
            "win_rate": best.win_rate,
            "expectancy": best.expectancy,
            "occurrences": best.total_occurrences,
            "confidence": round(best.confidence_score * 100, 1),
            "avg_rr": best.average_rr,
            "profit_factor": best.profit_factor,
            "match_score": round(best_score * 100, 1),
        }

    return {"found": False, "name": None, "win_rate": 0, "expectancy": 0, "occurrences": 0, "confidence": 0}


def _get_statistics_context(db: Session, project_id: UUID, env: dict) -> dict:
    """Get statistical context for the current environment."""
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    ov = overview.get("overview", {})
    risk = overview.get("risk", {})

    pair_stats = None
    pair = env.get("pair")
    if pair:
        by_pair = overview.get("by_pair", {})
        pair_stats = by_pair.get(pair)

    session_stats = None
    sessions = []
    if env.get("asian_session"):
        sessions.append("asian_session")
    if env.get("london_session"):
        sessions.append("london_session")
    if env.get("newyork_session"):
        sessions.append("newyork_session")
    if sessions:
        by_session = overview.get("by_session", {})
        for s in sessions:
            if s in by_session:
                session_stats = by_session[s]
                break

    return {
        "overall_win_rate": ov.get("win_rate", 0),
        "overall_avg_rr": ov.get("avg_rr", 0),
        "overall_expectancy": ov.get("expectancy", 0),
        "overall_total_trades": ov.get("closed_trades", 0),
        "overall_profit_factor": risk.get("profit_factor", 0),
        "overall_max_drawdown": risk.get("max_drawdown", 0),
        "pair_stats": pair_stats,
        "session_stats": session_stats,
    }


def _compute_confidence(
    pattern_match: dict,
    similarity_summary: dict,
    stats_context: dict,
    market_alignment: dict,
    ict_components: dict,
    session_alignment: dict,
) -> dict:
    """Compute overall confidence score (0-100)."""
    pattern_score = pattern_match.get("confidence", 0) * PATTERN_WEIGHT
    sim_matches = similarity_summary.get("matches_found", 0)
    sim_score = min(100, sim_matches * 2) * SIMILARITY_WEIGHT
    total_trades = stats_context.get("overall_total_trades", 0)
    sample_score = min(100, total_trades) * SAMPLE_WEIGHT
    stats_wr = stats_context.get("overall_win_rate", 0)
    stats_score = stats_wr * STATS_WEIGHT
    evidence_score = (
        market_alignment.get("score", 0) * 0.4
        + ict_components.get("score", 0) * 0.3
        + session_alignment.get("score", 0) * 0.3
    ) * EVIDENCE_WEIGHT

    raw = pattern_score + sim_score + sample_score + stats_score + evidence_score
    score = round(min(100, max(0, raw)), 1)

    if score >= 75:
        level = "STRONG"
    elif score >= 50:
        level = "MODERATE"
    elif score >= 25:
        level = "WEAK"
    else:
        level = "INSUFFICIENT"

    return {"score": score, "level": level}


def _evaluate_execution(
    market_alignment: dict,
    pattern_match: dict,
    sim_summary: dict,
    stats_context: dict,
) -> dict:
    """Evaluate execution conditions WITHOUT recommending direction."""
    criteria = []
    satisfied = 0
    total = 0

    if market_alignment.get("score", 0) >= 50:
        criteria.append({"name": "Market Alignment", "met": True, "detail": f"{market_alignment['score']}%"})
        satisfied += 1
    else:
        criteria.append({"name": "Market Alignment", "met": False, "detail": f"{market_alignment.get('score', 0)}%"})
    total += 1

    if pattern_match.get("found"):
        criteria.append({"name": "Pattern Match", "met": True, "detail": pattern_match.get("name", "—")})
        satisfied += 1
    else:
        criteria.append({"name": "Pattern Match", "met": False, "detail": "No matching pattern"})
    total += 1

    if sim_summary.get("matches_found", 0) >= 5:
        criteria.append({"name": "Historical Similarity", "met": True, "detail": f"{sim_summary['matches_found']} matches"})
        satisfied += 1
    else:
        criteria.append({"name": "Historical Similarity", "met": False, "detail": f"{sim_summary.get('matches_found', 0)} matches"})
    total += 1

    if stats_context.get("overall_win_rate", 0) >= 50 and stats_context.get("overall_total_trades", 0) >= 10:
        criteria.append({"name": "Statistical Reliability", "met": True, "detail": f"WR {stats_context['overall_win_rate']}% ({stats_context['overall_total_trades']} trades)"})
        satisfied += 1
    else:
        criteria.append({"name": "Statistical Reliability", "met": False, "detail": f"WR {stats_context.get('overall_win_rate', 0)}%"})
    total += 1

    ratio = satisfied / total if total > 0 else 0
    if ratio >= 0.75:
        status = "SATISFIED"
    elif ratio >= 0.5:
        status = "PARTIALLY_SATISFIED"
    else:
        status = "NOT_SATISFIED"

    return {"status": status, "criteria": criteria, "satisfied": satisfied, "total": total}


def _generate_explanation(
    market_alignment: dict,
    ict_components: dict,
    session_alignment: dict,
    pattern_match: dict,
    sim_summary: dict,
    stats_context: dict,
    execution: dict,
    confidence: dict,
) -> list[str]:
    """Generate human-readable explanation of the evaluation."""
    lines = []

    if execution["status"] == "SATISFIED":
        lines.append("Execution conditions are satisfied because:")
    elif execution["status"] == "PARTIALLY_SATFISIED":
        lines.append("Execution conditions are partially satisfied:")
    else:
        lines.append("Execution conditions are not satisfied:")

    aligned = market_alignment.get("aligned_biases", [])
    conflicting = market_alignment.get("conflicting_biases", [])
    if aligned:
        for a in aligned:
            lines.append(f"- {a}")
    if conflicting:
        for c in conflicting:
            lines.append(f"- {c} (conflict)")

    if session_alignment.get("active_sessions"):
        lines.append(f"- Active session(s): {', '.join(session_alignment['active_sessions'])}")

    present = ict_components.get("present", [])
    if present:
        lines.append(f"- ICT components present: {', '.join(present)}")

    if pattern_match.get("found"):
        lines.append(f"- Pattern '{pattern_match['name']}' matched with {pattern_match.get('match_score', 0)}% similarity")
        lines.append(f"  Historical win rate: {pattern_match['win_rate']}%, expectancy: {pattern_match['expectancy']}, occurrences: {pattern_match['occurrences']}")
    else:
        lines.append("- No matching pattern found")

    sim_count = sim_summary.get("matches_found", 0)
    if sim_count > 0:
        lines.append(f"- Similarity engine found {sim_count} comparable trades")
        lines.append(f"  Historical win rate: {sim_summary.get('average_win_rate', 0)}%, avg RR: {sim_summary.get('average_rr', 0)}")
    else:
        lines.append("- No comparable historical trades found")

    total = stats_context.get("overall_total_trades", 0)
    if total > 0:
        lines.append(f"- Overall methodology: {total} closed trades, {stats_context['overall_win_rate']}% win rate, expectancy {stats_context['overall_expectancy']}")

    for c in execution.get("criteria", []):
        if not c["met"]:
            lines.append(f"- {c['name']}: NOT MET ({c['detail']})")

    if not lines[0].startswith("Execution"):
        lines.insert(0, "Evidence summary:")

    return lines


def _empty_result() -> dict:
    return {
        "market_alignment": {"score": 0, "details": "No data", "aligned_biases": [], "conflicting_biases": []},
        "ict_components": {"score": 0, "present": [], "missing": [], "details": "No data"},
        "session_alignment": {"score": 0, "active_sessions": [], "details": "No data"},
        "pattern_match": {"found": False, "name": None, "win_rate": 0, "expectancy": 0, "occurrences": 0, "confidence": 0},
        "similarity": {"matches_found": 0, "average_win_rate": 0, "average_rr": 0, "average_pnl": 0, "average_drawdown": 0, "top_matches": []},
        "statistics": {"overall_win_rate": 0, "overall_avg_rr": 0, "overall_expectancy": 0, "overall_total_trades": 0, "overall_profit_factor": 0, "overall_max_drawdown": 0, "pair_stats": None, "session_stats": None},
        "confidence": {"score": 0, "level": "INSUFFICIENT"},
        "execution": {"status": "NOT_SATISFIED", "criteria": [], "satisfied": 0, "total": 0},
        "explanation": ["Insufficient data to evaluate."],
    }
