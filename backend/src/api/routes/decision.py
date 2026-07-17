from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import decision_support

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


class MarketAlignment(BaseModel):
    score: float
    details: str
    aligned_biases: list[str]
    conflicting_biases: list[str]


class ICTComponents(BaseModel):
    score: float
    present: list[str]
    missing: list[str]
    details: str


class SessionAlignment(BaseModel):
    score: float
    active_sessions: list[str]
    details: str


class PatternMatch(BaseModel):
    found: bool
    name: Optional[str] = None
    win_rate: float = 0
    expectancy: float = 0
    occurrences: int = 0
    confidence: float = 0
    avg_rr: float = 0
    profit_factor: float = 0
    match_score: float = 0


class SimilaritySummary(BaseModel):
    matches_found: int
    average_win_rate: float
    average_rr: float
    average_pnl: float
    average_drawdown: float
    top_matches: list[dict]


class StatsContext(BaseModel):
    overall_win_rate: float
    overall_avg_rr: float
    overall_expectancy: float
    overall_total_trades: int
    overall_profit_factor: float
    overall_max_drawdown: float
    pair_stats: Optional[dict] = None
    session_stats: Optional[dict] = None


class Confidence(BaseModel):
    score: float
    level: str


class ExecutionCriterion(BaseModel):
    name: str
    met: bool
    detail: str


class Execution(BaseModel):
    status: str
    criteria: list[ExecutionCriterion]
    satisfied: int
    total: int


class DecisionResponse(BaseModel):
    market_alignment: MarketAlignment
    ict_components: ICTComponents
    session_alignment: SessionAlignment
    pattern_match: PatternMatch
    similarity: SimilaritySummary
    statistics: StatsContext
    confidence: Confidence
    execution: Execution
    explanation: list[str]


class HistoryEntry(BaseModel):
    trade_id: str
    pair: Optional[str] = None
    direction: Optional[str] = None
    result: Optional[str] = None
    rr: Optional[float] = None
    pnl: Optional[float] = None
    market_alignment: float
    created_at: Optional[str] = None


@router.post("/current", response_model=DecisionResponse)
def evaluate_current_environment(
    project_id: UUID,
    request: CurrentEnvironmentRequest,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    env = request.model_dump()
    result = decision_support.evaluate_current(db, project_id=project_id, env=env)
    return _to_response(result)


@router.post("/trade/{trade_id}", response_model=DecisionResponse)
def evaluate_trade(
    project_id: UUID,
    trade_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = decision_support.evaluate_trade(db, project_id=project_id, trade_id=trade_id)
    return _to_response(result)


@router.get("/history", response_model=list[HistoryEntry])
def get_decision_history(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    result = decision_support.get_history(db, project_id=project_id, limit=limit)
    return [HistoryEntry(**h) for h in result]


def _to_response(result: dict) -> DecisionResponse:
    return DecisionResponse(
        market_alignment=MarketAlignment(**result["market_alignment"]),
        ict_components=ICTComponents(**result["ict_components"]),
        session_alignment=SessionAlignment(**result["session_alignment"]),
        pattern_match=PatternMatch(**result["pattern_match"]),
        similarity=SimilaritySummary(**result["similarity"]),
        statistics=StatsContext(**result["statistics"]),
        confidence=Confidence(**result["confidence"]),
        execution=Execution(**{
            "status": result["execution"]["status"],
            "criteria": [ExecutionCriterion(**c) for c in result["execution"]["criteria"]],
            "satisfied": result["execution"]["satisfied"],
            "total": result["execution"]["total"],
        }),
        explanation=result["explanation"],
    )
