from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.market_structure import MarketStructure
from src.models.trade_memory import TradeMemory
from src.schemas.trade_memory import TradeMemoryCreate
from src.crud import trade_memory as crud


def _determine_session(trade: Trade) -> str:
    sessions = []
    if getattr(trade, "asian_session", None):
        sessions.append("ASIAN")
    if getattr(trade, "london_session", None):
        sessions.append("LONDON")
    if getattr(trade, "newyork_session", None):
        sessions.append("NEWYORK")
    return "_".join(sorted(sessions)) if sessions else "NONE"


def _determine_entry_model(trade: Trade, ms: MarketStructure | None) -> str:
    parts = []
    if getattr(trade, "order_block", None):
        parts.append("OB")
    if getattr(trade, "fvg", None):
        parts.append("FVG")
    if getattr(trade, "bos", None):
        parts.append("BOS")
    if getattr(trade, "mss", None):
        parts.append("MSS")
    if ms:
        if getattr(ms, "breaker", None):
            parts.append("BREAKER")
        if getattr(ms, "mitigation", None):
            parts.append("MITIGATION")
    return "+".join(parts) if parts else "DISCRETIONARY"


def _determine_liquidity_type(trade: Trade) -> str:
    if getattr(trade, "liquidity_sweep", None):
        return trade.liquidity_sweep
    return "NONE"


def _determine_execution_model(trade: Trade) -> str:
    if getattr(trade, "position_size", None) and getattr(trade, "risk_percent", None):
        return "FIXED_RISK"
    if getattr(trade, "position_size", None):
        return "FIXED_SIZE"
    return "DISCRETIONARY"


def _build_strengths(trade: Trade, ms: MarketStructure | None) -> list[str]:
    strengths = []
    if trade.result == "WIN":
        strengths.append("Profitable trade")
    if trade.rr and trade.rr >= 2.0:
        strengths.append("Strong risk-to-reward ratio")
    elif trade.rr and trade.rr >= 1.5:
        strengths.append("Decent risk-to-reward ratio")
    if trade.weekly_bias and trade.direction:
        wb = trade.weekly_bias.upper()
        direction = trade.direction.upper()
        if (wb == "BULLISH" and direction == "BUY") or (wb == "BEARISH" and direction == "SELL"):
            strengths.append("Aligned with weekly bias")
        if trade.daily_bias and trade.daily_bias.upper() == direction:
            strengths.append("Aligned with daily bias")
    if getattr(trade, "london_session", None):
        strengths.append("London session execution")
    if getattr(trade, "newyork_session", None):
        strengths.append("New York session execution")
    if ms:
        if ms.market_phase:
            phase = ms.market_phase.upper()
            if "LIQUIDITY" in phase or "BREAKER" in phase or "MSS" in phase:
                strengths.append(f"Recognised market phase: {ms.market_phase}")
        if ms.trend:
            direction = trade.direction.upper() if trade.direction else ""
            trend = ms.trend.upper()
            if ("BULLISH" in trend and "BUY" in direction) or ("BEARISH" in trend and "SELL" in direction):
                strengths.append("Trade with trend")
    return strengths if strengths else ["Basic trade execution"]


def _build_weaknesses(trade: Trade, ms: MarketStructure | None) -> list[str]:
    weaknesses = []
    if trade.result == "LOSS":
        weaknesses.append("Unprofitable trade")
    if trade.rr is not None and trade.rr < 1.0:
        weaknesses.append("Poor risk-to-reward ratio")
    if trade.result == "LOSS" and trade.rr is not None and trade.rr < 1.0:
        weaknesses.append("Risk-to-reward ratio below breakeven")
    if not trade.weekly_bias:
        weaknesses.append("No higher timeframe bias defined")
    if not getattr(trade, "asian_session", None) and not getattr(trade, "london_session", None) and not getattr(trade, "newyork_session", None):
        weaknesses.append("No session context recorded")
    if trade.status == "OPEN":
        weaknesses.append("Trade still open — no outcome yet")
    if ms and not ms.trend:
        weaknesses.append("No market trend recorded")
    return weaknesses


def _build_mistakes(trade: Trade, ms: MarketStructure | None) -> list[str]:
    mistakes = []
    if trade.result == "LOSS":
        if trade.stop_loss and trade.entry_price and trade.rr is not None:
            if trade.rr < 1.0:
                mistakes.append("Stop loss too tight relative to target")
        if not getattr(trade, "mss", None):
            mistakes.append("Entered without MSS confirmation")
        if not getattr(trade, "bos", None):
            mistakes.append("No BOS confirmation before entry")
        if ms:
            if not ms.market_phase:
                mistakes.append("No market phase identification before entry")
        if not trade.weekly_bias:
            mistakes.append("Entered without higher timeframe context")
    if trade.result == "WIN" and trade.rr and trade.rr < 1.5:
        mistakes.append("Exited too early")
    return mistakes


def _build_lessons(trade: Trade, ms: MarketStructure | None) -> list[str]:
    lessons = []
    if trade.result == "WIN":
        if trade.rr and trade.rr >= 2.0:
            lessons.append("Maintain patient entries for high RR setups")
        if trade.weekly_bias or trade.daily_bias:
            lessons.append("Higher timeframe alignment improves outcomes")
        if getattr(trade, "mss", None):
            lessons.append("Wait for MSS confirmation before entry")
        if getattr(trade, "london_session", None):
            lessons.append("London session provides quality setups")
    else:
        if trade.rr and trade.rr < 1.0:
            lessons.append("Avoid trades with risk-to-reward below 1:1")
        if not getattr(trade, "mss", None):
            lessons.append("Always wait for MSS confirmation")
        if not trade.weekly_bias:
            lessons.append("Define higher timeframe bias before entry")
        if ms and not ms.market_phase:
            lessons.append("Identify market phase before entering")
    lessons.append("Review and document every trade for continuous improvement")
    return lessons


def _build_tags(trade: Trade, ms: MarketStructure | None) -> list[str]:
    tags = []
    if trade.pair:
        tags.append(trade.pair)
    if trade.direction:
        tags.append(trade.direction.upper())
    if trade.result:
        tags.append(trade.result)
    session = _determine_session(trade)
    if session != "NONE":
        tags.append(session)
    if trade.weekly_bias:
        tags.append(f"WEEKLY_{trade.weekly_bias.upper()}")
    if ms and ms.market_phase:
        tags.append(ms.market_phase.replace(" ", "_").upper())
    if ms and ms.trend:
        tags.append(ms.trend.replace(" ", "_").upper())
    if trade.rr and trade.rr >= 2.0:
        tags.append("HIGH_RR")
    if trade.rr and trade.rr < 1.0:
        tags.append("LOW_RR")
    if trade.result == "WIN":
        tags.append("WINNING_SETUP")
    else:
        tags.append("LOSING_SETUP")
    return tags


def _compute_confidence(trade: Trade, ms: MarketStructure | None) -> float:
    score = 50.0
    if trade.weekly_bias:
        score += 5.0
    if trade.daily_bias:
        score += 5.0
    if trade.h4_bias:
        score += 3.0
    if ms and ms.market_phase:
        score += 5.0
    if ms and ms.trend:
        score += 5.0
    if getattr(trade, "mss", None):
        score += 5.0
    if getattr(trade, "bos", None):
        score += 5.0
    if getattr(trade, "order_block", None):
        score += 4.0
    if getattr(trade, "fvg", None):
        score += 3.0
    if getattr(trade, "london_session", None):
        score += 5.0
    if getattr(trade, "newyork_session", None):
        score += 3.0
    if trade.risk_percent and trade.risk_percent <= 1.0:
        score += 3.0
    if trade.rr and trade.rr >= 2.0:
        score += 5.0
    elif trade.rr and trade.rr >= 1.5:
        score += 3.0
    if trade.result == "WIN":
        score += 10.0
    else:
        score -= 5.0
    return round(min(100.0, max(0.0, score)), 2)


def _build_summary(trade: Trade, ms: MarketStructure | None) -> str:
    parts = []
    pair = trade.pair or "Unknown pair"
    direction = trade.direction or "Unknown direction"
    result = trade.result or "Unknown result"

    setup_type = "discretionary"
    if ms:
        if ms.market_phase:
            setup_type = ms.market_phase
        if ms.trend:
            setup_type = f"{setup_type} in a {ms.trend} market"

    session_text = _determine_session(trade)
    if session_text != "NONE":
        session_text = session_text.replace("_", " & ").title()
    else:
        session_text = "unspecified session"

    alignment = ""
    if trade.weekly_bias:
        wb = trade.weekly_bias.capitalize()
        direction_cap = direction.capitalize()
        if (wb == "Bullish" and direction_cap == "Buy") or (wb == "Bearish" and direction_cap == "Sell"):
            alignment = " aligned with higher timeframe bias"
        else:
            alignment = f" against {wb} bias"

    parts.append(f"{pair} {direction} trade during {session_text}{alignment}.")
    parts.append(f"Setup type: {setup_type}.")
    parts.append(f"Outcome: {result}")

    if trade.rr is not None:
        parts.append(f"R:R {trade.rr:.2f}.")
    if trade.pnl is not None:
        parts.append(f"P&L {trade.pnl:.2f}.")
    if trade.risk_percent is not None:
        parts.append(f"Risk {trade.risk_percent:.2f}%.")

    entry_model = _determine_entry_model(trade, ms)
    if entry_model != "DISCRETIONARY":
        parts.append(f"Entry triggered by {entry_model}.")

    return " ".join(parts)


def find_similar_trade_matches(db: Session, trade: Trade, limit: int = 5) -> list[dict]:
    from src.services.similarity import compare_trade
    try:
        result = compare_trade(db, project_id=trade.project_id, trade_id=trade.id)
        matches = result.get("matches", [])
        return [m for m in matches if str(m.get("trade_id")) != str(trade.id)][:limit]
    except Exception:
        return []


def generate_trade_memory(db: Session, trade_id: UUID) -> TradeMemory:
    trade = db.scalar(select(Trade).where(Trade.id == trade_id))
    if not trade:
        raise ValueError(f"Trade {trade_id} not found")

    ms = None
    if trade.market_structure_id:
        ms = db.get(MarketStructure, trade.market_structure_id)

    session = _determine_session(trade)
    entry_model = _determine_entry_model(trade, ms)
    liquidity_type = _determine_liquidity_type(trade)
    execution_model = _determine_execution_model(trade)

    strengths = _build_strengths(trade, ms)
    weaknesses = _build_weaknesses(trade, ms)
    mistakes = _build_mistakes(trade, ms)
    lessons = _build_lessons(trade, ms)
    tags = _build_tags(trade, ms)

    confidence = _compute_confidence(trade, ms)
    similar = find_similar_trade_matches(db, trade)
    similarity_score = similar[0].get("similarity_score", 0.0) if similar else 0.0

    summary = _build_summary(trade, ms)

    memory_in = TradeMemoryCreate(
        project_id=trade.project_id,
        trade_id=trade.id,
        pair=trade.pair,
        direction=trade.direction,
        session=session,
        weekly_bias=trade.weekly_bias,
        daily_bias=trade.daily_bias,
        h4_bias=trade.h4_bias,
        market_phase=ms.market_phase if ms else None,
        market_trend=ms.trend if ms else None,
        entry_model=entry_model,
        liquidity_type=liquidity_type,
        execution_model=execution_model,
        risk_percent=trade.risk_percent,
        rr=trade.rr,
        pnl=trade.pnl,
        result=trade.result,
        strengths=strengths,
        weaknesses=weaknesses,
        mistakes=mistakes,
        lessons=lessons,
        tags=tags,
        confidence=confidence,
        similarity_score=similarity_score,
        summary=summary,
    )

    existing = crud.get(db, trade_id=trade.id, project_id=trade.project_id)
    if existing:
        return existing

    return crud.create(db, obj_in=memory_in)
