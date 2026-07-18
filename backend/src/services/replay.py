"""Historical Replay Engine — replay markets candle by candle.

Enforces that the frontend NEVER sees future candles.
After every saved trade, automatically triggers the full AI pipeline:
  Trade Memory → Knowledge Rules → Knowledge Graph → Statistics → Similarity → Research
"""

import math, random
from datetime import datetime, timezone, timedelta
from uuid import UUID, uuid4
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from src.models.replay import MarketCandle, ReplaySession, ReplayTrade, ReplayBookmark
from src.models.trade import Trade
from src.schemas.trade import TradeCreate
from src.schemas.replay import ReplaySessionCreate, ReplayTradeCreate, ReplayBookmarkCreate
from src.crud import trade as trade_crud


# ---------------------------------------------------------------------------
# Candle seeding — synthetic data generator for demo purposes
# ---------------------------------------------------------------------------

PAIR_CONFIGS = {
    "EURUSD": {"base": 1.0500, "volatility": 0.002},
    "GBPUSD": {"base": 1.2600, "volatility": 0.003},
    "USDJPY": {"base": 150.00, "volatility": 0.5},
    "AUDUSD": {"base": 0.6500, "volatility": 0.002},
    "USDCAD": {"base": 1.3600, "volatility": 0.002},
    "XAUUSD": {"base": 2350.00, "volatility": 10.0},
}

DEFAULT_PAIRS = ["EURUSD", "GBPUSD", "USDJPY"]


def seed_candles(
    db: Session,
    pair: str,
    timeframe: str,
    start_date: datetime,
    end_date: datetime,
) -> int:
    """Generate synthetic candle data for a pair/timeframe window."""
    existing = db.scalar(
        select(func.count(MarketCandle.id))
        .where(MarketCandle.pair == pair, MarketCandle.timeframe == timeframe)
    )
    if existing and existing > 0:
        return existing

    cfg = PAIR_CONFIGS.get(pair, {"base": 1.0000, "volatility": 0.001})
    minutes_map = {"1m": 1, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240, "1d": 1440}
    interval = minutes_map.get(timeframe, 60)

    price = cfg["base"]
    candles = []
    idx = 0
    current = start_date

    while current < end_date:
        o = round(price, 5)
        change = random.gauss(0, cfg["volatility"])
        c = round(price + change, 5)
        h = round(max(o, c) + abs(random.gauss(0, cfg["volatility"] * 0.5)), 5)
        l = round(min(o, c) - abs(random.gauss(0, cfg["volatility"] * 0.5)), 5)
        vol = round(random.uniform(100, 10000), 2)

        candle = MarketCandle(
            id=uuid4(),
            pair=pair,
            timeframe=timeframe,
            timestamp=current,
            open=o,
            high=h,
            low=l,
            close=c,
            volume=vol,
            candle_index=idx,
        )
        candles.append(candle)
        price = c
        idx += 1
        current += timedelta(minutes=interval)

    for batch_start in range(0, len(candles), 500):
        db.bulk_save_objects(candles[batch_start:batch_start + 500])
    db.commit()

    return len(candles)


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------


def create_session(
    db: Session,
    project_id: UUID,
    data: ReplaySessionCreate,
) -> ReplaySession:
    """Create a new replay session and seed candles."""
    total = seed_candles(db, data.pair, data.timeframe, data.start_date, data.end_date)

    session = ReplaySession(
        id=uuid4(),
        project_id=project_id,
        pair=data.pair,
        timeframe=data.timeframe,
        start_date=data.start_date,
        current_date=data.start_date,
        end_date=data.end_date,
        current_candle=0,
        total_candles=total,
        status="active",
        notes=data.notes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session(db: Session, session_id: UUID) -> ReplaySession | None:
    return db.get(ReplaySession, session_id)


def list_sessions(db: Session, project_id: UUID) -> list[ReplaySession]:
    return (
        db.query(ReplaySession)
        .filter(ReplaySession.project_id == project_id)
        .order_by(ReplaySession.created_at.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# Candle navigation — FUTURE CANDLE ENFORCEMENT
# ---------------------------------------------------------------------------


def _get_visible_candles(db: Session, session: ReplaySession) -> list[MarketCandle]:
    """Return candles up to AND INCLUDING current_candle. Never future."""
    return (
        db.query(MarketCandle)
        .filter(
            MarketCandle.pair == session.pair,
            MarketCandle.timeframe == session.timeframe,
            MarketCandle.candle_index <= session.current_candle,
        )
        .order_by(MarketCandle.candle_index.asc())
        .all()
    )


def _get_current_candle(db: Session, session: ReplaySession) -> MarketCandle | None:
    return (
        db.query(MarketCandle)
        .filter(
            MarketCandle.pair == session.pair,
            MarketCandle.timeframe == session.timeframe,
            MarketCandle.candle_index == session.current_candle,
        )
        .first()
    )


def _get_session_trades(db: Session, session_id: UUID) -> list[ReplayTrade]:
    return (
        db.query(ReplayTrade)
        .filter(ReplayTrade.session_id == session_id)
        .order_by(ReplayTrade.created_at.desc())
        .all()
    )


def _get_session_bookmarks(db: Session, session_id: UUID) -> list[ReplayBookmark]:
    return (
        db.query(ReplayBookmark)
        .filter(ReplayBookmark.session_id == session_id)
        .order_by(ReplayBookmark.candle_index.asc())
        .all()
    )


def _build_navigate_response(db: Session, session: ReplaySession) -> dict:
    candle = _get_current_candle(db, session)
    visible = _get_visible_candles(db, session)
    trades = _get_session_trades(db, session.id)
    bookmarks = _get_session_bookmarks(db, session.id)

    return {
        "session": {
            "id": str(session.id),
            "project_id": str(session.project_id),
            "pair": session.pair,
            "timeframe": session.timeframe,
            "start_date": session.start_date.isoformat() if session.start_date else None,
            "current_date": session.current_date.isoformat() if session.current_date else None,
            "end_date": session.end_date.isoformat() if session.end_date else None,
            "current_candle": session.current_candle,
            "total_candles": session.total_candles,
            "status": session.status,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "notes": session.notes,
            "created_at": session.created_at.isoformat() if session.created_at else None,
        },
        "candle": {
            "id": str(candle.id),
            "pair": candle.pair,
            "timeframe": candle.timeframe,
            "timestamp": candle.timestamp.isoformat(),
            "open": candle.open,
            "high": candle.high,
            "low": candle.low,
            "close": candle.close,
            "volume": candle.volume,
            "candle_index": candle.candle_index,
        } if candle else None,
        "candles_visible": [
            {
                "id": str(c.id),
                "pair": c.pair,
                "timeframe": c.timeframe,
                "timestamp": c.timestamp.isoformat(),
                "open": c.open,
                "high": c.high,
                "low": c.low,
                "close": c.close,
                "volume": c.volume,
                "candle_index": c.candle_index,
            }
            for c in visible
        ],
        "trades": [
            {
                "id": str(t.id),
                "session_id": str(t.session_id),
                "trade_id": str(t.trade_id) if t.trade_id else None,
                "candle_index": t.candle_index,
                "direction": t.direction,
                "entry_price": t.entry_price,
                "stop_loss": t.stop_loss,
                "take_profit": t.take_profit,
                "position_size": t.position_size,
                "risk_percent": t.risk_percent,
                "notes": t.notes,
                "confidence": t.confidence,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in trades
        ],
        "bookmarks": [
            {
                "id": str(b.id),
                "session_id": str(b.session_id),
                "candle_index": b.candle_index,
                "date": b.date.isoformat() if b.date else None,
                "note": b.note,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in bookmarks
        ],
    }


def next_candle(db: Session, session_id: UUID) -> dict | None:
    """Advance one candle. Returns None if at end."""
    session = db.get(ReplaySession, session_id)
    if not session or session.status != "active":
        return None
    if session.current_candle >= session.total_candles - 1:
        return None

    session.current_candle += 1
    next_c = _get_current_candle(db, session)
    if next_c:
        session.current_date = next_c.timestamp
    db.commit()
    db.refresh(session)
    return _build_navigate_response(db, session)


def prev_candle(db: Session, session_id: UUID) -> dict | None:
    """Go back one candle. Returns None if at start."""
    session = db.get(ReplaySession, session_id)
    if not session or session.status != "active":
        return None
    if session.current_candle <= 0:
        return None

    session.current_candle -= 1
    prev_c = _get_current_candle(db, session)
    if prev_c:
        session.current_date = prev_c.timestamp
    db.commit()
    db.refresh(session)
    return _build_navigate_response(db, session)


def jump_to_candle(db: Session, session_id: UUID, target_index: int) -> dict | None:
    """Jump to a specific candle index. Cannot go beyond total_candles-1."""
    session = db.get(ReplaySession, session_id)
    if not session or session.status != "active":
        return None

    target = max(0, min(target_index, session.total_candles - 1))
    session.current_candle = target
    jump_c = _get_current_candle(db, session)
    if jump_c:
        session.current_date = jump_c.timestamp
    db.commit()
    db.refresh(session)
    return _build_navigate_response(db, session)


def get_current_state(db: Session, session_id: UUID) -> dict | None:
    """Get current replay state without navigating."""
    session = db.get(ReplaySession, session_id)
    if not session:
        return None
    return _build_navigate_response(db, session)


# ---------------------------------------------------------------------------
# Session lifecycle
# ---------------------------------------------------------------------------


def pause_session(db: Session, session_id: UUID) -> ReplaySession | None:
    session = db.get(ReplaySession, session_id)
    if not session:
        return None
    session.status = "paused"
    db.commit()
    db.refresh(session)
    return session


def resume_session(db: Session, session_id: UUID) -> ReplaySession | None:
    session = db.get(ReplaySession, session_id)
    if not session:
        return None
    session.status = "active"
    db.commit()
    db.refresh(session)
    return session


def finish_session(db: Session, session_id: UUID) -> ReplaySession | None:
    """Finish a replay session."""
    session = db.get(ReplaySession, session_id)
    if not session:
        return None
    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session


# ---------------------------------------------------------------------------
# Trade creation — with auto pipeline trigger
# ---------------------------------------------------------------------------


def _run_ai_pipeline(project_id: UUID, trade: Trade, db: Session) -> None:
    """Run the full AI pipeline after saving a replay trade.

    Trade Memory → Knowledge Rules → Knowledge Graph → Statistics → Similarity → Research
    All wrapped in silent try/except so the replay session is never disrupted.
    """
    try:
        from src.services.trade_memory import generate_trade_memory
        generate_trade_memory(db, trade.id)
    except Exception:
        pass

    try:
        from src.services.knowledge_engine import update_knowledge
        update_knowledge(project_id, db)
    except Exception:
        pass

    try:
        from src.services.knowledge_graph import update_graph
        update_graph(project_id, db)
    except Exception:
        pass

    try:
        from src.services.research.engine import run_research
        question = f"Auto-analysis of replay trade {trade.pair} {trade.direction} at {trade.entry_price}"
        run_research(project_id, question, db)
    except Exception:
        pass

    try:
        from src.models.learning import LearningEvent, KnowledgeSnapshot
        event = LearningEvent(
            project_id=project_id,
            event_type="replay_trade",
            entity_type="trade",
            entity_id=str(trade.id),
            status="completed",
            summary=f"Replay trade saved: {trade.pair} {trade.direction}",
        )
        db.add(event)
        total_trades = db.query(Trade).filter(Trade.project_id == project_id, Trade.status == "CLOSED").count()
        wins = db.query(Trade).filter(Trade.project_id == project_id, Trade.result == "WIN").count()
        wr = (wins / total_trades * 100) if total_trades > 0 else 0
        snapshot = KnowledgeSnapshot(
            project_id=project_id,
            total_trades=total_trades,
            win_rate=wr,
        )
        db.add(snapshot)
        db.commit()
    except Exception:
        pass


def create_trade_in_replay(
    db: Session,
    session_id: UUID,
    project_id: UUID,
    data: ReplayTradeCreate,
) -> dict | None:
    """Create a trade in the replay session and trigger the full AI pipeline."""
    session = db.get(ReplaySession, session_id)
    if not session:
        return None

    candle = _get_current_candle(db, session)
    entry_price = data.entry_price
    exit_price = data.stop_loss if data.direction == "SELL" else data.take_profit
    result = None
    pnl = 0.0
    rr = 0.0

    if data.stop_loss and data.take_profit:
        if data.direction == "BUY":
            risk = entry_price - data.stop_loss
            reward = data.take_profit - entry_price
        else:
            risk = data.stop_loss - entry_price
            reward = entry_price - data.take_profit
        rr = round(reward / risk, 2) if risk > 0 else 0.0

    trade_create = TradeCreate(
        pair=session.pair,
        direction=data.direction,
        entry_price=data.entry_price,
        stop_loss=data.stop_loss,
        take_profit=data.take_profit,
        exit_price=exit_price,
        position_size=data.position_size or 0.01,
        risk_percent=data.risk_percent or 1.0,
        rr=rr,
        pnl=pnl,
        result=result,
        status="CLOSED",
        notes=data.notes,
    )
    trade = trade_crud.create(db, project_id=project_id, obj_in=trade_create)

    replay_trade = ReplayTrade(
        id=uuid4(),
        session_id=session_id,
        trade_id=trade.id,
        candle_index=session.current_candle,
        direction=data.direction,
        entry_price=data.entry_price,
        stop_loss=data.stop_loss,
        take_profit=data.take_profit,
        position_size=data.position_size,
        risk_percent=data.risk_percent,
        notes=data.notes,
        confidence=data.confidence,
    )
    db.add(replay_trade)
    db.commit()

    _run_ai_pipeline(project_id, trade, db)

    return _build_navigate_response(db, session)


# ---------------------------------------------------------------------------
# Bookmarks
# ---------------------------------------------------------------------------


def create_bookmark(
    db: Session,
    session_id: UUID,
    data: ReplayBookmarkCreate,
) -> ReplayBookmark | None:
    session = db.get(ReplaySession, session_id)
    if not session:
        return None

    bookmark = ReplayBookmark(
        id=uuid4(),
        session_id=session_id,
        candle_index=data.candle_index,
        date=data.date,
        note=data.note,
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


def delete_bookmark(db: Session, bookmark_id: UUID) -> bool:
    bookmark = db.get(ReplayBookmark, bookmark_id)
    if not bookmark:
        return False
    db.delete(bookmark)
    db.commit()
    return True


def update_bookmark(db: Session, bookmark_id: UUID, note: str) -> ReplayBookmark | None:
    bookmark = db.get(ReplayBookmark, bookmark_id)
    if not bookmark:
        return None
    bookmark.note = note
    db.commit()
    db.refresh(bookmark)
    return bookmark


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


def get_dashboard_stats(db: Session, project_id: UUID) -> dict:
    total_sessions = db.scalar(
        select(func.count(ReplaySession.id))
        .where(ReplaySession.project_id == project_id)
    ) or 0

    replay_trades = (
        db.query(ReplayTrade)
        .join(ReplaySession)
        .filter(ReplaySession.project_id == project_id)
        .count()
    )

    trades = db.scalars(
        select(Trade)
        .where(Trade.project_id == project_id, Trade.status == "CLOSED")
    ).all()

    total_trades = len(trades)
    wins = sum(1 for t in trades if t.result == "WIN")
    losses = sum(1 for t in trades if t.result == "LOSS")
    avg_rr = 0.0
    if trades:
        rrs = [t.rr for t in trades if t.rr is not None]
        avg_rr = round(sum(rrs) / len(rrs), 2) if rrs else 0.0

    win_rate = round((wins / total_trades * 100), 1) if total_trades > 0 else 0.0

    from src.models.learning import KnowledgeSnapshot
    latest_snap = (
        db.query(KnowledgeSnapshot)
        .filter(KnowledgeSnapshot.project_id == project_id)
        .order_by(KnowledgeSnapshot.created_at.desc())
        .first()
    )

    return {
        "total_sessions": total_sessions,
        "total_trades": replay_trades,
        "avg_rr": avg_rr,
        "avg_win_rate": win_rate,
        "learning_progress": total_trades,
        "knowledge_growth": latest_snap.knowledge_growth if latest_snap else 0,
    }
