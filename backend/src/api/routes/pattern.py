from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.crud import pattern as pattern_crud
from src.schemas.pattern import PatternRead, PatternSearchFilters, PatternStatistics
from src.services import pattern_discovery

router = APIRouter()


class PatternDiscoverRequest(BaseModel):
    min_occurrences: int = 3


class PatternDiscoverResponse(BaseModel):
    discovered: int
    updated: int
    total: int
    signatures_analyzed: int


@router.get("/", response_model=list[PatternRead])
def list_patterns(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    return pattern_crud.get_multi(db, project_id=project_id, skip=skip, limit=limit)


@router.get("/statistics", response_model=PatternStatistics)
def get_pattern_statistics(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return pattern_crud.get_pattern_stats(db, project_id=project_id)


@router.post("/discover", response_model=PatternDiscoverResponse)
def run_discovery(
    project_id: UUID,
    request: PatternDiscoverRequest,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = pattern_discovery.discover_patterns(db, project_id=project_id)
    return PatternDiscoverResponse(
        discovered=result["discovered"],
        updated=result["updated"],
        total=result["total"],
        signatures_analyzed=result["signatures_analyzed"],
    )


@router.get("/search", response_model=list[PatternRead])
def search_patterns(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
    pair: Optional[str] = None,
    session: Optional[str] = None,
    direction: Optional[str] = None,
    weekly_bias: Optional[str] = None,
    market_phase: Optional[str] = None,
    min_occurrences: Optional[int] = None,
    min_win_rate: Optional[float] = None,
    min_expectancy: Optional[float] = None,
    limit: int = 50,
    offset: int = 0,
):
    filters = PatternSearchFilters(
        pair=pair,
        session=session,
        direction=direction,
        weekly_bias=weekly_bias,
        market_phase=market_phase,
        min_occurrences=min_occurrences,
        min_win_rate=min_win_rate,
        min_expectancy=min_expectancy,
        limit=limit,
        offset=offset,
    )
    return pattern_crud.search(db, project_id=project_id, filters=filters)


@router.get("/{pattern_id}", response_model=PatternRead)
def get_pattern(
    project_id: UUID,
    pattern_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    pattern = pattern_crud.get(db, pattern_id, project_id=project_id)
    if not pattern:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pattern not found"
        )
    return pattern


@router.get("/{pattern_id}/details")
def get_pattern_details(
    project_id: UUID,
    pattern_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    details = pattern_discovery.get_pattern_details(db, project_id=project_id, pattern_id=pattern_id)
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pattern not found"
        )
    return details