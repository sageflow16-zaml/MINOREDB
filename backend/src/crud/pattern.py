from uuid import UUID
from typing import Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session
from src.db.base import Pattern, PatternTrade
from src.schemas.pattern import PatternCreate, PatternUpdate, PatternSearchFilters
from src.core.config import settings


def get(db: Session, id: UUID, project_id: UUID | None = None) -> Pattern | None:
    if project_id:
        return db.scalar(
            select(Pattern).where(Pattern.id == id, Pattern.project_id == project_id)
        )
    return db.get(Pattern, id)


def get_multi(
    db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None
) -> list[Pattern]:
    stmt = select(Pattern).order_by(Pattern.confidence_score.desc())
    if project_id:
        stmt = stmt.where(Pattern.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()


def get_by_signature(
    db: Session, *, project_id: UUID, signature: dict
) -> Pattern | None:
    # Search for pattern with matching signature
    patterns = db.scalars(
        select(Pattern).where(Pattern.project_id == project_id)
    ).all()
    
    for p in patterns:
        if p.signature == signature:
            return p
    return None


def create(
    db: Session, *, project_id: UUID, obj_in: PatternCreate
) -> Pattern:
    data = obj_in.model_dump()
    data.pop("project_id", None)  # Remove project_id from data if present
    db_obj = Pattern(**data, project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(
    db: Session, *, db_obj: Pattern, obj_in: PatternUpdate | dict
) -> Pattern:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(
    db: Session, *, id: UUID, project_id: UUID | None = None
) -> Pattern | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj


def get_pattern_stats(db: Session, *, project_id: UUID) -> dict:
    """Get aggregate statistics for patterns in a project."""
    stmt = select(
        func.count(Pattern.id).label("total_patterns"),
        func.avg(Pattern.win_rate).label("avg_win_rate"),
        func.avg(Pattern.expectancy).label("avg_expectancy"),
        func.avg(Pattern.confidence_score).label("avg_confidence"),
        func.sum(Pattern.total_occurrences).label("total_occurrences"),
        func.sum(Pattern.wins).label("total_wins"),
    ).where(Pattern.project_id == project_id)
    
    result = db.execute(stmt).first()
    
    high_conf = db.scalar(
        select(func.count(Pattern.id)).where(
            Pattern.project_id == project_id,
            Pattern.confidence_score >= 0.7
        )
    )
    
    profitable = db.scalar(
        select(func.count(Pattern.id)).where(
            Pattern.project_id == project_id,
            Pattern.expectancy > 0
        )
    )
    
    return {
        "total_patterns": result.total_patterns or 0,
        "avg_win_rate": round(float(result.avg_win_rate or 0), 1),
        "avg_expectancy": round(float(result.avg_expectancy or 0), 2),
        "avg_confidence": round(float(result.avg_confidence or 0), 3),
        "total_occurrences": result.total_occurrences or 0,
        "total_wins": result.total_wins or 0,
        "high_confidence_patterns": high_conf or 0,
        "profitable_patterns": profitable or 0,
    }


def search(
    db: Session, *, project_id: UUID, filters: PatternSearchFilters
) -> list[Pattern]:
    stmt = select(Pattern).where(Pattern.project_id == project_id)
    
    if filters.pair:
        # Search in signature JSON
        stmt = stmt.where(Pattern.signature["pair"].astext == filters.pair)
    
    if filters.direction:
        stmt = stmt.where(Pattern.signature["direction"].astext == filters.direction)
    
    if filters.weekly_bias:
        stmt = stmt.where(Pattern.signature["weekly_bias"].astext == filters.weekly_bias)
    
    if filters.market_phase:
        stmt = stmt.where(Pattern.signature["market_phase"].astext == filters.market_phase)
    
    if filters.min_occurrences:
        stmt = stmt.where(Pattern.total_occurrences >= filters.min_occurrences)
    
    if filters.min_win_rate:
        stmt = stmt.where(Pattern.win_rate >= filters.min_win_rate)
    
    if filters.min_expectancy:
        stmt = stmt.where(Pattern.expectancy >= filters.min_expectancy)
    
    if filters.session:
        # Search in session fields
        stmt = stmt.where(
            or_(
                Pattern.signature["asian_session"].astext == filters.session,
                Pattern.signature["london_session"].astext == filters.session,
                Pattern.signature["newyork_session"].astext == filters.session,
            )
        )
    
    stmt = stmt.order_by(Pattern.confidence_score.desc())
    stmt = stmt.offset(filters.offset).limit(filters.limit)
    
    return db.scalars(stmt).all()


def link_trade(db: Session, *, project_id: UUID, pattern_id: UUID, trade_id: UUID) -> PatternTrade | None:
    """Link a trade to a pattern."""
    existing = db.scalar(
        select(PatternTrade).where(
            PatternTrade.project_id == project_id,
            PatternTrade.pattern_id == pattern_id,
            PatternTrade.trade_id == trade_id,
        )
    )
    if existing:
        return existing
    
    link = PatternTrade(
        project_id=project_id,
        pattern_id=pattern_id,
        trade_id=trade_id,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def get_trades_for_pattern(
    db: Session, *, project_id: UUID, pattern_id: UUID
) -> list[UUID]:
    """Get all trade IDs linked to a pattern."""
    links = db.scalars(
        select(PatternTrade.trade_id).where(
            PatternTrade.project_id == project_id,
            PatternTrade.pattern_id == pattern_id,
        )
    ).all()
    return list(links)