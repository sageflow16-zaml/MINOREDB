from datetime import datetime
from typing import Any
from pydantic import BaseModel


class TraderDNAResponse(BaseModel):
    id: str
    project_id: str
    trading_style: str | None = None
    preferred_session: str | None = None
    preferred_markets: list | None = None
    preferred_rr: float | None = None
    preferred_timeframes: list | None = None
    best_models: list | None = None
    worst_models: list | None = None
    best_timeframe: str | None = None
    worst_timeframe: str | None = None
    best_holding_time: int | None = None
    best_execution_window: str | None = None
    risk_behavior: str | None = None
    discipline_score: float | None = None
    psychology_score: float | None = None
    patience_index: float | None = None
    learning_progress: dict | None = None
    mistake_frequency: float | None = None
    mistake_trend: list | None = None
    improvement_timeline: list | None = None
    dna_summary: dict | None = None
    raw_insights: list | None = None
    total_trades_analyzed: int = 0
    last_updated: datetime | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class BrainMemoryCreate(BaseModel):
    memory_type: str
    key: str
    title: str | None = None
    content: dict | None = None
    text_content: str | None = None
    importance: str = "medium"
    tags: list[str] | None = None
    source_entity_type: str | None = None
    source_entity_id: str | None = None
    expires_at: datetime | None = None


class BrainMemoryResponse(BaseModel):
    id: str
    project_id: str
    memory_type: str
    key: str
    title: str | None = None
    content: dict | None = None
    text_content: str | None = None
    importance: str = "medium"
    tags: list | None = None
    source_entity_type: str | None = None
    source_entity_id: str | None = None
    is_archived: bool = False
    expires_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class BrainMemorySearch(BaseModel):
    query: str | None = None
    memory_type: str | None = None
    tags: list[str] | None = None
    limit: int = 20
    include_archived: bool = False


class ReasoningStepResult(BaseModel):
    step: str
    status: str
    data: Any = None
    duration_ms: float = 0.0
    error: str | None = None


class BrainAskRequest(BaseModel):
    question: str
    context: dict | None = None
    include_steps: list[str] | None = None
    skip_steps: list[str] | None = None


class BrainAskResponse(BaseModel):
    decision_id: str
    question: str
    verdict: str | None = None
    confidence_score: float | None = None
    recommendation: str | None = None
    reasoning: str | None = None
    scores: dict | None = None
    reasoning_steps: list[ReasoningStepResult] | None = None
    evidence_sources: list[dict] | None = None


class EvaluationRequest(BaseModel):
    pair: str | None = None
    direction: str | None = None
    weekly_bias: str | None = None
    daily_bias: str | None = None
    h4_bias: str | None = None
    market_phase: str | None = None
    trend: str | None = None
    session: str | None = None
    entry_model: str | None = None
    confidence: float | None = None
    risk_percent: float | None = None
    rr_target: float | None = None
    additional_context: dict | None = None


class EvaluationResponse(BaseModel):
    execution_score: float | None = None
    risk_score: float | None = None
    structure_score: float | None = None
    liquidity_score: float | None = None
    session_score: float | None = None
    psychology_score: float | None = None
    discipline_score: float | None = None
    strategy_match: dict | None = None
    historical_similarity: dict | None = None
    confidence_score: float | None = None
    overall_grade: str | None = None
    reasoning: str | None = None
    similar_trades: list[dict] | None = None


class SimilaritySearchRequest(BaseModel):
    pair: str | None = None
    direction: str | None = None
    session: str | None = None
    entry_model: str | None = None
    weekly_bias: str | None = None
    daily_bias: str | None = None
    limit: int = 20


class SimilaritySearchResponse(BaseModel):
    matches: list[dict] = []
    total_found: int = 0
    summary: dict | None = None


class LearningObservationResponse(BaseModel):
    id: str
    project_id: str
    observation_type: str
    title: str
    description: str | None = None
    category: str | None = None
    severity: str | None = None
    confidence: float | None = None
    evidence: dict | None = None
    related_entities: list | None = None
    is_actionable: bool = False
    is_dismissed: bool = False
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class PersonalInsightResponse(BaseModel):
    id: str
    project_id: str
    category: str
    title: str
    description: str | None = None
    impact: str | None = None
    confidence: float | None = None
    supporting_data: dict | None = None
    source: str | None = None
    is_dismissed: bool = False
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class BrainCoachingResponse(BaseModel):
    id: str
    project_id: str
    coaching_type: str
    title: str
    summary: str | None = None
    strengths: list | None = None
    weaknesses: list | None = None
    observations: list | None = None
    action_items: list | None = None
    metrics_snapshot: dict | None = None
    score: float | None = None
    is_completed: bool = False
    period_start: datetime | None = None
    period_end: datetime | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class DecisionRecordResponse(BaseModel):
    id: str
    project_id: str
    question: str
    context_snapshot: dict | None = None
    reasoning_steps: list | None = None
    evidence_sources: list | None = None
    scores: dict | None = None
    verdict: str | None = None
    confidence_score: float | None = None
    recommendation: str | None = None
    reasoning: str | None = None
    actual_outcome: str | None = None
    user_feedback: str | None = None
    learning_result: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class BrainDashboardResponse(BaseModel):
    dna: TraderDNAResponse | None = None
    recent_decisions: list[DecisionRecordResponse] = []
    top_insights: list[PersonalInsightResponse] = []
    active_observations: list[LearningObservationResponse] = []
    latest_coaching: BrainCoachingResponse | None = None
    memory_summary: dict | None = None
    today_intelligence: dict | None = None


class CoachingRequest(BaseModel):
    coaching_type: str = "daily"
    period_start: str | None = None
    period_end: str | None = None


class TrackOutcomeRequest(BaseModel):
    outcome: str
    feedback: str | None = None
