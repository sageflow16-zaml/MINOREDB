from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.market_structure import MarketStructure
from src.schemas.market_structure import MarketStructureCreate, MarketStructureUpdate
from src.core.config import settings


def get(
    db: Session, id: UUID, project_id: UUID | None = None
) -> MarketStructure | None:
    if project_id:
        return db.scalar(
            select(MarketStructure).where(
                MarketStructure.id == id, MarketStructure.project_id == project_id
            )
        )
    return db.get(MarketStructure, id)


def get_multi(
    db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None
) -> list[MarketStructure]:
    stmt = select(MarketStructure)
    if project_id:
        stmt = stmt.where(MarketStructure.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()


def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count()).select_from(MarketStructure)
    if project_id:
        stmt = stmt.where(MarketStructure.project_id == project_id)
    return db.scalar(stmt) or 0


def count_by_bias(
    db: Session, *, project_id: UUID, bias_field: str, value: str
) -> int:
    col = getattr(MarketStructure, bias_field, None)
    if col is None:
        return 0
    stmt = (
        select(func.count())
        .select_from(MarketStructure)
        .where(
            MarketStructure.project_id == project_id,
            col == value,
        )
    )
    return db.scalar(stmt) or 0


def count_by_field(
    db: Session, *, project_id: UUID, field: str, value: str
) -> int:
    col = getattr(MarketStructure, field, None)
    if col is None:
        return 0
    stmt = (
        select(func.count())
        .select_from(MarketStructure)
        .where(
            MarketStructure.project_id == project_id,
            col == value,
        )
    )
    return db.scalar(stmt) or 0


def create(
    db: Session, *, project_id: UUID, obj_in: MarketStructureCreate
) -> MarketStructure:
    db_obj = MarketStructure(**obj_in.model_dump(), project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(
    db: Session, *, db_obj: MarketStructure, obj_in: MarketStructureUpdate
) -> MarketStructure:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(
    db: Session, *, id: UUID, project_id: UUID | None = None
) -> MarketStructure | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj
