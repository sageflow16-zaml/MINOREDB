from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.trade_memory import TradeMemory
from src.schemas.trade_memory import TradeMemoryCreate


def get(db: Session, trade_id: UUID, project_id: UUID) -> TradeMemory | None:
    return db.scalar(
        select(TradeMemory).where(
            TradeMemory.trade_id == trade_id,
            TradeMemory.project_id == project_id,
        )
    )


def get_multi(
    db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None
) -> list[TradeMemory]:
    stmt = select(TradeMemory).order_by(TradeMemory.created_at.desc())
    if project_id:
        stmt = stmt.where(TradeMemory.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(limit)).all()


def create(db: Session, *, obj_in: TradeMemoryCreate) -> TradeMemory:
    db_obj = TradeMemory(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, *, id: UUID) -> TradeMemory | None:
    obj = db.get(TradeMemory, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj
