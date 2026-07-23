from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


# ── AI Profile ──

class AIProfileCreate(BaseModel):
    trading_style: str | None = None
    preferred_sessions: list | None = None
    preferred_markets: list | None = None
    preferred_timeframes: list | None = None
    preferred_pairs: list | None = None
    risk_profile: str | None = None
    avg_rr: float | None = None
    avg_holding_time_min: float | None = None
    avg_risk_per_trade: float | None = None
    best_conditions: dict | None = None
    worst_conditions: dict | None = None
    notes: str | None = None


class AIProfileUpdate(BaseModel):
    trading_style: str | None = None
    preferred_sessions: list | None = None
    preferred_markets: list | None = None
    preferred_timeframes: list | None = None
    preferred_pairs: list | None = None
    risk_profile: str | None = None
    avg_rr: float | None = None
    avg_holding_time_min: float | None = None
    avg_risk_per_trade: float | None = None
    best_conditions: dict | None = None
    worst_conditions: dict | None = None


class AIProfileRead(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    project_id: UUID
    trading_style: str | None = None
    preferred_sessions: list | None = None
    preferred_markets: list | None = None
    preferred_timeframes: list | None = None
    preferred_pairs: list | None = None
    risk_profile: str | None = None
    avg_rr: float | None = None
    avg_holding_time_min: float | None = None
    avg_risk_per_trade: float | None = None
    max_drawdown_pct: float | None = None
    best_conditions: dict | None = None
    worst_conditions: dict | None = None
    psychological_patterns: list | None = None
    most_common_mistakes: list | None = None
    most_successful_behaviors: list | None = None
    learning_progress: dict | None = None
    overall_score: float | None = None
    total_trades_analyzed: int = 0
    last_analyzed_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Trade Evaluation ──

class TradeEvaluationCreate(BaseModel):
    trade_id: UUID
    strength_score: float | None = None
    risk_score: float | None = None
    execution_score: float | None = None
    psychology_score: float | None = None
    discipline_score: float | None = None
    strategy_alignment: float | None = None
    confidence_score: float | None = None
    overall_quality: float | None = None
    critique: dict | None = None
    provider: str | None = None


class TradeEvaluationRead(BaseModel):
    id: UUID
    created_at: datetime
    project_id: UUID
    trade_id: UUID
    strength_score: float | None = None
    risk_score: float | None = None
    execution_score: float | None = None
    psychology_score: float | None = None
    discipline_score: float | None = None
    strategy_alignment: float | None = None
    confidence_score: float | None = None
    overall_quality: float | None = None
    critique: dict | None = None
    provider: str | None = None
    evaluated_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Knowledge Link ──

class KnowledgeLinkCreate(BaseModel):
    source_type: str
    source_id: UUID
    target_type: str
    target_id: UUID
    relationship: str = "related_to"
    strength: float = 1.0
    metadata_json: dict | None = None


class KnowledgeLinkRead(BaseModel):
    id: UUID
    created_at: datetime
    project_id: UUID
    source_type: str
    source_id: UUID
    target_type: str
    target_id: UUID
    relationship: str
    strength: float
    metadata_json: dict | None = None
    model_config = {"from_attributes": True}


# ── Detected Pattern ──

class DetectedPatternRead(BaseModel):
    id: UUID
    created_at: datetime
    project_id: UUID
    pattern_type: str
    pattern_key: str
    pattern_value: str | None = None
    confidence: float
    sample_size: int
    avg_pnl: float | None = None
    win_rate: float | None = None
    description: str | None = None
    is_positive: bool
    is_active: bool
    last_detected_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Coaching Session ──

class CoachingSessionCreate(BaseModel):
    session_type: str
    session_date: str
    period_start: str | None = None
    period_end: str | None = None
    summary: str | None = None
    key_findings: list | None = None
    action_items: list | None = None
    strengths: list | None = None
    weaknesses: list | None = None
    score: float | None = None


class CoachingSessionRead(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    project_id: UUID
    session_type: str
    session_date: str
    period_start: str | None = None
    period_end: str | None = None
    summary: str | None = None
    key_findings: list | None = None
    action_items: list | None = None
    strengths: list | None = None
    weaknesses: list | None = None
    score: float | None = None
    metrics_snapshot: dict | None = None
    is_read: bool
    model_config = {"from_attributes": True}


# ── AI Insight ──

class AIInsightRead(BaseModel):
    id: UUID
    created_at: datetime
    project_id: UUID
    insight_type: str
    category: str | None = None
    title: str
    description: str | None = None
    data: dict | None = None
    confidence: float
    is_read: bool
    is_dismissed: bool
    model_config = {"from_attributes": True}


# ── AI Recommendation ──

class AIRecommendationRead(BaseModel):
    id: UUID
    created_at: datetime
    project_id: UUID
    recommendation_type: str
    priority: str
    title: str
    description: str | None = None
    rationale: str | None = None
    action_url: str | None = None
    related_entity_type: str | None = None
    related_entity_id: UUID | None = None
    is_dismissed: bool
    is_completed: bool
    model_config = {"from_attributes": True}


# ── AI Summary ──

class AISummaryCreate(BaseModel):
    summary_type: str
    entity_id: UUID | None = None
    period: str | None = None
    content: dict | None = None
    text_summary: str | None = None
    keywords: list | None = None
    sentiment: str | None = None
    importance: float = 0.5


class AISummaryRead(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    project_id: UUID
    summary_type: str
    entity_id: UUID | None = None
    period: str | None = None
    content: dict | None = None
    text_summary: str | None = None
    keywords: list | None = None
    sentiment: str | None = None
    importance: float
    model_config = {"from_attributes": True}


# ── AI Context Snapshot ──

class AIContextSnapshotRead(BaseModel):
    id: UUID
    created_at: datetime
    project_id: UUID
    snapshot_type: str
    trade_id: UUID | None = None
    context: dict | None = None
    model_config = {"from_attributes": True}


# ── AI Provider Config ──

class AIProviderConfigCreate(BaseModel):
    provider_name: str
    display_name: str
    is_enabled: bool = False
    is_default: bool = False
    model_name: str | None = None
    api_endpoint: str | None = None
    config_json: dict | None = None
    capabilities: list | None = None


class AIProviderConfigUpdate(BaseModel):
    display_name: str | None = None
    is_enabled: bool | None = None
    is_default: bool | None = None
    model_name: str | None = None
    api_endpoint: str | None = None
    config_json: dict | None = None
    capabilities: list | None = None


class AIProviderConfigRead(BaseModel):
    id: UUID
    created_at: datetime
    provider_name: str
    display_name: str
    is_enabled: bool
    is_default: bool
    model_name: str | None = None
    api_endpoint: str | None = None
    config_json: dict | None = None
    capabilities: list | None = None
    model_config = {"from_attributes": True}


# ── Dashboard / Aggregated ──

class AIDashboardData(BaseModel):
    profile: AIProfileRead | None = None
    latest_insights: list[AIInsightRead] = []
    coaching_cards: list[CoachingSessionRead] = []
    recommendations: list[AIRecommendationRead] = []
    detected_patterns: list[DetectedPatternRead] = []
    learning_progress: dict | None = None
    recent_improvements: list[str] = []
    areas_to_improve: list[str] = []
    overall_score: float | None = None


class AIContextBuildRequest(BaseModel):
    trade_id: UUID | None = None
    include_performance: bool = True
    include_recent_trades: bool = True
    include_strategies: bool = True
    include_risk: bool = True
    include_journal: bool = True
    include_planning: bool = True
    include_goals: bool = True
    include_psychology: bool = True
    include_patterns: bool = True
    max_recent_trades: int = 20
