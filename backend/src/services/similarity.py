from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.db.base import Trade, MarketStructure, Pattern, PatternTrade


WEIGHTS = {
    "weekly_bias": 0.20,
    "daily_bias": 0.15,
    "h4_bias": 0.10,
    "pair": 0.10,
    "session": 0.10,
    "liquidity_sweep": 0.10,
    "mss": 0.10,
    "fvg": 0.05,
    "trend": 0.05,
    "market_phase": 0.05,
}

SESSION_WEIGHT = 0.10 / 3


def _build_vector(trade: Trade, ms: MarketStructure | None) -> dict[str, str | None]:
    vec: dict[str, str | None] = {}
    vec["weekly_bias"] = getattr(trade, "weekly_bias", None)
    vec["daily_bias"] = getattr(trade, "daily_bias", None)
    vec["h4_bias"] = getattr(trade, "h4_bias", None)
    vec["pair"] = getattr(trade, "pair", None)
    vec["liquidity_sweep"] = getattr(trade, "liquidity_sweep", None)
    vec["mss"] = getattr(trade, "mss", None)
    vec["fvg"] = getattr(trade, "fvg", None)

    sessions = []
    if getattr(trade, "asian_session", None):
        sessions.append("ASIAN")
    if getattr(trade, "london_session", None):
        sessions.append("LONDON")
    if getattr(trade, "newyork_session", None):
        sessions.append("NEWYORK")
    vec["session"] = "_".join(sorted(sessions)) if sessions else None

    if ms:
        vec["trend"] = getattr(ms, "trend", None)
        vec["market_phase"] = getattr(ms, "market_phase", None)
        if not vec["weekly_bias"]:
            vec["weekly_bias"] = getattr(ms, "weekly_bias", None)
        if not vec["daily_bias"]:
            vec["daily_bias"] = getattr(ms, "daily_bias", None)
        if not vec["h4_bias"]:
            vec["h4_bias"] = getattr(ms, "h4_bias", None)
        if not vec["liquidity_sweep"]:
            vec["liquidity_sweep"] = getattr(ms, "liquidity_sweep", None)
        if not vec["mss"]:
            vec["mss"] = getattr(ms, "mss", None)
        if not vec["fvg"]:
            vec["fvg"] = getattr(ms, "fvg", None)

    return vec


def _compute_similarity(a: dict[str, str | None], b: dict[str, str | None]) -> float:
    score = 0.0

    for field, weight in WEIGHTS.items():
        if field == "session":
            continue
        va = a.get(field)
        vb = b.get(field)
        if va is not None and vb is not None and va == vb:
            score += weight

    sa = set((a.get("session") or "").split("_")) - {""}
    sb = set((b.get("session") or "").split("_")) - {""}
    if sa and sb:
        overlap = len(sa & sb)
        union = len(sa | sb)
        score += SESSION_WEIGHT * (overlap / union) if union > 0 else 0

    return round(min(1.0, score) * 100, 2)


def _get_ms_map(db: Session, trade_ids: list[UUID]) -> dict[UUID, MarketStructure]:
    ms_ids = []
    trades = db.scalars(select(Trade).where(Trade.id.in_(trade_ids))).all()
    for t in trades:
        if t.market_structure_id:
            ms_ids.append(t.market_structure_id)
    if not ms_ids:
        return {}
    mss = db.scalars(select(MarketStructure).where(MarketStructure.id.in_(ms_ids))).all()
    return {ms.id: ms for ms in mss}


def compare_current(db: Session, project_id: UUID, env: dict) -> dict:
    trades = db.scalars(
        select(Trade).where(Trade.project_id == project_id, Trade.status == "CLOSED")
    ).all()
    if not trades:
        return {"matches": [], "summary": _empty_summary()}

    ms_ids = [t.market_structure_id for t in trades if t.market_structure_id]
    ms_map = {}
    if ms_ids:
        mss = db.scalars(select(MarketStructure).where(MarketStructure.id.in_(ms_ids))).all()
        ms_map = {ms.id: ms for ms in mss}

    env_vec: dict[str, str | None] = {
        "weekly_bias": env.get("weekly_bias"),
        "daily_bias": env.get("daily_bias"),
        "h4_bias": env.get("h4_bias"),
        "pair": env.get("pair"),
        "session": "_".join(
            sorted(
                s for s in [
                    "ASIAN" if env.get("asian_session") else None,
                    "LONDON" if env.get("london_session") else None,
                    "NEWYORK" if env.get("newyork_session") else None,
                ] if s
            )
        ) or None,
        "liquidity_sweep": env.get("liquidity_sweep"),
        "mss": env.get("mss"),
        "fvg": env.get("fvg"),
        "trend": env.get("trend"),
        "market_phase": env.get("market_phase"),
    }

    matches = []
    for trade in trades:
        ms = ms_map.get(trade.market_structure_id) if trade.market_structure_id else None
        trade_vec = _build_vector(trade, ms)
        sim = _compute_similarity(env_vec, trade_vec)
        if sim > 0:
            pid = _get_pattern_id(db, project_id, trade.id)
            matches.append(_build_match(trade, sim, pid))

    matches.sort(key=lambda m: m["similarity_score"], reverse=True)
    matches = matches[:100]
    return {"matches": matches, "summary": _build_summary(matches)}


def compare_trade(db: Session, project_id: UUID, trade_id: UUID) -> dict:
    target = db.scalar(
        select(Trade).where(Trade.id == trade_id, Trade.project_id == project_id)
    )
    if not target:
        return {"matches": [], "summary": _empty_summary()}

    target_ms = None
    if target.market_structure_id:
        target_ms = db.scalar(
            select(MarketStructure).where(MarketStructure.id == target.market_structure_id)
        )

    target_vec = _build_vector(target, target_ms)

    trades = db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
            Trade.id != trade_id,
        )
    ).all()
    if not trades:
        return {"matches": [], "summary": _empty_summary()}

    ms_map = _get_ms_map(db, [t.id for t in trades])

    matches = []
    for trade in trades:
        ms = ms_map.get(trade.market_structure_id) if trade.market_structure_id else None
        trade_vec = _build_vector(trade, ms)
        sim = _compute_similarity(target_vec, trade_vec)
        if sim > 0:
            pid = _get_pattern_id(db, project_id, trade.id)
            matches.append(_build_match(trade, sim, pid))

    matches.sort(key=lambda m: m["similarity_score"], reverse=True)
    matches = matches[:100]
    return {"matches": matches, "summary": _build_summary(matches)}


def compare_pattern(db: Session, project_id: UUID, pattern_id: UUID) -> dict:
    pattern = db.scalar(
        select(Pattern).where(Pattern.id == pattern_id, Pattern.project_id == project_id)
    )
    if not pattern:
        return {"matches": [], "summary": _empty_summary()}

    sig = pattern.signature or {}

    pattern_vec: dict[str, str | None] = {
        "weekly_bias": sig.get("weekly_bias"),
        "daily_bias": sig.get("daily_bias"),
        "h4_bias": sig.get("h4_bias"),
        "pair": sig.get("pair"),
        "session": "_".join(
            sorted(
                s for s in [
                    "ASIAN" if sig.get("asian_session") else None,
                    "LONDON" if sig.get("london_session") else None,
                    "NEWYORK" if sig.get("newyork_session") else None,
                ] if s
            )
        ) or None,
        "liquidity_sweep": sig.get("liquidity_sweep"),
        "mss": sig.get("mss"),
        "fvg": sig.get("fvg"),
        "trend": sig.get("trend"),
        "market_phase": sig.get("market_phase"),
    }

    trades = db.scalars(
        select(Trade).where(Trade.project_id == project_id, Trade.status == "CLOSED")
    ).all()
    if not trades:
        return {"matches": [], "summary": _empty_summary()}

    ms_map = _get_ms_map(db, [t.id for t in trades])

    matches = []
    for trade in trades:
        ms = ms_map.get(trade.market_structure_id) if trade.market_structure_id else None
        trade_vec = _build_vector(trade, ms)
        sim = _compute_similarity(pattern_vec, trade_vec)
        if sim > 0:
            pid = _get_pattern_id(db, project_id, trade.id)
            matches.append(_build_match(trade, sim, pid))

    matches.sort(key=lambda m: m["similarity_score"], reverse=True)
    matches = matches[:100]
    return {"matches": matches, "summary": _build_summary(matches)}


def get_history(db: Session, project_id: UUID, limit: int = 50) -> list[dict]:
    trades = db.scalars(
        select(Trade).where(Trade.project_id == project_id, Trade.status == "CLOSED")
        .order_by(Trade.created_at.desc()).limit(limit)
    ).all()
    if not trades:
        return []

    ms_map = _get_ms_map(db, [t.id for t in trades])

    result = []
    for trade in trades:
        ms = ms_map.get(trade.market_structure_id) if trade.market_structure_id else None
        vec = _build_vector(trade, ms)
        result.append({
            "trade_id": str(trade.id),
            "pair": trade.pair,
            "direction": trade.direction,
            "result": trade.result,
            "rr": trade.rr,
            "pnl": trade.pnl,
            "weekly_bias": trade.weekly_bias,
            "market_phase": ms.market_phase if ms else None,
            "trend": ms.trend if ms else None,
            "created_at": trade.created_at.isoformat() if trade.created_at else None,
        })

    return result


def _get_pattern_id(db: Session, project_id: UUID, trade_id: UUID) -> UUID | None:
    link = db.scalar(
        select(PatternTrade).where(
            PatternTrade.project_id == project_id,
            PatternTrade.trade_id == trade_id,
        )
    )
    return link.pattern_id if link else None


def _build_match(trade: Trade, sim: float, pattern_id: UUID | None) -> dict:
    return {
        "trade_id": str(trade.id),
        "pattern_id": str(pattern_id) if pattern_id else None,
        "similarity_score": sim,
        "trade_result": trade.result,
        "rr": trade.rr,
        "pnl": trade.pnl,
        "session": _trade_session(trade),
        "pair": trade.pair,
        "weekly_bias": trade.weekly_bias,
        "market_phase": None,
        "created_at": trade.created_at.isoformat() if trade.created_at else None,
    }


def _trade_session(trade: Trade) -> str | None:
    sessions = []
    if trade.asian_session:
        sessions.append("Asian")
    if trade.london_session:
        sessions.append("London")
    if trade.newyork_session:
        sessions.append("NewYork")
    return ", ".join(sessions) if sessions else None


def _build_summary(matches: list[dict]) -> dict:
    if not matches:
        return _empty_summary()

    total = len(matches)
    wins = sum(1 for m in matches if m.get("trade_result") == "WIN")
    losses = sum(1 for m in matches if m.get("trade_result") == "LOSS")

    rrs = [m["rr"] for m in matches if m.get("rr") is not None]
    pnls = [m["pnl"] for m in matches if m.get("pnl") is not None]

    avg_win_rate = round((wins / total * 100), 1) if total > 0 else 0
    avg_rr = round(sum(rrs) / len(rrs), 2) if rrs else 0
    avg_pnl = round(sum(pnls) / len(pnls), 2) if pnls else 0
    avg_drawdown = round(abs(min((p for p in pnls if p < 0), default=0)), 2) if pnls else 0

    pattern_counts: dict[str, int] = {}
    for m in matches:
        pid = m.get("pattern_id")
        if pid:
            pattern_counts[pid] = pattern_counts.get(pid, 0) + 1

    best_pattern = max(pattern_counts, key=pattern_counts.get) if pattern_counts else None
    worst_pattern = min(pattern_counts, key=pattern_counts.get) if pattern_counts else None

    return {
        "matches_found": total,
        "average_win_rate": avg_win_rate,
        "average_rr": avg_rr,
        "average_pnl": avg_pnl,
        "best_pattern": best_pattern,
        "worst_pattern": worst_pattern,
        "average_drawdown": avg_drawdown,
    }


def _empty_summary() -> dict:
    return {
        "matches_found": 0,
        "average_win_rate": 0,
        "average_rr": 0,
        "average_pnl": 0,
        "best_pattern": None,
        "worst_pattern": None,
        "average_drawdown": 0,
    }
