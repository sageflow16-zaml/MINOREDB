from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, update as sa_update
from sqlalchemy.orm import Session
from src.models.strategy import Strategy, StrategyVersion
from src.models.trade import Trade
from src.schemas.strategy import StrategyCreate, StrategyUpdate, StrategyVersionCreate
from src.core.config import settings


def get(db: Session, id: UUID, project_id: UUID | None = None) -> Strategy | None:
    if project_id:
        return db.scalar(select(Strategy).where(Strategy.id == id, Strategy.project_id == project_id))
    return db.get(Strategy, id)


def get_multi(
    db: Session, *, skip: int = 0, limit: int = 100,
    project_id: UUID | None = None,
    status: str | None = None,
    category: str | None = None,
    market: str | None = None,
    search: str | None = None,
    tag: str | None = None,
) -> list[Strategy]:
    stmt = select(Strategy)
    if project_id:
        stmt = stmt.where(Strategy.project_id == project_id)
    if status:
        stmt = stmt.where(Strategy.status == status)
    if category:
        stmt = stmt.where(Strategy.category == category)
    if market:
        stmt = stmt.where(Strategy.market == market)
    if tag:
        stmt = stmt.where(Strategy.tags.any(tag))
    if search:
        stmt = stmt.where(
            Strategy.name.ilike(f"%{search}%") | Strategy.description.ilike(f"%{search}%")
        )
    stmt = stmt.order_by(Strategy.updated_at.desc())
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()


def count(
    db: Session, *, project_id: UUID | None = None,
    status: str | None = None,
    category: str | None = None,
) -> int:
    stmt = select(func.count()).select_from(Strategy)
    if project_id:
        stmt = stmt.where(Strategy.project_id == project_id)
    if status:
        stmt = stmt.where(Strategy.status == status)
    if category:
        stmt = stmt.where(Strategy.category == category)
    return db.scalar(stmt) or 0


def create(db: Session, *, project_id: UUID, obj_in: StrategyCreate) -> Strategy:
    db_obj = Strategy(**obj_in.model_dump(), project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, *, db_obj: Strategy, obj_in: StrategyUpdate) -> Strategy:
    update_data = obj_in.model_dump(exclude_unset=True)
    now = datetime.now(timezone.utc)
    update_data["updated_at"] = now
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> Strategy | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        if hasattr(obj, 'deleted_at'):
            db.execute(sa_update(Strategy).where(Strategy.id == id).values(deleted_at=datetime.now(timezone.utc)))
            db.commit()
            return obj
        db.delete(obj)
        db.commit()
    return obj


def duplicate(db: Session, *, id: UUID, project_id: UUID) -> Strategy | None:
    original = get(db, id, project_id=project_id)
    if not original:
        return None
    new_obj = Strategy(
        project_id=project_id,
        name=f"{original.name} (Copy)",
        description=original.description,
        category=original.category,
        market=original.market,
        instrument_types=original.instrument_types,
        timeframes=original.timeframes,
        version="1.0.0",
        status="Draft",
        market_bias=original.market_bias,
        entry_conditions=original.entry_conditions,
        confirmation_rules=original.confirmation_rules,
        invalidation_rules=original.invalidation_rules,
        exit_rules=original.exit_rules,
        risk_rules=original.risk_rules,
        entry_model=original.entry_model,
        stop_loss_model=original.stop_loss_model,
        take_profit_model=original.take_profit_model,
        partial_close_rules=original.partial_close_rules,
        trade_management_rules=original.trade_management_rules,
        preferred_sessions=original.preferred_sessions,
        preferred_market_conditions=original.preferred_market_conditions,
        volatility_requirements=original.volatility_requirements,
        news_restrictions=original.news_restrictions,
        required_mindset=original.required_mindset,
        discipline_rules=original.discipline_rules,
        common_mistakes=original.common_mistakes,
        things_to_avoid=original.things_to_avoid,
        checklist_items=original.checklist_items,
        documentation=original.documentation,
        tags=original.tags,
        author=original.author,
    )
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    return new_obj


# ── Version Management ──

def get_versions(db: Session, *, strategy_id: UUID) -> list[StrategyVersion]:
    stmt = select(StrategyVersion).where(
        StrategyVersion.strategy_id == strategy_id
    ).order_by(StrategyVersion.created_at.desc())
    return db.scalars(stmt).all()


def create_version(
    db: Session, *, strategy_id: UUID, project_id: UUID, obj_in: StrategyVersionCreate
) -> StrategyVersion | None:
    strategy = get(db, strategy_id, project_id=project_id)
    if not strategy:
        return None
    snapshot = {
        "name": strategy.name,
        "description": strategy.description,
        "category": strategy.category,
        "market": strategy.market,
        "instrument_types": strategy.instrument_types,
        "timeframes": strategy.timeframes,
        "version": obj_in.version,
        "status": strategy.status,
        "market_bias": strategy.market_bias,
        "entry_conditions": strategy.entry_conditions,
        "confirmation_rules": strategy.confirmation_rules,
        "invalidation_rules": strategy.invalidation_rules,
        "exit_rules": strategy.exit_rules,
        "risk_rules": strategy.risk_rules,
        "entry_model": strategy.entry_model,
        "stop_loss_model": strategy.stop_loss_model,
        "take_profit_model": strategy.take_profit_model,
        "partial_close_rules": strategy.partial_close_rules,
        "trade_management_rules": strategy.trade_management_rules,
        "preferred_sessions": strategy.preferred_sessions,
        "preferred_market_conditions": strategy.preferred_market_conditions,
        "volatility_requirements": strategy.volatility_requirements,
        "news_restrictions": strategy.news_restrictions,
        "required_mindset": strategy.required_mindset,
        "discipline_rules": strategy.discipline_rules,
        "common_mistakes": strategy.common_mistakes,
        "things_to_avoid": strategy.things_to_avoid,
        "checklist_items": strategy.checklist_items,
        "documentation": strategy.documentation,
        "tags": strategy.tags,
        "author": strategy.author,
        "change_log": strategy.change_log,
    }
    db_obj = StrategyVersion(
        strategy_id=strategy_id,
        project_id=project_id,
        version=obj_in.version,
        change_log=obj_in.change_log,
        snapshot=snapshot,
        author=obj_in.author or strategy.author,
    )
    db.add(db_obj)
    strategy.version = obj_in.version
    change_entry = {
        "version": obj_in.version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "change_log": obj_in.change_log,
        "author": obj_in.author or strategy.author,
    }
    if strategy.change_log:
        strategy.change_log.append(change_entry)
    else:
        strategy.change_log = [change_entry]
    db.add(strategy)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def compare_versions(db: Session, *, strategy_id: UUID, version_a_id: UUID, version_b_id: UUID) -> dict | None:
    va = db.get(StrategyVersion, version_a_id)
    vb = db.get(StrategyVersion, version_b_id)
    if not va or not vb or va.strategy_id != strategy_id or vb.strategy_id != strategy_id:
        return None
    return {
        "version_a": {"id": str(va.id), "version": va.version, "snapshot": va.snapshot},
        "version_b": {"id": str(vb.id), "version": vb.version, "snapshot": vb.snapshot},
    }


# ── Performance Analytics ──

def get_analytics(db: Session, *, strategy_id: UUID, project_id: UUID) -> dict:
    trades = db.scalars(
        select(Trade).where(
            Trade.strategy_id == strategy_id,
            Trade.project_id == project_id,
        )
    ).all()

    total = len(trades)
    wins = [t for t in trades if t.result == "WIN"]
    losses = [t for t in trades if t.result == "LOSS"]
    breakevens = [t for t in trades if t.result == "BREAKEVEN"]
    closed = [t for t in trades if t.result is not None]

    total_pnl = sum(t.pnl or 0 for t in trades)
    avg_pnl = total_pnl / total if total > 0 else 0
    avg_win = sum(t.pnl or 0 for t in wins) / len(wins) if wins else 0
    avg_loss = abs(sum(t.pnl or 0 for t in losses)) / len(losses) if losses else 0
    win_rate = len(wins) / total * 100 if total > 0 else 0
    avg_rr = sum(t.rr or 0 for t in closed) / len(closed) if closed else 0
    expectancy = (win_rate / 100 * avg_win) - ((1 - win_rate / 100) * avg_loss) if wins or losses else 0

    gross_profit = sum(t.pnl or 0 for t in wins)
    gross_loss = abs(sum(t.pnl or 0 for t in losses))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else (gross_profit if gross_profit > 0 else 0)

    max_drawdown = 0.0
    peak = 0.0
    running = 0.0
    equity = []
    for i, t in enumerate(sorted(closed, key=lambda x: x.created_at)):
        running += t.pnl or 0
        equity.append({"trade": i + 1, "value": running})
        if running > peak:
            peak = running
        dd = peak - running
        if dd > max_drawdown:
            max_drawdown = dd

    # Session analysis
    session_map = {}
    for t in trades:
        for s in ["asian_session", "london_session", "newyork_session"]:
            val = getattr(t, s, None)
            if val:
                if val not in session_map:
                    session_map[val] = {"trades": 0, "wins": 0, "pnl": 0.0}
                session_map[val]["trades"] += 1
                session_map[val]["wins"] += 1 if t.result == "WIN" else 0
                session_map[val]["pnl"] += t.pnl or 0

    session_analysis = [
        {"session": k, "trades": v["trades"], "wins": v["wins"], "pnl": round(v["pnl"], 2)}
        for k, v in session_map.items()
    ]

    best_session = max(session_analysis, key=lambda x: x["pnl"])["session"] if session_analysis else None
    worst_session = min(session_analysis, key=lambda x: x["pnl"])["session"] if session_analysis else None

    # Pair analysis
    pair_map = {}
    for t in trades:
        p = t.pair or "Unknown"
        if p not in pair_map:
            pair_map[p] = {"trades": 0, "wins": 0, "pnl": 0.0}
        pair_map[p]["trades"] += 1
        pair_map[p]["wins"] += 1 if t.result == "WIN" else 0
        pair_map[p]["pnl"] += t.pnl or 0

    pair_analysis = [
        {"pair": k, "trades": v["trades"], "wins": v["wins"], "pnl": round(v["pnl"], 2)}
        for k, v in pair_map.items()
    ]

    best_pair = max(pair_analysis, key=lambda x: x["pnl"])["pair"] if pair_analysis else None
    worst_pair = min(pair_analysis, key=lambda x: x["pnl"])["pair"] if pair_analysis else None

    # Monthly performance
    monthly = {}
    for t in closed:
        month_key = t.created_at.strftime("%Y-%m") if t.created_at else "Unknown"
        if month_key not in monthly:
            monthly[month_key] = {"trades": 0, "wins": 0, "pnl": 0.0}
        monthly[month_key]["trades"] += 1
        monthly[month_key]["wins"] += 1 if t.result == "WIN" else 0
        monthly[month_key]["pnl"] += t.pnl or 0

    monthly_performance = [
        {"month": k, "trades": v["trades"], "wins": v["wins"], "pnl": round(v["pnl"], 2)}
        for k, v in sorted(monthly.items())
    ]

    # P&L distribution
    distribution = [
        {"range": "Winners", "count": len(wins), "pnl": round(sum(t.pnl or 0 for t in wins), 2)},
        {"range": "Losers", "count": len(losses), "pnl": round(sum(t.pnl or 0 for t in losses), 2)},
        {"range": "Breakeven", "count": len(breakevens), "pnl": 0},
    ]

    return {
        "total_trades": total,
        "wins": len(wins),
        "losses": len(losses),
        "breakevens": len(breakevens),
        "win_rate": round(win_rate, 2),
        "total_pnl": round(total_pnl, 2),
        "avg_pnl": round(avg_pnl, 2),
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "avg_rr": round(avg_rr, 2),
        "expectancy": round(expectancy, 2),
        "profit_factor": round(profit_factor, 2),
        "max_drawdown": round(max_drawdown, 2),
        "sharpe_ratio": 0.0,
        "avg_holding_time": None,
        "best_session": best_session,
        "worst_session": worst_session,
        "best_pair": best_pair,
        "worst_pair": worst_pair,
        "monthly_performance": monthly_performance,
        "equity_curve": equity,
        "distribution": distribution,
        "session_analysis": session_analysis,
        "pair_analysis": pair_analysis,
    }
