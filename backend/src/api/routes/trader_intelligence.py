from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.trader_intelligence import (
    TradeDebriefRead, TradeDebriefCreate, TradeDebriefUpdate,
    PersonalPatternRead, PersonalPatternCreate, PersonalPatternUpdate,
    PersonalRuleRead, PersonalRuleCreate, PersonalRuleUpdate,
    GenerateDebriefRequest, GenerateDebriefResponse,
    ApproveRuleRequest, RejectRuleRequest, GenerateRulesResponse,
    TraderProfileRead, TraderProfileSnapshotRead,
    DashboardResponse,
)
from src.crud import trader_intelligence as crud
from src.services.trader_intelligence import (
    generate_debrief_from_trade, detect_personal_patterns,
    generate_proposed_rules, build_or_update_profile,
)

router = APIRouter()


# --- Dashboard ---

@router.get("/dashboard", response_model=DashboardResponse)
def intelligence_dashboard(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    summary = crud.get_profile_summary(db, project_id)
    recent = crud.get_debriefs(db, project_id=project_id, limit=5)
    return DashboardResponse(
        debrief_count=summary["debrief_count"],
        pattern_count=summary["pattern_count"],
        rule_count=summary["rule_count"],
        approved_rule_count=summary["approved_rule_count"],
        profile=summary["profile"],
        recent_debriefs=recent,
    )


# --- Trade Debrief ---

@router.get("/debriefs", response_model=list[TradeDebriefRead])
def read_debriefs(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    trade_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    return crud.get_debriefs(db, project_id=project_id, skip=skip, limit=limit, trade_id=trade_id)


@router.get("/debriefs/search", response_model=list[TradeDebriefRead])
def search_debriefs(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return crud.search_debriefs(db, project_id=project_id, q=q, limit=limit)


@router.get("/debriefs/{debrief_id}", response_model=TradeDebriefRead)
def read_debrief(
    project_id: UUID,
    debrief_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_debrief(db, debrief_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debrief not found")
    return db_obj


@router.post("/debriefs/generate", response_model=GenerateDebriefResponse)
def generate_debrief(
    project_id: UUID,
    req: GenerateDebriefRequest,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    try:
        debrief = generate_debrief_from_trade(db, req.trade_id)
        return GenerateDebriefResponse(debrief=debrief, message="Debrief generated successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/debriefs/{debrief_id}", response_model=TradeDebriefRead)
def update_debrief(
    project_id: UUID,
    debrief_id: UUID,
    obj_in: TradeDebriefUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_debrief(db, debrief_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debrief not found")
    return crud.update_debrief(db, db_obj=db_obj, obj_in=obj_in)


@router.delete("/debriefs/{debrief_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_debrief(
    project_id: UUID,
    debrief_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_debrief(db, debrief_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debrief not found")
    crud.remove_debrief(db, id=debrief_id)


# --- Personal Patterns ---

@router.get("/patterns", response_model=list[PersonalPatternRead])
def read_patterns(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: str | None = None,
    active: bool | None = None,
    db: Session = Depends(get_db),
):
    return crud.get_patterns(db, project_id=project_id, skip=skip, limit=limit, category=category, active=active)


@router.get("/patterns/{pattern_id}", response_model=PersonalPatternRead)
def read_pattern(
    project_id: UUID,
    pattern_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_pattern(db, pattern_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pattern not found")
    return db_obj


@router.post("/patterns/detect", response_model=list[PersonalPatternRead])
def detect_patterns(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return detect_personal_patterns(db, project_id, limit=limit)


@router.put("/patterns/{pattern_id}", response_model=PersonalPatternRead)
def update_pattern(
    project_id: UUID,
    pattern_id: UUID,
    obj_in: PersonalPatternUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_pattern(db, pattern_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pattern not found")
    return crud.update_pattern(db, db_obj=db_obj, obj_in=obj_in)


@router.delete("/patterns/{pattern_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pattern(
    project_id: UUID,
    pattern_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_pattern(db, pattern_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pattern not found")
    crud.remove_pattern(db, id=pattern_id)


# --- Personal Rules ---

@router.get("/rules", response_model=list[PersonalRuleRead])
def read_rules(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    return crud.get_rules(db, project_id=project_id, skip=skip, limit=limit, status=status, category=category)


@router.get("/rules/for-approval", response_model=list[PersonalRuleRead])
def read_rules_for_approval(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return crud.get_rules_for_approval(db, project_id, limit=limit)


@router.get("/rules/{rule_id}", response_model=PersonalRuleRead)
def read_rule(
    project_id: UUID,
    rule_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_rule(db, rule_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    return db_obj


@router.post("/rules/generate", response_model=GenerateRulesResponse)
def generate_rules(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    rules = generate_proposed_rules(db, project_id)
    return GenerateRulesResponse(rules=rules, message=f"{len(rules)} rules generated/updated")


@router.post("/rules/{rule_id}/approve", response_model=PersonalRuleRead)
def approve_rule(
    project_id: UUID,
    rule_id: UUID,
    req: ApproveRuleRequest = ApproveRuleRequest(),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_rule(db, rule_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    if db_obj.status != "draft":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Rule is already {db_obj.status}")
    from datetime import datetime, timezone
    crud.create_rule_version(
        db, rule_id=db_obj.id, version=db_obj.version,
        title=db_obj.title, description=db_obj.description,
        evidence=db_obj.evidence, change_notes=req.notes or "Approved",
    )
    db_obj.status = "approved"
    db_obj.approved_at = datetime.now(timezone.utc)
    db_obj.version += 1
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.post("/rules/{rule_id}/reject", response_model=PersonalRuleRead)
def reject_rule(
    project_id: UUID,
    rule_id: UUID,
    req: RejectRuleRequest,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_rule(db, rule_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    if db_obj.status != "draft":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Rule is already {db_obj.status}")
    from datetime import datetime, timezone
    db_obj.status = "rejected"
    db_obj.rejected_at = datetime.now(timezone.utc)
    db_obj.rejection_reason = req.reason
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.put("/rules/{rule_id}", response_model=PersonalRuleRead)
def update_rule(
    project_id: UUID,
    rule_id: UUID,
    obj_in: PersonalRuleUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_rule(db, rule_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    crud.create_rule_version(
        db, rule_id=db_obj.id, version=db_obj.version,
        title=db_obj.title, description=db_obj.description,
        evidence=db_obj.evidence, change_notes="Updated before new version",
    )
    updated = crud.update_rule(db, db_obj=db_obj, obj_in=obj_in)
    updated.version += 1
    db.commit()
    db.refresh(updated)
    return updated


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    project_id: UUID,
    rule_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    db_obj = crud.get_rule(db, rule_id)
    if not db_obj or db_obj.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    crud.remove_rule(db, id=rule_id)


# --- Trader Profile ---

@router.get("/profile", response_model=TraderProfileRead)
def read_profile(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    profile = crud.get_profile(db, project_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found. Build it first.")
    return profile


@router.post("/profile/build", response_model=TraderProfileRead)
def build_profile(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return build_or_update_profile(db, project_id)


@router.get("/profile/snapshots", response_model=list[TraderProfileSnapshotRead])
def read_profile_snapshots(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return crud.get_snapshots(db, project_id, limit=limit)
