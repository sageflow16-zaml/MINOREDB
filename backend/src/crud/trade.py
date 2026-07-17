from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.schemas.trade import TradeCreate, TradeUpdate
from src.core.config import settings


def get(db: Session, id: UUID, project_id: UUID | None = None) -> Trade | None:
    if project_id:
        return db.scalar(select(Trade).where(Trade.id == id, Trade.project_id == project_id))
    return db.get(Trade, id)


def get_multi(
    db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None
) -> list[Trade]:
    stmt = select(Trade)
    if project_id:
        stmt = stmt.where(Trade.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()


def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count()).select_from(Trade)
    if project_id:
        stmt = stmt.where(Trade.project_id == project_id)
    return db.scalar(stmt) or 0


def count_by_result(
    db: Session, *, project_id: UUID, result: str
) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Trade)
        .where(Trade.project_id == project_id, Trade.result == result)
    ) or 0


def count_by_status(
    db: Session, *, project_id: UUID, status: str
) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Trade)
        .where(Trade.project_id == project_id, Trade.status == status)
    ) or 0


def avg_rr(db: Session, *, project_id: UUID) -> float:
    result = db.scalar(
        select(func.avg(Trade.rr)).where(
            Trade.project_id == project_id, Trade.rr.isnot(None)
        )
    )
    return float(result) if result is not None else 0.0


def create(db: Session, *, project_id: UUID, obj_in: TradeCreate) -> Trade:
    db_obj = Trade(**obj_in.model_dump(), project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, *, db_obj: Trade, obj_in: TradeUpdate) -> Trade:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(
    db: Session, *, id: UUID, project_id: UUID | None = None
) -> Trade | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj
