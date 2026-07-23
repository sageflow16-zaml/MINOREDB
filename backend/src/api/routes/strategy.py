from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.strategy import (
    StrategyCreate, StrategyUpdate, StrategyRead,
    StrategyVersionRead, StrategyVersionCreate, StrategyAnalytics,
)
from src.crud import strategy as crud

router = APIRouter()

# ── CRUD Endpoints ──


@router.get("/", response_model=list[StrategyRead])
def read_strategies(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: str | None = None,
    category: str | None = None,
    market: str | None = None,
    search: str | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db),
):
    strategies = crud.get_multi(
        db, project_id=project_id, skip=skip, limit=limit,
        status=status, category=category, market=market,
        search=search, tag=tag,
    )
    result = []
    for s in strategies:
        s_dict = {
            "id": s.id,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "name": s.name,
            "description": s.description,
            "category": s.category,
            "market": s.market,
            "instrument_types": s.instrument_types,
            "timeframes": s.timeframes,
            "version": s.version,
            "status": s.status,
            "market_bias": s.market_bias,
            "entry_conditions": s.entry_conditions,
            "confirmation_rules": s.confirmation_rules,
            "invalidation_rules": s.invalidation_rules,
            "exit_rules": s.exit_rules,
            "risk_rules": s.risk_rules,
            "entry_model": s.entry_model,
            "stop_loss_model": s.stop_loss_model,
            "take_profit_model": s.take_profit_model,
            "partial_close_rules": s.partial_close_rules,
            "trade_management_rules": s.trade_management_rules,
            "preferred_sessions": s.preferred_sessions,
            "preferred_market_conditions": s.preferred_market_conditions,
            "volatility_requirements": s.volatility_requirements,
            "news_restrictions": s.news_restrictions,
            "required_mindset": s.required_mindset,
            "discipline_rules": s.discipline_rules,
            "common_mistakes": s.common_mistakes,
            "things_to_avoid": s.things_to_avoid,
            "checklist_items": s.checklist_items,
            "documentation": s.documentation,
            "tags": s.tags,
            "author": s.author,
            "change_log": s.change_log,
            "trades_count": len(s.trades) if hasattr(s, "trades") else 0,
        }
        result.append(s_dict)
    return result


@router.get("/{id}", response_model=StrategyRead)
def read_strategy(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    db: Session = Depends(get_db),
):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    s = db_obj
    return {
        "id": s.id,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "name": s.name,
        "description": s.description,
        "category": s.category,
        "market": s.market,
        "instrument_types": s.instrument_types,
        "timeframes": s.timeframes,
        "version": s.version,
        "status": s.status,
        "market_bias": s.market_bias,
        "entry_conditions": s.entry_conditions,
        "confirmation_rules": s.confirmation_rules,
        "invalidation_rules": s.invalidation_rules,
        "exit_rules": s.exit_rules,
        "risk_rules": s.risk_rules,
        "entry_model": s.entry_model,
        "stop_loss_model": s.stop_loss_model,
        "take_profit_model": s.take_profit_model,
        "partial_close_rules": s.partial_close_rules,
        "trade_management_rules": s.trade_management_rules,
        "preferred_sessions": s.preferred_sessions,
        "preferred_market_conditions": s.preferred_market_conditions,
        "volatility_requirements": s.volatility_requirements,
        "news_restrictions": s.news_restrictions,
        "required_mindset": s.required_mindset,
        "discipline_rules": s.discipline_rules,
        "common_mistakes": s.common_mistakes,
        "things_to_avoid": s.things_to_avoid,
        "checklist_items": s.checklist_items,
        "documentation": s.documentation,
        "tags": s.tags,
        "author": s.author,
        "change_log": s.change_log,
        "trades_count": len(s.trades) if hasattr(s, "trades") else 0,
    }


@router.post("/", response_model=StrategyRead, status_code=status.HTTP_201_CREATED)
def create_strategy(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    obj_in: StrategyCreate = ...,
    db: Session = Depends(get_db),
):
    strategy = crud.create(db, project_id=project_id, obj_in=obj_in)
    s = strategy
    return {
        "id": s.id,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "name": s.name,
        "description": s.description,
        "category": s.category,
        "market": s.market,
        "instrument_types": s.instrument_types,
        "timeframes": s.timeframes,
        "version": s.version,
        "status": s.status,
        "market_bias": s.market_bias,
        "entry_conditions": s.entry_conditions,
        "confirmation_rules": s.confirmation_rules,
        "invalidation_rules": s.invalidation_rules,
        "exit_rules": s.exit_rules,
        "risk_rules": s.risk_rules,
        "entry_model": s.entry_model,
        "stop_loss_model": s.stop_loss_model,
        "take_profit_model": s.take_profit_model,
        "partial_close_rules": s.partial_close_rules,
        "trade_management_rules": s.trade_management_rules,
        "preferred_sessions": s.preferred_sessions,
        "preferred_market_conditions": s.preferred_market_conditions,
        "volatility_requirements": s.volatility_requirements,
        "news_restrictions": s.news_restrictions,
        "required_mindset": s.required_mindset,
        "discipline_rules": s.discipline_rules,
        "common_mistakes": s.common_mistakes,
        "things_to_avoid": s.things_to_avoid,
        "checklist_items": s.checklist_items,
        "documentation": s.documentation,
        "tags": s.tags,
        "author": s.author,
        "change_log": s.change_log,
        "trades_count": 0,
    }


@router.put("/{id}", response_model=StrategyRead)
def update_strategy(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    obj_in: StrategyUpdate = ...,
    db: Session = Depends(get_db),
):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    strategy = crud.update(db, db_obj=db_obj, obj_in=obj_in)
    s = strategy
    return {
        "id": s.id,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "name": s.name,
        "description": s.description,
        "category": s.category,
        "market": s.market,
        "instrument_types": s.instrument_types,
        "timeframes": s.timeframes,
        "version": s.version,
        "status": s.status,
        "market_bias": s.market_bias,
        "entry_conditions": s.entry_conditions,
        "confirmation_rules": s.confirmation_rules,
        "invalidation_rules": s.invalidation_rules,
        "exit_rules": s.exit_rules,
        "risk_rules": s.risk_rules,
        "entry_model": s.entry_model,
        "stop_loss_model": s.stop_loss_model,
        "take_profit_model": s.take_profit_model,
        "partial_close_rules": s.partial_close_rules,
        "trade_management_rules": s.trade_management_rules,
        "preferred_sessions": s.preferred_sessions,
        "preferred_market_conditions": s.preferred_market_conditions,
        "volatility_requirements": s.volatility_requirements,
        "news_restrictions": s.news_restrictions,
        "required_mindset": s.required_mindset,
        "discipline_rules": s.discipline_rules,
        "common_mistakes": s.common_mistakes,
        "things_to_avoid": s.things_to_avoid,
        "checklist_items": s.checklist_items,
        "documentation": s.documentation,
        "tags": s.tags,
        "author": s.author,
        "change_log": s.change_log,
        "trades_count": len(s.trades) if hasattr(s, "trades") else 0,
    }


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_strategy(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    db: Session = Depends(get_db),
):
    if not crud.remove(db, id=id, project_id=project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return None


# ── Action Endpoints ──


@router.post("/{id}/duplicate", response_model=StrategyRead, status_code=status.HTTP_201_CREATED)
def duplicate_strategy(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    db: Session = Depends(get_db),
):
    strategy = crud.duplicate(db, id=id, project_id=project_id)
    if not strategy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    s = strategy
    return {
        "id": s.id,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "name": s.name,
        "description": s.description,
        "category": s.category,
        "market": s.market,
        "instrument_types": s.instrument_types,
        "timeframes": s.timeframes,
        "version": s.version,
        "status": s.status,
        "market_bias": s.market_bias,
        "entry_conditions": s.entry_conditions,
        "confirmation_rules": s.confirmation_rules,
        "invalidation_rules": s.invalidation_rules,
        "exit_rules": s.exit_rules,
        "risk_rules": s.risk_rules,
        "entry_model": s.entry_model,
        "stop_loss_model": s.stop_loss_model,
        "take_profit_model": s.take_profit_model,
        "partial_close_rules": s.partial_close_rules,
        "trade_management_rules": s.trade_management_rules,
        "preferred_sessions": s.preferred_sessions,
        "preferred_market_conditions": s.preferred_market_conditions,
        "volatility_requirements": s.volatility_requirements,
        "news_restrictions": s.news_restrictions,
        "required_mindset": s.required_mindset,
        "discipline_rules": s.discipline_rules,
        "common_mistakes": s.common_mistakes,
        "things_to_avoid": s.things_to_avoid,
        "checklist_items": s.checklist_items,
        "documentation": s.documentation,
        "tags": s.tags,
        "author": s.author,
        "change_log": s.change_log,
        "trades_count": 0,
    }


@router.post("/{id}/versions", response_model=StrategyVersionRead, status_code=status.HTTP_201_CREATED)
def create_strategy_version(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    obj_in: StrategyVersionCreate = ...,
    db: Session = Depends(get_db),
):
    version = crud.create_version(db, strategy_id=id, project_id=project_id, obj_in=obj_in)
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return version


@router.get("/{id}/versions", response_model=list[StrategyVersionRead])
def read_strategy_versions(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    db: Session = Depends(get_db),
):
    return crud.get_versions(db, strategy_id=id)


@router.get("/{id}/versions/compare")
def compare_strategy_versions(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    version_a: UUID = ...,
    version_b: UUID = ...,
    db: Session = Depends(get_db),
):
    result = crud.compare_versions(db, strategy_id=id, version_a_id=version_a, version_b_id=version_b)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versions not found or mismatch")
    return result


# ── Analytics ──


@router.get("/{id}/analytics", response_model=StrategyAnalytics)
def read_strategy_analytics(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    db: Session = Depends(get_db),
):
    strategy = crud.get(db, id=id, project_id=project_id)
    if not strategy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return crud.get_analytics(db, strategy_id=id, project_id=project_id)
