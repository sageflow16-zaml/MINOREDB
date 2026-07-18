from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload
from src.models.trader_intelligence import (
    TradeDebrief, PersonalPattern, PersonalRule, PersonalRuleVersion,
    TraderProfile, TraderProfileSnapshot,
)
from src.schemas.trader_intelligence import (
    TradeDebriefCreate, TradeDebriefUpdate,
    PersonalPatternCreate, PersonalPatternUpdate,
    PersonalRuleCreate, PersonalRuleUpdate,
)


# --- TradeDebrief ---

def get_debrief(db: Session, id: UUID) -> TradeDebrief | None:
    return db.get(TradeDebrief, id)

def get_debrief_by_trade(db: Session, trade_id: UUID, project_id: UUID) -> TradeDebrief | None:
    return db.scalar(
        select(TradeDebrief).where(
            TradeDebrief.trade_id == trade_id,
            TradeDebrief.project_id == project_id,
        )
    )

def get_debriefs(
    db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None,
    trade_id: UUID | None = None,
) -> list[TradeDebrief]:
    stmt = select(TradeDebrief).order_by(TradeDebrief.created_at.desc())
    if project_id:
        stmt = stmt.where(TradeDebrief.project_id == project_id)
    if trade_id:
        stmt = stmt.where(TradeDebrief.trade_id == trade_id)
    return db.scalars(stmt.offset(skip).limit(limit)).all()

def search_debriefs(db: Session, *, project_id: UUID, q: str, limit: int = 20) -> list[TradeDebrief]:
    like = f"%{q}%"
    stmt = select(TradeDebrief).where(
        TradeDebrief.project_id == project_id,
        or_(
            TradeDebrief.entry_review.ilike(like),
            TradeDebrief.execution_review.ilike(like),
            TradeDebrief.exit_review.ilike(like),
            TradeDebrief.psychology_review.ilike(like),
            TradeDebrief.summary.ilike(like),
        ),
    ).order_by(TradeDebrief.created_at.desc()).limit(limit)
    return db.scalars(stmt).all()

def create_debrief(db: Session, *, obj_in: TradeDebriefCreate) -> TradeDebrief:
    db_obj = TradeDebrief(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_debrief(db: Session, *, db_obj: TradeDebrief, obj_in: TradeDebriefUpdate) -> TradeDebrief:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_debrief(db: Session, *, id: UUID) -> TradeDebrief | None:
    obj = db.get(TradeDebrief, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

def get_debrief_count(db: Session, project_id: UUID) -> int:
    return db.scalar(
        select(func.count(TradeDebrief.id)).where(TradeDebrief.project_id == project_id)
    ) or 0


# --- PersonalPattern ---

def get_pattern(db: Session, id: UUID) -> PersonalPattern | None:
    return db.get(PersonalPattern, id)

def get_patterns(
    db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None,
    category: str | None = None, active: bool | None = None,
) -> list[PersonalPattern]:
    stmt = select(PersonalPattern).order_by(PersonalPattern.confidence.desc().nullslast(), PersonalPattern.occurrence_count.desc())
    if project_id:
        stmt = stmt.where(PersonalPattern.project_id == project_id)
    if category:
        stmt = stmt.where(PersonalPattern.category == category)
    if active is not None:
        stmt = stmt.where(PersonalPattern.active == active)
    return db.scalars(stmt.offset(skip).limit(limit)).all()

def create_pattern(db: Session, *, obj_in: PersonalPatternCreate) -> PersonalPattern:
    db_obj = PersonalPattern(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_pattern(db: Session, *, db_obj: PersonalPattern, obj_in: PersonalPatternUpdate) -> PersonalPattern:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_pattern(db: Session, *, id: UUID) -> PersonalPattern | None:
    obj = db.get(PersonalPattern, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

def get_pattern_count(db: Session, project_id: UUID) -> int:
    return db.scalar(
        select(func.count(PersonalPattern.id)).where(PersonalPattern.project_id == project_id)
    ) or 0


# --- PersonalRule ---

def get_rule(db: Session, id: UUID) -> PersonalRule | None:
    return db.get(PersonalRule, id)

def get_rules(
    db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None,
    status: str | None = None, category: str | None = None,
) -> list[PersonalRule]:
    stmt = select(PersonalRule).order_by(PersonalRule.created_at.desc())
    if project_id:
        stmt = stmt.where(PersonalRule.project_id == project_id)
    if status:
        stmt = stmt.where(PersonalRule.status == status)
    if category:
        stmt = stmt.where(PersonalRule.category == category)
    return db.scalars(stmt.offset(skip).limit(limit)).all()

def get_rules_for_approval(db: Session, project_id: UUID, limit: int = 50) -> list[PersonalRule]:
    stmt = select(PersonalRule).where(
        PersonalRule.project_id == project_id,
        PersonalRule.status == "draft",
    ).order_by(PersonalRule.created_at.desc()).limit(limit)
    return db.scalars(stmt).all()

def create_rule(db: Session, *, obj_in: PersonalRuleCreate) -> PersonalRule:
    db_obj = PersonalRule(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_rule(db: Session, *, db_obj: PersonalRule, obj_in: PersonalRuleUpdate) -> PersonalRule:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_rule(db: Session, *, id: UUID) -> PersonalRule | None:
    obj = db.get(PersonalRule, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

def get_rule_count(db: Session, project_id: UUID, status: str | None = None) -> int:
    stmt = select(func.count(PersonalRule.id)).where(PersonalRule.project_id == project_id)
    if status:
        stmt = stmt.where(PersonalRule.status == status)
    return db.scalar(stmt) or 0


# --- PersonalRuleVersion ---

def create_rule_version(db: Session, *, rule_id: UUID, version: int, title: str, description: str | None = None, evidence: dict | None = None, change_notes: str | None = None) -> PersonalRuleVersion:
    db_obj = PersonalRuleVersion(
        rule_id=rule_id, version=version, title=title,
        description=description, evidence=evidence, change_notes=change_notes,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_rule_versions(db: Session, rule_id: UUID) -> list[PersonalRuleVersion]:
    return db.scalars(
        select(PersonalRuleVersion).where(PersonalRuleVersion.rule_id == rule_id).order_by(PersonalRuleVersion.version.desc())
    ).all()


# --- TraderProfile ---

def get_profile(db: Session, project_id: UUID) -> TraderProfile | None:
    return db.scalar(select(TraderProfile).where(TraderProfile.project_id == project_id))

def create_profile(db: Session, *, project_id: UUID) -> TraderProfile:
    db_obj = TraderProfile(project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_profile(db: Session, *, db_obj: TraderProfile, **kwargs) -> TraderProfile:
    for field, value in kwargs.items():
        if hasattr(db_obj, field):
            setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_or_create_profile(db: Session, project_id: UUID) -> TraderProfile:
    profile = get_profile(db, project_id)
    if not profile:
        profile = create_profile(db, project_id=project_id)
    return profile


# --- TraderProfileSnapshot ---

def create_snapshot(db: Session, *, project_id: UUID, snapshot_date: datetime, **kwargs) -> TraderProfileSnapshot:
    data = {"project_id": project_id, "snapshot_date": snapshot_date}
    data.update(kwargs)
    db_obj = TraderProfileSnapshot(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_snapshots(db: Session, project_id: UUID, limit: int = 50) -> list[TraderProfileSnapshot]:
    return db.scalars(
        select(TraderProfileSnapshot).where(TraderProfileSnapshot.project_id == project_id)
        .order_by(TraderProfileSnapshot.snapshot_date.desc())
        .limit(limit)
    ).all()

def get_profile_summary(db: Session, project_id: UUID) -> dict:
    profile = get_profile(db, project_id)
    debrief_count = get_debrief_count(db, project_id)
    pattern_count = get_pattern_count(db, project_id)
    rule_count = get_rule_count(db, project_id)
    approved_rules = get_rule_count(db, project_id, status="approved")
    return {
        "profile": profile,
        "debrief_count": debrief_count,
        "pattern_count": pattern_count,
        "rule_count": rule_count,
        "approved_rule_count": approved_rules,
    }
