from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import similarity

router = APIRouter()


class CurrentEnvironmentRequest(BaseModel):
    pair: Optional[str] = None
    direction: Optional[str] = None
    weekly_bias: Optional[str] = None
    daily_bias: Optional[str] = None
    h4_bias: Optional[str] = None
    market_phase: Optional[str] = None
    trend: Optional[str] = None
    asian_session: Optional[bool] = None
    london_session: Optional[bool] = None
    newyork_session: Optional[bool] = None
    liquidity_sweep: Optional[str] = None
    bos: Optional[str] = None
    mss: Optional[str] = None
    order_block: Optional[str] = None
    fvg: Optional[str] = None
    dxy: Optional[str] = None
    us10y: Optional[str] = None
    us02y: Optional[str] = None
    cpi: Optional[str] = None
    nfp: Optional[str] = None
    fomc: Optional[str] = None
    news_risk: Optional[str] = None


class SimilarityMatch(BaseModel):
    trade_id: str
    pattern_id: Optional[str] = None
    similarity_score: float
    trade_result: Optional[str] = None
    rr: Optional[float] = None
    pnl: Optional[float] = None
    session: Optional[str] = None
    pair: Optional[str] = None
    weekly_bias: Optional[str] = None
    market_phase: Optional[str] = None
    created_at: Optional[str] = None


class SimilaritySummary(BaseModel):
    matches_found: int
    average_win_rate: float
    average_rr: float
    average_pnl: float
    best_pattern: Optional[str] = None
    worst_pattern: Optional[str] = None
    average_drawdown: float


class SimilarityResponse(BaseModel):
    matches: list[SimilarityMatch]
    summary: SimilaritySummary


class HistoryEntry(BaseModel):
    trade_id: str
    pair: Optional[str] = None
    direction: Optional[str] = None
    result: Optional[str] = None
    rr: Optional[float] = None
    pnl: Optional[float] = None
    weekly_bias: Optional[str] = None
    market_phase: Optional[str] = None
    trend: Optional[str] = None
    created_at: Optional[str] = None


@router.post("/current", response_model=SimilarityResponse)
def compare_current_environment(
    project_id: UUID,
    request: CurrentEnvironmentRequest,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    env = request.model_dump()
    result = similarity.compare_current(db, project_id=project_id, env=env)
    return SimilarityResponse(
        matches=[SimilarityMatch(**m) for m in result["matches"]],
        summary=SimilaritySummary(**result["summary"]),
    )


@router.post("/trade/{trade_id}", response_model=SimilarityResponse)
def compare_trade(
    project_id: UUID,
    trade_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = similarity.compare_trade(db, project_id=project_id, trade_id=trade_id)
    return SimilarityResponse(
        matches=[SimilarityMatch(**m) for m in result["matches"]],
        summary=SimilaritySummary(**result["summary"]),
    )


@router.post("/pattern/{pattern_id}", response_model=SimilarityResponse)
def compare_pattern(
    project_id: UUID,
    pattern_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = similarity.compare_pattern(db, project_id=project_id, pattern_id=pattern_id)
    return SimilarityResponse(
        matches=[SimilarityMatch(**m) for m in result["matches"]],
        summary=SimilaritySummary(**result["summary"]),
    )


@router.get("/history", response_model=list[HistoryEntry])
def get_similarity_history(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    result = similarity.get_history(db, project_id=project_id, limit=limit)
    return [HistoryEntry(**h) for h in result]
